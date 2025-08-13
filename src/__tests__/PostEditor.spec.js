import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import PostEditor from '@/components/board/PostEditor.vue'
import { useUserStore } from '@/stores/user'

// Mock Quill editor
vi.mock('quill', () => ({
  default: vi.fn(() => ({
    root: {
      innerHTML: '',
    },
    on: vi.fn(),
    getModule: vi.fn(() => ({
      addHandler: vi.fn(),
    })),
    getText: vi.fn(() => 'Test content'),
    getSelection: vi.fn(() => ({ index: 0 })),
    insertText: vi.fn(),
    deleteText: vi.fn(),
    insertEmbed: vi.fn(),
  })),
}))

// Mock services
vi.mock('@/services/database', () => ({
  postService: {
    createPost: vi.fn(),
    updatePost: vi.fn(),
  },
}))

vi.mock('@/services/storage', () => ({
  storageService: {
    validateFile: vi.fn(),
    uploadImage: vi.fn(),
  },
}))

vi.mock('@/services/match', () => ({
  matchService: {
    getTodayMatches: vi.fn(),
    getUpcomingMatches: vi.fn(),
  },
  createSampleMatchData: vi.fn(),
}))

// Mock child components
vi.mock('@/components/common/MediaUploader.vue', () => ({
  default: {
    name: 'MediaUploader',
    template: '<div class="media-uploader">Media Uploader</div>',
    props: ['modelValue', 'maxFiles', 'maxSize', 'acceptedTypes', 'uploadPath'],
    emits: ['update:modelValue', 'upload-complete', 'upload-error'],
  },
}))

vi.mock('@/components/board/MatchPostTemplate.vue', () => ({
  default: {
    name: 'MatchPostTemplate',
    template: '<div class="match-post-template">Match Post Template</div>',
    props: ['availableMatches'],
    emits: ['create-post', 'cancel'],
  },
}))

describe('PostEditor', () => {
  let wrapper
  let pinia
  let vuetify
  let userStore
  let mockPostService

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    vuetify = createVuetify()

    userStore = useUserStore()
    userStore.user = {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
      selectedIcon: null,
    }

    const { postService } = await import('@/services/database')
    mockPostService = postService

    mockPostService.createPost.mockResolvedValue('new-post-id')
    mockPostService.updatePost.mockResolvedValue()

    vi.clearAllMocks()
  })

  function createWrapper(props = {}) {
    return mount(PostEditor, {
      props: {
        boardType: 'free',
        isEdit: false,
        ...props,
      },
      global: {
        plugins: [pinia, vuetify],
        stubs: {
          MediaUploader: true,
          MatchPostTemplate: true,
        },
      },
    })
  }

  it('renders form elements correctly', () => {
    wrapper = createWrapper()

    expect(wrapper.find('input[label="제목"]').exists()).toBe(true)
    expect(wrapper.find('.editor-container').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('shows board selection for new posts without boardType', () => {
    wrapper = createWrapper({ boardType: null })

    expect(wrapper.find('select[label="게시판"]').exists()).toBe(true)
  })

  it('hides board selection for edit mode', () => {
    wrapper = createWrapper({ isEdit: true })

    expect(wrapper.find('select[label="게시판"]').exists()).toBe(false)
  })

  it('shows media upload for media board', () => {
    wrapper = createWrapper({ boardType: 'media' })

    expect(wrapper.find('.media-upload').exists()).toBe(true)
  })

  it('hides media upload for non-media boards', () => {
    wrapper = createWrapper({ boardType: 'free' })

    expect(wrapper.find('.media-upload').exists()).toBe(false)
  })

  it('shows match template for match board', () => {
    wrapper = createWrapper({ boardType: 'match' })

    expect(wrapper.find('.match-template').exists()).toBe(true)
  })

  it('validates title input', async () => {
    wrapper = createWrapper()

    const titleInput = wrapper.find('input[label="제목"]')

    // Test empty title
    await titleInput.setValue('')
    await titleInput.trigger('blur')
    expect(wrapper.text()).toContain('제목을 입력해주세요')

    // Test short title
    await titleInput.setValue('a')
    await titleInput.trigger('blur')
    expect(wrapper.text()).toContain('제목은 2글자 이상이어야 합니다')

    // Test long title
    await titleInput.setValue('a'.repeat(101))
    await titleInput.trigger('blur')
    expect(wrapper.text()).toContain('제목은 100글자 이하여야 합니다')

    // Test valid title
    await titleInput.setValue('Valid Title')
    await titleInput.trigger('blur')
    expect(wrapper.vm.formData.title).toBe('Valid Title')
  })

  it('validates board selection for new posts', async () => {
    wrapper = createWrapper({ boardType: null })

    const boardSelect = wrapper.find('select[label="게시판"]')

    // Test empty selection
    await boardSelect.setValue('')
    await boardSelect.trigger('blur')
    expect(wrapper.text()).toContain('게시판을 선택해주세요')

    // Test valid selection
    await boardSelect.setValue('free')
    await boardSelect.trigger('blur')
    expect(wrapper.vm.formData.boardType).toBe('free')
  })

  it('handles form submission for new post', async () => {
    wrapper = createWrapper()

    // Fill form data
    wrapper.vm.formData = {
      title: 'Test Post',
      content: '<p>Test content</p>',
      boardType: 'free',
      tags: ['test'],
      mediaUrls: [],
    }

    // Mock form validation
    wrapper.vm.$refs.form = { validate: vi.fn(() => true) }
    wrapper.vm.validateContent = vi.fn(() => true)

    await wrapper.vm.handleSubmit()

    expect(mockPostService.createPost).toHaveBeenCalledWith({
      title: 'Test Post',
      content: '<p>Test content</p>',
      boardType: 'free',
      tags: ['test'],
      mediaUrls: [],
      authorId: 'test-user',
      authorName: 'Test User',
      authorIcon: null,
    })

    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('handles form submission for post update', async () => {
    const mockPost = {
      id: 'existing-post-id',
      title: 'Existing Post',
      content: 'Existing content',
      boardType: 'free',
      tags: [],
      mediaUrls: [],
    }

    wrapper = createWrapper({
      isEdit: true,
      post: mockPost,
    })

    // Fill form data
    wrapper.vm.formData = {
      title: 'Updated Post',
      content: '<p>Updated content</p>',
      boardType: 'free',
      tags: ['updated'],
      mediaUrls: [],
    }

    // Mock form validation
    wrapper.vm.$refs.form = { validate: vi.fn(() => true) }
    wrapper.vm.validateContent = vi.fn(() => true)

    await wrapper.vm.handleSubmit()

    expect(mockPostService.updatePost).toHaveBeenCalledWith('existing-post-id', {
      title: 'Updated Post',
      content: '<p>Updated content</p>',
      boardType: 'free',
      tags: ['updated'],
      mediaUrls: [],
      authorId: 'test-user',
      authorName: 'Test User',
      authorIcon: null,
    })

    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('prevents submission with invalid form', async () => {
    wrapper = createWrapper()

    // Mock form validation to fail
    wrapper.vm.$refs.form = { validate: vi.fn(() => false) }
    wrapper.vm.validateContent = vi.fn(() => false)

    await wrapper.vm.handleSubmit()

    expect(mockPostService.createPost).not.toHaveBeenCalled()
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('saves draft to localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    wrapper = createWrapper()

    wrapper.vm.formData = {
      title: 'Draft Title',
      content: 'Draft content',
      boardType: 'free',
      tags: ['draft'],
    }

    wrapper.vm.saveDraft()

    expect(setItemSpy).toHaveBeenCalledWith(
      'post_draft_free',
      expect.stringContaining('Draft Title'),
    )
  })

  it('loads draft from localStorage', () => {
    const draftData = {
      title: 'Loaded Draft',
      content: 'Loaded content',
      boardType: 'free',
      tags: ['loaded'],
    }

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(draftData))

    wrapper = createWrapper()
    wrapper.vm.loadDraft()

    expect(wrapper.vm.formData.title).toBe('Loaded Draft')
    expect(wrapper.vm.formData.content).toBe('Loaded content')
  })

  it('clears draft from localStorage', () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
    wrapper = createWrapper()

    wrapper.vm.clearDraft()

    expect(removeItemSpy).toHaveBeenCalledWith('post_draft_free')
  })

  it('handles media upload completion', () => {
    wrapper = createWrapper({ boardType: 'media' })

    const fileData = {
      name: 'test.jpg',
      url: 'https://example.com/test.jpg',
      type: 'image',
    }

    wrapper.vm.onMediaUploadComplete(fileData)

    expect(wrapper.vm.formData.mediaUrls).toContain('https://example.com/test.jpg')
  })

  it('handles media upload error', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    wrapper = createWrapper({ boardType: 'media' })

    const errorData = {
      file: { name: 'test.jpg' },
      error: { message: 'Upload failed' },
    }

    wrapper.vm.onMediaUploadError(errorData)

    expect(alertSpy).toHaveBeenCalledWith('test.jpg 업로드에 실패했습니다: Upload failed')
  })

  it('shows match template dialog for match board', async () => {
    wrapper = createWrapper({ boardType: 'match' })

    const templateButton = wrapper.find('.match-template button')
    await templateButton.trigger('click')

    expect(wrapper.vm.showMatchTemplate).toBe(true)
  })

  it('applies match template data', () => {
    wrapper = createWrapper({ boardType: 'match' })

    const templateData = {
      title: 'Match: Roma vs Milan',
      content: '<p>Match content</p>',
      tags: ['match', 'roma'],
      matchId: 'match-123',
      matchData: { homeTeam: 'Roma', awayTeam: 'Milan' },
    }

    wrapper.vm.handleMatchTemplateCreate(templateData)

    expect(wrapper.vm.formData.title).toBe('Match: Roma vs Milan')
    expect(wrapper.vm.formData.tags).toEqual(['match', 'roma'])
    expect(wrapper.vm.formData.matchId).toBe('match-123')
    expect(wrapper.vm.showMatchTemplate).toBe(false)
  })

  it('emits cancel event when cancel button is clicked', async () => {
    wrapper = createWrapper()

    const cancelButton = wrapper.find('button[variant="outlined"]:not([color="primary"])')
    await cancelButton.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('shows correct button text for edit mode', () => {
    wrapper = createWrapper({ isEdit: true })

    expect(wrapper.text()).toContain('수정')
    expect(wrapper.text()).toContain('게시글 수정')
  })

  it('shows correct button text for create mode', () => {
    wrapper = createWrapper({ isEdit: false })

    expect(wrapper.text()).toContain('작성')
    expect(wrapper.text()).toContain('게시글 작성')
  })
})
