/**
 * Composable for lazy loading images with intersection observer
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { toCdnUrl } from '@/utils/image'

export function useLazyImage(options = {}) {
  const imageRef = ref(null)
  const isLoaded = ref(false)
  const isError = ref(false)
  const isIntersecting = ref(false)

  let observer = null

  const {
    rootMargin = '50px',
    threshold = 0.1,
    placeholder = '/placeholder.jpg',
    errorImage = '/error.jpg',
  } = options

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const handleIntersection = async (entries) => {
    const entry = entries[0]

    if (entry.isIntersecting && !isLoaded.value) {
      isIntersecting.value = true

      const img = imageRef.value
      if (!img) return

      const src = toCdnUrl(img.dataset.src)
      if (!src) return

      try {
        await loadImage(src)
        img.src = src
        img.classList.add('loaded')
        isLoaded.value = true
        observer?.disconnect()
      } catch (error) {
        console.error('Failed to load image:', error)
        img.src = errorImage
        img.classList.add('error')
        isError.value = true
      }
    }
  }

  onMounted(() => {
    if (!imageRef.value) return

    // Use native lazy loading if supported
    if ('loading' in HTMLImageElement.prototype) {
      const img = imageRef.value
      img.loading = 'lazy'
      img.src = img.dataset.src || placeholder
      isLoaded.value = true
      return
    }

    // Fallback to intersection observer
    observer = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold,
    })

    observer.observe(imageRef.value)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return {
    imageRef,
    isLoaded,
    isError,
    isIntersecting,
  }
}

/**
 * Directive for lazy loading images
 */
export const vLazyImage = {
  mounted(el, binding) {
    const { value: src, modifiers } = binding

    const cdnSrc = toCdnUrl(src)

    // Set placeholder
    el.src = modifiers.placeholder || '/placeholder.jpg'
    el.dataset.src = cdnSrc

    // Add loading class
    el.classList.add('lazy-image', 'loading')

    // Use native lazy loading if supported
    if ('loading' in HTMLImageElement.prototype) {
      el.loading = 'lazy'
      el.src = cdnSrc
      el.classList.remove('loading')
      el.classList.add('loaded')
      return
    }

    // Intersection observer fallback
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const img = entry.target
            const src = img.dataset.src

            try {
              // Preload image
              const tempImg = new Image()
              tempImg.src = src
              await new Promise((resolve, reject) => {
                tempImg.onload = resolve
                tempImg.onerror = reject
              })

              // Set actual image
              img.src = src
              img.classList.remove('loading')
              img.classList.add('loaded')

              observer.unobserve(img)
            } catch (error) {
              console.error('Failed to load image:', error)
              img.src = modifiers.error || '/error.jpg'
              img.classList.remove('loading')
              img.classList.add('error')
            }
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      },
    )

    observer.observe(el)

    // Store observer for cleanup
    el._lazyImageObserver = observer
  },

  unmounted(el) {
    if (el._lazyImageObserver) {
      el._lazyImageObserver.disconnect()
    }
  },
}
