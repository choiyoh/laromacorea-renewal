// Error handling and loading state tests
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useErrorStore } from '@/stores/error'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useLoading, useGlobalLoading } from '@/composables/useLoading'

describe('Error Handling System', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Error Store', () => {
    it('should add and manage errors', () => {
      const errorStore = useErrorStore()

      const errorId = errorStore.addError('Test error', errorStore.ERROR_TYPES.VALIDATION)

      expect(errorStore.hasErrors).toBe(true)
      expect(errorStore.errors).toHaveLength(1)
      expect(errorStore.errors[0].message).toBe('Test error')
      expect(errorStore.errors[0].type).toBe(errorStore.ERROR_TYPES.VALIDATION)
      expect(errorStore.latestError.message).toBe('Test error')
    })

    it('should dismiss errors', () => {
      const errorStore = useErrorStore()

      const errorId = errorStore.addError('Test error')
      errorStore.dismissError(errorId)

      expect(errorStore.errors[0].dismissed).toBe(true)
    })

    it('should clear all errors', () => {
      const errorStore = useErrorStore()

      errorStore.addError('Error 1')
      errorStore.addError('Error 2')
      errorStore.clearErrors()

      expect(errorStore.errors).toHaveLength(0)
      expect(errorStore.hasErrors).toBe(false)
    })

    it('should handle network errors', () => {
      const errorStore = useErrorStore()

      errorStore.setNetworkError('Network connection failed')

      expect(errorStore.hasNetworkError).toBe(true)
      expect(errorStore.networkError.message).toBe('Network connection failed')
    })

    it('should manage loading states', () => {
      const errorStore = useErrorStore()

      errorStore.setLoading('test-key', true)
      expect(errorStore.isLoadingKey('test-key')).toBe(true)
      expect(errorStore.isLoading).toBe(true)

      errorStore.setLoading('test-key', false)
      expect(errorStore.isLoadingKey('test-key')).toBe(false)
      expect(errorStore.isLoading).toBe(false)
    })

    it('should handle Firebase errors', () => {
      const errorStore = useErrorStore()

      const firebaseError = {
        code: 'auth/user-not-found',
        message: 'User not found',
      }

      const errorId = errorStore.handleFirebaseError(firebaseError, 'Test context')

      expect(errorStore.hasErrors).toBe(true)
      expect(errorStore.errors[0].type).toBe(errorStore.ERROR_TYPES.AUTH)
      expect(errorStore.errors[0].context).toBe('Test context')
    })
  })

  describe('Error Handler Composable', () => {
    it('should handle different error types', () => {
      const { handleError, handleAuthError, handleValidationError } = useErrorHandler()
      const errorStore = useErrorStore()

      handleError(new Error('Generic error'))
      expect(errorStore.errors).toHaveLength(1)

      handleAuthError({ code: 'auth/invalid-email', message: 'Invalid email' })
      expect(errorStore.errors).toHaveLength(2)

      handleValidationError('Validation failed')
      expect(errorStore.errors).toHaveLength(3)
      expect(errorStore.errors[2].type).toBe(errorStore.ERROR_TYPES.VALIDATION)
    })

    it('should provide user-friendly error messages', () => {
      const { getErrorMessage } = useErrorHandler()

      expect(getErrorMessage({ code: 'auth/user-not-found' })).toBe('등록되지 않은 이메일입니다.')
      expect(getErrorMessage({ code: 'auth/wrong-password' })).toBe('비밀번호가 올바르지 않습니다.')
      expect(getErrorMessage('Custom error message')).toBe('Custom error message')
    })

    it('should handle async operations with error handling', async () => {
      const { withErrorHandling } = useErrorHandler()
      const errorStore = useErrorStore()

      const successOperation = vi.fn().mockResolvedValue('success')
      const result = await withErrorHandling(successOperation)
      expect(result).toBe('success')

      const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'))

      try {
        await withErrorHandling(failingOperation)
      } catch (error) {
        expect(error.message).toBe('Operation failed')
        expect(errorStore.hasErrors).toBe(true)
      }
    })
  })

  describe('Loading Composable', () => {
    it('should manage local loading state', () => {
      const { loading, setLoading } = useLoading()

      expect(loading.value).toBe(false)

      setLoading(true)
      expect(loading.value).toBe(true)

      setLoading(false)
      expect(loading.value).toBe(false)
    })

    it('should manage keyed loading state', () => {
      const { loading, setLoading } = useLoading('test-key')
      const errorStore = useErrorStore()

      expect(loading.value).toBe(false)

      setLoading(true)
      expect(loading.value).toBe(true)
      expect(errorStore.isLoadingKey('test-key')).toBe(true)

      setLoading(false)
      expect(loading.value).toBe(false)
      expect(errorStore.isLoadingKey('test-key')).toBe(false)
    })

    it('should handle async operations with loading state', async () => {
      const { withLoading } = useLoading()

      const asyncOperation = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve('done'), 10)))

      const result = await withLoading(asyncOperation)
      expect(result).toBe('done')
      expect(asyncOperation).toHaveBeenCalled()
    })
  })

  describe('Global Loading', () => {
    it('should manage global loading state', () => {
      const { setGlobalLoading, isGlobalLoading } = useGlobalLoading()
      const errorStore = useErrorStore()

      expect(isGlobalLoading.value).toBe(false)

      setGlobalLoading(true)
      expect(isGlobalLoading.value).toBe(true)
      expect(errorStore.globalLoading).toBe(true)

      setGlobalLoading(false)
      expect(isGlobalLoading.value).toBe(false)
      expect(errorStore.globalLoading).toBe(false)
    })

    it('should handle async operations with global loading', async () => {
      const { withGlobalLoading } = useGlobalLoading()

      const asyncOperation = vi.fn().mockResolvedValue('global success')
      const result = await withGlobalLoading(asyncOperation, 'Test operation')

      expect(result).toBe('global success')
      expect(asyncOperation).toHaveBeenCalled()
    })
  })

  describe('Error Recovery', () => {
    it('should retry failed operations', async () => {
      const errorStore = useErrorStore()

      let attempts = 0
      const flakyOperation = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve('success')
      })

      const result = await errorStore.retryNetworkOperation(flakyOperation, 3)
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should fail after max retries', async () => {
      const errorStore = useErrorStore()

      const alwaysFailingOperation = vi.fn().mockRejectedValue(new Error('Always fails'))

      try {
        await errorStore.retryNetworkOperation(alwaysFailingOperation, 2)
      } catch (error) {
        expect(error.message).toBe('Always fails')
        expect(alwaysFailingOperation).toHaveBeenCalledTimes(2)
      }
    })
  })
})
