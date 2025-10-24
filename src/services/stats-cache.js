/**
 * 통계 캐싱 서비스
 * Firestore 읽기 사용량을 줄이기 위한 캐싱 시스템
 */

// 메모리 캐시
const cache = new Map();
// 캐시 기간 설정 (메인페이지 캐싱 강화)
const CACHE_DURATIONS = {
  SITE_STATS: 6 * 60 * 60 * 1000, // 60분 → 6시간 (읽기 최적화)
  BOARD_POSTS: 6 * 60 * 60 * 1000, // 120분 → 6시간 (읽기 최적화)
  BOARD_COUNT: 6 * 60 * 60 * 1000, // 새로 추가: 게시판 카운트 6시간
  SEARCH_RESULTS: 10 * 60 * 1000, // 새로 추가: 검색 결과 10분
  DEFAULT: 5 * 60 * 1000, // 5분
};

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
    const duration = CACHE_DURATIONS[key] || CACHE_DURATIONS.DEFAULT;

    // 메모리 캐시 먼저 확인
    const memoryData = cache.get(key);
    if (memoryData && Date.now() - memoryData.timestamp < duration) {
      return memoryData.data;
    }

    // 로컬스토리지 캐시 확인
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < duration) {
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
   * 캐시에 데이터 저장 (선택적 기간 지정 가능)
   */
  set(key, data, customDuration = null) {
    const duration =
      customDuration || CACHE_DURATIONS[key] || CACHE_DURATIONS.DEFAULT;

    const cacheData = {
      data,
      timestamp: Date.now(),
      duration, // 캐시 기간도 저장 (디버깅용)
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
