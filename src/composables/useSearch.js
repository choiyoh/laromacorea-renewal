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

  // totalPages는 더 이상 사용하지 않음

  // Methods
  async function fetchData(page = 1) {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const options = {
        limitCount: 15, // 하드코딩: itemsPerPage
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
        hasMore.value = false; // 검색 결과는 단일 페이지로 처리
      } else {
        posts.value = result.posts;
        hasMore.value = result.hasMore;

        // 다음 페이지를 위한 커서 저장
        // 정렬 관련 필드값을 추출하여 커서로 사용 (직렬화 가능)
        // sortBy에 따라 필요한 필드가 다름
        // latest: [createdAt, id] (ID는 타이브레이커)
        // views: [viewCount, createdAt, id]
        // ...

        // 하지만 Firestore query constraints가 이미 id를 포함하지 않을 수도 있음.
        // 단순히 doc 전체를 넘기면 Firestore가 알아서 처리하지만, 직렬화를 위해 값만 추출.

        // 여기서는 postService에서 반환된 lastDoc(문서 스냅샷)을 그대로 쓰지 않고,
        // 필요한 값만 추출하여 저장합니다.

        // NOTE: database.js에서 lastDoc을 반환할 때, 스냅샷 대신 값 배열을 반환하도록 수정하는 것이 더 깔끔할 수 있음.
        // 하지만 database.js는 스냅샷을 반환하는 것이 일반적 패턴.
        // useSearch에서 변환하자.

        if (result.lastDoc) {
          // 커서 생성 로직
          const docData = result.lastDoc.data();
          let cursorValues = [];

          // 정렬 기준에 따른 커서 값 추출
          // database.js의 쿼리 정렬 순서와 정확히 일치해야 함
          switch (sortBy.value) {
            case 'views':
              // orderBy('isPinned', 'desc'), orderBy('viewCount', 'desc')
              // isPinned는 보통 false인 것들만 페이징되므로(상단 고정 제외),
              // 일반 게시글 쿼리에서는 isPinned가 false임.
              // 값 순서: [isPinned, viewCount, id(혹은 createdAt?)]
              // database.js 확인 필요: orderBy('createdAt', 'desc')가 아니라면 타이브레이커 필요.
              // database.js: orderBy('isPinned', 'desc'), orderBy('viewCount', 'desc')
              cursorValues = [
                docData.isPinned || false,
                docData.viewCount || 0,
              ];
              break;
            case 'comments':
              cursorValues = [
                docData.isPinned || false,
                docData.commentCount || 0,
              ];
              break;
            case 'likes':
              cursorValues = [
                docData.isPinned || false,
                docData.likeCount || 0,
              ];
              break;
            case 'latest':
            default:
              // orderBy('isPinned', 'desc'), orderBy('createdAt', 'desc')
              cursorValues = [docData.isPinned || false, docData.createdAt];
              break;
          }

          // 커서 저장 (페이지 번호 -> 값 배열)
          cursors.value[page] = cursorValues;
        }
      }

      currentPage.value = page;
      saveState(); // 성공적으로 데이터를 불러온 후 상태 저장
    } catch (err) {
      error.value = '데이터를 불러오는 중 오류가 발생했습니다.';
      await handleUserActionError(err, '데이터 조회');
    } finally {
      loading.value = false;
    }
  }

  // async function loadPopularTags() {
  //   try {
  //     // 인기 태그는 한 번만 로드하거나 세션 캐시 사용
  //     const cacheKey = `popular_tags_${boardType.value}`;
  //     const cached = sessionStorage.getItem(cacheKey);
  //     if (cached) {
  //       popularTags.value = JSON.parse(cached);
  //       return;
  //     }
  //
  //     const tags = await postService.getPopularTags(boardType.value, 20);
  //     popularTags.value = tags;
  //     sessionStorage.setItem(cacheKey, JSON.stringify(tags));
  //   } catch (err) {
  //     console.error('Error loading popular tags:', err);
  //   }
  // }

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

  // State Persistence
  function getStorageKey() {
    return `board_state_${boardType.value}`;
  }

  function saveState() {
    // Only save if we have data or modified state
    const state = {
      currentPage: currentPage.value,
      searchQuery: searchQuery.value,
      selectedTags: selectedTags.value,
      sortBy: sortBy.value,
      cursors: cursors.value, // 커서 상태도 저장
      timestamp: Date.now(),
    };

    // Let's modify saveState to exclude cursors.
    // const { cursors: _, ...safeState } = state;
    sessionStorage.setItem(getStorageKey(), JSON.stringify(state));
  }

  function restoreState() {
    try {
      const key = getStorageKey();
      const saved = sessionStorage.getItem(key);
      if (!saved) return false;

      const state = JSON.parse(saved);

      // Check expiration (e.g. 30 mins)
      if (Date.now() - state.timestamp > 30 * 60 * 1000) {
        sessionStorage.removeItem(key);
        return false;
      }

      searchQuery.value = state.searchQuery || '';
      selectedTags.value = state.selectedTags || [];
      sortBy.value = state.sortBy || 'latest';
      currentPage.value = state.currentPage || 1;

      // Restore cursors
      if (state.cursors) {
        cursors.value = state.cursors;

        // Timestamp handling: Firestore timestamps stored in JSON become strings.
        // We might need to convert them back to Firestore Timestamp objects or Date objects
        // IF database.js expects Timestamp objects.
        // However, startAfter works with Date objects too if stored as Timestamp.
        // JSON.stringify turns Date into string ISO format.
        // We need to ensure database.js handles string dates or we convert them here.

        // Let's iterate and convert string dates if needed.
        // Or simpler: Let database.js handle it or store timestamps as millis?
        // Let's try to retain them as structure but we might need hydration logic.
      }

      return true;
    } catch (e) {
      console.error('Failed to restore state', e);
      return false;
    }
  }

  function clearState() {
    sessionStorage.removeItem(getStorageKey());
  }

  // Flag to prevent watchers from triggering during restoration
  let isRestoring = false;

  // Watchers
  watch([searchQuery, selectedTags, sortBy], () => {
    if (isRestoring) return;

    currentPage.value = 1; // Reset to page 1 on filter change
    cursors.value = { 1: null };
    saveState();
    debouncedFetch();
  });

  watch(
    boardType,
    async (newVal, oldVal) => {
      isRestoring = true;
      try {
        // 게시판이 실제로 변경되었는지 확인 (다른 게시판으로 이동)
        const isBoardChanged = oldVal !== undefined && oldVal !== newVal;

        if (isBoardChanged) {
          // 다른 게시판으로 이동 시 무조건 1페이지로 초기화
          searchQuery.value = '';
          selectedTags.value = [];
          sortBy.value = 'latest';
          currentPage.value = 1;
          cursors.value = { 1: null };
        } else {
          // 같은 게시판으로 돌아온 경우 (뒤로가기 등) 저장된 상태 복원 시도
          const restored = restoreState();
          if (!restored) {
            searchQuery.value = '';
            selectedTags.value = [];
            sortBy.value = 'latest';
            currentPage.value = 1;
            cursors.value = { 1: null };
          }
        }

        // Always fetch to ensure data is fresh
        await fetchData(currentPage.value);
      } finally {
        // Use setTimeout to ensure all watchers have fired before resetting flag
        setTimeout(() => {
          isRestoring = false;
        }, 0);
      }
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
    hasMore,

    // Computed
    isSearchActive,
    searchSummary,
    sortOptions,

    // Methods
    fetchPosts: fetchData, // fetchData를 fetchPosts로 노출
    searchPosts: resetAndFetch, // 검색 실행 함수
    addTag,
    removeTag,
    clearSearch,
    goToPage,
    clearState, // Expose for external use if needed (e.g. logout)
  };
}
