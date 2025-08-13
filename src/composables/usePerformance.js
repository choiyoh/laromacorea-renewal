/**
 * Performance optimization composable
 */

import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { debounce, throttle, optimizeScroll } from '@/utils/performance'

export function usePerformance() {
  const isLoading = ref(false)
  const performanceMetrics = ref({})

  /**
   * Measure component render time
   */
  const measureRenderTime = (componentName) => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      performanceMetrics.value[componentName] = {
        renderTime: Math.round(renderTime * 100) / 100,
        timestamp: new Date().toISOString(),
      }

      if (import.meta.env.DEV) {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`)
      }
    }
  }

  /**
   * Optimize heavy computations with Web Workers
   */
  const useWebWorker = (workerScript, data) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerScript)

      worker.postMessage(data)

      worker.onmessage = (event) => {
        resolve(event.data)
        worker.terminate()
      }

      worker.onerror = (error) => {
        reject(error)
        worker.terminate()
      }
    })
  }

  /**
   * Batch DOM updates for better performance
   */
  const batchDOMUpdates = (updates) => {
    return nextTick(() => {
      updates.forEach((update) => update())
    })
  }

  /**
   * Virtual scrolling for large lists
   */
  const useVirtualScroll = (items, itemHeight = 50, containerHeight = 400) => {
    const scrollTop = ref(0)
    const visibleItems = ref([])

    const updateVisibleItems = () => {
      const startIndex = Math.floor(scrollTop.value / itemHeight)
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        items.length,
      )

      visibleItems.value = items.slice(startIndex, endIndex).map((item, index) => ({
        ...item,
        index: startIndex + index,
        top: (startIndex + index) * itemHeight,
      }))
    }

    const onScroll = optimizeScroll((event) => {
      scrollTop.value = event.target.scrollTop
      updateVisibleItems()
    })

    onMounted(() => {
      updateVisibleItems()
    })

    return {
      visibleItems,
      onScroll,
      totalHeight: items.length * itemHeight,
    }
  }

  /**
   * Image optimization and lazy loading
   */
  const optimizeImages = () => {
    const images = document.querySelectorAll('img[data-src]')

    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src
            img.classList.remove('lazy')
            imageObserver.unobserve(img)
          }
        })
      },
      { rootMargin: '50px' },
    )

    images.forEach((img) => imageObserver.observe(img))

    return () => imageObserver.disconnect()
  }

  /**
   * Preload critical resources
   */
  const preloadResources = (resources) => {
    resources.forEach((resource) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.url
      link.as = resource.type

      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin
      }

      document.head.appendChild(link)
    })
  }

  /**
   * Memory leak prevention
   */
  const preventMemoryLeaks = () => {
    const cleanup = []

    const addCleanup = (cleanupFn) => {
      cleanup.push(cleanupFn)
    }

    onUnmounted(() => {
      cleanup.forEach((fn) => fn())
    })

    return { addCleanup }
  }

  return {
    isLoading,
    performanceMetrics,
    measureRenderTime,
    useWebWorker,
    batchDOMUpdates,
    useVirtualScroll,
    optimizeImages,
    preloadResources,
    preventMemoryLeaks,
    debounce,
    throttle,
  }
}

/**
 * Resource loading optimization
 */
export function useResourceLoading() {
  const loadedResources = ref(new Set())
  const failedResources = ref(new Set())

  const loadResource = async (url, type = 'script') => {
    if (loadedResources.value.has(url)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const element =
        type === 'script' ? document.createElement('script') : document.createElement('link')

      element.onload = () => {
        loadedResources.value.add(url)
        resolve()
      }

      element.onerror = () => {
        failedResources.value.add(url)
        reject(new Error(`Failed to load ${type}: ${url}`))
      }

      if (type === 'script') {
        element.src = url
        element.async = true
      } else {
        element.rel = 'stylesheet'
        element.href = url
      }

      document.head.appendChild(element)
    })
  }

  const preloadCriticalResources = () => {
    const criticalResources = [
      { url: '/fonts/roboto-v30-latin-regular.woff2', type: 'font' },
      { url: '/images/logo.png', type: 'image' },
    ]

    return Promise.all(
      criticalResources.map((resource) => loadResource(resource.url, resource.type)),
    )
  }

  return {
    loadedResources,
    failedResources,
    loadResource,
    preloadCriticalResources,
  }
}
