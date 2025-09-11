/**
 * 사용자 정보 관리 Composable
 * 사용자 정보를 캐싱하여 성능을 최적화합니다.
 */

import { ref, reactive } from 'vue';
import { userService } from '@/services/database';

// 전역 캐시 (메모리 기반)
const userInfoCache = reactive(new Map());
const cacheTimestamps = reactive(new Map());

// 캐시 유효 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

export function useUserInfo() {
  const loading = ref(false);

  /**
   * 사용자 정보 조회 (캐싱 지원)
   */
  const getUserInfo = async (userId) => {
    if (!userId) return null;

    // 캐시 확인
    const cached = userInfoCache.get(userId);
    const cacheTime = cacheTimestamps.get(userId);

    if (cached && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
      return cached;
    }

    // 캐시가 없거나 만료된 경우 새로 조회
    try {
      loading.value = true;
      const userInfo = await userService.getUser(userId);

      if (userInfo) {
        // 캐시에 저장
        userInfoCache.set(userId, userInfo);
        cacheTimestamps.set(userId, Date.now());
        return userInfo;
      }

      return null;
    } catch (error) {
      console.warn('Failed to load user info:', error);
      return cached || null; // 실패 시 기존 캐시 반환
    } finally {
      loading.value = false;
    }
  };

  /**
   * 사용자 표시 이름 조회
   */
  const getUserDisplayName = async (userId, fallbackName = '익명') => {
    const userInfo = await getUserInfo(userId);
    return userInfo?.displayName || fallbackName;
  };

  /**
   * 특정 사용자의 캐시 무효화
   */
  const invalidateUserCache = (userId) => {
    if (userId) {
      userInfoCache.delete(userId);
      cacheTimestamps.delete(userId);
    }
  };

  /**
   * 전체 캐시 무효화
   */
  const clearUserCache = () => {
    userInfoCache.clear();
    cacheTimestamps.clear();
  };

  /**
   * 사용자 정보 업데이트 (캐시도 함께 업데이트)
   */
  const updateUserInfo = (userId, updatedInfo) => {
    if (userId && updatedInfo) {
      userInfoCache.set(userId, updatedInfo);
      cacheTimestamps.set(userId, Date.now());
    }
  };

  return {
    loading,
    getUserInfo,
    getUserDisplayName,
    invalidateUserCache,
    clearUserCache,
    updateUserInfo,
  };
}
