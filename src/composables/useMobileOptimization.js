/**
 * Mobile Performance Optimization Composable
 * 모바일 환경에서의 성능 최적화를 위한 유틸리티
 */

import { ref, onMounted, onUnmounted } from 'vue';

export function useMobileOptimization() {
  const isMobile = ref(false);
  const isSlowConnection = ref(false);
  const shouldOptimizeImages = ref(false);

  // 모바일 디바이스 감지
  function detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent,
    );
  }

  // 네트워크 속도 감지
  function detectSlowConnection() {
    if ('connection' in navigator) {
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      if (connection) {
        // 2G, slow-2g, 3g는 느린 연결로 간주
        return ['slow-2g', '2g', '3g'].includes(connection.effectiveType);
      }
    }
    return false;
  }

  // 이미지 최적화 여부 결정
  function shouldOptimizeImagesForDevice() {
    return isMobile.value || isSlowConnection.value;
  }

  // 지연 로딩을 위한 Intersection Observer
  function createLazyLoader(callback, options = {}) {
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    };

    return new IntersectionObserver(callback, defaultOptions);
  }

  // 이미지 압축 URL 생성 (Firebase Storage용)
  function getOptimizedImageUrl(originalUrl, options = {}) {
    if (!shouldOptimizeImages.value) return originalUrl;

    const { width = 800, quality = 80 } = options;

    // Firebase Storage 이미지 최적화 파라미터 추가
    if (originalUrl.includes('firebasestorage.googleapis.com')) {
      const url = new URL(originalUrl);
      url.searchParams.set('w', width);
      url.searchParams.set('q', quality);
      return url.toString();
    }

    return originalUrl;
  }

  // 비디오 최적화 설정
  function getVideoOptimizationSettings() {
    if (isMobile.value) {
      return {
        preload: 'metadata',
        controls: true,
        muted: true,
        playsinline: true,
        style: {
          maxHeight: '250px',
          width: '100%',
        },
      };
    }

    return {
      preload: 'auto',
      controls: true,
      style: {
        maxHeight: '400px',
        width: '100%',
      },
    };
  }

  // 청크 로딩 최적화
  function optimizeChunkLoading() {
    if (isMobile.value) {
      // 모바일에서는 더 작은 청크 크기 사용
      return {
        chunkSize: 'small',
        prefetch: false,
        preload: 'critical-only',
      };
    }

    return {
      chunkSize: 'normal',
      prefetch: true,
      preload: 'all',
    };
  }

  // 댓글 로딩 최적화
  function getCommentLoadingStrategy() {
    if (isMobile.value || isSlowConnection.value) {
      return {
        initialLoad: 10,
        loadMore: 10,
        lazyLoad: true,
      };
    }

    return {
      initialLoad: 20,
      loadMore: 20,
      lazyLoad: false,
    };
  }

  onMounted(() => {
    isMobile.value = detectMobile();
    isSlowConnection.value = detectSlowConnection();
    shouldOptimizeImages.value = shouldOptimizeImagesForDevice();

    // 네트워크 상태 변경 감지
    if ('connection' in navigator) {
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      if (connection) {
        const updateConnection = () => {
          isSlowConnection.value = detectSlowConnection();
          shouldOptimizeImages.value = shouldOptimizeImagesForDevice();
        };

        connection.addEventListener('change', updateConnection);

        onUnmounted(() => {
          connection.removeEventListener('change', updateConnection);
        });
      }
    }
  });

  return {
    isMobile,
    isSlowConnection,
    shouldOptimizeImages,
    createLazyLoader,
    getOptimizedImageUrl,
    getVideoOptimizationSettings,
    optimizeChunkLoading,
    getCommentLoadingStrategy,
  };
}
