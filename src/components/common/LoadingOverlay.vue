<template>
  <v-overlay
    v-model="isVisible"
    class="loading-overlay"
    :persistent="persistent"
    :opacity="0.8"
    :z-index="9998"
  >
    <div class="loading-content">
      <v-progress-circular
        :size="size"
        :width="width"
        color="primary"
        indeterminate
        class="loading-spinner"
      />
      <div v-if="message" class="loading-message mt-4">
        {{ message }}
      </div>
      <div v-if="subMessage" class="loading-sub-message mt-2">
        {{ subMessage }}
      </div>
    </div>
  </v-overlay>
</template>

<script setup>
import { computed } from 'vue'
import { useErrorStore } from '@/stores/error'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '로딩 중...',
  },
  subMessage: {
    type: String,
    default: null,
  },
  size: {
    type: [String, Number],
    default: 64,
  },
  width: {
    type: [String, Number],
    default: 4,
  },
  persistent: {
    type: Boolean,
    default: true,
  },
})

const errorStore = useErrorStore()

const isVisible = computed(() => props.isActive || errorStore.globalLoading)
</script>

<style scoped>
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  max-width: 300px;
}

.loading-message {
  font-size: 1.1rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.loading-sub-message {
  font-size: 0.9rem;
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.8;
}

.loading-spinner {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Dark theme support */
.v-theme--dark .loading-content {
  background: rgba(33, 33, 33, 0.95);
}
</style>
