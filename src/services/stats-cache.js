/**
 * 통계 캐싱 서비스
 * Firestore 읽기 사용량을 줄이기 위한 캐싱 시스템
 */

// 메모리 캐시
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 로컬스토리지 캐시 키
const CACHE_KEYS = {
  SITE_STATS: 'site_stats_cache',
  BOARD_POSTS: 'board_posts_cache',
};

export const statsCache = {
  /**
   * 캐시에서 데이터 가져오기
   */
  get(key) {
    // 메모리 캐시 먼저 확인
    const memoryData = cache.get(key);
    if (memoryData && Date.now() - memoryData.timestamp < CACHE_DURATION) {
      return memoryData.data;
    }

    // 로컬스토리지 캐시 확인
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          // 메모리 캐시에도 저장
          cache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('캐시 읽기 실패:', error);
    }

    return null;
  },

  /**
   * 캐시에 데이터 저장
   */
  set(key, data) {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };

    // 메모리 캐시에 저장
    cache.set(key, cacheData);

    // 로컬스토리지에도 저장
    try {
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('캐시 저장 실패:', error);
    }
  },

  /**
   * 캐시 무효화
   */
  invalidate(key) {
    cache.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('캐시 삭제 실패:', error);
    }
  },

  /**
   * 모든 캐시 클리어
   */
  clear() {
    cache.clear();
    Object.values(CACHE_KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('캐시 클리어 실패:', error);
      }
    });
  },
};

export { CACHE_KEYS };
