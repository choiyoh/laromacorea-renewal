import { createRouter, createWebHistory } from 'vue-router'

// Lazy loading with chunk names for better debugging
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "home" */ '@/views/HomeView.vue'),
    },
    {
      path: '/board/:boardType',
      name: 'board',
      component: () => import(/* webpackChunkName: "board" */ '@/views/board/BoardView.vue'),
      props: true,
    },
    {
      path: '/board/:boardType/post/:postId',
      name: 'post',
      component: () => import(/* webpackChunkName: "post" */ '@/views/board/PostView.vue'),
      props: true,
    },
    {
      path: '/board/:boardType/write',
      name: 'post-write',
      component: () =>
        import(/* webpackChunkName: "post-editor" */ '@/views/board/PostWriteView.vue'),
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/board/:boardType/post/:postId/edit',
      name: 'post-edit',
      component: () =>
        import(/* webpackChunkName: "post-editor" */ '@/views/board/PostEditView.vue'),
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import(/* webpackChunkName: "user" */ '@/views/user/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/icon-shop',
      name: 'icon-shop',
      component: () => import(/* webpackChunkName: "user" */ '@/views/user/IconShopView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import(/* webpackChunkName: "auth" */ '@/views/auth/AuthView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import(/* webpackChunkName: "admin" */ '@/views/admin/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    // Test routes (development only)
    ...(import.meta.env.VITE_APP_ENV === 'development'
      ? [
          {
            path: '/test/media-upload',
            name: 'media-upload-test',
            component: () =>
              import(/* webpackChunkName: "test" */ '@/views/test/MediaUploadTestView.vue'),
            meta: { requiresAuth: true },
          },
          {
            path: '/test/error-handling',
            name: 'error-handling-test',
            component: () =>
              import(
                /* webpackChunkName: "test" */ '@/components/examples/ErrorHandlingExample.vue'
              ),
          },
        ]
      : []),
  ],
})

// Import auth middleware
import { requireAuth, requireAdmin } from '@/middleware/auth'

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  console.log('Router guard:', {
    path: to.path,
    requiresAuth: to.matched.some((record) => record.meta.requiresAuth),
    requiresAdmin: to.matched.some((record) => record.meta.requiresAdmin),
    authInitialized: userStore.authInitialized,
    isAuthenticated: userStore.isAuthenticated,
    isAdmin: userStore.isAdmin,
  })

  // Wait for auth initialization if not ready
  if (!userStore.authInitialized) {
    console.log('Waiting for auth initialization...')

    // Wait up to 3 seconds for auth to initialize
    let attempts = 0
    const maxAttempts = 30 // 3 seconds with 100ms intervals

    while (!userStore.authInitialized && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    if (!userStore.authInitialized) {
      console.log('Auth initialization timeout')
      if (to.matched.some((record) => record.meta.requiresAuth || record.meta.requiresAdmin)) {
        next('/auth')
        return
      }
    }
  }

  if (to.matched.some((record) => record.meta.requiresAdmin)) {
    // Admin routes require admin authentication
    if (userStore.isAuthenticated && userStore.isAdmin) {
      console.log('Admin access granted')
      next()
    } else if (userStore.isAuthenticated) {
      console.log('User authenticated but not admin')
      next('/')
    } else {
      console.log('User not authenticated')
      next('/auth')
    }
  } else if (to.matched.some((record) => record.meta.requiresAuth)) {
    // Regular authenticated routes
    if (userStore.isAuthenticated) {
      next()
    } else {
      next('/auth')
    }
  } else {
    next()
  }
})

export default router
