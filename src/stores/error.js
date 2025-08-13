// Global error handling store
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useErrorStore = defineStore('error', () => {
  // State
  const errors = ref([])
  const networkError = ref(null)
  const isOffline = ref(false)
  const globalLoading = ref(false)
  const loadingStates = ref(new Map())

  // Error types
  const ERROR_TYPES = {
    NETWORK: 'network',
    AUTH: 'auth',
    VALIDATION: 'validation',
    PERMISSION: 'permission',
    SERVER: 'server',
    UNKNOWN: 'unknown',
  }

  // Getters
  const hasErrors = computed(() => errors.value.length > 0)
  const hasNetworkError = computed(() => !!networkError.value)
  const latestError = computed(() => errors.value[errors.value.length - 1] || null)
  const isLoading = computed(() => globalLoading.value || loadingStates.value.size > 0)

  // Actions
  function addError(error, type = ERROR_TYPES.UNKNOWN, context = null) {
    const errorObj = {
      id: Date.now() + Math.random(),
      message: error.message || error,
      type,
      context,
      timestamp: new Date(),
      dismissed: false,
    }

    errors.value.push(errorObj)

    // Auto-dismiss after 10 seconds for non-critical errors
    if (type !== ERROR_TYPES.NETWORK && type !== ERROR_TYPES.AUTH) {
      setTimeout(() => {
        dismissError(errorObj.id)
      }, 10000)
    }

    return errorObj.id
  }

  function dismissError(errorId) {
    const index = errors.value.findIndex((error) => error.id === errorId)
    if (index !== -1) {
      errors.value[index].dismissed = true
      // Remove dismissed errors after animation
      setTimeout(() => {
        errors.value = errors.value.filter((error) => error.id !== errorId)
      }, 300)
    }
  }

  function clearErrors() {
    errors.value = []
  }

  function setNetworkError(error) {
    networkError.value = {
      message: error.message || error,
      timestamp: new Date(),
      retryCount: 0,
    }
  }

  function clearNetworkError() {
    networkError.value = null
  }

  function setOfflineStatus(offline) {
    isOffline.value = offline
    if (offline) {
      setNetworkError('인터넷 연결이 끊어졌습니다. 연결을 확인해주세요.')
    } else {
      clearNetworkError()
    }
  }

  function setGlobalLoading(loading) {
    globalLoading.value = loading
  }

  function setLoading(key, loading) {
    if (loading) {
      loadingStates.value.set(key, true)
    } else {
      loadingStates.value.delete(key)
    }
  }

  function isLoadingKey(key) {
    return loadingStates.value.has(key)
  }

  // Handle Firebase errors
  function handleFirebaseError(error, context = null) {
    let type = ERROR_TYPES.UNKNOWN
    let message = error.message

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-email':
      case 'auth/user-disabled':
      case 'auth/too-many-requests':
        type = ERROR_TYPES.AUTH
        break
      case 'permission-denied':
        type = ERROR_TYPES.PERMISSION
        message = '권한이 없습니다.'
        break
      case 'unavailable':
      case 'deadline-exceeded':
        type = ERROR_TYPES.NETWORK
        message = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
        break
      case 'invalid-argument':
        type = ERROR_TYPES.VALIDATION
        message = '잘못된 요청입니다.'
        break
      default:
        if (error.code?.startsWith('auth/')) {
          type = ERROR_TYPES.AUTH
        }
    }

    return addError({ message }, type, context)
  }

  // Handle network errors
  function handleNetworkError(error, context = null) {
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      setNetworkError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.')
      return addError(error, ERROR_TYPES.NETWORK, context)
    }
    return addError(error, ERROR_TYPES.UNKNOWN, context)
  }

  // Retry network operation
  async function retryNetworkOperation(operation, maxRetries = 3) {
    let lastError = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (networkError.value) {
          networkError.value.retryCount = i + 1
        }

        // Wait before retry (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
        }
      }
    }

    throw lastError
  }

  return {
    // State
    errors,
    networkError,
    isOffline,
    globalLoading,
    loadingStates,

    // Constants
    ERROR_TYPES,

    // Getters
    hasErrors,
    hasNetworkError,
    latestError,
    isLoading,

    // Actions
    addError,
    dismissError,
    clearErrors,
    setNetworkError,
    clearNetworkError,
    setOfflineStatus,
    setGlobalLoading,
    setLoading,
    isLoadingKey,
    handleFirebaseError,
    handleNetworkError,
    retryNetworkOperation,
  }
})
