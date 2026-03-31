/**
 * Comment Service
 * 댓글 관련 데이터베이스 작업
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, collections } from './constants';
import { pointsService } from '../points';

export const commentService = {
  // 게시글의 댓글 목록 조회 (페이지네이션 지원)
  async getComments(postId, boardType = 'default', options = {}) {
    const { lastDoc = null, limitCount = 50 } = options;

    try {
      const sortOrder = boardType === 'match' ? 'desc' : 'asc';

      const constraints = [
        where('postId', '==', postId),
        where('isDeleted', '==', false),
        orderBy('createdAt', sortOrder),
        limit(limitCount),
      ];

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, collections.comments), ...constraints);

      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
        };
      });

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
      const hasMore = snapshot.docs.length === limitCount;

      return { comments, lastDoc: newLastDoc, hasMore };
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // 댓글 작성
  async createComment(commentData) {
    try {
      const batch = writeBatch(db);

      const commentRef = doc(collection(db, collections.comments));
      batch.set(commentRef, {
        ...commentData,
        createdAt: serverTimestamp(),
        likeCount: 0,
        isDeleted: false,
        level: commentData.parentId ? 1 : 0,
      });

      const postRef = doc(db, collections.posts, commentData.postId);
      batch.update(postRef, {
        commentCount: increment(1),
      });

      await batch.commit();

      console.log(`Comment created with ID: ${commentRef.id}`);

      try {
        const { statsService } = await import('../stats');
        statsService.invalidateCache();
      } catch (error) {
        console.warn('캐시 무효화 실패:', error);
      }

      try {
        await pointsService.autoAwardPoints(
          commentData.authorId,
          'COMMENT_CREATED',
          commentRef.id,
        );
      } catch (pointsError) {
        console.warn('Failed to award points for comment:', pointsError);
      }

      return commentRef.id;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  // 댓글 수정
  async updateComment(commentId, content) {
    const commentRef = doc(db, collections.comments, commentId);
    await updateDoc(commentRef, {
      content,
      updatedAt: serverTimestamp(),
    });
  },

  // 댓글 삭제 (소프트 삭제)
  async deleteComment(commentId, postId) {
    const batch = writeBatch(db);

    const commentRef = doc(db, collections.comments, commentId);
    batch.update(commentRef, {
      isDeleted: true,
      updatedAt: serverTimestamp(),
    });

    const postRef = doc(db, collections.posts, postId);
    batch.update(postRef, {
      commentCount: increment(-1),
    });

    await batch.commit();
  },

  // 댓글 좋아요 토글
  async toggleCommentLike(commentId, userId) {
    const likeRef = doc(db, collections.comments, commentId, 'likes', userId);
    const likeDoc = await getDoc(likeRef);
    const commentRef = doc(db, collections.comments, commentId);

    const commentDoc = await getDoc(commentRef);
    if (!commentDoc.exists()) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    const commentData = commentDoc.data();

    const batch = writeBatch(db);
    let isLiked = false;

    if (likeDoc.exists()) {
      batch.delete(likeRef);
      batch.update(commentRef, {
        likeCount: increment(-1),
      });
      isLiked = false;
    } else {
      batch.set(likeRef, {
        userId,
        createdAt: serverTimestamp(),
      });
      batch.update(commentRef, {
        likeCount: increment(1),
      });
      isLiked = true;
    }

    await batch.commit();

    if (isLiked && commentData.authorId !== userId) {
      await pointsService.autoAwardPoints(
        commentData.authorId,
        'COMMENT_LIKED',
        commentId,
      );
    }

    return isLiked;
  },

  // 게시글의 실제 댓글 수 동기화
  async syncPostCommentCount(postId) {
    try {
      const q = query(
        collection(db, collections.comments),
        where('postId', '==', postId),
        where('isDeleted', '==', false),
      );

      const snapshot = await getDocs(q);
      const actualCommentCount = snapshot.size;

      const postRef = doc(db, collections.posts, postId);
      await updateDoc(postRef, {
        commentCount: actualCommentCount,
      });

      console.log(`Post ${postId} comment count synced: ${actualCommentCount}`);
      return actualCommentCount;
    } catch (error) {
      console.error('Error syncing comment count:', error);
      throw error;
    }
  },

  // 사용자의 댓글 좋아요 상태 확인
  async checkCommentLike(commentId, userId) {
    const likeDoc = await getDoc(
      doc(db, collections.comments, commentId, 'likes', userId),
    );
    return likeDoc.exists();
  },
};
