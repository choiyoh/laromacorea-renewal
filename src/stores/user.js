// User store for authentication and user data management
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { AuthService } from '@/services/auth';
import { useErrorStore } from '@/stores/error';

export const useUserStore = defineStore('user', () => {
  // Get error store instance
  const errorStore = useErrorStore();

  // State
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const authInitialized = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isVerified = computed(
    () => user.value?.role === 'admin' || user.value?.verified === true,
  );
  const userLevel = computed(() => {
    if (!user.value) return 'guest';
    if (user.value.role === 'admin') return 'admin';
    if (user.value.verified === true) return 'verified';
    return 'unverified';
  });
  const userDisplayName = computed(() => {
    if (!user.value) return '';
    return (
      user.value.displayName || user.value.email?.split('@')[0] || '사용자'
    );
  });
  const userPoints = computed(() => user.value?.points || 0);
  const userIcon = computed(() => user.value?.selectedIconData || null);

  // Actions
  async function signIn(email, password) {
    errorStore.setLoading('auth-signin', true);
    error.value = null;

    try {
      const firebaseUser = await AuthService.signIn(email, password);

      // Get user data from Firestore
      const userData = await AuthService.getUserDocument(firebaseUser.uid);

      user.value = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        ...userData, // Merge Firestore data
      };

      return user.value;
    } catch (err) {
      error.value = err.message;
      errorStore.handleFirebaseError(err, 'User Sign In');
      throw err;
    } finally {
      errorStore.setLoading('auth-signin', false);
    }
  }

  async function signUp(email, password, displayName = null) {
    errorStore.setLoading('auth-signup', true);
    error.value = null;

    try {
      const firebaseUser = await AuthService.signUp(
        email,
        password,
        displayName,
      );

      // Get the created user document from Firestore
      const userData = await AuthService.getUserDocument(firebaseUser.uid);

      user.value = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        ...userData, // Merge Firestore data
      };

      return user.value;
    } catch (err) {
      error.value = err.message;
      errorStore.handleFirebaseError(err, 'User Sign Up');
      throw err;
    } finally {
      errorStore.setLoading('auth-signup', false);
    }
  }

  async function signOut() {
    errorStore.setLoading('auth-signout', true);
    error.value = null;

    try {
      await AuthService.signOut();
      user.value = null;
    } catch (err) {
      error.value = err.message;
      errorStore.handleFirebaseError(err, 'User Sign Out');
      throw err;
    } finally {
      errorStore.setLoading('auth-signout', false);
    }
  }

  async function resetPassword(email) {
    loading.value = true;
    error.value = null;

    try {
      await AuthService.resetPassword(email);
      return true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(updates) {
    loading.value = true;
    error.value = null;

    try {
      await AuthService.updateUserProfile(updates);

      // Update local user state
      if (user.value) {
        user.value = { ...user.value, ...updates };
      }

      // 닉네임이 변경된 경우 사용자 정보 캐시 무효화
      if (updates.displayName && user.value?.uid) {
        try {
          const { useUserInfo } = await import('@/composables/useUserInfo');
          const { invalidateUserCache, updateUserInfo } = useUserInfo();

          // 해당 사용자의 캐시 무효화
          invalidateUserCache(user.value.uid);

          // 새로운 정보로 캐시 업데이트
          updateUserInfo(user.value.uid, user.value);
        } catch (error) {
          console.warn('Failed to invalidate user cache:', error);
        }
      }

      return user.value;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updatePassword(newPassword) {
    loading.value = true;
    error.value = null;

    try {
      await AuthService.updateUserPassword(newPassword);
      return true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function refreshUserData() {
    if (!user.value?.uid) return;

    try {
      const userData = await AuthService.getUserDocument(user.value.uid);
      if (userData) {
        user.value = { ...user.value, ...userData };
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  }

  async function refreshUserPoints() {
    if (!user.value?.uid) return;

    try {
      const userData = await AuthService.getUserDocument(user.value.uid);
      if (userData && user.value) {
        user.value.points = userData.points || 0;
      }
    } catch (err) {
      console.error('Error refreshing user points:', err);
    }
  }

  function setUser(userData) {
    user.value = userData;
  }

  function clearError() {
    error.value = null;
  }

  function clearUser() {
    user.value = null;
  }

  async function loadUserIconData(iconId) {
    try {
      // iconService를 동적으로 import하여 순환 참조 방지
      const { iconService } = await import('@/services/database');
      const icons = await iconService.getActiveIcons();
      const iconData = icons.find((icon) => icon.id === iconId);

      if (iconData && user.value) {
        user.value.selectedIconData = {
          id: iconData.id,
          name: iconData.name,
          url: iconData.url,
        };
      }
    } catch (error) {
      console.error('Error loading user icon data:', error);
    }
  }

  // Initialize auth state listener
  function initializeAuth() {
    return AuthService.onAuthStateChanged(async (firebaseUser) => {
      errorStore.setLoading('auth-init', true);

      try {
        if (firebaseUser) {
          // Get user data from Firestore
          const userData = await AuthService.getUserDocument(firebaseUser.uid);

          user.value = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            ...userData, // Merge Firestore data
          };

          // 선택된 아이콘 데이터 로드
          if (userData?.selectedIcon) {
            await loadUserIconData(userData.selectedIcon);
          }
        } else {
          user.value = null;
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        errorStore.handleFirebaseError(err, 'Auth Initialization');
        user.value = null;
      } finally {
        errorStore.setLoading('auth-init', false);
        authInitialized.value = true;
      }
    });
  }

  return {
    // State
    user,
    loading,
    error,
    authInitialized,

    // Getters
    isAuthenticated,
    isAdmin,
    isVerified,
    userLevel,
    userDisplayName,
    userPoints,
    userIcon,

    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
    refreshUserData,
    refreshUserPoints,
    setUser,
    clearError,
    clearUser,
    loadUserIconData,
    initializeAuth,
  };
});
