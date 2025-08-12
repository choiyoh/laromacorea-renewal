import { describe, it, expect, vi, beforeEach } from 'vitest'
import { storageService } from '@/services/storage'
import { useMediaUpload } from '@/composables/useMediaUpload'

// Mock Firebase Storage
vi.mock('@/services/firebase', () => ({
  storage: {},
}))

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}))

describe('Media Upload Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Storage Service', () => {
    it('validates files correctly', () => {
      const validImageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const largeFile = new File([new ArrayBuffer(20 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })

      const validResult = storageService.validateFile(validImageFile)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)

      const invalidResult = storageService.validateFile(invalidFile)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors).toContain('지원하지 않는 파일 형식입니다.')

      const largeResult = storageService.validateFile(largeFile)
      expect(largeResult.isValid).toBe(false)
      expect(largeResult.errors).toContain('파일 크기가 10MB를 초과합니다.')
    })

    it('formats file sizes correctly', () => {
      expect(storageService.formatFileSize(0)).toBe('0 Bytes')
      expect(storageService.formatFileSize(1024)).toBe('1 KB')
      expect(storageService.formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(storageService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('identifies file types correctly', () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const videoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      expect(storageService.getFileType(imageFile)).toBe('image')
      expect(storageService.getFileType(videoFile)).toBe('video')
      expect(storageService.getFileType(textFile)).toBe('other')
    })
  })

  describe('Media Upload Composable', () => {
    it('initializes with correct default values', () => {
      const { files, hasFiles, canAddMore, uploadedFiles, pendingFiles } = useMediaUpload()

      expect(files.value).toEqual([])
      expect(hasFiles.value).toBe(false)
      expect(canAddMore.value).toBe(true)
      expect(uploadedFiles.value).toEqual([])
      expect(pendingFiles.value).toEqual([])
    })

    it('respects max files limit', () => {
      const { addFile, canAddMore } = useMediaUpload({ maxFiles: 2 })

      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      const file3 = new File(['test3'], 'test3.jpg', { type: 'image/jpeg' })

      expect(addFile(file1, false)).toBe(true)
      expect(addFile(file2, false)).toBe(true)
      expect(canAddMore.value).toBe(false)
      expect(addFile(file3, false)).toBe(false)
    })

    it('validates files before adding', () => {
      const { addFile, errors } = useMediaUpload({
        maxSize: 1024, // 1KB
        acceptedTypes: ['image/jpeg'],
      })

      const validFile = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const invalidTypeFile = new File(['x'], 'test.png', { type: 'image/png' })
      const largeFile = new File([new ArrayBuffer(2048)], 'large.jpg', { type: 'image/jpeg' })

      expect(addFile(validFile, false)).toBe(true)
      expect(addFile(invalidTypeFile, false)).toBe(false)
      expect(addFile(largeFile, false)).toBe(false)

      expect(errors.value.length).toBeGreaterThan(0)
    })

    it('manages file removal correctly', () => {
      const { addFile, removeFile, files } = useMediaUpload()

      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })

      addFile(file1, false)
      addFile(file2, false)

      expect(files.value).toHaveLength(2)

      const firstFileId = files.value[0].id
      removeFile(firstFileId)

      expect(files.value).toHaveLength(1)
      expect(files.value[0].name).toBe('test2.jpg')
    })

    it('clears all files correctly', () => {
      const { addFile, clearFiles, files } = useMediaUpload()

      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })

      addFile(file1, false)
      addFile(file2, false)

      expect(files.value).toHaveLength(2)

      clearFiles()

      expect(files.value).toHaveLength(0)
    })
  })
})
