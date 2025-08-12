// Authentication composable
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

export function useAuth() {
  const userStore = useUserStore()
  const router = useRouter()

  // Computed properties
  const user = computed(() => userStore.user)
  const isAuthenticated = computed(() => userStore.isAuthenticated)
  const isAdmin = computed(() => userStore.isAdmin)
  const loading = computed(() => userStore.loading)
  const error = computed(() => userStore.error)
  const authInitialized = computed(() => userStore.authInitialized)

  // Authentication methods
  const signIn = async (email, password) => {
    try {
      await userStore.signIn(email, password)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const signUp = async (email, password, displayName = null) => {
    try {
      await userStore.signUp(email, password, displayName)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      await userStore.signOut()
      router.push('/')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const resetPassword = async (email) => {
    try {
      await userStore.resetPassword(email)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateProfile = async (updates) => {
    try {
      await userStore.updateProfile(updates)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      await userStore.updatePassword(newPassword)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Utility methods
  const requireAuth = () => {
    if (!isAuthenticated.value) {
      router.push('/auth')
      return false
    }
    return true
  }

  const requireAdmin = () => {
    if (!isAuthenticated.value) {
      router.push('/auth')
      return false
    }
    if (!isAdmin.value) {
      router.push('/')
      return false
    }
    return true
  }

  const clearError = () => {
    userStore.clearError()
  }

  const refreshUserData = async () => {
    await userStore.refreshUserData()
  }

  return {
    // State
    user,
    isAuthenticated,
    isAdmin,
    loading,
    error,
    authInitialized,

    // Methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
    requireAuth,
    requireAdmin,
    clearError,
    refreshUserData,
  }
}
