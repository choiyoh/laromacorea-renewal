<template>
  <v-app-bar color="secondary" dark app elevation="2">
    <!-- Mobile Menu Button -->
    <v-app-bar-nav-icon v-if="mobile" @click="$emit('toggle-drawer')" class="d-md-none" />

    <!-- Logo -->
    <v-app-bar-title class="d-flex align-center">
      <router-link to="/" class="text-decoration-none text-black d-flex align-center">
        <v-img src="/favicon.ico" alt="AS Roma Logo" width="32" height="32" class="me-2" />
        <span class="font-weight-bold">AS 로마 코리아</span>
      </router-link>
    </v-app-bar-title>

    <!-- Desktop Navigation -->
    <div class="d-none d-md-flex align-center mx-4">
      <v-btn
        v-for="board in boards"
        :key="board.key"
        :to="`/board/${board.key}`"
        variant="text"
        class="text-black mx-1"
        :class="{ 'v-btn--active': $route.params.boardType === board.key }"
      >
        {{ board.name }}
      </v-btn>
    </div>

    <v-spacer />

    <!-- User Menu -->
    <div v-if="userStore.isAuthenticated" class="d-flex align-center">
      <!-- User Points (Desktop only) -->
      <div class="d-none d-sm-flex align-center me-3">
        <v-icon class="roma-yellow me-1">mdi-star</v-icon>
        <span class="roma-yellow font-weight-bold">{{ userStore.user?.points || 0 }}P</span>
      </div>

      <!-- User Profile Menu -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="me-2">
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
      <v-btn variant="outlined" color="black" @click="$router.push('/auth')"> 로그인 </v-btn>
    </div>
  </v-app-bar>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useUserStore } from '@/stores/user'

// Emits
defineEmits(['toggle-drawer'])

// Composables
const { mobile } = useDisplay()
const userStore = useUserStore()

// Board navigation items
const boards = [
  { key: 'notice', name: 'Notice' },
  { key: 'squad', name: 'Squad' },
  { key: 'match', name: 'Match' },
  { key: 'calcio', name: 'Calcio' },
  { key: 'free', name: 'Free' },
  { key: 'special', name: 'Special' },
  { key: 'media', name: 'Media' },
]
</script>

<style scoped>
.v-btn--active {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.roma-yellow {
  color: #fbba00 !important;
}
</style>
