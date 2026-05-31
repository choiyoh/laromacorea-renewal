<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useResponsive } from '@/composables/useResponsive';
import { useNetworkStatus } from '@/composables/useNetworkStatus';
import { initializeCacheManagement } from '@/utils/cacheUtils';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppNavigation from '@/components/layout/AppNavigation.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import ErrorNotification from '@/components/common/ErrorNotification.vue';
import LoadingOverlay from '@/components/common/LoadingOverlay.vue';
import PWAUpdatePrompt from '@/components/common/PWAUpdatePrompt.vue';
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt.vue';

const route = useRoute();
const userStore = useUserStore();
const { responsiveClasses, isMobile } = useResponsive();

// Get authInitialized state
const authInitialized = computed(() => userStore.authInitialized);

// Initialize network monitoring
useNetworkStatus();

// Mobile drawer state
const drawer = ref(false);

// Check if current route is splash screen
const isSplashScreen = computed(() => route.name === 'splash');

onMounted(() => {
  // 캐시 관리 초기화
  initializeCacheManagement();

  // Add responsive classes to document (with safety check)
  nextTick(() => {
    try {
      const classes = responsiveClasses.value;
      if (classes && classes.length > 0) {
        document.documentElement.classList.add(...classes);
      }
    } catch (error) {
      console.warn('Failed to add responsive classes:', error);
    }
  });

  // Handle drawer auto-close on desktop (with safety check)
  nextTick(() => {
    try {
      if (!isMobile.value) {
        drawer.value = false;
      }
    } catch (error) {
      console.warn('Failed to handle drawer state:', error);
    }
  });
});

onUnmounted(() => {
  // Clean up responsive classes
  document.documentElement.classList.remove(...responsiveClasses.value);
});

// Methods
const toggleDrawer = () => {
  drawer.value = !drawer.value;
};

// Close drawer when clicking outside (mobile only)
const handleDrawerOverlayClick = () => {
  if (isMobile.value) {
    drawer.value = false;
  }
};
</script>

<template>
  <v-app class="responsive-app">
    <!-- Global Loading Overlay for Auth Initialization -->
    <LoadingOverlay
      :is-active="!authInitialized"
      message="인증 정보를 확인하는 중..."
    />

    <!-- Main App Content (only when auth is initialized) -->
    <template v-if="authInitialized">
      <!-- Header (hidden on splash screen) -->
      <AppHeader v-if="!isSplashScreen" @toggle-drawer="toggleDrawer" />

      <!-- Mobile Navigation Drawer (hidden on splash screen) -->
      <AppNavigation
        v-if="!isSplashScreen"
        v-model="drawer"
        @click:outside="handleDrawerOverlayClick"
      />

      <!-- Main Content -->
      <v-main :class="isSplashScreen ? 'splash-main' : 'responsive-main'">
        <div
          :class="
            isSplashScreen ? 'splash-content-wrapper' : 'main-content-wrapper'
          "
        >
          <router-view />
        </div>
      </v-main>

      <!-- Footer (hidden on splash screen) -->
      <AppFooter v-if="!isSplashScreen" />
    </template>

    <!-- Global Error Notifications -->
    <ErrorNotification />

    <!-- PWA Components -->
    <PWAUpdatePrompt />
    <PWAInstallPrompt />
  </v-app>
</template>

<style>
/* Global styles */
.v-application {
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* AS Roma brand colors */
.roma-red {
  color: #990a2c !important;
}

.roma-yellow {
  color: #fbba00 !important;
}

/* v-btn hover color for primary buttons */
.v-btn.bg-primary:hover {
  background-color: rgba(
    var(--v-theme-primary),
    0.8
  ) !important; /* Slightly darker primary on hover */
}

/* Responsive app styles */
.responsive-app {
  min-height: 100vh;
  min-height: calc(var(--vh, 1vh) * 100);
}

.responsive-main {
  min-height: calc(100vh - 64px - 120px); /* Header height - Footer height */
  min-height: calc(calc(var(--vh, 1vh) * 100) - 64px - 120px);
}

.splash-main {
  min-height: 100vh;
  min-height: calc(var(--vh, 1vh) * 100);
}

.main-content-wrapper {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
}

.splash-content-wrapper {
  width: 100%;
  height: 100%;
  padding: 0;
}

@media (max-width: 599px) {
  .main-content-wrapper {
    padding: 0;
  }

  .responsive-main {
    min-height: calc(100vh - 56px - 100px); /* Mobile header - Mobile footer */
    min-height: calc(calc(var(--vh, 1vh) * 100) - 56px - 100px);
    /* 스크롤 시 헤더/푸터가 숨겨져도 충분한 공간 확보 */
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
}

@media (min-width: 600px) and (max-width: 959px) {
  .main-content-wrapper {
    padding: 0 24px;
  }
}

@media (min-width: 960px) {
  .main-content-wrapper {
    padding: 0 32px;
  }
}

/* Touch-friendly focus styles */
.touch-device *:focus-visible {
  outline: 2px solid var(--v-theme-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Reduce motion for users who prefer it */
.reduce-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

/* No animations for IE */
.no-animations * {
  animation: none !important;
  transition: none !important;
}

/* Safe area support for devices with notches */
@supports (padding-top: env(safe-area-inset-top)) {
  .responsive-app {
    padding-top: env(safe-area-inset-top);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
