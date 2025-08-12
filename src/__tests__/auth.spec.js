// Authentication system tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { AuthService } from '@/services/auth'

// Mock Firebase services
vi.mock('@/services/auth', () => ({
  AuthService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    onAuthStateChanged: vi.fn(),
    getCurrentUser: vi.fn(),
    getUserDocument: vi.fn(),
    createUserDocument: vi.fn(),
    updateUserProfile: vi.fn(),
    updateUserPassword: vi.fn(),
  },
}))

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const userStore = useUserStore()

    expect(userStore.user).toBeNull()
    expect(userStore.loading).toBe(false)
    expect(userStore.error).toBeNull()
    expect(userStore.authInitialized).toBe(false)
    expect(userStore.isAuthenticated).toBe(false)
    expect(userStore.isAdmin).toBe(false)
  })

  it('should handle successful sign in', async () => {
    const userStore = useUserStore()
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
    }
    const mockUserData = {
      points: 100,
      role: 'user',
      selectedIcon: null,
    }

    AuthService.signIn.mockResolvedValue(mockUser)
    AuthService.getUserDocument.mockResolvedValue(mockUserData)

    await userStore.signIn('test@example.com', 'password')

    expect(AuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password')
    expect(AuthService.getUserDocument).toHaveBeenCalledWith('test-uid')
    expect(userStore.user).toEqual({ ...mockUser, ...mockUserData })
    expect(userStore.isAuthenticated).toBe(true)
    expect(userStore.loading).toBe(false)
    expect(userStore.error).toBeNull()
  })

  it('should handle sign in error', async () => {
    const userStore = useUserStore()
    const mockError = new Error('Invalid credentials')

    AuthService.signIn.mockRejectedValue(mockError)

    await expect(userStore.signIn('test@example.com', 'wrong-password')).rejects.toThrow()

    expect(userStore.user).toBeNull()
    expect(userStore.isAuthenticated).toBe(false)
    expect(userStore.loading).toBe(false)
    expect(userStore.error).toBe('Invalid credentials')
  })

  it('should handle successful sign up', async () => {
    const userStore = useUserStore()
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: false,
    }
    const mockUserData = {
      points: 100,
      role: 'user',
      selectedIcon: null,
    }

    AuthService.signUp.mockResolvedValue(mockUser)
    AuthService.getUserDocument.mockResolvedValue(mockUserData)

    await userStore.signUp('test@example.com', 'password', 'Test User')

    expect(AuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password', 'Test User')
    expect(userStore.user).toEqual({ ...mockUser, ...mockUserData })
    expect(userStore.isAuthenticated).toBe(true)
  })

  it('should handle sign out', async () => {
    const userStore = useUserStore()

    // Set initial user
    userStore.setUser({ uid: 'test-uid', email: 'test@example.com' })
    expect(userStore.isAuthenticated).toBe(true)

    AuthService.signOut.mockResolvedValue()

    await userStore.signOut()

    expect(AuthService.signOut).toHaveBeenCalled()
    expect(userStore.user).toBeNull()
    expect(userStore.isAuthenticated).toBe(false)
  })

  it('should handle password reset', async () => {
    const userStore = useUserStore()

    AuthService.resetPassword.mockResolvedValue()

    const result = await userStore.resetPassword('test@example.com')

    expect(AuthService.resetPassword).toHaveBeenCalledWith('test@example.com')
    expect(result).toBe(true)
    expect(userStore.error).toBeNull()
  })

  it('should compute user display name correctly', () => {
    const userStore = useUserStore()

    // No user
    expect(userStore.userDisplayName).toBe('')

    // User with display name
    userStore.setUser({
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    })
    expect(userStore.userDisplayName).toBe('Test User')

    // User without display name
    userStore.setUser({
      uid: 'test-uid',
      email: 'test@example.com',
    })
    expect(userStore.userDisplayName).toBe('test')
  })

  it('should identify admin users correctly', () => {
    const userStore = useUserStore()

    // Regular user
    userStore.setUser({
      uid: 'test-uid',
      email: 'test@example.com',
      role: 'user',
    })
    expect(userStore.isAdmin).toBe(false)

    // Admin user
    userStore.setUser({
      uid: 'admin-uid',
      email: 'admin@example.com',
      role: 'admin',
    })
    expect(userStore.isAdmin).toBe(true)
  })
})
