// Loading state management composable
import { ref, computed } from 'vue'
import { useErrorStore } from '@/stores/error'

export function useLoading(key = null) {
  const errorStore = useErrorStore()

  // Local loading state (if no key provided)
  const localLoading = ref(false)

  // Computed loading state
  const loading = computed({
    get() {
      if (key) {
        return errorStore.isLoadingKey(key)
      }
      return localLoading.value
    },
    set(value) {
      if (key) {
        errorStore.setLoading(key, value)
      } else {
        localLoading.value = value
      }
    },
  })

  // Set loading state
  const setLoading = (value, message = null) => {
    loading.value = value

    if (value && message) {
      // Could extend to show loading message
      console.log(`Loading: ${message}`)
    }
  }

  // Async wrapper that handles loading state
  const withLoading = async (asyncFn, errorHandler = null) => {
    setLoading(true)

    try {
      const result = await asyncFn()
      return result
    } catch (error) {
      if (errorHandler) {
        errorHandler(error)
      } else {
        // Default error handling
        errorStore.handleFirebaseError(error)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Multiple loading states manager
  const createLoadingManager = () => {
    const loadingStates = ref(new Map())

    const setLoadingState = (key, value) => {
      if (value) {
        loadingStates.value.set(key, true)
      } else {
        loadingStates.value.delete(key)
      }
    }

    const isLoading = (key) => {
      return loadingStates.value.has(key)
    }

    const hasAnyLoading = computed(() => {
      return loadingStates.value.size > 0
    })

    const getLoadingKeys = computed(() => {
      return Array.from(loadingStates.value.keys())
    })

    return {
      setLoadingState,
      isLoading,
      hasAnyLoading,
      getLoadingKeys,
    }
  }

  return {
    loading,
    setLoading,
    withLoading,
    createLoadingManager,
  }
}

// Global loading utilities
export function useGlobalLoading() {
  const errorStore = useErrorStore()

  const setGlobalLoading = (value, message = null) => {
    errorStore.setGlobalLoading(value)

    if (value && message) {
      console.log(`Global Loading: ${message}`)
    }
  }

  const withGlobalLoading = async (asyncFn, message = null, errorHandler = null) => {
    setGlobalLoading(true, message)

    try {
      const result = await asyncFn()
      return result
    } catch (error) {
      if (errorHandler) {
        errorHandler(error)
      } else {
        errorStore.handleFirebaseError(error)
      }
      throw error
    } finally {
      setGlobalLoading(false)
    }
  }

  return {
    setGlobalLoading,
    withGlobalLoading,
    isGlobalLoading: computed(() => errorStore.globalLoading),
  }
}

// Debounced loading for rapid state changes
export function useDebouncedLoading(delay = 300) {
  const { loading, setLoading } = useLoading()
  let timeoutId = null

  const debouncedSetLoading = (value) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (value) {
      // Show loading immediately
      setLoading(true)
    } else {
      // Delay hiding loading to prevent flicker
      timeoutId = setTimeout(() => {
        setLoading(false)
        timeoutId = null
      }, delay)
    }
  }

  return {
    loading,
    setLoading: debouncedSetLoading,
  }
}
