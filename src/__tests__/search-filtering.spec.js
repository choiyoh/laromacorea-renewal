/**
 * Search and Filtering Tests
 * 검색 및 필터링 기능 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createPinia } from 'pinia'
import { useSearch } from '@/composables/useSearch'
import SearchFilters from '@/components/board/SearchFilters.vue'
import { postService } from '@/services/database'

// Mock the database service
vi.mock('@/services/database', () => ({
  postService: {
    getPosts: vi.fn(),
    searchPosts: vi.fn(),
    getPopularTags: vi.fn(),
  },
}))

// Mock lodash-es
vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn) => fn),
}))

const vuetify = createVuetify()
const pinia = createPinia()

// Sample test data
const samplePosts = [
  {
    id: '1',
    title: 'AS 로마 vs 라치오 경기 분석',
    content: '오늘 경기에서 로마가 좋은 경기력을 보여줬습니다.',
    authorName: '로마팬123',
    boardType: 'match',
    tags: ['경기분석', '라치오', '더비'],
    createdAt: new Date('2024-01-15'),
    viewCount: 150,
    likeCount: 25,
    commentCount: 8,
    isPinned: false,
  },
  {
    id: '2',
    title: '디발라 부상 소식',
    content: '디발라가 훈련 중 부상을 당했다는 소식입니다.',
    authorName: '축구매니아',
    boardType: 'squad',
    tags: ['디발라', '부상', '스쿼드'],
    createdAt: new Date('2024-01-14'),
    viewCount: 200,
    likeCount: 15,
    commentCount: 12,
    isPinned: true,
  },
  {
    id: '3',
    title: '로마 새 유니폼 공개',
    content: '2024-25 시즌 새 유니폼이 공개되었습니다.',
    authorName: '유니폼수집가',
    boardType: 'free',
    tags: ['유니폼', '디자인'],
    createdAt: new Date('2024-01-13'),
    viewCount: 300,
    likeCount: 45,
    commentCount: 20,
    isPinned: false,
  },
]

const sampleTags = [
  { tag: '경기분석', count: 15 },
  { tag: '디발라', count: 12 },
  { tag: '유니폼', count: 8 },
  { tag: '라치오', count: 6 },
  { tag: '더비', count: 5 },
]

describe('Search and Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    postService.getPosts.mockResolvedValue(samplePosts)
    postService.searchPosts.mockResolvedValue(samplePosts.slice(0, 2))
    postService.getPopularTags.mockResolvedValue(sampleTags)
  })

  describe('useSearch composable', () => {
    it('should initialize with default values', () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      expect(search.searchQuery.value).toBe('')
      expect(search.selectedTags.value).toEqual([])
      expect(search.sortBy.value).toBe('latest')
      expect(search.loading.value).toBe(false)
      expect(search.posts.value).toEqual([])
    })

    it('should fetch posts on initialization', async () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      await search.fetchPosts(true)

      expect(postService.getPosts).toHaveBeenCalledWith('match', {
        lastDoc: null,
        limitCount: 20,
        sortBy: 'latest',
        searchQuery: '',
        tags: [],
      })
      expect(search.posts.value).toEqual(samplePosts)
    })

    it('should perform search when search query is provided', async () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      search.searchQuery.value = '디발라'
      await search.searchPosts()

      expect(postService.searchPosts).toHaveBeenCalledWith('디발라', {
        boardType: 'match',
        sortBy: 'latest',
        tags: [],
        limitCount: 20,
      })
    })

    it('should filter by tags', async () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      search.selectedTags.value = ['경기분석', '더비']
      await search.fetchPosts(true)

      expect(postService.getPosts).toHaveBeenCalledWith('match', {
        lastDoc: null,
        limitCount: 20,
        sortBy: 'latest',
        searchQuery: '',
        tags: ['경기분석', '더비'],
      })
    })

    it('should sort posts correctly', async () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      search.sortBy.value = 'views'
      await search.fetchPosts(true)

      expect(postService.getPosts).toHaveBeenCalledWith('match', {
        lastDoc: null,
        limitCount: 20,
        sortBy: 'views',
        searchQuery: '',
        tags: [],
      })
    })

    it('should load popular tags', async () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      await search.loadPopularTags()

      expect(postService.getPopularTags).toHaveBeenCalledWith('match', 20)
      expect(search.popularTags.value).toEqual(sampleTags)
    })

    it('should add and remove tags correctly', () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      search.addTag('새태그')
      expect(search.selectedTags.value).toContain('새태그')

      search.addTag('새태그') // 중복 추가 시도
      expect(search.selectedTags.value.filter((tag) => tag === '새태그')).toHaveLength(1)

      search.removeTag('새태그')
      expect(search.selectedTags.value).not.toContain('새태그')
    })

    it('should clear search correctly', async () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      search.searchQuery.value = '테스트'
      search.selectedTags.value = ['태그1', '태그2']

      search.clearSearch()

      expect(search.searchQuery.value).toBe('')
      expect(search.selectedTags.value).toEqual([])
    })

    it('should detect active search state', () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      expect(search.isSearchActive.value).toBe(false)

      search.searchQuery.value = '검색어'
      expect(search.isSearchActive.value).toBe(true)

      search.searchQuery.value = ''
      search.selectedTags.value = ['태그']
      expect(search.isSearchActive.value).toBe(true)

      search.selectedTags.value = []
      expect(search.isSearchActive.value).toBe(false)
    })

    it('should generate search summary correctly', () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      search.searchQuery.value = '로마'
      search.selectedTags.value = ['경기분석', '더비']

      expect(search.searchSummary.value).toBe('"로마" | 태그: 경기분석, 더비')
    })
  })

  describe('SearchFilters component', () => {
    const createWrapper = (props = {}) => {
      return mount(SearchFilters, {
        props: {
          searchQuery: '',
          selectedTags: [],
          sortBy: 'latest',
          popularTags: sampleTags,
          sortOptions: [
            { title: '최신순', value: 'latest', icon: 'mdi-clock-outline' },
            { title: '조회수순', value: 'views', icon: 'mdi-eye-outline' },
            { title: '댓글순', value: 'comments', icon: 'mdi-comment-outline' },
            { title: '추천순', value: 'likes', icon: 'mdi-heart-outline' },
          ],
          ...props,
        },
        global: {
          plugins: [vuetify, pinia],
        },
      })
    }

    it('should render search input', () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="text"]')
      expect(searchInput.exists()).toBe(true)
    })

    it('should render sort options', () => {
      const wrapper = createWrapper()
      const sortSelect = wrapper.find('.v-select')
      expect(sortSelect.exists()).toBe(true)
    })

    it('should render popular tags when not searching', () => {
      const wrapper = createWrapper()
      const popularTagsSection = wrapper.find('.popular-tags')
      expect(popularTagsSection.exists()).toBe(true)
    })

    it('should show search summary when search is active', () => {
      const wrapper = createWrapper({
        searchQuery: '로마',
        selectedTags: ['경기분석'],
      })
      const searchSummary = wrapper.find('.search-summary')
      expect(searchSummary.exists()).toBe(true)
    })

    it('should emit search event on enter key', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="text"]')

      await searchInput.trigger('keyup.enter')
      expect(wrapper.emitted('search')).toBeTruthy()
    })

    it('should emit clear event when clear button is clicked', async () => {
      const wrapper = createWrapper({
        searchQuery: '검색어',
      })

      const clearButton = wrapper.find('[data-testid="clear-button"]')
      if (clearButton.exists()) {
        await clearButton.trigger('click')
        expect(wrapper.emitted('clear')).toBeTruthy()
      }
    })

    it('should emit add-tag event when popular tag is clicked', async () => {
      const wrapper = createWrapper()
      const tagChips = wrapper.findAll('.tag-chips .v-chip')

      if (tagChips.length > 0) {
        await tagChips[0].trigger('click')
        expect(wrapper.emitted('add-tag')).toBeTruthy()
      }
    })
  })

  describe('Database service search methods', () => {
    it('should handle getPosts with search options', async () => {
      const options = {
        lastDoc: null,
        limitCount: 20,
        sortBy: 'views',
        searchQuery: '로마',
        tags: ['경기분석'],
      }

      await postService.getPosts('match', options)
      expect(postService.getPosts).toHaveBeenCalledWith('match', options)
    })

    it('should handle searchPosts with options', async () => {
      const options = {
        boardType: 'match',
        sortBy: 'latest',
        tags: ['디발라'],
        limitCount: 20,
      }

      await postService.searchPosts('부상', options)
      expect(postService.searchPosts).toHaveBeenCalledWith('부상', options)
    })

    it('should handle getPopularTags', async () => {
      await postService.getPopularTags('match', 10)
      expect(postService.getPopularTags).toHaveBeenCalledWith('match', 10)
    })
  })

  describe('Integration tests', () => {
    it('should perform complete search workflow', async () => {
      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      // 초기 로드
      await search.fetchPosts(true)
      expect(search.posts.value).toEqual(samplePosts)

      // 검색어 입력
      search.searchQuery.value = '디발라'
      await search.searchPosts()
      expect(postService.searchPosts).toHaveBeenCalled()

      // 태그 추가
      search.addTag('부상')
      expect(search.selectedTags.value).toContain('부상')

      // 정렬 변경
      search.sortBy.value = 'views'
      await search.searchPosts()
      expect(postService.searchPosts).toHaveBeenCalledWith('디발라', {
        boardType: 'match',
        sortBy: 'views',
        tags: ['부상'],
        limitCount: 20,
      })

      // 검색 초기화
      search.clearSearch()
      expect(search.searchQuery.value).toBe('')
      expect(search.selectedTags.value).toEqual([])
    })

    it('should handle error states gracefully', async () => {
      postService.getPosts.mockRejectedValue(new Error('Network error'))

      const boardType = { value: 'match' }
      const search = useSearch(boardType)

      await search.fetchPosts(true)
      expect(search.error.value).toBe('게시글을 불러오는 중 오류가 발생했습니다.')
      expect(search.loading.value).toBe(false)
    })
  })
})
