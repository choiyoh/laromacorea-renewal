<template>
  <v-container class="offline-container d-flex align-center justify-center">
    <v-card class="text-center pa-8" max-width="500">
      <v-icon
        icon="mdi-wifi-off"
        size="80"
        color="grey-darken-2"
        class="mb-4"
      />

      <h1 class="text-h4 mb-4">오프라인 상태</h1>

      <p class="text-body-1 mb-6">
        인터넷 연결을 확인해주세요.<br />
        연결이 복구되면 자동으로 다시 시도됩니다.
      </p>

      <v-btn
        color="primary"
        variant="elevated"
        @click="retry"
        :loading="retrying"
      >
        <v-icon icon="mdi-refresh" class="me-2" />
        다시 시도
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const retrying = ref(false);

const retry = async () => {
  retrying.value = true;

  try {
    // 네트워크 연결 확인
    const response = await fetch('/', { method: 'HEAD' });
    if (response.ok) {
      // 연결이 복구되면 홈으로 이동
      router.push('/');
    }
  } catch (error) {
    // 여전히 오프라인
    // Still offline
  } finally {
    retrying.value = false;
  }
};

// 온라인 상태 복구 감지
window.addEventListener('online', () => {
  router.push('/');
});
</script>

<style scoped>
.offline-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
</style>
