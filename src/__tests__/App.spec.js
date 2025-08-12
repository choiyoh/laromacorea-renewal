import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

// Mock Firebase
vi.mock('@/services/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}))

describe('App', () => {
  it('mounts and renders properly', () => {
    const pinia = createPinia()
    const vuetify = createVuetify()
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    })

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, vuetify, router],
      },
    })

    expect(wrapper.text()).toContain('AS 로마 코리아')
  })
})
