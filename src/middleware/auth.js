// Authentication middleware
import { useUserStore } from '@/stores/user'

// Route guard for authenticated users only
export const requireAuth = (to, from, next) => {
  const userStore = useUserStore()

  if (!userStore.authInitialized) {
    // Wait for auth initialization
    const unsubscribe = userStore.$subscribe((mutation, state) => {
      if (state.authInitialized) {
        unsubscribe()
        if (state.isAuthenticated) {
          next()
        } else {
          next('/auth')
        }
      }
    })
    return
  }

  if (userStore.isAuthenticated) {
    next()
  } else {
    next('/auth')
  }
}

// Route guard for admin users only
export const requireAdmin = (to, from, next) => {
  const userStore = useUserStore()

  console.log('requireAdmin middleware called:', {
    authInitialized: userStore.authInitialized,
    isAuthenticated: userStore.isAuthenticated,
    isAdmin: userStore.isAdmin,
    user: userStore.user,
    userRole: userStore.user?.role,
  })

  const checkAdminAccess = () => {
    console.log('Checking admin access:', {
      isAuthenticated: userStore.isAuthenticated,
      isAdmin: userStore.isAdmin,
      userRole: userStore.user?.role,
      user: userStore.user,
    })

    if (userStore.isAuthenticated && userStore.isAdmin) {
      console.log('Admin access granted')
      next()
    } else if (userStore.isAuthenticated) {
      console.log('User authenticated but not admin, redirecting to home')
      next('/')
    } else {
      console.log('User not authenticated, redirecting to auth')
      next('/auth')
    }
  }

  if (!userStore.authInitialized) {
    console.log('Auth not initialized, waiting...')

    // Set up a timeout to prevent infinite waiting
    const timeout = setTimeout(() => {
      console.log('Auth initialization timeout, redirecting to auth')
      next('/auth')
    }, 5000)

    // Wait for auth initialization
    const unsubscribe = userStore.$subscribe((mutation, state) => {
      if (state.authInitialized) {
        console.log('Auth initialized in subscription')
        clearTimeout(timeout)
        unsubscribe()

        // Add a small delay to ensure user data is fully loaded
        setTimeout(() => {
          checkAdminAccess()
        }, 100)
      }
    })
    return
  }

  // If auth is already initialized, check immediately
  checkAdminAccess()
}

// Route guard for guest users only (redirect authenticated users)
export const requireGuest = (to, from, next) => {
  const userStore = useUserStore()

  if (!userStore.authInitialized) {
    // Wait for auth initialization
    const unsubscribe = userStore.$subscribe((mutation, state) => {
      if (state.authInitialized) {
        unsubscribe()
        if (state.isAuthenticated) {
          next('/')
        } else {
          next()
        }
      }
    })
    return
  }

  if (userStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
}
