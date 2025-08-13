import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'

/**
 * Responsive design composable
 * Provides reactive breakpoint detection and responsive utilities
 */
export function useResponsive() {
  // Vuetify display composable
  const display = useDisplay()

  // Custom breakpoint detection with safe initial values
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 768)

  // Update window dimensions
  const updateDimensions = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  // Lifecycle
  onMounted(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    window.addEventListener('orientationchange', updateDimensions)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateDimensions)
    window.removeEventListener('orientationchange', updateDimensions)
  })

  // Breakpoint computed properties with safe access
  const isMobile = computed(() => display.mobile?.value || windowWidth.value < 600)
  const isTablet = computed(
    () => display.tablet?.value || (windowWidth.value >= 600 && windowWidth.value < 960),
  )
  const isDesktop = computed(() => display.desktop?.value || windowWidth.value >= 960)
  const isMobileOrTablet = computed(() => isMobile.value || isTablet.value)

  // Custom breakpoints
  const isSmallMobile = computed(() => windowWidth.value < 480)
  const isLargeMobile = computed(() => windowWidth.value >= 480 && windowWidth.value < 600)
  const isSmallTablet = computed(() => windowWidth.value >= 600 && windowWidth.value < 768)
  const isLargeTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 960)
  const isSmallDesktop = computed(() => windowWidth.value >= 960 && windowWidth.value < 1280)
  const isLargeDesktop = computed(() => windowWidth.value >= 1280)
  const isExtraLargeDesktop = computed(() => windowWidth.value >= 1920)

  // Orientation detection
  const isPortrait = computed(() => windowHeight.value > windowWidth.value)
  const isLandscape = computed(() => windowWidth.value > windowHeight.value)

  // Touch device detection
  const isTouchDevice = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  // Device type detection
  const deviceType = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  // Screen size category
  const screenSize = computed(() => {
    if (isSmallMobile.value) return 'xs'
    if (isLargeMobile.value) return 'sm'
    if (isSmallTablet.value) return 'md'
    if (isLargeTablet.value) return 'lg'
    if (isSmallDesktop.value) return 'xl'
    if (isLargeDesktop.value) return 'xxl'
    return 'xxxl'
  })

  // Container width calculation
  const containerWidth = computed(() => {
    if (isMobile.value) return windowWidth.value - 24 // 12px padding on each side
    if (isTablet.value) return windowWidth.value - 48 // 24px padding on each side
    if (windowWidth.value >= 1400) return 1400 - 64 // Max width with 32px padding
    if (windowWidth.value >= 1200) return 1200 - 64
    return windowWidth.value - 64
  })

  // Grid columns calculation
  const getGridColumns = (mobileColumns = 1, tabletColumns = 2, desktopColumns = 3) => {
    if (isMobile.value) return mobileColumns
    if (isTablet.value) return tabletColumns
    return desktopColumns
  }

  // Responsive spacing
  const getResponsiveSpacing = (mobileSpacing = 16, desktopSpacing = 24) => {
    return isMobileOrTablet.value ? mobileSpacing : desktopSpacing
  }

  // Responsive font size
  const getResponsiveFontSize = (mobileFontSize, desktopFontSize) => {
    return isMobileOrTablet.value ? mobileFontSize : desktopFontSize
  }

  // Touch-friendly size calculation
  const getTouchFriendlySize = (baseSize = 44) => {
    if (isTouchDevice.value && isMobile.value) return Math.max(baseSize, 48)
    return Math.max(baseSize, 44)
  }

  // Responsive image dimensions
  const getResponsiveImageSize = (mobileSize, tabletSize, desktopSize) => {
    if (isMobile.value) return mobileSize
    if (isTablet.value) return tabletSize
    return desktopSize
  }

  // Safe area detection (for devices with notches)
  const safeAreaInsets = computed(() => {
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0', 10),
      right: parseInt(style.getPropertyValue('--sar') || '0', 10),
      bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
      left: parseInt(style.getPropertyValue('--sal') || '0', 10),
    }
  })

  // Viewport height calculation (handles mobile browser UI)
  const viewportHeight = computed(() => {
    // Use CSS custom property if available (set by CSS)
    const vh = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--vh') || '0',
      10,
    )
    return vh || windowHeight.value
  })

  // Responsive class names
  const responsiveClasses = computed(() => {
    const classes = []

    classes.push(`device-${deviceType.value}`)
    classes.push(`screen-${screenSize.value}`)

    if (isTouchDevice.value) classes.push('touch-device')
    if (isPortrait.value) classes.push('portrait')
    if (isLandscape.value) classes.push('landscape')

    return classes
  })

  // Media query helpers
  const matchesMediaQuery = (query) => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  }

  const createMediaQuery = (minWidth, maxWidth = null) => {
    let query = `(min-width: ${minWidth}px)`
    if (maxWidth) {
      query += ` and (max-width: ${maxWidth}px)`
    }
    return query
  }

  // Debounced resize handler
  const createDebouncedResizeHandler = (callback, delay = 250) => {
    let timeoutId
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(callback, delay)
    }
  }

  // Performance optimization: check if resize affects layout
  const shouldUpdateLayout = (prevWidth, newWidth, threshold = 50) => {
    return Math.abs(newWidth - prevWidth) > threshold
  }

  return {
    // Vuetify display properties
    display,

    // Window dimensions
    windowWidth,
    windowHeight,

    // Breakpoint detection
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    isSmallMobile,
    isLargeMobile,
    isSmallTablet,
    isLargeTablet,
    isSmallDesktop,
    isLargeDesktop,
    isExtraLargeDesktop,

    // Orientation
    isPortrait,
    isLandscape,

    // Device detection
    isTouchDevice,
    deviceType,
    screenSize,

    // Calculations
    containerWidth,
    viewportHeight,
    safeAreaInsets,

    // Utility functions
    getGridColumns,
    getResponsiveSpacing,
    getResponsiveFontSize,
    getTouchFriendlySize,
    getResponsiveImageSize,

    // CSS classes
    responsiveClasses,

    // Media query helpers
    matchesMediaQuery,
    createMediaQuery,

    // Performance helpers
    createDebouncedResizeHandler,
    shouldUpdateLayout,

    // Update function
    updateDimensions,
  }
}
