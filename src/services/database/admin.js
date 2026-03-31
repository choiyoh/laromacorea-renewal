/**
 * Admin Service (database-level)
 * 데이터 정리 및 관리 함수들
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from 'firebase/firestore';
import { db, collections } from './constants';

export const adminService = {
  // 모든 게시글의 댓글 수 동기화 (배치 처리로 최적화됨 - 관리자용)
  async syncAllPostCommentCounts() {
    try {
      console.log('Starting to sync all post comment counts with batching...');

      const BATCH_SIZE = 50;
      let totalSynced = 0;
      let totalProcessed = 0;
      let lastDoc = null;

      while (true) {
        let batchQuery = query(
          collection(db, collections.posts),
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc'),
          limit(BATCH_SIZE),
        );

        if (lastDoc) {
          batchQuery = query(batchQuery, startAfter(lastDoc));
        }

        const postsSnapshot = await getDocs(batchQuery);
        const posts = postsSnapshot.docs;

        if (posts.length === 0) break;

        console.log(`Processing batch of ${posts.length} posts...`);

        let batchSynced = 0;

        for (const postDoc of posts) {
          const postId = postDoc.id;
          const postData = postDoc.data();

          try {
            const commentsQuery = query(
              collection(db, collections.comments),
              where('postId', '==', postId),
              where('isDeleted', '==', false),
            );

            const commentsSnapshot = await getDocs(commentsQuery);
            const actualCommentCount = commentsSnapshot.size;
            const currentCommentCount = postData.commentCount || 0;

            if (actualCommentCount !== currentCommentCount) {
              await updateDoc(doc(db, collections.posts, postId), {
                commentCount: actualCommentCount,
              });

              console.log(
                `Post ${postId}: ${currentCommentCount} -> ${actualCommentCount}`,
              );
              batchSynced++;
            }
          } catch (error) {
            console.error(`Error syncing post ${postId}:`, error);
          }
        }

        totalProcessed += posts.length;
        totalSynced += batchSynced;

        console.log(`Batch completed: ${batchSynced}/${posts.length} synced`);

        lastDoc = posts[posts.length - 1];

        if (posts.length < BATCH_SIZE) break;
      }

      console.log(
        `Batch sync completed: ${totalSynced}/${totalProcessed} posts synced`,
      );
      return { total: totalProcessed, synced: totalSynced };
    } catch (error) {
      console.error('Error in batched sync:', error);
      throw error;
    }
  },

  // 임시/테스트 게시글 정리
  async cleanupTestPosts() {
    try {
      console.log('Starting to cleanup test posts...');

      const testPatterns = [
        '테스트',
        'test',
        '임시',
        '샘플',
        'sample',
        '로마팬123',
        '이적전문가',
        '여행러버',
        '유니폼콜렉터',
        '로마분석가',
      ];

      const postsQuery = query(
        collection(db, collections.posts),
        where('isDeleted', '==', false),
      );

      const postsSnapshot = await getDocs(postsQuery);
      let deletedCount = 0;

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        const title = postData.title?.toLowerCase() || '';
        const content = postData.content?.toLowerCase() || '';
        const authorName = postData.authorName?.toLowerCase() || '';

        const isTestPost = testPatterns.some(
          (pattern) =>
            title.includes(pattern.toLowerCase()) ||
            content.includes(pattern.toLowerCase()) ||
            authorName.includes(pattern.toLowerCase()),
        );

        if (isTestPost) {
          await updateDoc(doc(db, collections.posts, postDoc.id), {
            isDeleted: true,
            deletedAt: serverTimestamp(),
          });

          console.log(`Deleted test post: ${postData.title}`);
          deletedCount++;
        }
      }

      console.log(`Deleted ${deletedCount} test posts`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up test posts:', error);
      throw error;
    }
  },

  // 게시글 작성자 정보 정리
  async fixPostAuthorInfo() {
    try {
      console.log('Starting to fix post author info...');

      const postsQuery = query(
        collection(db, collections.posts),
        where('isDeleted', '==', false),
      );

      const postsSnapshot = await getDocs(postsQuery);
      let fixedCount = 0;

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        let needsUpdate = false;
        const updates = {};

        if (
          !postData.authorName ||
          postData.authorName.includes('팬') ||
          postData.authorName.includes('전문가')
        ) {
          updates.authorName = '익명';
          needsUpdate = true;
        }

        if (typeof postData.viewCount !== 'number') {
          updates.viewCount = 0;
          needsUpdate = true;
        }

        if (typeof postData.likeCount !== 'number') {
          updates.likeCount = 0;
          needsUpdate = true;
        }

        if (typeof postData.commentCount !== 'number') {
          updates.commentCount = 0;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(doc(db, collections.posts, postDoc.id), updates);
          console.log(`Fixed post ${postDoc.id}:`, updates);
          fixedCount++;
        }
      }

      console.log(`Fixed ${fixedCount} posts`);
      return fixedCount;
    } catch (error) {
      console.error('Error fixing post author info:', error);
      throw error;
    }
  },

  // 댓글 작성자명 정리 (이메일 주소를 닉네임으로 변경)
  async fixCommentAuthorNames() {
    try {
      console.log('🔧 댓글 작성자명 정리를 시작합니다...');

      const commentsSnapshot = await getDocs(
        collection(db, collections.comments),
      );
      let fixedCount = 0;

      const userIds = new Set();
      commentsSnapshot.docs.forEach((doc) => {
        const commentData = doc.data();
        if (commentData.authorId) {
          userIds.add(commentData.authorId);
        }
      });

      const usersMap = new Map();
      if (userIds.size > 0) {
        const usersQuery = query(
          collection(db, collections.users),
          where('__name__', 'in', Array.from(userIds)),
        );
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.docs.forEach((doc) => {
          usersMap.set(doc.id, doc.data());
        });
      }

      for (const commentDoc of commentsSnapshot.docs) {
        const commentData = commentDoc.data();

        if (commentData.authorName && commentData.authorName.includes('@')) {
          let newAuthorName = commentData.authorName.split('@')[0];

          if (commentData.authorId && usersMap.has(commentData.authorId)) {
            const userData = usersMap.get(commentData.authorId);
            newAuthorName = userData.displayName || newAuthorName;
          }

          if (newAuthorName !== commentData.authorName) {
            await updateDoc(doc(db, collections.comments, commentDoc.id), {
              authorName: newAuthorName,
            });

            console.log(
              `Fixed comment ${commentDoc.id}: ${commentData.authorName} -> ${newAuthorName}`,
            );
            fixedCount++;
          }
        }
      }

      console.log(`✅ 완료: ${fixedCount}개 댓글의 작성자명이 수정되었습니다.`);
      return fixedCount;
    } catch (error) {
      console.error('❌ 댓글 작성자명 정리 실패:', error);
      throw error;
    }
  },
};
