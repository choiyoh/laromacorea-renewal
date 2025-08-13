// User store for authentication and user data management
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { AuthService } from '@/services/auth'
import { useErrorStore } from '@/stores/error'

export const useUserStore = defineStore('user', () => {
  // Get error store instance
  const errorStore = useErrorStore()

  // State
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const authInitialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userDisplayName = computed(() => {
    if (!user.value) return ''
    return user.value.displayName || user.value.email?.split('@')[0] || '사용자'
  })
  const userPoints = computed(() => user.value?.points || 0)
  const userIcon = computed(() => user.value?.selectedIcon || null)

  // Actions
  async function signIn(email, password) {
    errorStore.setLoading('auth-signin', true)
    error.value = null

    try {
      const firebaseUser = await AuthService.signIn(email, password)

      // Get user data from Firestore
      const userData = await AuthService.getUserDocument(firebaseUser.uid)

      user.value = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        ...userData, // Merge Firestore data
      }

      return user.value
    } catch (err) {
      error.value = err.message
      errorStore.handleFirebaseError(err, 'User Sign In')
      throw err
    } finally {
      errorStore.setLoading('auth-signin', false)
    }
  }

  async function signUp(email, password, displayName = null) {
    errorStore.setLoading('auth-signup', true)
    error.value = null

    try {
      const firebaseUser = await AuthService.signUp(email, password, displayName)

      // Get the created user document from Firestore
      const userData = await AuthService.getUserDocument(firebaseUser.uid)

      user.value = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        ...userData, // Merge Firestore data
      }

      return user.value
    } catch (err) {
      error.value = err.message
      errorStore.handleFirebaseError(err, 'User Sign Up')
      throw err
    } finally {
      errorStore.setLoading('auth-signup', false)
    }
  }

  async function signOut() {
    errorStore.setLoading('auth-signout', true)
    error.value = null

    try {
      await AuthService.signOut()
      user.value = null
    } catch (err) {
      error.value = err.message
      errorStore.handleFirebaseError(err, 'User Sign Out')
      throw err
    } finally {
      errorStore.setLoading('auth-signout', false)
    }
  }

  async function resetPassword(email) {
    loading.value = true
    error.value = null

    try {
      await AuthService.resetPassword(email)
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(updates) {
    loading.value = true
    error.value = null

    try {
      await AuthService.updateUserProfile(updates)

      // Update local user state
      if (user.value) {
        user.value = { ...user.value, ...updates }
      }

      return user.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePassword(newPassword) {
    loading.value = true
    error.value = null

    try {
      await AuthService.updateUserPassword(newPassword)
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refreshUserData() {
    if (!user.value?.uid) return

    try {
      const userData = await AuthService.getUserDocument(user.value.uid)
      if (userData) {
        user.value = { ...user.value, ...userData }
      }
    } catch (err) {
      console.error('Error refreshing user data:', err)
    }
  }

  async function refreshUserPoints() {
    if (!user.value?.uid) return

    try {
      const userData = await AuthService.getUserDocument(user.value.uid)
      if (userData && user.value) {
        user.value.points = userData.points || 0
      }
    } catch (err) {
      console.error('Error refreshing user points:', err)
    }
  }

  function setUser(userData) {
    user.value = userData
  }

  function clearError() {
    error.value = null
  }

  function clearUser() {
    user.value = null
  }

  // Initialize auth state listener
  function initializeAuth() {
    console.log('Initializing auth state listener...')

    return AuthService.onAuthStateChanged(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out')
      errorStore.setLoading('auth-init', true)

      try {
        if (firebaseUser) {
          console.log('Firebase user:', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            emailVerified: firebaseUser.emailVerified,
          })

          // Get user data from Firestore
          const userData = await AuthService.getUserDocument(firebaseUser.uid)
          console.log('Firestore user data:', userData)

          user.value = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            ...userData, // Merge Firestore data
          }

          console.log('User store updated:', user.value)
        } else {
          console.log('No user, clearing user store')
          user.value = null
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        errorStore.handleFirebaseError(err, 'Auth Initialization')
        user.value = null
      } finally {
        errorStore.setLoading('auth-init', false)
        authInitialized.value = true
        console.log('Auth initialization completed, authInitialized:', authInitialized.value)
      }
    })
  }

  return {
    // State
    user,
    loading,
    error,
    authInitialized,

    // Getters
    isAuthenticated,
    isAdmin,
    userDisplayName,
    userPoints,
    userIcon,

    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
    refreshUserData,
    refreshUserPoints,
    setUser,
    clearError,
    clearUser,
    initializeAuth,
  }
})
