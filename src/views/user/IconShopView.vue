<template>
  <div class="icon-shop-view">
    <v-container>
      <v-row>
        <v-col cols="12">
          <div v-if="isAuthenticated">
            <IconShop />
          </div>
          <div v-else class="text-center py-8">
            <v-icon size="64" class="mb-4 text-medium-emphasis">mdi-store</v-icon>
            <h2 class="text-h5 mb-4">로그인이 필요합니다</h2>
            <p class="text-body-1 text-medium-emphasis mb-4">
              아이콘 상점을 이용하려면 먼저 로그인해주세요.
            </p>
            <v-btn color="primary" @click="goToAuth"> 로그인하기 </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import IconShop from '@/components/user/IconShop.vue'

const router = useRouter()
const { isAuthenticated } = useAuth()

const goToAuth = () => {
  router.push('/auth')
}
</script>
