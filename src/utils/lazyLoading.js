/**
 * Lazy loading utilities for performance optimization
 */

import { defineAsyncComponent } from 'vue'

/**
 * Create a lazy-loaded component with loading and error states
 * @param {Function} loader - Dynamic import function
 * @param {Object} options - Loading options
 * @returns {Object} Async component
 */
export function createLazyComponent(loader, options = {}) {
  return defineAsyncComponent({
    loader,
    loadingComponent: options.loadingComponent,
    errorComponent: options.errorComponent,
    delay: options.delay || 200,
    timeout: options.timeout || 3000,
    suspensible: options.suspensible !== false,
    onError: options.onError,
  })
}

/**
 * Preload a component for better UX
 * @param {Function} loader - Dynamic import function
 */
export function preloadComponent(loader) {
  if (typeof loader === 'function') {
    loader()
  }
}

/**
 * Lazy load heavy components with intersection observer
 * @param {Function} loader - Dynamic import function
 * @param {Object} options - Intersection observer options
 * @returns {Object} Async component
 */
export function createIntersectionLazyComponent(loader, options = {}) {
  return defineAsyncComponent({
    loader: () => {
      return new Promise((resolve) => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                observer.disconnect()
                loader().then(resolve)
              }
            })
          },
          {
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.1,
          },
        )

        // Create a temporary element to observe
        const tempElement = document.createElement('div')
        tempElement.style.height = '1px'
        document.body.appendChild(tempElement)
        observer.observe(tempElement)

        // Cleanup after timeout
        setTimeout(() => {
          observer.disconnect()
          document.body.removeChild(tempElement)
          loader().then(resolve)
        }, options.timeout || 5000)
      })
    },
    delay: 200,
    timeout: 10000,
  })
}

/**
 * Bundle splitting configuration for Vite
 */
export const bundleSplitConfig = {
  // Vendor libraries
  vendor: ['vue', 'vue-router', 'pinia'],
  ui: ['vuetify'],
  firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
  editor: ['quill', 'vue-quill-editor'],
  utils: ['lodash-es'],
}
