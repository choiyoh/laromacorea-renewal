import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { createRouter, createWebHistory } from 'vue-router'
import BoardList from '@/components/board/BoardList.vue'
import { useUserStore } from '@/stores/user'

// Mock composables
vi.mock('@/composables/useSearch', () => ({
  useSearch: vi.fn(() => ({
    searchQuery: vi.fn(),
    selectedTags: vi.fn(),
    sortBy: vi.fn(),
    loading: vi.fn().mockReturnValue(false),
    error: vi.fn().mockReturnValue(null),
    posts: vi.fn().mockReturnValue([]),
    popularTags: vi.fn().mockReturnValue([]),
    hasMore: vi.fn().mockReturnValue(false),
    isSearchActive: vi.fn().mockReturnValue(false),
    searchSummary: vi.fn(),
    sortOptions: vi.fn().mockReturnValue([]),
    fetchPosts: vi.fn(),
    searchPosts: vi.fn(),
    addTag: vi.fn(),
    clearSearch: vi.fn(),
    loadMore: vi.fn(),
  })),
}))

// Mock child components
vi.mock('@/components/board/PostListItem.vue', () => ({
  default: {
    name: 'PostListItem',
    template: '<div class="post-list-item">{{ post.title }}</div>',
    props: ['post', 'isPinned', 'showMatchInfo'],
  },
}))

vi.mock('@/components/board/SearchFilters.vue', () => ({
  default: {
    name: 'SearchFilters',
    template: '<div class="search-filters">Search Filters</div>',
    props: ['searchQuery', 'selectedTags', 'sortBy', 'popularTags', 'sortOptions', 'loading'],
    emits: ['search', 'clear', 'addTag'],
  },
}))

describe('BoardList', () => {
  let wrapper
  let pinia
  let vuetify
  let router
  let userStore

  const mockBoardConfig = {
    name: 'Test Board',
    icon: 'mdi-test',
    adminOnly: false,
  }

  const mockPosts = [
    {
      id: '1',
      title: 'Test Post 1',
      content: 'Test content 1',
      isPinned: true,
      authorName: 'Test User',
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'Test Post 2',
      content: 'Test content 2',
      isPinned: false,
      authorName: 'Test User 2',
      createdAt: new Date(),
    },
  ]

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vuetify = createVuetify()
    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    })

    userStore = useUserStore()
    userStore.user = {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
    }

    vi.clearAllMocks()
  })

  function createWrapper(props = {}) {
    return mount(BoardList, {
      props: {
        boardType: 'free',
        boardConfig: mockBoardConfig,
        ...props,
      },
      global: {
        plugins: [pinia, vuetify, router],
        stubs: {
          PostListItem: true,
          SearchFilters: true,
        },
      },
    })
  }

  it('renders board header correctly', () => {
    wrapper = createWrapper()

    expect(wrapper.find('.board-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Board')
  })

  it('shows write button for authenticated users', () => {
    wrapper = createWrapper()

    const writeButton = wrapper.find('[data-testid="write-button"]')
    expect(writeButton.exists()).toBe(true)
  })

  it('hides write button for unauthenticated users', () => {
    userStore.user = null
    wrapper = createWrapper()

    const writeButton = wrapper.find('[data-testid="write-button"]')
    expect(writeButton.exists()).toBe(false)
  })

  it('shows admin-only message for admin boards when user is not admin', () => {
    wrapper = createWrapper({
      boardConfig: { ...mockBoardConfig, adminOnly: true },
    })

    const writeButton = wrapper.find('[data-testid="write-button"]')
    expect(writeButton.exists()).toBe(false)
  })

  it('shows write button for admin users on admin boards', () => {
    userStore.user.role = 'admin'
    wrapper = createWrapper({
      boardConfig: { ...mockBoardConfig, adminOnly: true },
    })

    const writeButton = wrapper.find('[data-testid="write-button"]')
    expect(writeButton.exists()).toBe(true)
  })

  it('displays loading state correctly', async () => {
    const { useSearch } = await import('@/composables/useSearch')
    useSearch.mockReturnValue({
      ...useSearch(),
      loading: vi.fn().mockReturnValue(true),
    })

    wrapper = createWrapper()

    expect(wrapper.find('.v-progress-circular').exists()).toBe(true)
    expect(wrapper.text()).toContain('게시글을 불러오는 중...')
  })

  it('displays error state correctly', async () => {
    const { useSearch } = await import('@/composables/useSearch')
    useSearch.mockReturnValue({
      ...useSearch(),
      error: vi.fn().mockReturnValue('Test error message'),
    })

    wrapper = createWrapper()

    expect(wrapper.find('.v-alert').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test error message')
  })

  it('displays empty state when no posts', async () => {
    const { useSearch } = await import('@/composables/useSearch')
    useSearch.mockReturnValue({
      ...useSearch(),
      posts: vi.fn().mockReturnValue([]),
    })

    wrapper = createWrapper()

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('게시글이 없습니다')
  })

  it('separates pinned and regular posts correctly', async () => {
    const { useSearch } = await import('@/composables/useSearch')
    useSearch.mockReturnValue({
      ...useSearch(),
      posts: vi.fn().mockReturnValue(mockPosts),
    })

    wrapper = createWrapper()

    expect(wrapper.find('.pinned-posts').exists()).toBe(true)
    expect(wrapper.find('.regular-posts').exists()).toBe(true)
  })

  it('emits view-post event when post is clicked', async () => {
    const { useSearch } = await import('@/composables/useSearch')
    useSearch.mockReturnValue({
      ...useSearch(),
      posts: vi.fn().mockReturnValue(mockPosts),
    })

    wrapper = createWrapper()

    await wrapper.vm.$emit('view-post', '1')

    expect(wrapper.emitted('view-post')).toBeTruthy()
    expect(wrapper.emitted('view-post')[0]).toEqual(['1'])
  })

  it('navigates to write page when write button is clicked', async () => {
    const routerPushSpy = vi.spyOn(router, 'push')
    wrapper = createWrapper()

    const writeButton = wrapper.find('[data-testid="write-button"]')
    if (writeButton.exists()) {
      await writeButton.trigger('click')
      expect(routerPushSpy).toHaveBeenCalledWith('/board/free/write')
    }
  })

  it('shows load more button when hasMore is true', async () => {
    const { useSearch } = await import('@/composables/useSearch')
    useSearch.mockReturnValue({
      ...useSearch(),
      posts: vi.fn().mockReturnValue(mockPosts),
      hasMore: vi.fn().mockReturnValue(true),
    })

    wrapper = createWrapper()

    expect(wrapper.find('.load-more-section').exists()).toBe(true)
  })

  it('calls loadMore when load more button is clicked', async () => {
    const mockLoadMore = vi.fn()
    const { useSearch } = await import('@/composables/useSearch')
    useSearch.mockReturnValue({
      ...useSearch(),
      posts: vi.fn().mockReturnValue(mockPosts),
      hasMore: vi.fn().mockReturnValue(true),
      loadMore: mockLoadMore,
    })

    wrapper = createWrapper()

    const loadMoreButton = wrapper.find('.load-more-section button')
    await loadMoreButton.trigger('click')

    expect(mockLoadMore).toHaveBeenCalled()
  })
})
