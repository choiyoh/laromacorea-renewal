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
let updateSW = null;

onMounted(() => {
  // PWA 업데이트 감지
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
        showUpdatePrompt.value = true;
        updateSW = event.data.updateSW;
      }
    });
  }
});

const updateApp = () => {
  if (updateSW) {
    updateSW();
  } else {
    window.location.reload();
  }
  showUpdatePrompt.value = false;
};

const dismissUpdate = () => {
  showUpdatePrompt.value = false;
};
</script>
