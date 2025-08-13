/**
 * Touch-friendly UI utilities
 * Provides utilities for creating touch-optimized interfaces
 */

// Touch event detection
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0
}

// Touch gesture detection
export const createTouchGestureHandler = (element, options = {}) => {
  const {
    onTap = null,
    onDoubleTap = null,
    onLongPress = null,
    onSwipeLeft = null,
    onSwipeRight = null,
    onSwipeUp = null,
    onSwipeDown = null,
    longPressDelay = 500,
    swipeThreshold = 50,
    doubleTapDelay = 300,
  } = options

  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0
  let longPressTimer = null
  let lastTapTime = 0
  let tapCount = 0

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchStartTime = Date.now()

    // Long press detection
    if (onLongPress) {
      longPressTimer = setTimeout(() => {
        onLongPress(e)
      }, longPressDelay)
    }
  }

  const handleTouchMove = (e) => {
    // Cancel long press if finger moves
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  const handleTouchEnd = (e) => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }

    const touch = e.changedTouches[0]
    const touchEndX = touch.clientX
    const touchEndY = touch.clientY
    const touchDuration = Date.now() - touchStartTime

    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Swipe detection
    if (distance > swipeThreshold) {
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)

      if (angle >= -45 && angle <= 45 && onSwipeRight) {
        onSwipeRight(e)
      } else if (angle >= 135 || (angle <= -135 && onSwipeLeft)) {
        onSwipeLeft(e)
      } else if (angle >= 45 && angle <= 135 && onSwipeDown) {
        onSwipeDown(e)
      } else if (angle >= -135 && angle <= -45 && onSwipeUp) {
        onSwipeUp(e)
      }
      return
    }

    // Tap detection (only if no significant movement)
    if (distance < 10 && touchDuration < 500) {
      const currentTime = Date.now()

      if (onDoubleTap && currentTime - lastTapTime < doubleTapDelay) {
        tapCount++
        if (tapCount === 2) {
          onDoubleTap(e)
          tapCount = 0
          lastTapTime = 0
          return
        }
      }

      if (onTap) {
        // Delay single tap to allow for double tap detection
        if (onDoubleTap) {
          setTimeout(() => {
            if (tapCount === 1) {
              onTap(e)
              tapCount = 0
            }
          }, doubleTapDelay)
          tapCount = 1
        } else {
          onTap(e)
        }
      }

      lastTapTime = currentTime
    }
  }

  // Add event listeners
  element.addEventListener('touchstart', handleTouchStart, { passive: false })
  element.addEventListener('touchmove', handleTouchMove, { passive: false })
  element.addEventListener('touchend', handleTouchEnd, { passive: false })

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
    if (longPressTimer) {
      clearTimeout(longPressTimer)
    }
  }
}

// Touch-friendly button size calculation
export const getTouchFriendlySize = (baseSize = 44, isMobile = false) => {
  const minSize = isMobile ? 48 : 44 // iOS HIG recommends 44pt, Android recommends 48dp
  return Math.max(baseSize, minSize)
}

// Touch-friendly spacing calculation
export const getTouchFriendlySpacing = (baseSpacing = 8, isMobile = false) => {
  return isMobile ? Math.max(baseSpacing, 12) : baseSpacing
}

// Prevent iOS zoom on input focus
export const preventIOSZoom = (inputElement) => {
  if (!inputElement) return

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (!isIOS) return

  // Set font-size to 16px to prevent zoom
  inputElement.style.fontSize = '16px'

  // Optional: restore original font-size after blur
  const originalFontSize = getComputedStyle(inputElement).fontSize

  const handleBlur = () => {
    if (originalFontSize !== '16px') {
      inputElement.style.fontSize = originalFontSize
    }
  }

  inputElement.addEventListener('blur', handleBlur, { once: true })
}

// Smooth scroll with touch support
export const smoothScrollTo = (element, target, duration = 300) => {
  const start = element.scrollTop
  const change = target - start
  const startTime = performance.now()

  const animateScroll = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3)

    element.scrollTop = start + change * easeOut

    if (progress < 1) {
      requestAnimationFrame(animateScroll)
    }
  }

  requestAnimationFrame(animateScroll)
}

// Touch-friendly drag and drop
export const createTouchDragHandler = (element, options = {}) => {
  const { onDragStart = null, onDragMove = null, onDragEnd = null, dragThreshold = 10 } = options

  let isDragging = false
  let startX = 0
  let startY = 0
  let currentX = 0
  let currentY = 0

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    currentX = startX
    currentY = startY
  }

  const handleTouchMove = (e) => {
    e.preventDefault() // Prevent scrolling

    const touch = e.touches[0]
    currentX = touch.clientX
    currentY = touch.clientY

    const deltaX = currentX - startX
    const deltaY = currentY - startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (!isDragging && distance > dragThreshold) {
      isDragging = true
      if (onDragStart) {
        onDragStart({
          startX,
          startY,
          currentX,
          currentY,
          deltaX,
          deltaY,
        })
      }
    }

    if (isDragging && onDragMove) {
      onDragMove({
        startX,
        startY,
        currentX,
        currentY,
        deltaX,
        deltaY,
      })
    }
  }

  const handleTouchEnd = (e) => {
    if (isDragging && onDragEnd) {
      const deltaX = currentX - startX
      const deltaY = currentY - startY

      onDragEnd({
        startX,
        startY,
        currentX,
        currentY,
        deltaX,
        deltaY,
      })
    }

    isDragging = false
  }

  element.addEventListener('touchstart', handleTouchStart, { passive: false })
  element.addEventListener('touchmove', handleTouchMove, { passive: false })
  element.addEventListener('touchend', handleTouchEnd, { passive: false })

  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
  }
}

// Haptic feedback (if supported)
export const triggerHapticFeedback = (type = 'light') => {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10)
        break
      case 'medium':
        navigator.vibrate(20)
        break
      case 'heavy':
        navigator.vibrate(50)
        break
      case 'success':
        navigator.vibrate([10, 50, 10])
        break
      case 'error':
        navigator.vibrate([50, 50, 50])
        break
      default:
        navigator.vibrate(10)
    }
  }
}

// Touch-friendly scroll detection
export const createScrollHandler = (element, options = {}) => {
  const {
    onScrollStart = null,
    onScrollEnd = null,
    onScrollUp = null,
    onScrollDown = null,
    scrollEndDelay = 150,
  } = options

  let isScrolling = false
  let scrollTimer = null
  let lastScrollTop = element.scrollTop

  const handleScroll = () => {
    const currentScrollTop = element.scrollTop
    const scrollDirection = currentScrollTop > lastScrollTop ? 'down' : 'up'

    if (!isScrolling) {
      isScrolling = true
      if (onScrollStart) {
        onScrollStart({ scrollTop: currentScrollTop, direction: scrollDirection })
      }
    }

    if (scrollDirection === 'up' && onScrollUp) {
      onScrollUp({ scrollTop: currentScrollTop })
    } else if (scrollDirection === 'down' && onScrollDown) {
      onScrollDown({ scrollTop: currentScrollTop })
    }

    // Clear existing timer
    if (scrollTimer) {
      clearTimeout(scrollTimer)
    }

    // Set new timer for scroll end detection
    scrollTimer = setTimeout(() => {
      isScrolling = false
      if (onScrollEnd) {
        onScrollEnd({ scrollTop: currentScrollTop, direction: scrollDirection })
      }
    }, scrollEndDelay)

    lastScrollTop = currentScrollTop
  }

  element.addEventListener('scroll', handleScroll, { passive: true })

  return () => {
    element.removeEventListener('scroll', handleScroll)
    if (scrollTimer) {
      clearTimeout(scrollTimer)
    }
  }
}

// Touch-friendly focus management
export const manageFocusForTouch = (container) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )

  focusableElements.forEach((element) => {
    // Add touch-friendly focus styles
    element.addEventListener('focus', () => {
      element.classList.add('touch-focused')
    })

    element.addEventListener('blur', () => {
      element.classList.remove('touch-focused')
    })

    // Handle touch vs keyboard focus
    element.addEventListener('mousedown', () => {
      element.classList.add('mouse-focus')
    })

    element.addEventListener('keydown', () => {
      element.classList.remove('mouse-focus')
    })
  })
}

// Export all utilities
export default {
  isTouchDevice,
  createTouchGestureHandler,
  getTouchFriendlySize,
  getTouchFriendlySpacing,
  preventIOSZoom,
  smoothScrollTo,
  createTouchDragHandler,
  triggerHapticFeedback,
  createScrollHandler,
  manageFocusForTouch,
}
