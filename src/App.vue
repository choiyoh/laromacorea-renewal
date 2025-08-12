<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const userStore = useUserStore()

// Mobile drawer state
const drawer = ref(false)

// Initialize authentication state listener
onMounted(() => {
  userStore.initializeAuth()
})

// Methods
const toggleDrawer = () => {
  drawer.value = !drawer.value
}
</script>

<template>
  <v-app>
    <!-- Header -->
    <AppHeader @toggle-drawer="toggleDrawer" />

    <!-- Mobile Navigation Drawer -->
    <AppNavigation v-model="drawer" />

    <!-- Main Content -->
    <v-main>
      <router-view />
    </v-main>

    <!-- Footer -->
    <AppFooter />
  </v-app>
</template>

<style>
/* Global styles */
.v-application {
  font-family: 'Roboto', sans-serif;
}

/* AS Roma brand colors */
.roma-red {
  color: #990a2c !important;
}

.roma-yellow {
  color: #fbba00 !important;
}
</style>
