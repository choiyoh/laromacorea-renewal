<template>
  <v-footer color="primary" dark app class="pa-4">
    <v-container>
      <!-- Desktop Footer -->
      <v-row class="d-none d-md-flex justify-space-between">
        <!-- Logo and Description -->
        <v-col cols="12" md="4">
          <div class="d-flex align-center mb-3">
            <v-img src="/favicon.ico" alt="AS Roma Logo" width="24" height="24" class="me-2" />
            <span class="text-h6 font-weight-bold">La Roma Corea</span>
          </div>
          <p class="text-body-2 mb-0 text-center">
            AS 로마를 사랑하는 한국 팬들의 커뮤니티입니다.<br />
            함께 응원하고 소통하는 공간을 만들어가요.
          </p>
        </v-col>

        <!-- Quick Links
        <v-col cols="12" md="4">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">빠른 링크</h3>
          <div class="d-flex flex-column">
            <router-link
              v-for="link in quickLinks"
              :key="link.to"
              :to="link.to"
              class="text-white text-decoration-none mb-1 text-body-2"
            >
              {{ link.name }}
            </router-link>
          </div>
        </v-col> -->

        <!-- Social Links -->
        <v-col cols="12" md="4">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Social Media</h3>
          <div class="d-flex">
            <v-btn
              v-for="social in socialLinks"
              :key="social.name"
              :href="social.url"
              target="_blank"
              icon
              variant="text"
              class="me-2"
              size="small"
            >
              <v-icon>{{ social.icon }}</v-icon>
            </v-btn>
          </div>
          <div class="mt-3">
            <p class="text-caption mb-1">
              공식 AS 로마 웹사이트:
              <a href="https://www.asroma.com" target="_blank" class="text-white"> asroma.com </a>
            </p>
          </div>
        </v-col>
      </v-row>

      <!-- Mobile Footer -->
      <div class="d-md-none text-center">
        <div class="d-flex align-center justify-center mb-2">
          <v-img src="/favicon.ico" alt="AS Roma Logo" width="20" height="20" class="me-2" />
          <span class="font-weight-bold">La Roma Corea</span>
        </div>

        <!-- Mobile Social Links -->
        <div class="d-flex justify-center mb-3">
          <v-btn
            v-for="social in socialLinks"
            :key="social.name"
            :href="social.url"
            target="_blank"
            icon
            variant="text"
            size="small"
            class="mx-1"
          >
            <v-icon size="20">{{ social.icon }}</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Copyright -->
      <v-divider class="my-3" />
      <v-row>
        <v-col cols="12" class="text-center">
          <p class="text-caption mb-0">
            © {{ currentYear }} La Roma Corea. All rights reserved.
            <span class="d-none d-sm-inline">
              | 이 사이트는 팬 커뮤니티 사이트이며 AS 로마와 공식적인 관련이 없습니다.
            </span>
          </p>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup>
import { computed } from 'vue'

// Computed
const currentYear = computed(() => new Date().getFullYear())

// Quick navigation links
const quickLinks = [
  { name: '홈', to: '/' },
  { name: 'Notice', to: '/board/notice' },
  { name: 'Squad', to: '/board/squad' },
  { name: 'Match', to: '/board/match' },
  { name: '아이콘 상점', to: '/icon-shop' },
]

// Social media links
const socialLinks = [
  {
    name: 'Facebook',
    icon: 'mdi-facebook',
    url: 'https://facebook.com/asroma',
  },
  {
    name: 'Twitter',
    icon: 'mdi-twitter',
    url: 'https://twitter.com/asroma',
  },
  {
    name: 'Instagram',
    icon: 'mdi-instagram',
    url: 'https://instagram.com/asroma',
  },
  {
    name: 'YouTube',
    icon: 'mdi-youtube',
    url: 'https://youtube.com/asroma',
  },
]
</script>

<style scoped>
.v-footer a:hover {
  text-decoration: underline !important;
}

.v-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
