import { ref, computed } from 'vue';
import { iconService } from '@/services/database';

// 사용자 아이콘 캐시
const userIconCache = new Map();
const cacheExpiry = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export function useUserIcon() {
  const loading = ref(false);

  // 사용자의 현재 아이콘 정보를 가져오는 함수
  async function getUserCurrentIcon(userId) {
    if (!userId) return null;

    // 캐시 확인
    const now = Date.now();
    if (userIconCache.has(userId)) {
      const expiry = cacheExpiry.get(userId);
      if (expiry && now < expiry) {
        return userIconCache.get(userId);
      }
    }

    try {
      loading.value = true;

      // 사용자 정보 가져오기
      const { userService } = await import('@/services/database');
      const userData = await userService.getUser(userId);

      if (!userData || !userData.selectedIcon) {
        // 캐시에 null 저장
        userIconCache.set(userId, null);
        cacheExpiry.set(userId, now + CACHE_DURATION);
        return null;
      }

      // 아이콘 정보 가져오기
      const icons = await iconService.getActiveIcons();
      const iconData = icons.find((icon) => icon.id === userData.selectedIcon);

      if (!iconData) {
        userIconCache.set(userId, null);
        cacheExpiry.set(userId, now + CACHE_DURATION);
        return null;
      }

      const result = {
        id: iconData.id,
        name: iconData.name,
        url: iconData.url,
      };

      // 캐시에 저장
      userIconCache.set(userId, result);
      cacheExpiry.set(userId, now + CACHE_DURATION);

      return result;
    } catch (error) {
      console.error('Error fetching user icon:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // 캐시 무효화
  function invalidateUserIconCache(userId) {
    if (userId) {
      userIconCache.delete(userId);
      cacheExpiry.delete(userId);
    } else {
      // 모든 캐시 무효화
      userIconCache.clear();
      cacheExpiry.clear();
    }
  }

  // 전체 캐시 클리어
  function clearIconCache() {
    userIconCache.clear();
    cacheExpiry.clear();
  }

  return {
    loading: computed(() => loading.value),
    getUserCurrentIcon,
    invalidateUserIconCache,
    clearIconCache,
  };
}
