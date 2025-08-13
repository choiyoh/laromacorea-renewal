// Error handling composable
import { computed } from 'vue'
import { useErrorStore } from '@/stores/error'

export function useErrorHandler() {
  const errorStore = useErrorStore()

  // Computed properties
  const hasErrors = computed(() => errorStore.hasErrors)
  const errors = computed(() => errorStore.errors)
  const latestError = computed(() => errorStore.latestError)

  // Error handling methods
  const handleError = (error, context = null) => {
    console.error('Error occurred:', error, context)

    // Determine error type and handle accordingly
    if (error.code) {
      // Firebase error
      return errorStore.handleFirebaseError(error, context)
    } else if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      // Network error
      return errorStore.handleNetworkError(error, context)
    } else {
      // Generic error
      return errorStore.addError(error, errorStore.ERROR_TYPES.UNKNOWN, context)
    }
  }

  const handleAuthError = (error, context = null) => {
    return errorStore.handleFirebaseError(error, context)
  }

  const handleValidationError = (message, context = null) => {
    return errorStore.addError({ message }, errorStore.ERROR_TYPES.VALIDATION, context)
  }

  const handleNetworkError = (error, context = null) => {
    return errorStore.handleNetworkError(error, context)
  }

  const handlePermissionError = (message = '권한이 없습니다.', context = null) => {
    return errorStore.addError({ message }, errorStore.ERROR_TYPES.PERMISSION, context)
  }

  const handleServerError = (error, context = null) => {
    return errorStore.addError(error, errorStore.ERROR_TYPES.SERVER, context)
  }

  // Clear errors
  const clearErrors = () => {
    errorStore.clearErrors()
  }

  const dismissError = (errorId) => {
    errorStore.dismissError(errorId)
  }

  // Retry functionality
  const retryOperation = async (operation, maxRetries = 3) => {
    return errorStore.retryNetworkOperation(operation, maxRetries)
  }

  // Error boundary for async operations
  const withErrorHandling = async (asyncFn, context = null, customHandler = null) => {
    try {
      return await asyncFn()
    } catch (error) {
      if (customHandler) {
        return customHandler(error)
      } else {
        handleError(error, context)
        throw error
      }
    }
  }

  // Form validation error handler
  const handleFormErrors = (errors, fieldMap = {}) => {
    Object.entries(errors).forEach(([field, messages]) => {
      const fieldName = fieldMap[field] || field
      const message = Array.isArray(messages) ? messages[0] : messages
      handleValidationError(`${fieldName}: ${message}`, 'form-validation')
    })
  }

  // API error handler
  const handleApiError = (error, endpoint = null) => {
    const context = endpoint ? `API: ${endpoint}` : 'API'

    if (error.response) {
      // HTTP error response
      const status = error.response.status
      const message = error.response.data?.message || error.message

      switch (status) {
        case 400:
          return handleValidationError(message, context)
        case 401:
          return handleAuthError(error, context)
        case 403:
          return handlePermissionError(message, context)
        case 404:
          return handleError({ message: '요청한 리소스를 찾을 수 없습니다.' }, context)
        case 500:
          return handleServerError(error, context)
        default:
          return handleError(error, context)
      }
    } else if (error.request) {
      // Network error
      return handleNetworkError(error, context)
    } else {
      // Other error
      return handleError(error, context)
    }
  }

  // User-friendly error messages
  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error

    // Firebase Auth errors
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return '등록되지 않은 이메일입니다.'
        case 'auth/wrong-password':
          return '비밀번호가 올바르지 않습니다.'
        case 'auth/invalid-email':
          return '이메일 형식이 올바르지 않습니다.'
        case 'auth/user-disabled':
          return '비활성화된 계정입니다.'
        case 'auth/too-many-requests':
          return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
        case 'auth/weak-password':
          return '비밀번호가 너무 약합니다.'
        case 'auth/email-already-in-use':
          return '이미 사용 중인 이메일입니다.'
        case 'permission-denied':
          return '권한이 없습니다.'
        case 'unavailable':
          return '서비스를 일시적으로 사용할 수 없습니다.'
        case 'deadline-exceeded':
          return '요청 시간이 초과되었습니다.'
        default:
          return error.message || '알 수 없는 오류가 발생했습니다.'
      }
    }

    return error.message || '오류가 발생했습니다.'
  }

  return {
    // State
    hasErrors,
    errors,
    latestError,

    // Error handlers
    handleError,
    handleAuthError,
    handleValidationError,
    handleNetworkError,
    handlePermissionError,
    handleServerError,
    handleFormErrors,
    handleApiError,

    // Utilities
    clearErrors,
    dismissError,
    retryOperation,
    withErrorHandling,
    getErrorMessage,

    // Constants
    ERROR_TYPES: errorStore.ERROR_TYPES,
  }
}
