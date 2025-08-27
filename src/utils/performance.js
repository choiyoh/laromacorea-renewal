/**
 * Performance optimization utilities
 */

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  const criticalResources = [
    '/fonts/roboto-v30-latin-regular.woff2',
    '/images/logo.png',
    '/images/roma-badge.png',
  ];

  criticalResources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';

    if (resource.includes('.woff2')) {
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
    } else if (resource.includes('.png') || resource.includes('.jpg')) {
      link.as = 'image';
    }

    link.href = resource;
    document.head.appendChild(link);
  });
}

/**
 * Optimize images for different screen sizes
 * @param {string} src - Original image source
 * @param {number} width - Target width
 * @param {string} format - Target format (webp, jpg, png)
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(src, width = 800, format = 'webp') {
  // This would typically integrate with an image optimization service
  // For now, return the original src
  return src;
}

/**
 * Check if WebP is supported
 * @returns {Promise<boolean>} WebP support status
 */
export function checkWebPSupport() {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Measure and report performance metrics
 */
export function measurePerformance() {
  if (!window.performance) return;

  // Measure page load performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];

      if (perfData) {
        const metrics = {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          ttfb: perfData.responseStart - perfData.requestStart,
          download: perfData.responseEnd - perfData.responseStart,
          domReady:
            perfData.domContentLoadedEventEnd - perfData.navigationStart,
          windowLoad: perfData.loadEventEnd - perfData.navigationStart,
        };

        // Report to analytics if needed
        if (window.gtag) {
          window.gtag('event', 'timing_complete', {
            name: 'page_load',
            value: Math.round(metrics.windowLoad),
          });
        }
      }
    }, 0);
  });
}

/**
 * Optimize scroll performance
 * @param {Function} callback - Scroll callback
 * @param {number} delay - Throttle delay
 * @returns {Function} Optimized scroll handler
 */
export function optimizeScroll(callback, delay = 16) {
  let ticking = false;

  return throttle(() => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  }, delay);
}

/**
 * Intersection Observer utility for performance
 * @param {Function} callback - Intersection callback
 * @param {Object} options - Observer options
 * @returns {IntersectionObserver} Observer instance
 */
export function createPerformantObserver(callback, options = {}) {
  const defaultOptions = {
    rootMargin: '50px',
    threshold: 0.1,
  };

  return new IntersectionObserver(throttle(callback, 100), {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Preload route components
 * @param {Array} routes - Routes to preload
 */
export function preloadRoutes(routes) {
  routes.forEach((route) => {
    if (route.component && typeof route.component === 'function') {
      // Preload the component
      route.component();
    }
  });
}

/**
 * Memory usage monitoring
 */
export function monitorMemoryUsage() {
  if (!performance.memory) return;
}

/**
 * Critical CSS inlining utility
 */
export function inlineCriticalCSS() {
  const criticalCSS = `
    /* Critical CSS for above-the-fold content */
    body { margin: 0; font-family: 'Roboto', sans-serif; }
    .v-application { font-family: 'Roboto', sans-serif !important; }
    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
}
