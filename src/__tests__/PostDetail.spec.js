import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import PostDetail from '@/components/board/PostDetail.vue'
import { useUserStore } from '@/stores/user'

// Mock services
vi.mock('@/services/database', () => ({
  postService: {
    getPost: vi.fn(),
    checkPostLike: vi.fn(),
    togglePostLike: vi.fn(),
    deletePost: vi.fn(),
  },
  commentService: {
    getComments: vi.fn(),
  },
}))

// Mock child components
vi.mock('@/components/board/CommentSystem.vue', () => ({
  default: {
    name: 'CommentSystem',
    template: '<div class="comment-system">Comment System</div>',
    props: ['postId', 'comments', 'loading'],
    emits: ['comment-added', 'comment-updated', 'comment-deleted'],
  },
}))

vi.mock('@/components/board/MatchCommentSystem.vue', () => ({
  default: {
    name: 'MatchCommentSystem',
    template: '<div class="match-comment-system">Match Comment System</div>',
    props: ['postId', 'matchData', 'showCheeringStats'],
    emits: ['comment-added', 'comment-updated', 'comment-deleted'],
  },
}))

vi.mock('@/components/board/MatchInfo.vue', () => ({
  default: {
    name: 'MatchInfo',
    template: '<div class="match-info">Match Info</div>',
    props: ['matchData'],
  },
}))

describe('PostDetail', () => {
  let wrapper
  let pinia
  let vuetify
  let userStore
  let mockPostService
  let mockCommentService

  const mockPost = {
    id: 'test-post-id',
    title: 'Test Post Title',
    content: '<p>Test post content</p>',
    boardType: 'free',
    authorId: 'author-id',
    authorName: 'Test Author',
    authorIcon: null,
    createdAt: { toDate: () => new Date('2024-01-01') },
    viewCount: 100,
    likeCount: 5,
    commentCount: 3,
    isPinned: false,
    tags: ['test', 'post'],
    mediaUrls: ['https://example.com/image.jpg'],
  }

  const mockComments = [
    {
      id: 'comment-1',
      postId: 'test-post-id',
      authorId: 'commenter-1',
      authorName: 'Commenter 1',
      content: 'Test comment 1',
      createdAt: { toDate: () => new Date('2024-01-02') },
      likeCount: 1,
    },
    {
      id: 'comment-2',
      postId: 'test-post-id',
      authorId: 'commenter-2',
      authorName: 'Commenter 2',
      content: 'Test comment 2',
      createdAt: { toDate: () => new Date('2024-01-03') },
      likeCount: 0,
    },
  ]

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    vuetify = createVuetify()

    userStore = useUserStore()
    userStore.user = {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
    }

    const { postService, commentService } = await import('@/services/database')
    mockPostService = postService
    mockCommentService = commentService

    mockPostService.getPost.mockResolvedValue(mockPost)
    mockPostService.checkPostLike.mockResolvedValue(false)
    mockCommentService.getComments.mockResolvedValue(mockComments)

    vi.clearAllMocks()
  })

  function createWrapper(props = {}) {
    return mount(PostDetail, {
      props: {
        postId: 'test-post-id',
        ...props,
      },
      global: {
        plugins: [pinia, vuetify],
        stubs: {
          CommentSystem: true,
          MatchCommentSystem: true,
          MatchInfo: true,
        },
      },
    })
  }

  it('renders post details correctly', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Test Post Title')
    expect(wrapper.text()).toContain('Test Author')
    expect(wrapper.text()).toContain('100')
  })

  it('shows loading state initially', () => {
    wrapper = createWrapper()

    expect(wrapper.find('.v-progress-circular').exists()).toBe(true)
    expect(wrapper.text()).toContain('게시글을 불러오는 중...')
  })

  it('displays error when post fetch fails', async () => {
    mockPostService.getPost.mockRejectedValue(new Error('Post not found'))
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.v-alert').exists()).toBe(true)
    expect(wrapper.text()).toContain('게시글을 불러오는 중 오류가 발생했습니다.')
  })

  it('shows edit button for post author', async () => {
    userStore.user.uid = 'author-id'
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const editButton = wrapper.find('[data-testid="edit-button"]')
    expect(editButton.exists()).toBe(true)
  })

  it('shows edit button for admin users', async () => {
    userStore.user.role = 'admin'
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const editButton = wrapper.find('[data-testid="edit-button"]')
    expect(editButton.exists()).toBe(true)
  })

  it('hides edit button for other users', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const editButton = wrapper.find('[data-testid="edit-button"]')
    expect(editButton.exists()).toBe(false)
  })

  it('shows delete button for post author', async () => {
    userStore.user.uid = 'author-id'
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.find('[data-testid="delete-button"]')
    expect(deleteButton.exists()).toBe(true)
  })

  it('handles like button click', async () => {
    mockPostService.togglePostLike.mockResolvedValue(true)
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const likeButton = wrapper.find('[data-testid="like-button"]')
    await likeButton.trigger('click')

    expect(mockPostService.togglePostLike).toHaveBeenCalledWith('test-post-id', 'test-user')
  })

  it('displays media attachments correctly', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.media-attachments').exists()).toBe(true)
    expect(wrapper.find('.media-grid').exists()).toBe(true)
  })

  it('displays tags correctly', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.post-tags').exists()).toBe(true)
    expect(wrapper.text()).toContain('#test')
    expect(wrapper.text()).toContain('#post')
  })

  it('shows pinned badge for pinned posts', async () => {
    mockPostService.getPost.mockResolvedValue({ ...mockPost, isPinned: true })
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.v-chip').text()).toContain('공지')
  })

  it('opens media viewer when image is clicked', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const image = wrapper.find('.media-item img')
    await image.trigger('click')

    expect(wrapper.find('.v-dialog').exists()).toBe(true)
  })

  it('shows delete confirmation dialog', async () => {
    userStore.user.uid = 'author-id'
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.find('[data-testid="delete-button"]')
    await deleteButton.trigger('click')

    expect(wrapper.text()).toContain('게시글 삭제')
    expect(wrapper.text()).toContain('정말로 이 게시글을 삭제하시겠습니까?')
  })

  it('calls delete service when deletion is confirmed', async () => {
    userStore.user.uid = 'author-id'
    mockPostService.deletePost.mockResolvedValue()
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    // Open delete dialog
    const deleteButton = wrapper.find('[data-testid="delete-button"]')
    await deleteButton.trigger('click')

    // Confirm deletion
    const confirmButton = wrapper.find('[data-testid="confirm-delete"]')
    await confirmButton.trigger('click')

    expect(mockPostService.deletePost).toHaveBeenCalledWith('test-post-id')
    expect(wrapper.emitted('delete-post')).toBeTruthy()
  })

  it('renders match comment system for match posts', async () => {
    const matchPost = {
      ...mockPost,
      boardType: 'match',
      matchData: { homeTeam: 'Roma', awayTeam: 'Milan' },
    }
    mockPostService.getPost.mockResolvedValue(matchPost)
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.match-comment-system').exists()).toBe(true)
    expect(wrapper.find('.comment-system').exists()).toBe(false)
  })

  it('renders regular comment system for non-match posts', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.comment-system').exists()).toBe(true)
    expect(wrapper.find('.match-comment-system').exists()).toBe(false)
  })

  it('handles comment added event', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const newComment = {
      id: 'new-comment',
      content: 'New comment',
      authorName: 'New Author',
    }

    await wrapper.vm.handleCommentAdded(newComment)

    expect(wrapper.vm.comments).toContain(newComment)
  })

  it('handles comment updated event', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const updatedComment = {
      id: 'comment-1',
      content: 'Updated comment',
      authorName: 'Commenter 1',
    }

    await wrapper.vm.handleCommentUpdated(updatedComment)

    const comment = wrapper.vm.comments.find((c) => c.id === 'comment-1')
    expect(comment.content).toBe('Updated comment')
  })

  it('handles comment deleted event', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    await wrapper.vm.handleCommentDeleted('comment-1')

    expect(wrapper.vm.comments.find((c) => c.id === 'comment-1')).toBeUndefined()
  })

  it('formats date correctly', async () => {
    wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const formattedDate = wrapper.vm.formatDate(mockPost.createdAt)
    expect(formattedDate).toContain('2024')
  })

  it('identifies image files correctly', async () => {
    wrapper = createWrapper()

    expect(wrapper.vm.isImage('test.jpg')).toBe(true)
    expect(wrapper.vm.isImage('test.png')).toBe(true)
    expect(wrapper.vm.isImage('test.gif')).toBe(true)
    expect(wrapper.vm.isImage('test.mp4')).toBe(false)
  })

  it('identifies video files correctly', async () => {
    wrapper = createWrapper()

    expect(wrapper.vm.isVideo('test.mp4')).toBe(true)
    expect(wrapper.vm.isVideo('test.webm')).toBe(true)
    expect(wrapper.vm.isVideo('test.jpg')).toBe(false)
  })
})
