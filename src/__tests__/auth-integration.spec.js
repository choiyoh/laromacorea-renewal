import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { AuthService } from '@/services/auth'

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
  sendEmailVerification: vi.fn(),
  updatePassword: vi.fn(),
}))

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
}))

// Mock Firebase instance
vi.mock('@/services/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}))

describe('Authentication Integration Tests', () => {
  let userStore
  let mockAuth
  let mockFirestore

  beforeEach(async () => {
    setActivePinia(createPinia())
    userStore = useUserStore()

    // Import mocked modules
    mockAuth = await import('firebase/auth')
    mockFirestore = await import('firebase/firestore')

    vi.clearAllMocks()
  })

  describe('User Registration Flow', () => {
    it('should complete full registration process', async () => {
      const mockUser = {
        uid: 'new-user-id',
        email: 'newuser@example.com',
        displayName: null,
        emailVerified: false,
      }

      const mockUserData = {
        uid: 'new-user-id',
        email: 'newuser@example.com',
        displayName: 'New User',
        points: 100,
        role: 'user',
      }

      // Mock Firebase Auth responses
      mockAuth.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      })
      mockAuth.updateProfile.mockResolvedValue()
      mockAuth.sendEmailVerification.mockResolvedValue()

      // Mock Firestore responses
      mockFirestore.setDoc.mockResolvedValue()
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      })

      // Execute registration
      await userStore.signUp('newuser@example.com', 'password123', 'New User')

      // Verify Firebase Auth calls
      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'password123',
      )
      expect(mockAuth.updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'New User',
      })
      expect(mockAuth.sendEmailVerification).toHaveBeenCalledWith(mockUser)

      // Verify Firestore calls
      expect(mockFirestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          uid: 'new-user-id',
          email: 'newuser@example.com',
          displayName: 'New User',
          points: 100,
          role: 'user',
          isActive: true,
        }),
      )

      // Verify user store state
      expect(userStore.user).toEqual(expect.objectContaining(mockUserData))
      expect(userStore.isAuthenticated).toBe(true)
      expect(userStore.loading).toBe(false)
      expect(userStore.error).toBeNull()
    })

    it('should handle registration errors gracefully', async () => {
      const authError = new Error('Email already in use')
      authError.code = 'auth/email-already-in-use'

      mockAuth.createUserWithEmailAndPassword.mockRejectedValue(authError)

      await expect(
        userStore.signUp('existing@example.com', 'password123', 'Existing User'),
      ).rejects.toThrow()

      expect(userStore.user).toBeNull()
      expect(userStore.isAuthenticated).toBe(false)
      expect(userStore.error).toBe('이미 사용 중인 이메일입니다.')
    })
  })

  describe('User Login Flow', () => {
    it('should complete full login process', async () => {
      const mockUser = {
        uid: 'existing-user-id',
        email: 'user@example.com',
        displayName: 'Existing User',
        emailVerified: true,
      }

      const mockUserData = {
        uid: 'existing-user-id',
        email: 'user@example.com',
        displayName: 'Existing User',
        points: 250,
        role: 'user',
        selectedIcon: 'icon-1',
      }

      // Mock Firebase Auth responses
      mockAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      })

      // Mock Firestore responses
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      })
      mockFirestore.updateDoc.mockResolvedValue()

      // Execute login
      await userStore.signIn('user@example.com', 'password123')

      // Verify Firebase Auth calls
      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com',
        'password123',
      )

      // Verify last login update
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          lastLoginAt: { _serverTimestamp: true },
        }),
      )

      // Verify user store state
      expect(userStore.user).toEqual(
        expect.objectContaining({
          ...mockUser,
          ...mockUserData,
        }),
      )
      expect(userStore.isAuthenticated).toBe(true)
      expect(userStore.loading).toBe(false)
      expect(userStore.error).toBeNull()
    })

    it('should handle login with invalid credentials', async () => {
      const authError = new Error('Wrong password')
      authError.code = 'auth/wrong-password'

      mockAuth.signInWithEmailAndPassword.mockRejectedValue(authError)

      await expect(userStore.signIn('user@example.com', 'wrongpassword')).rejects.toThrow()

      expect(userStore.user).toBeNull()
      expect(userStore.isAuthenticated).toBe(false)
      expect(userStore.error).toBe('비밀번호가 올바르지 않습니다.')
    })

    it('should handle login with non-existent user', async () => {
      const authError = new Error('User not found')
      authError.code = 'auth/user-not-found'

      mockAuth.signInWithEmailAndPassword.mockRejectedValue(authError)

      await expect(userStore.signIn('nonexistent@example.com', 'password123')).rejects.toThrow()

      expect(userStore.user).toBeNull()
      expect(userStore.isAuthenticated).toBe(false)
      expect(userStore.error).toBe('등록되지 않은 이메일입니다.')
    })
  })

  describe('User Logout Flow', () => {
    it('should complete logout process', async () => {
      // Set initial user state
      userStore.setUser({
        uid: 'user-id',
        email: 'user@example.com',
        displayName: 'Test User',
      })

      expect(userStore.isAuthenticated).toBe(true)

      // Mock Firebase Auth response
      mockAuth.signOut.mockResolvedValue()

      // Execute logout
      await userStore.signOut()

      // Verify Firebase Auth call
      expect(mockAuth.signOut).toHaveBeenCalled()

      // Verify user store state
      expect(userStore.user).toBeNull()
      expect(userStore.isAuthenticated).toBe(false)
      expect(userStore.loading).toBe(false)
      expect(userStore.error).toBeNull()
    })

    it('should handle logout errors gracefully', async () => {
      userStore.setUser({
        uid: 'user-id',
        email: 'user@example.com',
      })

      const authError = new Error('Network error')
      mockAuth.signOut.mockRejectedValue(authError)

      await expect(userStore.signOut()).rejects.toThrow('Network error')

      // User should still be logged out locally even if Firebase call fails
      expect(userStore.user).toBeNull()
      expect(userStore.isAuthenticated).toBe(false)
    })
  })

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      mockAuth.sendPasswordResetEmail.mockResolvedValue()

      const result = await userStore.resetPassword('user@example.com')

      expect(mockAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com',
      )
      expect(result).toBe(true)
      expect(userStore.error).toBeNull()
    })

    it('should handle password reset errors', async () => {
      const authError = new Error('User not found')
      authError.code = 'auth/user-not-found'

      mockAuth.sendPasswordResetEmail.mockRejectedValue(authError)

      const result = await userStore.resetPassword('nonexistent@example.com')

      expect(result).toBe(false)
      expect(userStore.error).toBe('등록되지 않은 이메일입니다.')
    })
  })

  describe('Auth State Persistence', () => {
    it('should restore user session on app initialization', async () => {
      const mockUser = {
        uid: 'persisted-user-id',
        email: 'persisted@example.com',
        displayName: 'Persisted User',
        emailVerified: true,
      }

      const mockUserData = {
        uid: 'persisted-user-id',
        email: 'persisted@example.com',
        displayName: 'Persisted User',
        points: 150,
        role: 'user',
      }

      // Mock auth state change callback
      let authStateCallback
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback
        return vi.fn() // unsubscribe function
      })

      // Mock Firestore response
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      })

      // Initialize auth listener
      userStore.initializeAuth()

      // Simulate auth state change with persisted user
      await authStateCallback(mockUser)

      // Verify user store state
      expect(userStore.user).toEqual(
        expect.objectContaining({
          ...mockUser,
          ...mockUserData,
        }),
      )
      expect(userStore.isAuthenticated).toBe(true)
      expect(userStore.authInitialized).toBe(true)
    })

    it('should handle auth state change with no user', async () => {
      let authStateCallback
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback
        return vi.fn()
      })

      // Initialize auth listener
      userStore.initializeAuth()

      // Simulate auth state change with no user
      await authStateCallback(null)

      // Verify user store state
      expect(userStore.user).toBeNull()
      expect(userStore.isAuthenticated).toBe(false)
      expect(userStore.authInitialized).toBe(true)
    })
  })

  describe('Profile Management', () => {
    beforeEach(() => {
      userStore.setUser({
        uid: 'user-id',
        email: 'user@example.com',
        displayName: 'Test User',
        points: 100,
      })
    })

    it('should update user profile', async () => {
      const updateData = {
        displayName: 'Updated Name',
        selectedIcon: 'new-icon',
      }

      mockAuth.updateProfile.mockResolvedValue()
      mockFirestore.updateDoc.mockResolvedValue()
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...userStore.user, ...updateData }),
      })

      await userStore.updateProfile(updateData)

      expect(mockAuth.updateProfile).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          displayName: 'Updated Name',
        }),
      )

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updateData,
          updatedAt: { _serverTimestamp: true },
        }),
      )

      expect(userStore.user.displayName).toBe('Updated Name')
      expect(userStore.user.selectedIcon).toBe('new-icon')
    })

    it('should handle profile update errors', async () => {
      const updateData = { displayName: 'Updated Name' }
      const error = new Error('Update failed')

      mockAuth.updateProfile.mockRejectedValue(error)

      await expect(userStore.updateProfile(updateData)).rejects.toThrow('Update failed')

      expect(userStore.error).toBe('Update failed')
    })
  })

  describe('Admin Role Detection', () => {
    it('should correctly identify admin users', () => {
      userStore.setUser({
        uid: 'admin-id',
        email: 'admin@example.com',
        role: 'admin',
      })

      expect(userStore.isAdmin).toBe(true)
    })

    it('should correctly identify regular users', () => {
      userStore.setUser({
        uid: 'user-id',
        email: 'user@example.com',
        role: 'user',
      })

      expect(userStore.isAdmin).toBe(false)
    })

    it('should handle users without role', () => {
      userStore.setUser({
        uid: 'user-id',
        email: 'user@example.com',
      })

      expect(userStore.isAdmin).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during authentication', async () => {
      const networkError = new Error('Network request failed')
      networkError.code = 'auth/network-request-failed'

      mockAuth.signInWithEmailAndPassword.mockRejectedValue(networkError)

      await expect(userStore.signIn('user@example.com', 'password123')).rejects.toThrow()

      expect(userStore.error).toBe('네트워크 연결을 확인해주세요.')
    })

    it('should handle too many requests error', async () => {
      const tooManyRequestsError = new Error('Too many requests')
      tooManyRequestsError.code = 'auth/too-many-requests'

      mockAuth.signInWithEmailAndPassword.mockRejectedValue(tooManyRequestsError)

      await expect(userStore.signIn('user@example.com', 'password123')).rejects.toThrow()

      expect(userStore.error).toBe('너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.')
    })

    it('should handle unknown errors', async () => {
      const unknownError = new Error('Unknown error')
      unknownError.code = 'unknown-error'

      mockAuth.signInWithEmailAndPassword.mockRejectedValue(unknownError)

      await expect(userStore.signIn('user@example.com', 'password123')).rejects.toThrow()

      expect(userStore.error).toBe('Unknown error')
    })
  })
})
