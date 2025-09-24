/**
 * 캐시 무효화 및 관리 유틸리티
 */

// 앱 버전 관리 (package.json에서 가져오거나 빌드 시 주입)
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const CACHE_VERSION_KEY = 'app_cache_version';

/**
 * 앱 버전이 변경되었는지 확인
 */
export function checkVersionUpdate() {
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
  const currentVersion = APP_VERSION;

  if (storedVersion && storedVersion !== currentVersion) {
    return true; // 버전이 변경됨
  }

  // 현재 버전 저장
  localStorage.setItem(CACHE_VERSION_KEY, currentVersion);
  return false;
}

/**
 * 브라우저 캐시 강제 무효화
 */
export async function clearBrowserCache() {
  try {
    // Service Worker 캐시 삭제
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );
    }

    // Local Storage 버전 정보 업데이트
    localStorage.setItem(CACHE_VERSION_KEY, APP_VERSION);

    console.log('Browser cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear browser cache:', error);
    return false;
  }
}

/**
 * 페이지 새로고침 (캐시 무시)
 */
export function forceReload() {
  // 캐시를 무시하고 새로고침
  window.location.reload(true);
}

/**
 * URL에 캐시 버스팅 파라미터 추가
 */
export function addCacheBuster(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
}

/**
 * 즉시 캐시 확인 및 처리
 */
async function performImmediateCacheCheck() {
  // 버전 변경 확인
  if (checkVersionUpdate()) {
    console.log('App version updated, clearing cache...');
    await clearBrowserCache();

    // 서비스 워커 강제 업데이트
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          console.log('Service worker unregistered');
        }
      } catch (error) {
        console.error('Failed to unregister service worker:', error);
      }
    }

    // 강제 새로고침
    setTimeout(() => {
      window.location.href = window.location.href + '?_cb=' + Date.now();
    }, 1000);
    return;
  }

  // 서비스 워커 업데이트 확인
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      console.error('Failed to update service worker:', error);
    }
  }
}

/**
 * 앱 초기화 시 캐시 확인 및 처리
 */
export function initializeCacheManagement() {
  // 즉시 캐시 확인 및 정리
  performImmediateCacheCheck();

  // 페이지 가시성 변경 시 업데이트 확인
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      performImmediateCacheCheck();
    }
  });

  // 페이지 로드 시 강제 캐시 확인
  window.addEventListener('load', () => {
    setTimeout(performImmediateCacheCheck, 2000);
  });

  // 포커스 시 캐시 확인
  window.addEventListener('focus', () => {
    performImmediateCacheCheck();
  });

  // 정기적인 서버 버전 확인 시작
  // startPeriodicVersionCheck();
}
/**
 * 서버의 캐시 메타 정보 확인
 */
export async function checkServerCacheMeta() {
  try {
    const response = await fetch('/cache-meta.json?_cb=' + Date.now(), {
      cache: 'no-cache',
    });

    if (response.ok) {
      const serverMeta = await response.json();
      const localVersion = localStorage.getItem(CACHE_VERSION_KEY);

      if (localVersion !== serverMeta.version) {
        console.log('Server version changed, forcing cache clear...');
        localStorage.setItem(CACHE_VERSION_KEY, serverMeta.version);
        return true; // 버전 변경됨
      }
    }
  } catch (error) {
    console.warn('Failed to check server cache meta:', error);
  }

  return false;
}

/**
 * 정기적으로 서버 버전 확인
 */
export function startPeriodicVersionCheck() {
  // 5분마다 서버 버전 확인
  setInterval(async () => {
    const versionChanged = await checkServerCacheMeta();
    if (versionChanged) {
      // 사용자에게 새로고침 알림
      if (
        confirm('새로운 버전이 배포되었습니다. 페이지를 새로고침하시겠습니까?')
      ) {
        await clearBrowserCache();
        window.location.href = window.location.href + '?_refresh=' + Date.now();
      }
    }
  }, 300000); // 5분
}
