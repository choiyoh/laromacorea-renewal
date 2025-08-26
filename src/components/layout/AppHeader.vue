<template>
  <v-app-bar color="secondary" dark app elevation="2">
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
          <span class="font-weight-bold">La Roma Corea</span>
        </router-link>
      </v-app-bar-title>

      <!-- Desktop Navigation -->
      <div class="d-flex align-center mx-4">
        <v-btn
          v-for="board in boards"
          :key="board.key"
          :to="`/board/${board.key}`"
          variant="text"
          class="text-black mx-1 touch-friendly"
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
          class="text-black mx-1 touch-friendly admin-btn"
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
            <span class="font-weight-bold mobile-title">La Roma Corea</span>
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

// Emits
defineEmits(['toggle-drawer']);

// Composables
const { mobile } = useDisplay();

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
</style>
