/**
 * Search and Filtering Composable
 * 게시판 검색 및 필터링 기능을 위한 컴포저블
 */

import { ref, computed, watch } from 'vue';
import { postService } from '@/services/database';
import { debounce } from 'lodash-es';
import { handleUserActionError } from '@/utils/errorHandler';

export function useSearch(boardType) {
  // 커서 영구 저장 헬퍼 함수들
  function getCursorStorageKey(board, sort) {
    return `board_cursors_${board}_${sort}`;
  }

  function loadCursors(board, sort) {
    try {
      const key = getCursorStorageKey(board, sort);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : { 1: null };
    } catch (error) {
      console.warn('커서 로드 실패:', error);
      return { 1: null };
    }
  }

  function saveCursors(board, sort, cursorData) {
    try {
      const key = getCursorStorageKey(board, sort);
      localStorage.setItem(key, JSON.stringify(cursorData));
    } catch (error) {
      console.warn('커서 저장 실패:', error);
    }
  }

  // State
  const searchQuery = ref('');
  const selectedTags = ref([]);
  const sortBy = ref('latest');
  const loading = ref(false);
  const error = ref(null);
  const posts = ref([]);
  const popularTags = ref([]);
  const currentPage = ref(1);
  const totalItems = ref(0);
  const itemsPerPage = ref(15);
  const cursors = ref({ 1: null }); // 메모리 내 커서 캐싱

  // Search options
  const sortOptions = [
    { title: '최신순', value: 'latest', icon: 'mdi-clock-outline' },
    { title: '조회수순', value: 'views', icon: 'mdi-eye-outline' },
    { title: '댓글순', value: 'comments', icon: 'mdi-comment-outline' },
    { title: '추천순', value: 'likes', icon: 'mdi-heart-outline' },
  ];

  // Computed
  const isSearchActive = computed(() => {
    return searchQuery.value.trim() !== '' || selectedTags.value.length > 0;
  });

  const searchSummary = computed(() => {
    const parts = [];
    if (searchQuery.value.trim()) {
      parts.push(`"${searchQuery.value.trim()}"`);
    }
    if (selectedTags.value.length > 0) {
      parts.push(`태그: ${selectedTags.value.join(', ')}`);
    }
    return parts.join(' | ');
  });

  const totalPages = computed(() => {
    return Math.ceil(totalItems.value / itemsPerPage.value);
  });

  // Methods
  async function fetchPosts(page = 1) {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const isNextPage = page === currentPage.value + 1;
      let startAfterCursor = null;

      // 효율적인 경로: 다음 페이지로 순차 이동하는 경우
      if (isNextPage && cursors.value[page - 1]) {
        startAfterCursor = cursors.value[page - 1];
      } else {
        // 비효율적인 경로: 페이지를 점프하거나 뒤로 가는 경우
        // 최적화된 커서 조회 사용 (저장된 커서 재활용)
        startAfterCursor = await getOptimizedCursorForPage(page);

        if (startAfterCursor === 'invalid-page') {
          posts.value = [];
          totalItems.value = 0;
          currentPage.value = page;
          return;
        }
      }

      const options = {
        lastDoc: startAfterCursor,
        limitCount: itemsPerPage.value,
        sortBy: sortBy.value,
      };

      const result = await postService.getPostsWithPagination(
        boardType.value,
        options,
      );

      posts.value = result.posts;
      totalItems.value = result.totalCount;
      currentPage.value = page;

      // 다음 페이지를 위해 현재 페이지의 마지막 문서를 커서로 캐싱합니다 (메모리 + localStorage)
      updateCursor(page, result.lastDoc);
    } catch (err) {
      error.value = '게시글을 불러오는 중 오류가 발생했습니다.';
      await handleUserActionError(err, '게시글 조회');
    } finally {
      loading.value = false;
    }
  }

  async function searchPosts(page = 1) {
    if (!isSearchActive.value) {
      await fetchPosts(page);
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // 최적화됨: 서버사이드 검색 필터링 적용
      const result = await postService.performServerSideSearch(
        boardType.value,
        {
          lastDoc: null, // 검색 시에는 페이지 기반이 아니라 커서 기반으로
          limitCount: itemsPerPage.value,
          sortBy: sortBy.value,
          searchQuery: searchQuery.value.trim(),
          tags: selectedTags.value,
        },
      );

      // 검색 결과에서 해당 페이지의 아이템만 추출
      const startIndex = (page - 1) * itemsPerPage.value;
      const endIndex = startIndex + itemsPerPage.value;
      const paginatedPosts = result.slice(startIndex, endIndex);

      posts.value = paginatedPosts;
      totalItems.value = Math.min(result.length, 1000); // 최대 1000개로 제한
      currentPage.value = page;
    } catch (err) {
      error.value = '검색 중 오류가 발생했습니다.';
      await handleUserActionError(err, '게시글 검색');
    } finally {
      loading.value = false;
    }
  }

  async function loadPopularTags() {
    try {
      const tags = await postService.getPopularTags(boardType.value, 20);
      popularTags.value = tags;
    } catch (err) {
      console.error('Error loading popular tags:', err);
    }
  }

  function addTag(tag) {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag);
    }
  }

  function removeTag(tag) {
    const index = selectedTags.value.indexOf(tag);
    if (index > -1) {
      selectedTags.value.splice(index, 1);
    }
  }

  function clearSearch() {
    searchQuery.value = '';
    selectedTags.value = [];
    currentPage.value = 1;
    cursors.value = { 1: null }; // 커서 캐시 초기화
    fetchPosts(1);
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages.value || page === currentPage.value)
      return;

    if (isSearchActive.value) {
      searchPosts(page);
    } else {
      fetchPosts(page);
    }
  }

  // Debounced search function
  const debouncedSearch = debounce(() => {
    currentPage.value = 1; // 검색 시 첫 페이지로 이동
    if (isSearchActive.value) {
      searchPosts(1);
    } else {
      fetchPosts(1);
    }
  }, 500);

  // Watchers
  watch([searchQuery, selectedTags], () => {
    debouncedSearch();
  });

  watch(sortBy, () => {
    currentPage.value = 1; // 정렬 변경 시 첫 페이지로 이동
    cursors.value = { 1: null }; // 커서 캐시 초기화
    if (isSearchActive.value) {
      searchPosts(1);
    } else {
      fetchPosts(1);
    }
  });

  // 페이지 점프를 위한 최적화된 커서 조회
  async function getOptimizedCursorForPage(targetPage) {
    const storedCursors = loadCursors(boardType.value, sortBy.value);
    const availablePages = Object.keys(storedCursors)
      .map(Number)
      .sort((a, b) => a - b);

    // 1. 정확한 페이지 커서가 있으면 바로 사용
    if (storedCursors[targetPage]) {
      return storedCursors[targetPage];
    }

    // 2. 가장 가까운 이전 페이지 커서 찾기 (이진 탐색 비슷한 로직)
    const closestPage = availablePages.filter((p) => p < targetPage).pop();

    if (closestPage) {
      // 저장된 커서부터 필요한 만큼 더 가져오기
      const pagesToFetch = targetPage - closestPage;
      const itemsToSkip = (pagesToFetch - 1) * itemsPerPage.value;

      try {
        // 저장된 커서부터 필요한 페이지 수만큼 더 가져옴
        const result = await postService.getPostsWithPagination(
          boardType.value,
          {
            lastDoc: storedCursors[closestPage],
            limitCount: itemsToSkip + itemsPerPage.value,
            sortBy: sortBy.value,
          },
        );

        if (result.posts.length >= itemsToSkip + itemsPerPage.value) {
          // 결과에서 필요한 범위의 게시글만 추출
          const targetPosts = result.posts.slice(
            itemsToSkip,
            itemsToSkip + itemsPerPage.value,
          );
          if (targetPosts.length === itemsPerPage.value) {
            // 결과를 로컬에서 처리하므로 실제 DB 쿼리는 생략하고 결과를 직접 설정
            posts.value = targetPosts;
            totalItems.value = result.totalCount;
            currentPage.value = targetPage;
            // 커서 대신 결과를 직접 설정했으므로 null 반환해서 추가 쿼리 방지
            return null;
          }
        }
      } catch (error) {
        console.warn('최적화된 커서 조회 실패:', error);
      }
    }

    // 3. 최적화 실패 시 기존 방식 사용
    return await postService.getCursorForPage(
      boardType.value,
      targetPage,
      itemsPerPage.value,
      sortBy.value,
    );
  }

  // 초기화 및 커서 로드
  function initializeCursors() {
    cursors.value = loadCursors(boardType.value, sortBy.value);
  }

  // 커서 저장 (메모리 + localStorage)
  function updateCursor(page, cursor) {
    if (cursor) {
      cursors.value[page] = cursor;
      saveCursors(boardType.value, sortBy.value, cursors.value);
    }
  }

  watch(
    boardType,
    (newBoardType, oldBoardType) => {
      if (oldBoardType) {
        clearSearch();
      }
      initializeCursors(); // 게시판 변경 시 커서 초기화
      loadPopularTags();
    },
    { immediate: true },
  );

  watch(sortBy, () => {
    currentPage.value = 1;
    initializeCursors(); // 정렬 변경 시 커서 초기화
    if (isSearchActive.value) {
      searchPosts(1);
    } else {
      fetchPosts(1);
    }
  });

  return {
    // State
    searchQuery,
    selectedTags,
    sortBy,
    loading,
    error,
    posts,
    popularTags,
    currentPage,
    totalItems,
    itemsPerPage,

    // Computed
    isSearchActive,
    searchSummary,
    sortOptions,
    totalPages,

    // Methods
    fetchPosts,
    searchPosts,
    loadPopularTags,
    addTag,
    removeTag,
    clearSearch,
    goToPage,
  };
}
