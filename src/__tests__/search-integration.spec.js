/**
 * Search Integration Test
 * 검색 기능 통합 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useSearch } from '@/composables/useSearch'
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
]

const sampleTags = [
  { tag: '경기분석', count: 15 },
  { tag: '디발라', count: 12 },
  { tag: '유니폼', count: 8 },
]

describe('Search Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    postService.getPosts.mockResolvedValue(samplePosts)
    postService.searchPosts.mockResolvedValue(samplePosts.slice(0, 1))
    postService.getPopularTags.mockResolvedValue(sampleTags)
  })

  it('should implement all required search features', async () => {
    const boardType = ref('match')
    const search = useSearch(boardType)

    // 1. 게시판별 검색 기능
    expect(search.searchQuery).toBeDefined()
    expect(search.selectedTags).toBeDefined()
    expect(search.sortBy).toBeDefined()

    // 2. 태그 기반 필터링
    search.addTag('경기분석')
    expect(search.selectedTags.value).toContain('경기분석')

    search.removeTag('경기분석')
    expect(search.selectedTags.value).not.toContain('경기분석')

    // 3. 정렬 옵션 (최신순, 인기순, 조회수순)
    expect(search.sortOptions).toEqual([
      { title: '최신순', value: 'latest', icon: 'mdi-clock-outline' },
      { title: '조회수순', value: 'views', icon: 'mdi-eye-outline' },
      { title: '댓글순', value: 'comments', icon: 'mdi-comment-outline' },
      { title: '추천순', value: 'likes', icon: 'mdi-heart-outline' },
    ])

    // 정렬 변경 테스트
    search.sortBy.value = 'views'
    expect(search.sortBy.value).toBe('views')

    search.sortBy.value = 'comments'
    expect(search.sortBy.value).toBe('comments')

    search.sortBy.value = 'likes'
    expect(search.sortBy.value).toBe('likes')
  })

  it('should perform text search correctly', async () => {
    const boardType = ref('match')
    const search = useSearch(boardType)

    // 검색어 입력
    search.searchQuery.value = '디발라'
    await search.searchPosts()

    expect(postService.searchPosts).toHaveBeenCalledWith('디발라', {
      boardType: 'match',
      sortBy: 'latest',
      tags: [],
      limitCount: 20,
    })
  })

  it('should filter by tags correctly', async () => {
    const boardType = ref('match')
    const search = useSearch(boardType)

    // 태그 필터링
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

  it('should sort posts by different criteria', async () => {
    const boardType = ref('match')
    const search = useSearch(boardType)

    // 조회수순 정렬
    search.sortBy.value = 'views'
    await search.fetchPosts(true)

    expect(postService.getPosts).toHaveBeenCalledWith('match', {
      lastDoc: null,
      limitCount: 20,
      sortBy: 'views',
      searchQuery: '',
      tags: [],
    })

    // 댓글순 정렬
    search.sortBy.value = 'comments'
    await search.fetchPosts(true)

    expect(postService.getPosts).toHaveBeenCalledWith('match', {
      lastDoc: null,
      limitCount: 20,
      sortBy: 'comments',
      searchQuery: '',
      tags: [],
    })

    // 추천순 정렬
    search.sortBy.value = 'likes'
    await search.fetchPosts(true)

    expect(postService.getPosts).toHaveBeenCalledWith('match', {
      lastDoc: null,
      limitCount: 20,
      sortBy: 'likes',
      searchQuery: '',
      tags: [],
    })
  })

  it('should combine search query and tag filtering', async () => {
    const boardType = ref('match')
    const search = useSearch(boardType)

    // 검색어와 태그 필터 조합
    search.searchQuery.value = '로마'
    search.selectedTags.value = ['경기분석']
    await search.searchPosts()

    expect(postService.searchPosts).toHaveBeenCalledWith('로마', {
      boardType: 'match',
      sortBy: 'latest',
      tags: ['경기분석'],
      limitCount: 20,
    })
  })

  it('should load popular tags for board', async () => {
    const boardType = ref('match')
    const search = useSearch(boardType)

    await search.loadPopularTags()

    expect(postService.getPopularTags).toHaveBeenCalledWith('match', 20)
    expect(search.popularTags.value).toEqual(sampleTags)
  })

  it('should clear search correctly', async () => {
    const boardType = ref('match')
    const search = useSearch(boardType)

    // 검색 상태 설정
    search.searchQuery.value = '테스트'
    search.selectedTags.value = ['태그1', '태그2']

    // 검색 초기화
    search.clearSearch()

    expect(search.searchQuery.value).toBe('')
    expect(search.selectedTags.value).toEqual([])
  })

  it('should detect search active state', () => {
    const boardType = ref('match')
    const search = useSearch(boardType)

    // 초기 상태
    expect(search.isSearchActive.value).toBe(false)

    // 검색어만 있는 경우
    search.searchQuery.value = '검색어'
    expect(search.isSearchActive.value).toBe(true)

    // 태그만 있는 경우
    search.searchQuery.value = ''
    search.selectedTags.value = ['태그']
    expect(search.isSearchActive.value).toBe(true)

    // 둘 다 없는 경우
    search.selectedTags.value = []
    expect(search.isSearchActive.value).toBe(false)
  })
})
