/**
 * Search and Filtering Composable
 * 게시판 검색 및 필터링 기능을 위한 컴포저블
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
  const itemsPerPage = ref(10);

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
      const options = {
        page: page,
        limitCount: itemsPerPage.value,
        sortBy: sortBy.value,
        searchQuery: searchQuery.value.trim(),
        tags: selectedTags.value,
      };

      // 서버 사이드 페이지네이션을 지원하는 새로운 서비스 메서드 사용
      const result = await postService.getPostsWithPagination(
        boardType.value,
        options,
      );

      posts.value = result.posts;
      totalItems.value = result.totalCount;
      currentPage.value = page;
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
      const options = {
        boardType: boardType.value,
        sortBy: sortBy.value,
        tags: selectedTags.value,
        page: page,
        limitCount: itemsPerPage.value,
      };

      const result = await postService.searchPostsWithPagination(
        searchQuery.value.trim(),
        options,
      );
      posts.value = result.posts;
      totalItems.value = result.totalCount;
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
    fetchPosts(1);
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages.value) return;

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
    if (isSearchActive.value) {
      searchPosts(1);
    } else {
      fetchPosts(1);
    }
  });

  watch(
    boardType,
    (newBoardType, oldBoardType) => {
      if (oldBoardType) {
        clearSearch();
      }
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
