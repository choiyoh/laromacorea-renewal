<!-- AI가 수정/작성한 코드 - 2026-05-27 -->
<template>
  <v-app-bar
    app
    elevation="0"
    :class="{ 'header-hidden': mobile && isScrollingDown }"
    class="header-transition glass-panel"
  >
    <!-- Desktop Layout -->
    <template v-if="!mobile">
      <!-- Mobile Menu Button (hidden on desktop) -->
      <div style="width: 48px"></div>

      <!-- Logo -->
      <v-app-bar-title class="d-flex align-center">
        <router-link
          to="/home"
          class="text-decoration-none text-black d-flex align-center"
        >
          <v-img
            src="/favicon.ico"
            alt="AS Roma Logo"
            width="32"
            height="32"
            class="me-2"
          />
          <span class="font-weight-bold cinzel-font">La Roma Corea</span>
        </router-link>
      </v-app-bar-title>

      <!-- Desktop Navigation -->
      <div class="d-flex align-center mx-4">
        <v-btn
          v-for="board in boards"
          :key="board.key"
          :to="`/board/${board.key}`"
          variant="text"
          class="text-black mx-1 touch-friendly cinzel-font"
          :class="{ 'v-btn--active': $route.params.boardType === board.key }"
          min-width="60"
        >
          {{ board.name }}
        </v-btn>

        <!-- Admin Menu (only for admin users) -->
        <v-btn
          v-if="userStore.isAdmin"
          to="/admin"
          variant="text"
          class="text-black mx-1 touch-friendly admin-btn cinzel-font"
          :class="{ 'v-btn--active': $route.path.startsWith('/admin') }"
          min-width="60"
        >
          ADMIN
        </v-btn>
      </div>

      <v-spacer />

      <!-- User Menu -->
      <div v-if="userStore.isAuthenticated" class="d-flex align-center">
        <!-- User Points -->
        <div class="d-flex align-center me-3">
          <v-icon class="roma-yellow me-1">mdi-star</v-icon>
          <span class="roma-yellow font-weight-bold"
            >{{ userStore.user?.points || 0 }}P</span
          >
        </div>

        <!-- User Profile Menu -->
        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" class="me-2 touch-friendly">
              <v-avatar size="32">
                <v-img
                  v-if="userStore.user?.photoURL"
                  :src="userStore.user.photoURL"
                  :alt="userStore.user.displayName"
                />
                <v-icon v-else>mdi-account-circle</v-icon>
              </v-avatar>
            </v-btn>
          </template>
          <v-list>
            <v-list-item :to="`/profile`">
              <template v-slot:prepend>
                <v-icon>mdi-account</v-icon>
              </template>
              <v-list-item-title>프로필</v-list-item-title>
            </v-list-item>
            <v-list-item :to="`/icon-shop`">
              <template v-slot:prepend>
                <v-icon>mdi-shopping</v-icon>
              </template>
              <v-list-item-title>아이콘 상점</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item @click="userStore.signOut">
              <template v-slot:prepend>
                <v-icon>mdi-logout</v-icon>
              </template>
              <v-list-item-title>로그아웃</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <!-- Login Button for non-authenticated users -->
      <div v-else>
        <v-btn
          variant="outlined"
          color="black"
          class="touch-friendly"
          @click="$router.push('/auth')"
        >
          로그인
        </v-btn>
      </div>
    </template>

    <!-- Mobile Layout: 3-column grid -->
    <template v-else>
      <div class="mobile-header">
        <!-- Left: Hamburger Menu -->
        <div class="mobile-left">
          <v-app-bar-nav-icon
            @click="$emit('toggle-drawer')"
            class="touch-friendly"
            size="large"
          />
        </div>

        <!-- Center: Logo -->
        <div class="mobile-center">
          <router-link to="/home" class="text-decoration-none text-black">
            <span class="font-weight-bold mobile-title cinzel-font">La Roma Corea</span>
          </router-link>
        </div>

        <!-- Right: User Menu -->
        <div class="mobile-right">
          <div v-if="userStore.isAuthenticated">
            <v-menu offset-y>
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" class="touch-friendly" size="large">
                  <v-avatar size="36">
                    <v-img
                      v-if="userStore.user?.photoURL"
                      :src="userStore.user.photoURL"
                      :alt="userStore.user.displayName"
                    />
                    <v-icon v-else>mdi-account-circle</v-icon>
                  </v-avatar>
                </v-btn>
              </template>
              <v-list>
                <v-list-item :to="`/profile`">
                  <template v-slot:prepend>
                    <v-icon>mdi-account</v-icon>
                  </template>
                  <v-list-item-title>프로필</v-list-item-title>
                </v-list-item>
                <v-list-item :to="`/icon-shop`">
                  <template v-slot:prepend>
                    <v-icon>mdi-shopping</v-icon>
                  </template>
                  <v-list-item-title>아이콘 상점</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="userStore.signOut">
                  <template v-slot:prepend>
                    <v-icon>mdi-logout</v-icon>
                  </template>
                  <v-list-item-title>로그아웃</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          <div v-else>
            <v-btn
              variant="outlined"
              color="black"
              class="touch-friendly"
              size="small"
              @click="$router.push('/auth')"
            >
              로그인
            </v-btn>
          </div>
        </div>
      </div>
    </template>
  </v-app-bar>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/stores/user';
import { useScrollDirection } from '@/composables/useScrollDirection';

// Emits
defineEmits(['toggle-drawer']);

// Composables
const { mobile } = useDisplay();
const { isScrollingDown } = useScrollDirection();

const userStore = useUserStore();

// Board navigation items
const boards = [
  { key: 'notice', name: 'Notice' },
  { key: 'calcio', name: 'Calcio' },
  { key: 'free', name: 'Free' },
  { key: 'match', name: 'Match' },
  { key: 'squad', name: 'Squad' },
  { key: 'special', name: 'Special' },
  { key: 'media', name: 'Media' },
];
</script>

<style scoped>
/* Cinzel 폰트 적용 */
.cinzel-font {
  font-family: 'Cinzel', serif !important;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 로고에 더 강한 폰트 웨이트 적용 */
.v-app-bar-title .cinzel-font {
  font-weight: 600 !important;
  letter-spacing: 1px;
}

/* 모바일 타이틀에도 적용 */
.mobile-title.cinzel-font {
  font-weight: 600 !important;
  letter-spacing: 0.8px;
}
</style>

<style>
.v-btn--active {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.roma-yellow {
  color: #fbba00 !important;
}

.touch-friendly {
  min-height: 44px;
  min-width: 44px;
}

@media (max-width: 599px) {
  .touch-friendly {
    min-height: 48px;
    min-width: 48px;
  }
}

/* Improve touch targets on mobile */
.v-app-bar {
  padding: 0 8px;
}

/* Mobile Layout */
.mobile-header {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.mobile-left,
.mobile-right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  min-width: 60px;
}

.mobile-left {
  justify-content: flex-start;
}

.mobile-right {
  justify-content: flex-end;
}

.mobile-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mobile-title {
  font-size: 1.2rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
  text-align: center;
  white-space: nowrap;
}

@media (max-width: 599px) {
  .v-app-bar {
    padding: 0 8px;
  }
}

/* Focus styles for keyboard navigation */
.v-btn:focus-visible {
  outline: 2px solid var(--v-theme-primary);
  outline-offset: 2px;
}

/* Admin button styling */
.admin-btn {
  color: #990a2c !important;
  font-weight: bold !important;
}

.admin-btn:hover {
  background-color: rgba(153, 10, 44, 0.1) !important;
}

/* Header scroll animation */
.header-transition {
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  will-change: transform;
}

.header-hidden {
  transform: translateY(-100%) !important;
}

/* 모바일 헤더 스크롤 애니메이션 - 전역 스타일 */
@media (max-width: 599px) {
  .v-app-bar.header-hidden {
    transform: translateY(-100%) !important;
    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  }

  .v-app-bar.header-transition {
    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  }

  /* 더 구체적인 선택자 */
  .v-application .v-app-bar.header-hidden {
    transform: translateY(-100%) !important;
  }

  .v-application .v-app-bar.header-transition {
    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  }
}

@media (min-width: 600px) {
  .header-hidden {
    transform: none !important;
  }

  .header-transition {
    transition: none !important;
  }
}

/* AI가 수정/작성한 코드 - 2026-05-27 */
.v-app-bar.glass-panel {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08) !important;
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
}

/* 다크/라이트 테마에 맞추어 텍스트 색상 유연 변환 */
.v-app-bar.glass-panel .text-black {
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
}

.v-app-bar.glass-panel .v-btn {
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
}

.v-app-bar.glass-panel .v-app-bar-nav-icon {
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
}
</style>
