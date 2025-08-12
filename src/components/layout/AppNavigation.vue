<template>
  <v-navigation-drawer v-model="drawer" temporary location="left" width="280" class="d-md-none">
    <!-- User Profile Section -->
    <div v-if="userStore.isAuthenticated" class="pa-4 bg-primary">
      <div class="d-flex align-center text-white">
        <v-avatar size="48" class="me-3">
          <v-img
            v-if="userStore.user?.photoURL"
            :src="userStore.user.photoURL"
            :alt="userStore.user.displayName"
          />
          <v-icon v-else size="32">mdi-account-circle</v-icon>
        </v-avatar>
        <div>
          <div class="font-weight-bold">
            <v-icon v-if="userStore.user?.selectedIcon" size="16" class="me-1">
              {{ userStore.user.selectedIcon }}
            </v-icon>
            {{ userStore.user?.displayName || '사용자' }}
          </div>
          <div class="text-caption d-flex align-center">
            <v-icon size="14" class="roma-yellow me-1">mdi-star</v-icon>
            <span class="roma-yellow">{{ userStore.user?.points || 0 }}P</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Guest Section -->
    <div v-else class="pa-4 bg-grey-lighten-4">
      <div class="text-center">
        <v-icon size="48" class="text-grey mb-2">mdi-account-circle</v-icon>
        <div class="text-body-2 text-grey-darken-1 mb-3">로그인이 필요합니다</div>
        <v-btn color="primary" variant="flat" block @click="$router.push('/auth')"> 로그인 </v-btn>
      </div>
    </div>

    <v-divider />

    <!-- Navigation Menu -->
    <v-list nav>
      <!-- Home -->
      <v-list-item :to="`/`" :active="$route.path === '/'" @click="closeDrawer">
        <template v-slot:prepend>
          <v-icon>mdi-home</v-icon>
        </template>
        <v-list-item-title>홈</v-list-item-title>
      </v-list-item>

      <v-divider class="my-2" />

      <!-- Board Navigation -->
      <v-list-subheader>게시판</v-list-subheader>
      <v-list-item
        v-for="board in boards"
        :key="board.key"
        :to="`/board/${board.key}`"
        :active="$route.params.boardType === board.key"
        @click="closeDrawer"
      >
        <template v-slot:prepend>
          <v-icon>{{ board.icon }}</v-icon>
        </template>
        <v-list-item-title>{{ board.name }}</v-list-item-title>
        <template v-slot:append v-if="board.badge">
          <v-chip size="small" color="error">{{ board.badge }}</v-chip>
        </template>
      </v-list-item>

      <v-divider class="my-2" />

      <!-- User Menu (when authenticated) -->
      <template v-if="userStore.isAuthenticated">
        <v-list-subheader>사용자 메뉴</v-list-subheader>
        <v-list-item :to="`/profile`" @click="closeDrawer">
          <template v-slot:prepend>
            <v-icon>mdi-account</v-icon>
          </template>
          <v-list-item-title>프로필</v-list-item-title>
        </v-list-item>
        <v-list-item :to="`/icon-shop`" @click="closeDrawer">
          <template v-slot:prepend>
            <v-icon>mdi-shopping</v-icon>
          </template>
          <v-list-item-title>아이콘 상점</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleSignOut">
          <template v-slot:prepend>
            <v-icon>mdi-logout</v-icon>
          </template>
          <v-list-item-title>로그아웃</v-list-item-title>
        </v-list-item>
      </template>
    </v-list>

    <!-- Footer Info -->
    <template v-slot:append>
      <div class="pa-4 text-center">
        <div class="text-caption text-grey">AS 로마 코리아 커뮤니티</div>
        <div class="text-caption text-grey">© 2024 All rights reserved</div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Composables
const userStore = useUserStore()

// Computed
const drawer = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Board navigation items with icons
const boards = [
  { key: 'notice', name: 'Notice', icon: 'mdi-bullhorn' },
  { key: 'squad', name: 'Squad', icon: 'mdi-account-group' },
  { key: 'match', name: 'Match', icon: 'mdi-soccer' },
  { key: 'calcio', name: 'Calcio', icon: 'mdi-newspaper' },
  { key: 'free', name: 'Free', icon: 'mdi-chat' },
  { key: 'special', name: 'Special', icon: 'mdi-star' },
  { key: 'media', name: 'Media', icon: 'mdi-play-circle' },
]

// Methods
const closeDrawer = () => {
  drawer.value = false
}

const handleSignOut = async () => {
  await userStore.signOut()
  closeDrawer()
}
</script>

<style scoped>
.roma-yellow {
  color: #fbba00 !important;
}

.v-list-item--active {
  background-color: rgba(200, 16, 46, 0.1) !important;
}

.v-list-item--active .v-list-item-title {
  color: #990a2c !important;
  font-weight: bold;
}
</style>
