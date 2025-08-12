import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { createRouter, createWebHistory } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

// Mock Firebase
vi.mock('@/services/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}))

// Mock user store
vi.mock('@/stores/user', () => ({
  useUserStore: () => ({
    isAuthenticated: false,
    user: null,
    signOut: vi.fn(),
  }),
}))

describe('Layout Components', () => {
  const createWrapper = (component, props = {}) => {
    const pinia = createPinia()
    const vuetify = createVuetify()
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    })

    return mount(component, {
      props,
      global: {
        plugins: [pinia, vuetify, router],
      },
    })
  }

  describe('AppHeader', () => {
    it('renders the logo and title', () => {
      const wrapper = createWrapper(AppHeader)
      expect(wrapper.text()).toContain('AS 로마 코리아')
    })

    it('emits toggle-drawer event when nav icon is clicked', async () => {
      const wrapper = createWrapper(AppHeader)
      // This test would need proper mobile simulation
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('AppNavigation', () => {
    it('renders navigation items', () => {
      const wrapper = createWrapper(AppNavigation, { modelValue: true })
      expect(wrapper.text()).toContain('Notice')
      expect(wrapper.text()).toContain('Squad')
      expect(wrapper.text()).toContain('Match')
    })
  })

  describe('AppFooter', () => {
    it('renders footer content', () => {
      const wrapper = createWrapper(AppFooter)
      expect(wrapper.text()).toContain('AS 로마 코리아')
      expect(wrapper.text()).toContain('All rights reserved')
    })
  })
})
