<template>
  <v-snackbar
    v-model="showInstallPrompt"
    :timeout="10000"
    location="bottom"
    color="success"
    variant="elevated"
  >
    <div class="d-flex align-center">
      <v-icon icon="mdi-cellphone-arrow-down" class="me-2" />
      <span>앱으로 설치하시겠습니까?</span>
    </div>

    <template #actions>
      <v-btn variant="text" color="white" @click="installApp"> 설치 </v-btn>
      <v-btn variant="text" color="white" @click="dismissInstall"> 취소 </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const showInstallPrompt = ref(false);
let deferredPrompt = null;

onMounted(() => {
  // PWA 설치 프롬프트 감지
  window.addEventListener('beforeinstallprompt', (e) => {
    // 기본 설치 프롬프트 방지
    e.preventDefault();
    deferredPrompt = e;

    // 사용자가 이전에 설치를 거부했는지 확인
    const installDismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');

    // 24시간이 지났거나 처음 방문하는 경우에만 프롬프트 표시
    if (
      !installDismissed ||
      (dismissedTime &&
        Date.now() - parseInt(dismissedTime) > 24 * 60 * 60 * 1000)
    ) {
      // 3초 후에 프롬프트 표시
      setTimeout(() => {
        showInstallPrompt.value = true;
      }, 3000);
    }
  });

  // 앱이 이미 설치된 경우 감지
  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false;
    localStorage.removeItem('pwa-install-dismissed');
    localStorage.removeItem('pwa-install-dismissed-time');
  });
});

const installApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // PWA 설치됨
    } else {
      // PWA 설치 거부됨
      localStorage.setItem('pwa-install-dismissed', 'true');
      localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
    }

    deferredPrompt = null;
  }
  showInstallPrompt.value = false;
};

const dismissInstall = () => {
  showInstallPrompt.value = false;
  localStorage.setItem('pwa-install-dismissed', 'true');
  localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
};
</script>
