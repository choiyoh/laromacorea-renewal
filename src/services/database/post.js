/**
 * Post Service
 * 게시글 관련 데이터베이스 작업
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
import { db, collections } from './constants';
import { pointsService } from '../points';

export const postService = {
  // 게시판별 게시글 목록 조회 (서버사이드 검색 필터링 지원 - 최적화됨)
  async getPosts(boardType, options = {}) {
    const {
      lastDoc = null,
      limitCount = 20,
      sortBy = 'latest',
      searchQuery = '',
      tags = [],
    } = options;

    // 검색어가 있는 경우 전문 검색을 위한 제한된 쿼리 사용 (서버사이드 필터링)
    if (searchQuery && searchQuery.trim()) {
      return await this.performServerSideSearch(boardType, options);
    }

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
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return posts;
  },

  // 검색 자동완성을 위한 태그 목록 조회
  async getPopularTags(boardType = null, limitCount = 20) {
    let constraints = [where('isDeleted', '==', false)];

    if (boardType) {
      constraints.push(where('boardType', '==', boardType));
    }

    constraints.push(orderBy('createdAt', 'desc'), limit(100));

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

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limitCount)
      .map(([tag, count]) => ({ tag, count }));
  },

  // 게시글 검색 (제목, 내용, 작성자 기준) - 최적화 버전
  async searchPosts(searchQuery, options = {}) {
    const {
      boardType = null,
      sortBy = 'latest',
      tags = [],
      limitCount = 20,
    } = options;

    const cacheKey = `search_${boardType || 'all'}_${searchQuery}_${tags.join(',')}_${sortBy}`;
    const cached = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 300000) {
      return JSON.parse(cached);
    }

    let constraints = [where('isDeleted', '==', false)];

    if (boardType) {
      constraints.push(where('boardType', '==', boardType));
    }

    if (tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', tags));
    }

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

    const searchKeywords = searchQuery
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 1);
    const maxDocs =
      searchKeywords.length > 0 ? Math.min(limitCount * 3, 100) : limitCount;

    constraints.push(limit(maxDocs));

    const q = query(collection(db, collections.posts), ...constraints);
    const snapshot = await getDocs(q);

    const query = searchQuery.toLowerCase();
    let posts = snapshot.docs
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

    sessionStorage.setItem(cacheKey, JSON.stringify(posts));
    sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());

    return posts;
  },

  // 게시글 상세 조회
  async getPost(postId) {
    const postDoc = await getDoc(doc(db, collections.posts, postId));
    if (!postDoc.exists()) return null;

    const viewKey = `post_viewed_${postId}`;
    const isAlreadyViewed = sessionStorage.getItem(viewKey);

    if (!isAlreadyViewed) {
      updateDoc(doc(db, collections.posts, postId), {
        viewCount: increment(1),
      }).catch((error) => {
        console.warn('Failed to update view count:', error);
      });

      sessionStorage.setItem(viewKey, 'true');
    }

    return { id: postDoc.id, ...postDoc.data() };
  },

  // 게시글 작성
  async createPost(postData) {
    try {
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

      this.invalidateBoardCache(postData.boardType);

      try {
        const { statsService } = await import('../stats');
        statsService.invalidateCache();
      } catch (error) {
        console.warn('캐시 무효화 실패:', error);
      }

      try {
        await pointsService.autoAwardPoints(
          postData.authorId,
          'POST_CREATED',
          docRef.id,
        );
      } catch (pointError) {
        console.warn('포인트 지급 실패:', pointError);
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
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
      const boardType = postDoc.data().boardType;

      await updateDoc(postRef, {
        ...postData,
        updatedAt: serverTimestamp(),
      });

      this.invalidateSearchCache(null, boardType);

      try {
        const { statsService } = await import('../stats');
        statsService.invalidateCache();
      } catch (error) {
        console.warn('캐시 무효화 실패:', error);
      }
    }
  },

  // 게시글 삭제 (소프트 삭제)
  async deletePost(postId) {
    const postRef = doc(db, collections.posts, postId);
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
      const boardType = postDoc.data().boardType;

      await updateDoc(postRef, {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });

      this.invalidateBoardCache(boardType);

      try {
        const { statsService } = await import('../stats');
        statsService.invalidateCache();
      } catch (error) {
        console.warn('캐시 무효화 실패:', error);
      }
    }
  },

  // 게시글 좋아요 토글
  async togglePostLike(postId, userId) {
    const likeRef = doc(db, collections.posts, postId, 'likes', userId);
    const likeDoc = await getDoc(likeRef);
    const postRef = doc(db, collections.posts, postId);

    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    const postData = postDoc.data();

    const batch = writeBatch(db);
    let isLiked = false;

    if (likeDoc.exists()) {
      batch.delete(likeRef);
      batch.update(postRef, {
        likeCount: increment(-1),
      });
      isLiked = false;
    } else {
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

  // 게시판 총 글 개수 조회
  async getBoardPostCount(boardType) {
    try {
      const cacheKey = `board_count_${boardType}`;
      const cachedCount = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

      if (
        cachedCount &&
        cacheTime &&
        Date.now() - parseInt(cacheTime) < 43200000
      ) {
        return parseInt(cachedCount);
      }

      try {
        const countDoc = await getDoc(doc(db, 'post_counts', boardType));
        if (countDoc.exists()) {
          const count = countDoc.data().count || 0;
          sessionStorage.setItem(cacheKey, count.toString());
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
          return count;
        }
      } catch (countError) {
        console.warn(
          'Count collection not available, falling back to query:',
          countError,
        );
      }

      const { getCountFromServer } = await import('firebase/firestore');

      const countQuery = query(
        collection(db, collections.posts),
        where('boardType', '==', boardType),
        where('isDeleted', '==', false),
      );

      const snapshot = await getCountFromServer(countQuery);
      let totalCount = snapshot.data().count;

      sessionStorage.setItem(cacheKey, totalCount.toString());
      sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());

      return totalCount;
    } catch (error) {
      console.error('Error getting board post count:', error);
      return 0;
    }
  },

  // 게시판 카운트 컬렉션 업데이트 (관리자용)
  async updateBoardPostCount(boardType) {
    try {
      const countQuery = query(
        collection(db, collections.posts),
        where('boardType', '==', boardType),
        where('isDeleted', '==', false),
      );

      const countSnapshot = await getDocs(countQuery);
      const totalCount = countSnapshot.size;

      await setDoc(doc(db, 'post_counts', boardType), {
        count: totalCount,
        updatedAt: serverTimestamp(),
        boardType,
      });

      console.log(`Updated count for ${boardType}: ${totalCount}`);
      return totalCount;
    } catch (error) {
      console.error('Error updating board post count:', error);
      throw error;
    }
  },

  // 페이지네이션을 지원하는 게시글 목록 조회
  async getPostsWithPagination(boardType, options = {}) {
    const {
      lastDoc = null,
      limitCount = 15,
      sortBy = 'latest',
      searchQuery = '',
      tags = [],
    } = options;

    try {
      if (searchQuery || tags.length > 0) {
        return await this.searchPostsWithPagination(searchQuery, {
          boardType,
          sortBy,
          tags,
          page: 1,
          limitCount,
        });
      }

      let constraints = [
        where('boardType', '==', boardType),
        where('isDeleted', '==', false),
      ];

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

      let postsQuery = query(
        collection(db, collections.posts),
        ...constraints,
        limit(limitCount),
      );

      if (lastDoc) {
        if (Array.isArray(lastDoc)) {
          const hydratedLastDoc = lastDoc.map((val) => {
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
              return new Date(val);
            }
            if (typeof val === 'object' && val !== null && 'seconds' in val) {
              return new Date(val.seconds * 1000);
            }
            return val;
          });

          postsQuery = query(postsQuery, startAfter(...hydratedLastDoc));
        } else {
          postsQuery = query(postsQuery, startAfter(lastDoc));
        }
      }

      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const newLastDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1];
      const hasMore = posts.length === limitCount;

      return {
        posts,
        lastDoc: newLastDoc,
        hasMore,
      };
    } catch (error) {
      console.error('Error in getPostsWithPagination:', error);
      throw error;
    }
  },

  // 페이지네이션을 지원하는 게시글 검색
  async searchPostsWithPagination(searchQuery, options = {}) {
    const {
      boardType = null,
      sortBy = 'latest',
      tags = [],
      page = 1,
      limitCount = 15,
    } = options;

    try {
      const cacheKey = `search_${boardType || 'all'}_${searchQuery}_${tags.join(',')}_${sortBy}`;
      const cachedResults = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

      let allPosts = [];

      if (
        cachedResults &&
        cacheTime &&
        Date.now() - parseInt(cacheTime) < 600000
      ) {
        allPosts = JSON.parse(cachedResults);
      } else {
        let constraints = [where('isDeleted', '==', false)];

        if (boardType) {
          constraints.push(where('boardType', '==', boardType));
        }

        if (tags.length > 0) {
          constraints.push(where('tags', 'array-contains-any', tags));
        }

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

        const q = query(collection(db, collections.posts), ...constraints);
        const snapshot = await getDocs(q);

        const searchTerm = searchQuery.toLowerCase();
        allPosts = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((post) => {
            return (
              post.title.toLowerCase().includes(searchTerm) ||
              post.content.toLowerCase().includes(searchTerm) ||
              post.authorName.toLowerCase().includes(searchTerm) ||
              (post.tags &&
                post.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
            );
          });

        sessionStorage.setItem(cacheKey, JSON.stringify(allPosts));
        sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      }

      const totalCount = allPosts.length;
      const startIndex = (page - 1) * limitCount;
      const endIndex = startIndex + limitCount;
      const posts = allPosts.slice(startIndex, endIndex);

      return {
        posts,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limitCount),
        hasMore: endIndex < totalCount,
      };
    } catch (error) {
      console.error('Error in searchPostsWithPagination:', error);
      throw error;
    }
  },

  // 이전/다음 게시글 조회
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
      const prevPostQuery = query(
        collection(db, collections.posts),
        ...commonConstraints,
        where('createdAt', '>', currentPostCreatedAt),
        orderBy('createdAt', 'asc'),
        limit(1),
      );

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

  // 서버사이드 검색 수행 - Algolia 우선, Firestore 폴백
  async performServerSideSearch(boardType, options = {}) {
    const {
      limitCount = 20,
      sortBy = 'latest',
      searchQuery = '',
      tags = [],
      page = 0,
    } = options;

    try {
      const { isAlgoliaEnabled, searchPosts } = await import('../algolia');

      if (isAlgoliaEnabled()) {
        const result = await searchPosts(searchQuery, {
          boardType,
          sortBy,
          tags,
          limitCount,
          page,
        });

        console.log(`Algolia 검색 완료: ${result.posts.length}개 결과`);
        return result;
      }
    } catch (algoliaError) {
      console.warn(
        'Algolia 검색 실패, Firestore로 폴백:',
        algoliaError.message,
      );
    }

    try {
      let constraints = [
        where('boardType', '==', boardType),
        where('isDeleted', '==', false),
      ];

      if (tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', tags));
      }

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

      const searchKeywords = searchQuery
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 1);

      if (searchKeywords.length === 0) {
        constraints.push(limit(limitCount));
      }

      let q = query(collection(db, collections.posts), ...constraints);

      const snapshot = await getDocs(q);
      let posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (searchKeywords.length > 0) {
        posts = posts.filter((post) => {
          const title = (post.title || '').toLowerCase();
          const content = (post.content || '').toLowerCase();
          const authorName = (post.authorName || '').toLowerCase();
          const postTags = post.tags || [];

          return searchKeywords.every(
            (keyword) =>
              title.includes(keyword) ||
              content.includes(keyword) ||
              authorName.includes(keyword) ||
              postTags.some((tag) => tag.toLowerCase().includes(keyword)),
          );
        });

        posts = posts.slice(0, limitCount);
      }

      return posts;
    } catch (error) {
      console.error('Error in performServerSideSearch:', error);
      return [];
    }
  },

  // 캐시 무효화 헬퍼 메서드들
  invalidateBoardCache(boardType) {
    try {
      const cacheKey = `board_count_${boardType}`;
      sessionStorage.removeItem(cacheKey);
      sessionStorage.removeItem(`${cacheKey}_time`);

      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (
          key.startsWith(`search_${boardType}_`) ||
          key.startsWith(`search_all_`)
        ) {
          sessionStorage.removeItem(key);
          sessionStorage.removeItem(`${key}_time`);
        }
      });
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  },

  invalidateSearchCache(searchQuery = null, boardType = null) {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith('search_')) {
          if (!searchQuery && !boardType) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_time`);
          } else if (searchQuery && key.includes(searchQuery)) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_time`);
          } else if (boardType && key.includes(`search_${boardType}_`)) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_time`);
          }
        }
      });
    } catch (error) {
      console.warn('Search cache invalidation failed:', error);
    }
  },

  clearAllCache() {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith('board_count_') || key.startsWith('search_')) {
          sessionStorage.removeItem(key);
          sessionStorage.removeItem(`${key}_time`);
        }
      });
    } catch (error) {
      console.warn('Clear all cache failed:', error);
    }
  },
};
