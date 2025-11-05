<template>
  <v-snackbar
    v-model="showUpdatePrompt"
    :timeout="-1"
    location="bottom"
    color="primary"
    variant="elevated"
  >
    <div class="d-flex align-center">
      <v-icon icon="mdi-download" class="me-2" />
      <span>새로운 버전이 있습니다!</span>
    </div>

    <template #actions>
      <v-btn variant="text" color="white" @click="updateApp"> 업데이트 </v-btn>
      <v-btn variant="text" color="white" @click="dismissUpdate">
        나중에
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const showUpdatePrompt = ref(false);
let registration = null;

onMounted(() => {
  if ('serviceWorker' in navigator) {
    // 기존 서비스 워커 등록 확인
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        registration = reg;

        // 즉시 업데이트 확인
        reg.update();

        // 새로운 서비스 워커 감지
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                showUpdatePrompt.value = true;
              }
            });
          }
        });

        // 서비스 워커 제어권 변경 감지
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }
    });

    // PWA 플러그인에서 오는 메시지 처리
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
        showUpdatePrompt.value = true;
      }
    });

    // 정기적으로 업데이트 확인 (30초마다)
    setInterval(() => {
      if (registration) {
        registration.update();
      }
    }, 30000);
  }
});

const updateApp = async () => {
  showUpdatePrompt.value = false;

  try {
    // 모든 캐시 삭제
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    // 서비스 워커 완전 제거 후 재등록
    if (registration) {
      await registration.unregister();
    }

    // 강제 새로고침 (캐시 무시)
    window.location.href = window.location.href + '?_refresh=' + Date.now();
  } catch (error) {
    console.error('Update failed:', error);
    // 폴백: 일반 새로고침
    window.location.reload(true);
  }
};

const dismissUpdate = () => {
  showUpdatePrompt.value = false;

  // 5분 후 다시 확인
  setTimeout(() => {
    if (registration) {
      registration.update();
    }
  }, 300000);
};
</script>
