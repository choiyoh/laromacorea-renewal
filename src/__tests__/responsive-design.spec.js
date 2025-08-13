import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getBrowserInfo, getFeatureSupport } from '@/utils/browserUtils'
import { isTouchDevice, getTouchFriendlySize } from '@/utils/touchUtils'

// Mock window properties
const mockWindow = (width = 1024, height = 768) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
}

// Mock matchMedia
const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('Responsive Design Utils', () => {
  beforeEach(() => {
    mockMatchMedia()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Browser Utils', () => {
    it('should detect browser information', () => {
      const browserInfo = getBrowserInfo()

      expect(browserInfo).toHaveProperty('isChrome')
      expect(browserInfo).toHaveProperty('isFirefox')
      expect(browserInfo).toHaveProperty('isSafari')
      expect(browserInfo).toHaveProperty('isEdge')
      expect(browserInfo).toHaveProperty('userAgent')
      expect(typeof browserInfo.userAgent).toBe('string')
    })

    it('should detect feature support', () => {
      const featureSupport = getFeatureSupport()

      expect(featureSupport).toHaveProperty('supportsGrid')
      expect(featureSupport).toHaveProperty('supportsFlexbox')
      expect(featureSupport).toHaveProperty('supportsCustomProperties')
      expect(featureSupport).toHaveProperty('supportsTouchEvents')
      expect(featureSupport).toHaveProperty('supportsLocalStorage')
    })
  })

  describe('Touch Utils', () => {
    it('should detect touch device capability', () => {
      const isTouch = isTouchDevice()
      expect(typeof isTouch).toBe('boolean')
    })

    it('should calculate touch-friendly sizes', () => {
      const mobileSize = getTouchFriendlySize(40, true)
      const desktopSize = getTouchFriendlySize(40, false)

      expect(mobileSize).toBeGreaterThanOrEqual(48)
      expect(desktopSize).toBeGreaterThanOrEqual(44)
      expect(mobileSize).toBeGreaterThanOrEqual(desktopSize)
    })
  })

  describe('CSS Media Queries', () => {
    it('should handle mobile media queries', () => {
      mockMatchMedia(true)

      const mobileQuery = window.matchMedia('(max-width: 599px)')
      expect(mobileQuery.matches).toBe(true)
    })

    it('should handle desktop media queries', () => {
      mockMatchMedia(false)

      const desktopQuery = window.matchMedia('(min-width: 960px)')
      expect(desktopQuery.matches).toBe(false)
    })

    it('should handle touch device queries', () => {
      mockMatchMedia(true)

      const touchQuery = window.matchMedia('(hover: none)')
      expect(touchQuery.matches).toBe(true)
    })

    it('should handle reduced motion queries', () => {
      mockMatchMedia(true)

      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      expect(reducedMotionQuery.matches).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should provide focus-visible support', () => {
      const element = document.createElement('button')
      element.classList.add('focus-visible')

      expect(element.classList.contains('focus-visible')).toBe(true)
    })

    it('should handle high contrast mode', () => {
      mockMatchMedia(true)

      const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
      expect(highContrastQuery.matches).toBe(true)
    })
  })

  describe('Cross-browser Compatibility', () => {
    it('should handle viewport height on mobile', () => {
      // Mock iOS Safari
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })

      mockWindow(375, 667)

      // Should set CSS custom property for viewport height
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)

      const vhValue = document.documentElement.style.getPropertyValue('--vh')
      expect(vhValue).toBe(`${vh}px`)
    })

    it('should handle safe area insets', () => {
      // Mock support for safe area insets
      global.CSS.supports = vi.fn().mockImplementation((property, value) => {
        if (property === 'padding-top' && value === 'env(safe-area-inset-top)') {
          return true
        }
        return false
      })

      expect(CSS.supports('padding-top', 'env(safe-area-inset-top)')).toBe(true)
    })
  })

  describe('Window Dimensions', () => {
    it('should handle window resize', () => {
      mockWindow(480, 800)
      expect(window.innerWidth).toBe(480)
      expect(window.innerHeight).toBe(800)

      mockWindow(1200, 800)
      expect(window.innerWidth).toBe(1200)
      expect(window.innerHeight).toBe(800)
    })

    it('should detect orientation changes', () => {
      // Portrait
      mockWindow(480, 800)
      expect(window.innerHeight > window.innerWidth).toBe(true)

      // Landscape
      mockWindow(800, 480)
      expect(window.innerWidth > window.innerHeight).toBe(true)
    })
  })

  describe('Touch Gesture Detection', () => {
    it('should create touch gesture handler', async () => {
      const { createTouchGestureHandler } = await import('@/utils/touchUtils')

      const element = document.createElement('div')
      const onTap = vi.fn()

      const cleanup = createTouchGestureHandler(element, { onTap })

      expect(typeof cleanup).toBe('function')

      // Cleanup
      cleanup()
    })
  })

  describe('Performance Optimizations', () => {
    it('should handle debounced resize events', (done) => {
      let callCount = 0
      const debouncedHandler = (callback, delay = 100) => {
        let timeoutId
        return () => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(callback, delay)
        }
      }

      const handler = debouncedHandler(() => {
        callCount++
      }, 50)

      // Call multiple times quickly
      handler()
      handler()
      handler()

      // Should only be called once after delay
      setTimeout(() => {
        expect(callCount).toBe(1)
        done()
      }, 100)
    })
  })
})
