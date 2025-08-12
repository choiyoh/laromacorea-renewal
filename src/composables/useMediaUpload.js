/**
 * Media Upload Composable
 * 미디어 업로드 관련 로직을 관리하는 컴포저블
 */

import { ref, computed } from 'vue'
import { storageService } from '@/services/storage'

export function useMediaUpload(options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 10,
    acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
    uploadPath = 'uploads',
    autoUpload = true,
  } = options

  // Reactive state
  const files = ref([])
  const uploadProgress = ref([])
  const isUploading = ref(false)
  const errors = ref([])

  // Computed properties
  const hasFiles = computed(() => files.value.length > 0)
  const canAddMore = computed(() => files.value.length < maxFiles)
  const uploadedFiles = computed(() => files.value.filter((file) => file.uploaded !== false))
  const pendingFiles = computed(() => files.value.filter((file) => file.uploaded === false))

  // Methods
  function validateFile(file) {
    return storageService.validateFile(file, {
      maxSize,
      allowedTypes: acceptedTypes,
    })
  }

  function addFile(file, autoUploadFile = autoUpload) {
    if (!canAddMore.value) {
      addError('최대 파일 개수에 도달했습니다.')
      return false
    }

    const validation = validateFile(file)
    if (!validation.isValid) {
      addError(`${file.name}: ${validation.errors.join(', ')}`)
      return false
    }

    const fileData = {
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: storageService.getFileType(file),
      file: file,
      url: null,
      uploaded: false,
      uploadedAt: null,
    }

    files.value.push(fileData)

    if (autoUploadFile) {
      uploadFile(fileData)
    } else {
      // 미리보기용 임시 URL 생성
      fileData.url = URL.createObjectURL(file)
    }

    return true
  }

  function addFiles(fileList, autoUploadFiles = autoUpload) {
    const fileArray = Array.from(fileList)
    const remainingSlots = maxFiles - files.value.length

    if (remainingSlots <= 0) {
      addError('더 이상 파일을 추가할 수 없습니다.')
      return
    }

    const filesToAdd = fileArray.slice(0, remainingSlots)
    if (fileArray.length > remainingSlots) {
      addError(
        `최대 ${maxFiles}개의 파일만 업로드할 수 있습니다. ${remainingSlots}개만 선택되었습니다.`,
      )
    }

    filesToAdd.forEach((file) => addFile(file, autoUploadFiles))
  }

  async function uploadFile(fileData) {
    if (fileData.uploaded) return

    const progressIndex = uploadProgress.value.length
    const progressItem = {
      id: fileData.id,
      name: fileData.name,
      value: 0,
      error: null,
    }

    uploadProgress.value.push(progressItem)
    isUploading.value = true

    try {
      const fileName = `${uploadPath}/${Date.now()}_${fileData.name}`
      const uploadMethod =
        fileData.type === 'video' ? storageService.uploadVideo : storageService.uploadImage

      const downloadURL = await uploadMethod(fileData.file, fileName, (progress) => {
        progressItem.value = progress
      })

      // 업로드 성공
      fileData.url = downloadURL
      fileData.uploaded = true
      fileData.uploadedAt = new Date().toISOString()

      // 임시 URL이 있었다면 해제
      if (fileData.url && fileData.url.startsWith('blob:')) {
        URL.revokeObjectURL(fileData.url)
      }
    } catch (error) {
      console.error('File upload error:', error)
      progressItem.error = '업로드 실패'
      addError(`${fileData.name} 업로드에 실패했습니다.`)

      // 에러 상태를 잠시 보여준 후 제거
      setTimeout(() => {
        const index = uploadProgress.value.findIndex((p) => p.id === progressItem.id)
        if (index > -1) {
          uploadProgress.value.splice(index, 1)
        }
      }, 3000)
      return
    }

    // 성공적으로 업로드된 경우 진행률에서 제거
    uploadProgress.value.splice(progressIndex, 1)

    // 모든 업로드가 완료되었는지 확인
    if (uploadProgress.value.length === 0) {
      isUploading.value = false
    }
  }

  async function uploadAllPending() {
    const pending = pendingFiles.value
    if (pending.length === 0) return

    isUploading.value = true

    try {
      await Promise.all(pending.map((fileData) => uploadFile(fileData)))
    } finally {
      isUploading.value = false
    }
  }

  function removeFile(fileId) {
    const index = files.value.findIndex((file) => file.id === fileId)
    if (index === -1) return

    const file = files.value[index]

    // 임시 URL 해제
    if (file.url && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url)
    }

    files.value.splice(index, 1)

    // 진행 중인 업로드가 있다면 제거
    const progressIndex = uploadProgress.value.findIndex((p) => p.id === fileId)
    if (progressIndex > -1) {
      uploadProgress.value.splice(progressIndex, 1)
    }
  }

  function clearFiles() {
    files.value.forEach((file) => {
      if (file.url && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url)
      }
    })
    files.value = []
    uploadProgress.value = []
    isUploading.value = false
    clearErrors()
  }

  function addError(message) {
    errors.value.push({
      id: Date.now() + Math.random(),
      message,
      timestamp: new Date(),
    })
  }

  function removeError(errorId) {
    const index = errors.value.findIndex((error) => error.id === errorId)
    if (index > -1) {
      errors.value.splice(index, 1)
    }
  }

  function clearErrors() {
    errors.value = []
  }

  // 파일 크기 포맷팅
  function formatFileSize(bytes) {
    return storageService.formatFileSize(bytes)
  }

  // 파일 타입 확인
  function getFileType(file) {
    return storageService.getFileType(file)
  }

  return {
    // State
    files,
    uploadProgress,
    isUploading,
    errors,

    // Computed
    hasFiles,
    canAddMore,
    uploadedFiles,
    pendingFiles,

    // Methods
    addFile,
    addFiles,
    uploadFile,
    uploadAllPending,
    removeFile,
    clearFiles,
    validateFile,
    addError,
    removeError,
    clearErrors,
    formatFileSize,
    getFileType,
  }
}
