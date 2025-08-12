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

  if (!userStore.authInitialized) {
    // Wait for auth initialization
    const unsubscribe = userStore.$subscribe((mutation, state) => {
      if (state.authInitialized) {
        unsubscribe()
        if (state.isAuthenticated && state.isAdmin) {
          next()
        } else if (state.isAuthenticated) {
          next('/')
        } else {
          next('/auth')
        }
      }
    })
    return
  }

  if (userStore.isAuthenticated && userStore.isAdmin) {
    next()
  } else if (userStore.isAuthenticated) {
    next('/')
  } else {
    next('/auth')
  }
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
