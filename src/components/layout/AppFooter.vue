<template>
  <v-footer
    color="primary"
    dark
    :app="!mdAndUp"
    class="footer-container footer-transition"
    :class="{ 'footer-hidden': mobile && isScrollingDown }"
  >
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

      <!-- Mobile Footer - Copyright Only -->
      <div class="d-md-none text-center mobile-footer-minimal">
        <p class="text-caption mb-0">
          © {{ currentYear }} www.laromacorea.co.kr All Rights reserved.
        </p>
      </div>

      <!-- Desktop Copyright -->
      <div class="d-none d-md-block">
        <v-divider class="my-2" />
        <v-row>
          <v-col cols="12" class="text-center py-1">
            <p class="text-caption mt-1">
              © {{ currentYear }} www.laromacorea.co.kr All Rights reserved.
            </p>
          </v-col>
        </v-row>
      </div>
    </v-container>
  </v-footer>
</template>

<script setup>
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useScrollDirection } from '@/composables/useScrollDirection';

// Composables
const { mobile, mdAndUp } = useDisplay();
const { isScrollingDown } = useScrollDirection();

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
/* 전역 스타일로 Vuetify 오버라이드 */
</style>

<style>
.v-footer a:hover {
  text-decoration: underline !important;
}

.v-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Footer Container */
.footer-container {
  padding: 8px; /* Desktop padding */
}

/* Mobile Footer - Minimal */
.mobile-footer-minimal {
  padding: 8px 0;
}

.mobile-footer-minimal .text-caption {
  font-size: 0.7rem;
  line-height: 1.2;
  opacity: 0.8;
}

/* Mobile specific styles */
@media (max-width: 599px) {
  .footer-container {
    padding: 4px 8px; /* Minimal padding on mobile */
    min-height: auto;
  }

  .mobile-footer-minimal {
    padding: 4px 0;
  }

  .mobile-footer-minimal .text-caption {
    font-size: 0.65rem;
  }
}

/* Tablet specific styles */
@media (min-width: 600px) and (max-width: 959px) {
  .footer-container {
    padding: 6px;
  }
}

/* Footer scroll animation */
.footer-transition {
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  will-change: transform;
}

.footer-hidden {
  transform: translateY(100%) !important;
}

/* 모바일 푸터 스크롤 애니메이션 - 전역 스타일 */
@media (max-width: 599px) {
  .v-footer.footer-hidden {
    transform: translateY(100%) !important;
    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  }

  .v-footer.footer-transition {
    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  }

  /* 더 구체적인 선택자 */
  .v-application .v-footer.footer-hidden {
    transform: translateY(100%) !important;
  }

  .v-application .v-footer.footer-transition {
    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  }
}

@media (min-width: 600px) {
  .footer-hidden {
    transform: none !important;
  }

  .footer-transition {
    transition: none !important;
  }
}
</style>
