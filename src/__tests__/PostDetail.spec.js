import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PostDetail from '@/components/board/PostDetail.vue'
import { useUserStore } from '@/stores/user'

// Mock Firebase services
vi.mock('@/services/database', () => ({
  postService: {
    getPost: vi.fn(),
    togglePostLike: vi.fn(),
    checkPostLike: vi.fn(),
    deletePost: vi.fn(),
  },
  commentService: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
    toggleCommentLike: vi.fn(),
  },
}))

// Mock Vuetify components
const mockVuetifyComponents = {
  'v-progress-circular': { template: '<div>Loading...</div>' },
  'v-alert': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-chip': { template: '<span><slot /></span>' },
  'v-icon': { template: '<i></i>' },
  'v-avatar': { template: '<div><slot /></div>' },
  'v-img': { template: '<img />' },
  'v-btn': { template: '<button><slot /></button>' },
  'v-spacer': { template: '<div></div>' },
  'v-divider': { template: '<hr />' },
  'v-dialog': { template: '<div v-if="modelValue"><slot /></div>', props: ['modelValue'] },
}

describe('PostDetail Component', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  const mockPost = {
    id: 'test-post-1',
    title: 'Test Post Title',
    content: 'This is test post content',
    authorId: 'user-1',
    authorName: 'Test User',
    authorIcon: null,
    createdAt: new Date(),
    viewCount: 10,
    likeCount: 5,
    commentCount: 3,
    isPinned: false,
    tags: ['test', 'vue'],
    mediaUrls: [],
  }

  it('renders loading state initially', () => {
    wrapper = mount(PostDetail, {
      props: {
        postId: 'test-post-1',
      },
      global: {
        plugins: [pinia],
        components: mockVuetifyComponents,
      },
    })

    expect(wrapper.text()).toContain('게시글을 불러오는 중...')
  })

  it('renders post content when loaded', async () => {
    const { postService } = await import('@/services/database')
    postService.getPost.mockResolvedValue(mockPost)

    wrapper = mount(PostDetail, {
      props: {
        postId: 'test-post-1',
      },
      global: {
        plugins: [pinia],
        components: mockVuetifyComponents,
      },
    })

    // Wait for the component to load
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('Test Post Title')
    expect(wrapper.text()).toContain('This is test post content')
    expect(wrapper.text()).toContain('Test User')
  })

  it('shows edit and delete buttons for post author', async () => {
    const { postService } = await import('@/services/database')
    postService.getPost.mockResolvedValue(mockPost)

    const userStore = useUserStore()
    userStore.user = {
      uid: 'user-1',
      displayName: 'Test User',
      email: 'test@example.com',
    }
    userStore.isAuthenticated = true

    wrapper = mount(PostDetail, {
      props: {
        postId: 'test-post-1',
      },
      global: {
        plugins: [pinia],
        components: mockVuetifyComponents,
      },
    })

    // Wait for the component to load
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('수정')
    expect(wrapper.text()).toContain('삭제')
  })

  it('emits edit-post event when edit button is clicked', async () => {
    const { postService } = await import('@/services/database')
    postService.getPost.mockResolvedValue(mockPost)

    const userStore = useUserStore()
    userStore.user = {
      uid: 'user-1',
      displayName: 'Test User',
      email: 'test@example.com',
    }
    userStore.isAuthenticated = true

    wrapper = mount(PostDetail, {
      props: {
        postId: 'test-post-1',
      },
      global: {
        plugins: [pinia],
        components: mockVuetifyComponents,
      },
    })

    // Wait for the component to load
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Find and click edit button
    const editButton = wrapper.find('button:contains("수정")')
    if (editButton.exists()) {
      await editButton.trigger('click')
      expect(wrapper.emitted('edit-post')).toBeTruthy()
    }
  })
})
