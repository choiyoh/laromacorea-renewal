<template>
  <v-footer color="primary" dark app class="pa-2">
    <v-container>
      <!-- Desktop Footer -->
      <v-row class="d-none d-md-flex justify-space-between">
        <!-- Logo and Description -->
        <v-col cols="12" md="4">
          <div class="d-flex align-center mb-2">
            <span class="text-subtitle-1 font-weight-bold"
              ><v-img
                src="/favicon.ico"
                alt="AS Roma Logo"
                width="20"
                height="20"
                class="me-2"
              />La Roma Corea</span
            >
          </div>
          <p class="text-caption mb-0">
            AS 로마를 사랑하는 한국 팬들의 커뮤니티
          </p>
        </v-col>

        <!-- Social Links -->
        <v-col cols="12" md="4">
          <h3 class="text-body-2 font-weight-bold mb-1">Social Media</h3>
          <div class="d-flex">
            <v-btn
              v-for="social in socialLinks"
              :key="social.name"
              :href="social.url"
              target="_blank"
              icon
              variant="text"
              class="me-1"
              size="x-small"
            >
              <v-icon size="16">{{ social.icon }}</v-icon>
            </v-btn>
          </div>
          <div>
            <p class="text-caption mb-0">
              <a
                href="https://www.asroma.com"
                target="_blank"
                class="text-white"
              >
                asroma.com
              </a>
            </p>
          </div>
        </v-col>
      </v-row>

      <!-- Mobile Footer -->
      <div class="d-md-none text-center">
        <div class="mobile-footer-title">
          <img
            src="/favicon.ico"
            alt="AS Roma Logo"
            width="20"
            height="20"
            class="footer-logo"
          />
          <div class="text-wrapper">
            <span class="font-weight-bold footer-text">La Roma Corea</span>
          </div>
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
      <v-divider class="my-2" />
      <v-row>
        <v-col cols="12" class="text-center py-1">
          <p class="text-caption mt-1">
            © {{ currentYear }} www.laromacorea.com All Rights reserved.
          </p>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup>
import { computed } from 'vue';

// Computed
const currentYear = computed(() => new Date().getFullYear());

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
];
</script>

<style scoped>
.v-footer a:hover {
  text-decoration: underline !important;
}

.v-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Mobile Footer Styling */
.mobile-footer-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.text-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.footer-logo {
  flex-shrink: 0;
}

.footer-text {
  font-size: 1.1rem;
  line-height: 1;
}

/* Ensure proper alignment on all mobile devices */
@media (max-width: 599px) {
  .mobile-footer-title {
    align-items: center;
    min-height: 32px;
  }

  .footer-logo {
    margin-top: 0;
    margin-bottom: 0;
  }

  .footer-text {
    margin-top: 0;
    margin-bottom: 0;
  }
}
</style>
