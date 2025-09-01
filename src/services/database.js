/**
 * Database Service
 * Firestore 데이터베이스 작업을 위한 유틸리티 함수들
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
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
import { db } from './firebase';
import { pointsService } from './points';

// Collection references
export const collections = {
  users: 'users',
  posts: 'posts',
  comments: 'comments',
  icons: 'icons',
  pointsHistory: 'points_history',
  boards: 'boards',
};

/**
 * 사용자 관련 데이터베이스 작업
 */
export const userService = {
  // 사용자 정보 조회
  async getUser(uid) {
    const userDoc = await getDoc(doc(db, collections.users, uid));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  },

  // 아이디로 사용자 조회
  async getUserByUsername(username) {
    const q = query(
      collection(db, collections.users),
      where('username', '==', username),
      limit(1),
    );
    const snapshot = await getDocs(q);
    return snapshot.empty
      ? null
      : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },

  // 아이디 중복 체크
  async checkUsernameAvailability(username) {
    const q = query(
      collection(db, collections.users),
      where('username', '==', username),
      limit(1),
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  },

  // 닉네임 중복 체크
  async checkDisplayNameAvailability(displayName) {
    const q = query(
      collection(db, collections.users),
      where('displayName', '==', displayName),
      limit(1),
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  },

  // 사용자 프로필 업데이트
  async updateUserProfile(uid, profileData) {
    const userRef = doc(db, collections.users, uid);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    });
  },

  // 사용자 정보 업데이트
  async updateUser(uid, userData) {
    const userRef = doc(db, collections.users, uid);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    });
  },

  // 사용자 포인트 업데이트 (레거시 - pointsService 사용 권장)
  async updateUserPoints(uid, pointsChange, reason, relatedId = null) {
    if (pointsChange > 0) {
      await pointsService.awardPoints(uid, pointsChange, reason, relatedId);
    } else {
      await pointsService.deductPoints(
        uid,
        Math.abs(pointsChange),
        reason,
        relatedId,
      );
    }
  },
};

/**
 * 게시글 관련 데이터베이스 작업
 */
export const postService = {
  // 게시판별 게시글 목록 조회 (검색 및 필터링 지원)
  async getPosts(boardType, options = {}) {
    const {
      lastDoc = null,
      limitCount = 20,
      sortBy = 'latest',
      searchQuery = '',
      tags = [],
    } = options;

    let constraints = [
      where('boardType', '==', boardType),
      where('isDeleted', '==', false),
    ];

    // 태그 필터링
    if (tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', tags));
    }

    // 정렬 옵션 적용
    switch (sortBy) {
      case 'views':
        constraints.push(
          orderBy('isPinned', 'desc'),
          orderBy('viewCount', 'desc'),
        );
        break;
      case 'comments':
        constraints.push(
          orderBy('isPinned', 'desc'),
          orderBy('commentCount', 'desc'),
        );
        break;
      case 'likes':
        constraints.push(
          orderBy('isPinned', 'desc'),
          orderBy('likeCount', 'desc'),
        );
        break;
      case 'latest':
      default:
        constraints.push(
          orderBy('isPinned', 'desc'),
          orderBy('createdAt', 'desc'),
        );
        break;
    }

    constraints.push(limit(limitCount));

    let q = query(collection(db, collections.posts), ...constraints);

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    let posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 클라이언트 사이드 텍스트 검색 (Firestore의 제한으로 인해)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.authorName.toLowerCase().includes(query) ||
          (post.tags &&
            post.tags.some((tag) => tag.toLowerCase().includes(query))),
      );
    }

    return posts;
  },

  // 검색 자동완성을 위한 태그 목록 조회
  async getPopularTags(boardType = null, limitCount = 20) {
    let constraints = [where('isDeleted', '==', false)];

    if (boardType) {
      constraints.push(where('boardType', '==', boardType));
    }

    constraints.push(orderBy('createdAt', 'desc'), limit(100)); // 최근 100개 게시글에서 태그 추출

    const q = query(collection(db, collections.posts), ...constraints);
    const snapshot = await getDocs(q);

    const tagCounts = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // 태그를 사용 빈도순으로 정렬
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limitCount)
      .map(([tag, count]) => ({ tag, count }));
  },

  // 게시글 검색 (제목, 내용, 작성자 기준)
  async searchPosts(searchQuery, options = {}) {
    const {
      boardType = null,
      sortBy = 'latest',
      tags = [],
      limitCount = 20,
    } = options;

    let constraints = [where('isDeleted', '==', false)];

    if (boardType) {
      constraints.push(where('boardType', '==', boardType));
    }

    if (tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', tags));
    }

    // 정렬 적용
    switch (sortBy) {
      case 'views':
        constraints.push(orderBy('viewCount', 'desc'));
        break;
      case 'comments':
        constraints.push(orderBy('commentCount', 'desc'));
        break;
      case 'likes':
        constraints.push(orderBy('likeCount', 'desc'));
        break;
      case 'latest':
      default:
        constraints.push(orderBy('createdAt', 'desc'));
        break;
    }

    constraints.push(limit(limitCount * 2)); // 검색 필터링을 위해 더 많이 가져옴

    const q = query(collection(db, collections.posts), ...constraints);
    const snapshot = await getDocs(q);

    const query = searchQuery.toLowerCase();
    const posts = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.authorName.toLowerCase().includes(query) ||
          (post.tags &&
            post.tags.some((tag) => tag.toLowerCase().includes(query))),
      )
      .slice(0, limitCount);

    return posts;
  },

  // 게시글 상세 조회
  async getPost(postId) {
    const postDoc = await getDoc(doc(db, collections.posts, postId));
    if (!postDoc.exists()) return null;

    // 조회수 증가
    await updateDoc(doc(db, collections.posts, postId), {
      viewCount: increment(1),
    });

    return { id: postDoc.id, ...postDoc.data() };
  },

  // 게시글 작성
  async createPost(postData) {
    try {
      // 필수 필드 검증
      if (!postData.authorId) {
        throw new Error('작성자 정보가 필요합니다.');
      }
      if (!postData.title?.trim()) {
        throw new Error('제목을 입력해주세요.');
      }
      if (!postData.content?.trim()) {
        throw new Error('내용을 입력해주세요.');
      }

      console.log('게시글 생성 시작:', postData);

      const docRef = await addDoc(collection(db, collections.posts), {
        ...postData,
        title: postData.title.trim(),
        content: postData.content.trim(),
        authorName: postData.authorName || '익명',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        isPinned: postData.isPinned || false,
        isDeleted: false,
      });

      console.log('게시글 생성 완료:', docRef.id);

      // 통계 캐시 무효화 (새 게시글로 인한 통계 변경)
      try {
        const { statsService } = await import('./stats');
        statsService.invalidateCache();
      } catch (error) {
        console.warn('캐시 무효화 실패:', error);
      }

      // 작성자에게 포인트 지급
      try {
        await pointsService.autoAwardPoints(
          postData.authorId,
          'POST_CREATED',
          docRef.id,
        );
      } catch (pointError) {
        console.warn('포인트 지급 실패:', pointError);
        // 포인트 지급 실패는 게시글 작성을 막지 않음
      }

      return docRef.id;
    } catch (error) {
      console.error('게시글 생성 실패:', error);
      throw error;
    }
  },

  // 게시글 수정
  async updatePost(postId, postData) {
    const postRef = doc(db, collections.posts, postId);
    await updateDoc(postRef, {
      ...postData,
      updatedAt: serverTimestamp(),
    });
  },

  // 게시글 삭제 (소프트 삭제)
  async deletePost(postId) {
    const postRef = doc(db, collections.posts, postId);
    await updateDoc(postRef, {
      isDeleted: true,
      updatedAt: serverTimestamp(),
    });
  },

  // 게시글 좋아요 토글
  async togglePostLike(postId, userId) {
    const likeRef = doc(db, collections.posts, postId, 'likes', userId);
    const likeDoc = await getDoc(likeRef);
    const postRef = doc(db, collections.posts, postId);

    // 게시글 정보 조회 (작성자 확인용)
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    const postData = postDoc.data();

    const batch = writeBatch(db);
    let isLiked = false;

    if (likeDoc.exists()) {
      // 좋아요 취소
      batch.delete(likeRef);
      batch.update(postRef, {
        likeCount: increment(-1),
      });
      isLiked = false;
    } else {
      // 좋아요 추가
      batch.set(likeRef, {
        userId,
        createdAt: serverTimestamp(),
      });
      batch.update(postRef, {
        likeCount: increment(1),
      });
      isLiked = true;
    }

    await batch.commit();

    // 좋아요 추가 시 자신의 게시글이 아닌 경우에만 포인트 지급
    if (isLiked && postData.authorId !== userId) {
      await pointsService.autoAwardPoints(
        postData.authorId,
        'POST_LIKED',
        postId,
      );
    }

    return isLiked;
  },

  // 사용자의 게시글 좋아요 상태 확인
  async checkPostLike(postId, userId) {
    const likeDoc = await getDoc(
      doc(db, collections.posts, postId, 'likes', userId),
    );
    return likeDoc.exists();
  },

  // 이전/다음 게시글 조회 (최적화된 버전)
  async getAdjacentPosts(postId, boardType, currentPostCreatedAt) {
    if (!currentPostCreatedAt) {
      const currentPostDoc = await getDoc(doc(db, collections.posts, postId));
      if (currentPostDoc.exists()) {
        currentPostCreatedAt = currentPostDoc.data().createdAt;
      } else {
        return { prevPost: null, nextPost: null };
      }
    }

    const commonConstraints = [
      where('boardType', '==', boardType),
      where('isDeleted', '==', false),
    ];

    try {
      // 이전 게시글 조회 (현재보다 최신 글 중 가장 오래된 것)
      const prevPostQuery = query(
        collection(db, collections.posts),
        ...commonConstraints,
        where('createdAt', '>', currentPostCreatedAt),
        orderBy('createdAt', 'asc'),
        limit(1),
      );

      // 다음 게시글 조회 (현재보다 오래된 글 중 가장 최신 것)
      const nextPostQuery = query(
        collection(db, collections.posts),
        ...commonConstraints,
        where('createdAt', '<', currentPostCreatedAt),
        orderBy('createdAt', 'desc'),
        limit(1),
      );

      const [prevSnapshot, nextSnapshot] = await Promise.all([
        getDocs(prevPostQuery),
        getDocs(nextPostQuery),
      ]);

      const prevPost = prevSnapshot.empty
        ? null
        : { id: prevSnapshot.docs[0].id, ...prevSnapshot.docs[0].data() };
      const nextPost = nextSnapshot.empty
        ? null
        : { id: nextSnapshot.docs[0].id, ...nextSnapshot.docs[0].data() };

      return { prevPost, nextPost };
    } catch (error) {
      console.error('Error fetching adjacent posts:', error);
      return { prevPost: null, nextPost: null };
    }
  },
};

/**
 * 댓글 관련 데이터베이스 작업
 */
export const commentService = {
  // 게시글의 댓글 목록 조회 (페이지네이션 지원)
  async getComments(postId, options = {}) {
    const { lastDoc = null, limitCount = 50 } = options;

    try {
      const constraints = [
        where('postId', '==', postId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'asc'),
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
          // 타임스탬프 정규화
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
        };
      });

      // 마지막 문서와 추가 페이지 여부 반환
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

      // 댓글 생성
      const commentRef = doc(collection(db, collections.comments));
      batch.set(commentRef, {
        ...commentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likeCount: 0,
        isDeleted: false,
        level: commentData.parentId ? 1 : 0,
      });

      // 게시글 댓글 수 증가
      const postRef = doc(db, collections.posts, commentData.postId);
      batch.update(postRef, {
        commentCount: increment(1),
      });

      await batch.commit();

      console.log(`Comment created with ID: ${commentRef.id}`);

      // 통계 캐시 무효화 (새 댓글로 인한 통계 변경)
      try {
        const { statsService } = await import('./stats');
        statsService.invalidateCache();
      } catch (error) {
        console.warn('캐시 무효화 실패:', error);
      }

      // 작성자에게 포인트 지급
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

    // 댓글 삭제
    const commentRef = doc(db, collections.comments, commentId);
    batch.update(commentRef, {
      isDeleted: true,
      updatedAt: serverTimestamp(),
    });

    // 게시글 댓글 수 감소
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

    // 댓글 정보 조회 (작성자 확인용)
    const commentDoc = await getDoc(commentRef);
    if (!commentDoc.exists()) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    const commentData = commentDoc.data();

    const batch = writeBatch(db);
    let isLiked = false;

    if (likeDoc.exists()) {
      // 좋아요 취소
      batch.delete(likeRef);
      batch.update(commentRef, {
        likeCount: increment(-1),
      });
      isLiked = false;
    } else {
      // 좋아요 추가
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

    // 좋아요 추가 시 자신의 댓글이 아닌 경우에만 포인트 지급
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
      // 실제 댓글 수 조회
      const q = query(
        collection(db, collections.comments),
        where('postId', '==', postId),
        where('isDeleted', '==', false),
      );

      const snapshot = await getDocs(q);
      const actualCommentCount = snapshot.size;

      // 게시글의 댓글 수 업데이트
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

/**
 * 데이터 정리 및 관리 함수들
 */
export const adminService = {
  // 모든 게시글의 댓글 수 동기화
  async syncAllPostCommentCounts() {
    try {
      console.log('Starting to sync all post comment counts...');

      // 모든 게시글 조회
      const postsQuery = query(
        collection(db, collections.posts),
        where('isDeleted', '==', false),
      );

      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs;

      console.log(`Found ${posts.length} posts to sync`);

      let syncedCount = 0;

      for (const postDoc of posts) {
        const postId = postDoc.id;
        const postData = postDoc.data();

        try {
          // 실제 댓글 수 조회
          const commentsQuery = query(
            collection(db, collections.comments),
            where('postId', '==', postId),
            where('isDeleted', '==', false),
          );

          const commentsSnapshot = await getDocs(commentsQuery);
          const actualCommentCount = commentsSnapshot.size;
          const currentCommentCount = postData.commentCount || 0;

          // 댓글 수가 다르면 업데이트
          if (actualCommentCount !== currentCommentCount) {
            await updateDoc(doc(db, collections.posts, postId), {
              commentCount: actualCommentCount,
            });

            console.log(
              `Post ${postId}: ${currentCommentCount} -> ${actualCommentCount}`,
            );
            syncedCount++;
          }
        } catch (error) {
          console.error(`Error syncing post ${postId}:`, error);
        }
      }

      console.log(`Synced ${syncedCount} posts out of ${posts.length}`);
      return { total: posts.length, synced: syncedCount };
    } catch (error) {
      console.error('Error syncing all post comment counts:', error);
      throw error;
    }
  },

  // 임시/테스트 게시글 정리
  async cleanupTestPosts() {
    try {
      console.log('Starting to cleanup test posts...');

      // 임시 게시글 패턴들
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

        // 테스트 패턴이 포함된 게시글 찾기
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

        // 작성자명이 없거나 이상한 경우 수정
        if (
          !postData.authorName ||
          postData.authorName.includes('팬') ||
          postData.authorName.includes('전문가')
        ) {
          updates.authorName = '익명';
          needsUpdate = true;
        }

        // 조회수가 없는 경우 0으로 설정
        if (typeof postData.viewCount !== 'number') {
          updates.viewCount = 0;
          needsUpdate = true;
        }

        // 좋아요 수가 없는 경우 0으로 설정
        if (typeof postData.likeCount !== 'number') {
          updates.likeCount = 0;
          needsUpdate = true;
        }

        // 댓글 수가 없는 경우 0으로 설정
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

      // 모든 댓글 조회
      const commentsSnapshot = await getDocs(
        collection(db, collections.comments),
      );
      let fixedCount = 0;

      for (const commentDoc of commentsSnapshot.docs) {
        const commentData = commentDoc.data();

        // authorName이 이메일 형식인지 확인 (@ 포함하고 .temp 또는 실제 도메인 포함)
        if (commentData.authorName && commentData.authorName.includes('@')) {
          let newAuthorName = commentData.authorName;

          // .temp 이메일인 경우 @ 앞부분만 사용
          if (commentData.authorName.includes('.temp')) {
            newAuthorName = commentData.authorName.split('@')[0];
          }
          // 실제 이메일인 경우도 @ 앞부분만 사용
          else {
            newAuthorName = commentData.authorName.split('@')[0];
          }

          // 작성자 ID로 실제 사용자 정보 조회해서 displayName 사용
          if (commentData.authorId) {
            try {
              const userDoc = await getDoc(
                doc(db, collections.users, commentData.authorId),
              );
              if (userDoc.exists()) {
                const userData = userDoc.data();
                newAuthorName = userData.displayName || newAuthorName;
              }
            } catch (userError) {
              console.warn(
                `Failed to get user data for ${commentData.authorId}:`,
                userError,
              );
            }
          }

          // 댓글 업데이트
          await updateDoc(doc(db, collections.comments, commentDoc.id), {
            authorName: newAuthorName,
          });

          console.log(
            `Fixed comment ${commentDoc.id}: ${commentData.authorName} -> ${newAuthorName}`,
          );
          fixedCount++;
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

/**
 * 아이콘 관련 데이터베이스 작업
 */
export const iconService = {
  // 활성 아이콘 목록 조회
  async getActiveIcons() {
    const q = query(
      collection(db, collections.icons),
      where('isActive', '==', true),
      orderBy('category', 'asc'),
      orderBy('price', 'asc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  // 아이콘 구매
  async purchaseIcon(userId, iconId, iconPrice) {
    // 포인트 차감 (잔액 확인 포함)
    await pointsService.deductPoints(
      userId,
      iconPrice,
      'icon_purchase',
      iconId,
    );

    const batch = writeBatch(db);

    // 구매 내역 추가 (사용자 서브컬렉션)
    const purchaseRef = doc(
      db,
      collections.users,
      userId,
      'purchased_icons',
      iconId,
    );
    batch.set(purchaseRef, {
      iconId,
      purchasedAt: serverTimestamp(),
      price: iconPrice,
    });

    // 아이콘 구매 횟수 증가
    const iconRef = doc(db, collections.icons, iconId);
    batch.update(iconRef, {
      purchaseCount: increment(1),
    });

    await batch.commit();
  },

  // 사용자 구매 아이콘 목록 조회
  async getUserPurchasedIcons(userId) {
    const snapshot = await getDocs(
      collection(db, collections.users, userId, 'purchased_icons'),
    );
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
};

/**
 * 게시판 관련 데이터베이스 작업
 */
export const boardService = {
  // 활성 게시판 목록 조회
  async getActiveBoards() {
    const q = query(
      collection(db, collections.boards),
      where('isActive', '==', true),
      orderBy('order', 'asc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  // 게시판 정보 조회
  async getBoard(boardId) {
    const boardDoc = await getDoc(doc(db, collections.boards, boardId));
    return boardDoc.exists() ? { id: boardDoc.id, ...boardDoc.data() } : null;
  },
};

/**
 * 통합 데이터베이스 서비스
 * 모든 서비스를 하나의 객체로 통합
 */
export const databaseService = {
  // 사용자 관련
  ...userService,

  // 게시글 관련
  ...postService,

  // 댓글 관련
  ...commentService,

  // 관리자 관련
  ...adminService,

  // 아이콘 관련
  ...iconService,

  // 게시판 관련
  ...boardService,
};
