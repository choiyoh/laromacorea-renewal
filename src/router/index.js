import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/board/:boardType',
      name: 'board',
      component: () => import('@/views/board/BoardView.vue'),
      props: true,
    },
    {
      path: '/board/:boardType/post/:postId',
      name: 'post',
      component: () => import('@/views/board/PostView.vue'),
      props: true,
    },
    {
      path: '/board/:boardType/write',
      name: 'post-write',
      component: () => import('@/views/board/PostWriteView.vue'),
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/board/:boardType/post/:postId/edit',
      name: 'post-edit',
      component: () => import('@/views/board/PostEditView.vue'),
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/user/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/icon-shop',
      name: 'icon-shop',
      component: () => import('@/views/user/IconShopView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/auth/AuthView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    // Test routes (development only)
    ...(import.meta.env.VITE_APP_ENV === 'development'
      ? [
          {
            path: '/test/media-upload',
            name: 'media-upload-test',
            component: () => import('@/views/test/MediaUploadTestView.vue'),
            meta: { requiresAuth: true },
          },
        ]
      : []),
  ],
})

// Import auth middleware
import { requireAuth, requireAdmin } from '@/middleware/auth'

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAdmin)) {
    // Admin routes require admin authentication
    requireAdmin(to, from, next)
  } else if (to.matched.some((record) => record.meta.requiresAuth)) {
    // Regular authenticated routes
    requireAuth(to, from, next)
  } else {
    next()
  }
})

export default router
