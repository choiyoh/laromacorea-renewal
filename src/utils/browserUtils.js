/**
 * Cross-browser compatibility utilities
 * Handles browser-specific quirks and provides consistent behavior
 */

// Browser detection
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor)
  const isFirefox = /Firefox/.test(userAgent)
  const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor)
  const isEdge = /Edg/.test(userAgent)
  const isIE = /Trident/.test(userAgent) || /MSIE/.test(userAgent)
  const isOpera = /OPR/.test(userAgent)

  // Mobile browsers
  const isIOSSafari = /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent)
  const isAndroidChrome = /Android/.test(userAgent) && /Chrome/.test(userAgent)
  const isSamsungBrowser = /SamsungBrowser/.test(userAgent)

  return {
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    isIE,
    isOpera,
    isIOSSafari,
    isAndroidChrome,
    isSamsungBrowser,
    userAgent,
  }
}

// Operating system detection
export const getOSInfo = () => {
  const userAgent = navigator.userAgent
  const platform = navigator.platform

  const isWindows = /Win/.test(platform)
  const isMac = /Mac/.test(platform)
  const isLinux = /Linux/.test(platform)
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isAndroid = /Android/.test(userAgent)

  return {
    isWindows,
    isMac,
    isLinux,
    isIOS,
    isAndroid,
    platform,
  }
}

// Feature detection
export const getFeatureSupport = () => {
  return {
    // CSS features
    supportsGrid: CSS.supports('display', 'grid'),
    supportsFlexbox: CSS.supports('display', 'flex'),
    supportsCustomProperties: CSS.supports('--custom', 'property'),
    supportsClipPath: CSS.supports('clip-path', 'circle()'),
    supportsBackdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
    supportsObjectFit: CSS.supports('object-fit', 'cover'),
    supportsAspectRatio: CSS.supports('aspect-ratio', '16/9'),
    supportsContainerQueries: CSS.supports('container-type', 'inline-size'),

    // JavaScript features
    supportsIntersectionObserver: 'IntersectionObserver' in window,
    supportsResizeObserver: 'ResizeObserver' in window,
    supportsWebGL: (() => {
      try {
        const canvas = document.createElement('canvas')
        return !!(
          canvas.getContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        )
      } catch (e) {
        return false
      }
    })(),
    supportsWebP: (() => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        return canvas.toDataURL && canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
      } catch (e) {
        return false
      }
    })(),
    supportsAvif: (() => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        return canvas.toDataURL && canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
      } catch (e) {
        return false
      }
    })(),

    // Touch and input
    supportsTouchEvents: 'ontouchstart' in window,
    supportsPointerEvents: 'onpointerdown' in window,
    supportsPassiveEvents: (() => {
      let supportsPassive = false
      try {
        const opts = Object.defineProperty({}, 'passive', {
          get() {
            supportsPassive = true
            return true
          },
        })
        window.addEventListener('testPassive', null, opts)
        window.removeEventListener('testPassive', null, opts)
      } catch (e) {
        // ignore
      }
      return supportsPassive
    })(),

    // Storage
    supportsLocalStorage: (() => {
      try {
        const test = 'test'
        localStorage.setItem(test, test)
        localStorage.removeItem(test)
        return true
      } catch (e) {
        return false
      }
    })(),
    supportsSessionStorage: (() => {
      try {
        const test = 'test'
        sessionStorage.setItem(test, test)
        sessionStorage.removeItem(test)
        return true
      } catch (e) {
        return false
      }
    })(),

    // Network
    supportsServiceWorker: 'serviceWorker' in navigator,
    supportsWebSockets: 'WebSocket' in window,
    supportsFetch: 'fetch' in window,

    // Media
    supportsWebRTC: 'RTCPeerConnection' in window,
    supportsGetUserMedia: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices,
  }
}

// Viewport fixes for mobile browsers
export const applyViewportFixes = () => {
  const browserInfo = getBrowserInfo()
  const osInfo = getOSInfo()

  // iOS Safari viewport height fix
  if (osInfo.isIOS) {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 100) // Delay to ensure proper calculation
    })
  }

  // Android Chrome address bar fix
  if (browserInfo.isAndroidChrome) {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setVH()
    window.addEventListener('resize', setVH)
  }

  // Safe area insets for devices with notches
  if (osInfo.isIOS && CSS.supports('padding-top', 'env(safe-area-inset-top)')) {
    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)')
    document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)')
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)')
    document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)')
  }
}

// Polyfills for older browsers
export const loadPolyfills = async () => {
  const featureSupport = getFeatureSupport()

  // Log which features need polyfills
  if (!featureSupport.supportsIntersectionObserver) {
    console.warn('IntersectionObserver not supported - consider adding polyfill')
  }

  if (!featureSupport.supportsResizeObserver) {
    console.warn('ResizeObserver not supported - consider adding polyfill')
  }

  // Note: Polyfills can be added here when needed
  // For now, we rely on modern browser support
}

// CSS custom properties fallback
export const setCSSCustomProperty = (property, value, fallback = null) => {
  const featureSupport = getFeatureSupport()

  if (featureSupport.supportsCustomProperties) {
    document.documentElement.style.setProperty(property, value)
  } else if (fallback) {
    // Apply fallback for browsers that don't support custom properties
    const elements = document.querySelectorAll(`[style*="${property}"]`)
    elements.forEach((element) => {
      element.style.setProperty(property.replace('--', ''), fallback)
    })
  }
}

// Smooth scrolling polyfill
export const smoothScrollPolyfill = () => {
  if (!CSS.supports('scroll-behavior', 'smooth')) {
    // Add smooth scrolling behavior for browsers that don't support it
    const links = document.querySelectorAll('a[href^="#"]')

    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const target = document.querySelector(link.getAttribute('href'))

        if (target) {
          const targetPosition = target.offsetTop
          const startPosition = window.pageYOffset
          const distance = targetPosition - startPosition
          const duration = 500
          let start = null

          const step = (timestamp) => {
            if (!start) start = timestamp
            const progress = timestamp - start
            const progressPercentage = Math.min(progress / duration, 1)

            // Easing function
            const ease = progressPercentage * (2 - progressPercentage)

            window.scrollTo(0, startPosition + distance * ease)

            if (progress < duration) {
              requestAnimationFrame(step)
            }
          }

          requestAnimationFrame(step)
        }
      })
    })
  }
}

// Focus visible polyfill
export const focusVisiblePolyfill = () => {
  if (!CSS.supports('selector(:focus-visible)')) {
    let hadKeyboardEvent = true
    const keyboardThrottleTimeout = 100

    const focusTriggeredByKeyboard = (el) => {
      return hadKeyboardEvent || el.matches(':focus-visible')
    }

    const onPointerDown = () => {
      hadKeyboardEvent = false
    }

    const onKeyDown = (e) => {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return
      }
      hadKeyboardEvent = true
    }

    const onFocus = (e) => {
      if (focusTriggeredByKeyboard(e.target)) {
        e.target.classList.add('focus-visible')
      }
    }

    const onBlur = (e) => {
      e.target.classList.remove('focus-visible')
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('mousedown', onPointerDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('touchstart', onPointerDown, true)
    document.addEventListener('focus', onFocus, true)
    document.addEventListener('blur', onBlur, true)
  }
}

// Image format detection and fallback
export const getOptimalImageFormat = () => {
  const featureSupport = getFeatureSupport()

  if (featureSupport.supportsAvif) return 'avif'
  if (featureSupport.supportsWebP) return 'webp'
  return 'jpg'
}

// Performance optimization for older browsers
export const optimizeForOlderBrowsers = () => {
  const browserInfo = getBrowserInfo()

  // Disable animations for IE
  if (browserInfo.isIE) {
    document.documentElement.classList.add('no-animations')
  }

  // Reduce motion for users who prefer it
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduce-motion')
  }

  // Add browser-specific classes
  if (browserInfo.isChrome) document.documentElement.classList.add('chrome')
  if (browserInfo.isFirefox) document.documentElement.classList.add('firefox')
  if (browserInfo.isSafari) document.documentElement.classList.add('safari')
  if (browserInfo.isEdge) document.documentElement.classList.add('edge')
  if (browserInfo.isIOSSafari) document.documentElement.classList.add('ios-safari')
  if (browserInfo.isAndroidChrome) document.documentElement.classList.add('android-chrome')
}

// Initialize all browser compatibility fixes
export const initializeBrowserCompatibility = async () => {
  // Apply viewport fixes
  applyViewportFixes()

  // Load necessary polyfills
  await loadPolyfills()

  // Apply smooth scrolling polyfill
  smoothScrollPolyfill()

  // Apply focus visible polyfill
  focusVisiblePolyfill()

  // Optimize for older browsers
  optimizeForOlderBrowsers()

  console.log('Browser compatibility initialized')
}

// Export all utilities
export default {
  getBrowserInfo,
  getOSInfo,
  getFeatureSupport,
  applyViewportFixes,
  loadPolyfills,
  setCSSCustomProperty,
  smoothScrollPolyfill,
  focusVisiblePolyfill,
  getOptimalImageFormat,
  optimizeForOlderBrowsers,
  initializeBrowserCompatibility,
}
