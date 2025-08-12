/**
 * Search and Filtering Composable
 * 게시판 검색 및 필터링 기능을 위한 컴포저블
 */

import { ref, computed, watch } from 'vue'
import { postService } from '@/services/database'
import { debounce } from 'lodash-es'

export function useSearch(boardType) {
  // State
  const searchQuery = ref('')
  const selectedTags = ref([])
  const sortBy = ref('latest')
  const loading = ref(false)
  const error = ref(null)
  const posts = ref([])
  const popularTags = ref([])
  const hasMore = ref(true)
  const lastDoc = ref(null)

  // Search options
  const sortOptions = [
    { title: '최신순', value: 'latest', icon: 'mdi-clock-outline' },
    { title: '조회수순', value: 'views', icon: 'mdi-eye-outline' },
    { title: '댓글순', value: 'comments', icon: 'mdi-comment-outline' },
    { title: '추천순', value: 'likes', icon: 'mdi-heart-outline' },
  ]

  // Computed
  const isSearchActive = computed(() => {
    return searchQuery.value.trim() !== '' || selectedTags.value.length > 0
  })

  const searchSummary = computed(() => {
    const parts = []
    if (searchQuery.value.trim()) {
      parts.push(`"${searchQuery.value.trim()}"`)
    }
    if (selectedTags.value.length > 0) {
      parts.push(`태그: ${selectedTags.value.join(', ')}`)
    }
    return parts.join(' | ')
  })

  // Methods
  async function fetchPosts(reset = false) {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      if (reset) {
        posts.value = []
        lastDoc.value = null
        hasMore.value = true
      }

      const options = {
        lastDoc: reset ? null : lastDoc.value,
        limitCount: 20,
        sortBy: sortBy.value,
        searchQuery: searchQuery.value.trim(),
        tags: selectedTags.value,
      }

      const fetchedPosts = await postService.getPosts(boardType.value, options)

      if (reset) {
        posts.value = fetchedPosts
      } else {
        posts.value.push(...fetchedPosts)
      }

      // Update pagination state
      if (fetchedPosts.length > 0) {
        lastDoc.value = fetchedPosts[fetchedPosts.length - 1]
        hasMore.value = fetchedPosts.length === options.limitCount
      } else {
        hasMore.value = false
      }
    } catch (err) {
      error.value = '게시글을 불러오는 중 오류가 발생했습니다.'
      console.error('Error fetching posts:', err)
    } finally {
      loading.value = false
    }
  }

  async function searchPosts() {
    if (!isSearchActive.value) {
      await fetchPosts(true)
      return
    }

    loading.value = true
    error.value = null

    try {
      const options = {
        boardType: boardType.value,
        sortBy: sortBy.value,
        tags: selectedTags.value,
        limitCount: 20,
      }

      const searchResults = await postService.searchPosts(searchQuery.value.trim(), options)
      posts.value = searchResults
      hasMore.value = false // 검색 결과는 페이지네이션 없음
      lastDoc.value = null
    } catch (err) {
      error.value = '검색 중 오류가 발생했습니다.'
      console.error('Error searching posts:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadPopularTags() {
    try {
      const tags = await postService.getPopularTags(boardType.value, 20)
      popularTags.value = tags
    } catch (err) {
      console.error('Error loading popular tags:', err)
    }
  }

  function addTag(tag) {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
    }
  }

  function removeTag(tag) {
    const index = selectedTags.value.indexOf(tag)
    if (index > -1) {
      selectedTags.value.splice(index, 1)
    }
  }

  function clearSearch() {
    searchQuery.value = ''
    selectedTags.value = []
    fetchPosts(true)
  }

  function loadMore() {
    if (!loading.value && hasMore.value && !isSearchActive.value) {
      fetchPosts(false)
    }
  }

  // Debounced search function
  const debouncedSearch = debounce(() => {
    if (isSearchActive.value) {
      searchPosts()
    } else {
      fetchPosts(true)
    }
  }, 500)

  // Watchers
  watch([searchQuery, selectedTags], () => {
    debouncedSearch()
  })

  watch(sortBy, () => {
    if (isSearchActive.value) {
      searchPosts()
    } else {
      fetchPosts(true)
    }
  })

  watch(
    boardType,
    () => {
      clearSearch()
      loadPopularTags()
    },
    { immediate: true },
  )

  return {
    // State
    searchQuery,
    selectedTags,
    sortBy,
    loading,
    error,
    posts,
    popularTags,
    hasMore,

    // Computed
    isSearchActive,
    searchSummary,
    sortOptions,

    // Methods
    fetchPosts,
    searchPosts,
    loadPopularTags,
    addTag,
    removeTag,
    clearSearch,
    loadMore,
  }
}
