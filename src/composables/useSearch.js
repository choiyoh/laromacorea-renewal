/**
 * Search and Filtering Composable
 * 게시판 검색 및 필터링 기능을 위한 컴포저블 (최적화된 버전)
 */

import { ref, computed, watch } from 'vue';
import { postService } from '@/services/database';
import { debounce } from 'lodash-es';
import { handleUserActionError } from '@/utils/errorHandler';

export function useSearch(boardType) {
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
  const hasMore = ref(false);

  // 페이지별 커서를 저장하는 객체. cursors[1]은 항상 null (첫 페이지)
  const cursors = ref({ 1: null });

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
  async function fetchData(page = 1) {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const options = {
        limitCount: itemsPerPage.value,
        sortBy: sortBy.value,
        searchQuery: searchQuery.value.trim(),
        tags: selectedTags.value,
        // 요청하는 페이지의 이전 페이지 커서를 사용
        lastDoc: cursors.value[page - 1],
      };

      const result = isSearchActive.value
        ? await postService.performServerSideSearch(boardType.value, options)
        : await postService.getPostsWithPagination(boardType.value, options);

      if (isSearchActive.value) {
        // 검색 결과는 페이지네이션 정보가 없으므로 직접 처리
        posts.value = result;
        totalItems.value = result.length; // 검색은 전체 카운트를 알 수 없음
        hasMore.value = false; // 검색 결과는 단일 페이지로 처리
      } else {
        posts.value = result.posts;
        totalItems.value = result.totalCount;
        hasMore.value = result.hasMore;

        // 다음 페이지를 위한 커서 저장
        if (result.lastDoc) {
          cursors.value[page] = result.lastDoc;
        }
      }

      currentPage.value = page;
    } catch (err) {
      error.value = '데이터를 불러오는 중 오류가 발생했습니다.';
      await handleUserActionError(err, '데이터 조회');
    } finally {
      loading.value = false;
    }
  }

  async function loadPopularTags() {
    try {
      // 인기 태그는 한 번만 로드하거나 세션 캐시 사용
      const cacheKey = `popular_tags_${boardType.value}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        popularTags.value = JSON.parse(cached);
        return;
      }

      const tags = await postService.getPopularTags(boardType.value, 20);
      popularTags.value = tags;
      sessionStorage.setItem(cacheKey, JSON.stringify(tags));
    } catch (err) {
      console.error('Error loading popular tags:', err);
    }
  }

  function resetAndFetch() {
    currentPage.value = 1;
    cursors.value = { 1: null };
    posts.value = [];
    fetchData(1);
  }

  const debouncedFetch = debounce(resetAndFetch, 500);

  function goToPage(page) {
    if (page < 1 || page === currentPage.value) return;

    // 검색 중에는 페이지 이동 불가 (단일 결과 페이지만 표시)
    if (isSearchActive.value) return;

    // 다음 페이지로만 이동 가능
    if (page > currentPage.value && !hasMore.value) return;

    fetchData(page);
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
    // resetAndFetch()는 watch 핸들러에 의해 호출됨
  }

  // Watchers
  watch([searchQuery, selectedTags, sortBy], () => {
    debouncedFetch();
  });

  watch(
    boardType,
    () => {
      clearSearch();
      resetAndFetch();
      loadPopularTags();
    },
    { immediate: true },
  );

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
    hasMore,

    // Computed
    isSearchActive,
    searchSummary,
    sortOptions,
    totalPages,

    // Methods
    fetchPosts: fetchData, // fetchData를 fetchPosts로 노출
    searchPosts: resetAndFetch, // 검색 실행 함수
    addTag,
    removeTag,
    clearSearch,
    goToPage,
  };
}
