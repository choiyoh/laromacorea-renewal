import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import MediaUploader from '@/components/common/MediaUploader.vue'
import { storageService } from '@/services/storage'

// Mock the storage service
vi.mock('@/services/storage', () => ({
  storageService: {
    validateFile: vi.fn(),
    uploadImage: vi.fn(),
    uploadVideo: vi.fn(),
    getFileType: vi.fn(),
    formatFileSize: vi.fn(),
  },
}))

// Mock MediaPreview component
vi.mock('@/components/common/MediaPreview.vue', () => ({
  default: {
    name: 'MediaPreview',
    template: '<div class="media-preview-mock">{{ file.name }}</div>',
    props: ['file', 'showRemove'],
    emits: ['remove'],
  },
}))

const vuetify = createVuetify()

describe('MediaUploader', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    storageService.validateFile.mockReturnValue({ isValid: true, errors: [] })
    storageService.getFileType.mockReturnValue('image')
    storageService.formatFileSize.mockReturnValue('1 MB')
    storageService.uploadImage.mockResolvedValue('https://example.com/image.jpg')
  })

  const createWrapper = (props = {}) => {
    return mount(MediaUploader, {
      props: {
        modelValue: [],
        ...props,
      },
      global: {
        plugins: [vuetify],
      },
    })
  }

  it('renders upload area correctly', () => {
    wrapper = createWrapper()

    expect(wrapper.find('.upload-area').exists()).toBe(true)
    expect(wrapper.text()).toContain('클릭하거나 파일을 드래그하여 업로드')
  })

  it('shows file size limit when provided', () => {
    wrapper = createWrapper({
      maxSize: 5 * 1024 * 1024, // 5MB
    })

    expect(wrapper.text()).toContain('최대 5 MB')
  })

  it('validates files before upload', async () => {
    wrapper = createWrapper()

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = wrapper.find('input[type="file"]')

    // Mock file validation failure
    storageService.validateFile.mockReturnValue({
      isValid: false,
      errors: ['파일이 너무 큽니다'],
    })

    await fileInput.setValue([file])

    expect(storageService.validateFile).toHaveBeenCalledWith(file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
    })
  })

  it('uploads files automatically when autoUpload is true', async () => {
    wrapper = createWrapper({
      autoUpload: true,
      uploadPath: 'test',
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = wrapper.find('input[type="file"]')

    await fileInput.setValue([file])

    // Wait for upload to complete
    await wrapper.vm.$nextTick()

    expect(storageService.uploadImage).toHaveBeenCalledWith(
      file,
      expect.stringContaining('test/'),
      expect.any(Function),
    )
  })

  it('does not upload files when autoUpload is false', async () => {
    wrapper = createWrapper({
      autoUpload: false,
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = wrapper.find('input[type="file"]')

    await fileInput.setValue([file])
    await wrapper.vm.$nextTick()

    expect(storageService.uploadImage).not.toHaveBeenCalled()
  })

  it('respects max files limit', async () => {
    wrapper = createWrapper({
      maxFiles: 2,
      modelValue: [
        { name: 'file1.jpg', url: 'url1', type: 'image' },
        { name: 'file2.jpg', url: 'url2', type: 'image' },
      ],
    })

    expect(wrapper.text()).toContain('최대 파일 개수에 도달했습니다')
  })

  it('shows upload progress', async () => {
    wrapper = createWrapper()

    // Mock upload with progress callback
    storageService.uploadImage.mockImplementation((file, path, progressCallback) => {
      // Simulate progress
      progressCallback(50)
      return Promise.resolve('https://example.com/image.jpg')
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = wrapper.find('input[type="file"]')

    await fileInput.setValue([file])
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.upload-progress').exists()).toBe(true)
  })

  it('emits upload-complete event', async () => {
    wrapper = createWrapper()

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = wrapper.find('input[type="file"]')

    await fileInput.setValue([file])
    await wrapper.vm.$nextTick()

    // Wait for upload to complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(wrapper.emitted('upload-complete')).toBeTruthy()
  })

  it('emits upload-error event on failure', async () => {
    wrapper = createWrapper()

    // Mock upload failure
    storageService.uploadImage.mockRejectedValue(new Error('Upload failed'))

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = wrapper.find('input[type="file"]')

    await fileInput.setValue([file])
    await wrapper.vm.$nextTick()

    // Wait for upload to fail
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(wrapper.emitted('upload-error')).toBeTruthy()
  })

  it('can be disabled', () => {
    wrapper = createWrapper({
      disabled: true,
    })

    expect(wrapper.find('.upload-area').classes()).toContain('disabled')
    expect(wrapper.text()).toContain('업로드 비활성화됨')
  })

  it('updates modelValue when files are added', async () => {
    wrapper = createWrapper()

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = wrapper.find('input[type="file"]')

    await fileInput.setValue([file])
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })
})
