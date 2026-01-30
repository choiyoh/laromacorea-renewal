/**
 * Algolia Search Service
 * 게시물 검색을 위한 Algolia 클라이언트 서비스
 */

import { algoliasearch } from 'algoliasearch';

// Algolia 클라이언트 초기화
const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;

let client = null;

/**
 * Algolia 클라이언트 초기화 확인
 * @returns {boolean} Algolia 사용 가능 여부
 */
export function isAlgoliaEnabled() {
  return !!(appId && searchKey);
}

/**
 * Algolia 클라이언트 가져오기 (지연 초기화)
 * @returns {Object|null} Algolia 클라이언트 또는 null
 */
function getClient() {
  if (!isAlgoliaEnabled()) {
    return null;
  }

  if (!client) {
    client = algoliasearch(appId, searchKey);
  }

  return client;
}

/**
 * HTML 태그 제거 유틸리티
 * @param {string} html - HTML 문자열
 * @returns {string} 텍스트만 남은 문자열
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * 게시물 검색
 * @param {string} query - 검색어
 * @param {Object} options - 검색 옵션
 * @param {string} options.boardType - 게시판 타입 필터
 * @param {string} options.sortBy - 정렬 기준 (latest, views, likes, comments)
 * @param {string[]} options.tags - 태그 필터
 * @param {number} options.limitCount - 결과 제한 수
 * @param {number} options.page - 페이지 번호 (0부터 시작)
 * @returns {Promise<Object>} 검색 결과
 */
export async function searchPosts(query, options = {}) {
  const algoliaClient = getClient();

  if (!algoliaClient) {
    throw new Error('Algolia가 설정되지 않았습니다.');
  }

  const {
    boardType = null,
    sortBy = 'latest',
    tags = [],
    limitCount = 15,
    page = 0,
  } = options;

  // 필터 구성
  const filters = ['isDeleted:false'];

  if (boardType) {
    filters.push(`boardType:${boardType}`);
  }

  if (tags.length > 0) {
    const tagFilters = tags.map((tag) => `tags:${tag}`).join(' OR ');
    filters.push(`(${tagFilters})`);
  }

  // 인덱스 선택 (정렬 기준별 다른 인덱스 또는 replica 사용)
  // 기본 인덱스: posts (createdAt desc로 정렬)
  // 정렬별 replica: posts_views_desc, posts_likes_desc, posts_comments_desc
  let indexName = 'posts';
  switch (sortBy) {
    case 'views':
      indexName = 'posts_views_desc';
      break;
    case 'likes':
      indexName = 'posts_likes_desc';
      break;
    case 'comments':
      indexName = 'posts_comments_desc';
      break;
    case 'latest':
    default:
      indexName = 'posts';
      break;
  }

  try {
    const results = await algoliaClient.searchSingleIndex({
      indexName,
      searchParams: {
        query: query || '',
        filters: filters.join(' AND '),
        hitsPerPage: limitCount,
        page,
        attributesToRetrieve: [
          'objectID',
          'title',
          'content',
          'authorName',
          'authorId',
          'boardType',
          'tags',
          'viewCount',
          'likeCount',
          'commentCount',
          'isPinned',
          'createdAt',
        ],
        attributesToHighlight: ['title', 'content', 'authorName'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      },
    });

    // 결과 변환 (Algolia 형식 -> 기존 형식)
    const posts = results.hits.map((hit) => ({
      id: hit.objectID,
      title: hit.title,
      content: hit.content,
      authorName: hit.authorName,
      authorId: hit.authorId,
      boardType: hit.boardType,
      tags: hit.tags || [],
      viewCount: hit.viewCount || 0,
      likeCount: hit.likeCount || 0,
      commentCount: hit.commentCount || 0,
      isPinned: hit.isPinned || false,
      createdAt: hit.createdAt,
      // 하이라이팅 정보
      _highlightResult: hit._highlightResult,
    }));

    return {
      posts,
      totalCount: results.nbHits,
      totalPages: results.nbPages,
      currentPage: results.page,
      hasMore: results.page < results.nbPages - 1,
    };
  } catch (error) {
    console.error('Algolia 검색 오류:', error);
    throw error;
  }
}

/**
 * Algolia 인덱스에 저장할 게시물 데이터 변환
 * @param {string} postId - 게시물 ID
 * @param {Object} postData - Firestore 게시물 데이터
 * @returns {Object} Algolia 인덱스용 데이터
 */
export function transformPostForAlgolia(postId, postData) {
  return {
    objectID: postId,
    title: postData.title || '',
    content: stripHtml(postData.content || ''),
    authorName: postData.authorName || '',
    authorId: postData.authorId || '',
    boardType: postData.boardType || '',
    tags: postData.tags || [],
    viewCount: postData.viewCount || 0,
    likeCount: postData.likeCount || 0,
    commentCount: postData.commentCount || 0,
    isPinned: postData.isPinned || false,
    isDeleted: postData.isDeleted || false,
    // Timestamp를 Unix timestamp로 변환
    createdAt: postData.createdAt?.toMillis?.()
      ? postData.createdAt.toMillis()
      : postData.createdAt?.seconds
        ? postData.createdAt.seconds * 1000
        : Date.now(),
  };
}
