<template>
  <div class="error-notification-container">
    <!-- Network Error Banner -->
    <v-banner
      v-if="hasNetworkError"
      color="error"
      icon="mdi-wifi-off"
      sticky
      class="network-error-banner"
    >
      <template #text>
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="font-weight-medium">{{ networkError.message }}</div>
            <div v-if="networkError.retryCount > 0" class="text-caption mt-1">
              재시도 {{ networkError.retryCount }}회
            </div>
          </div>
          <v-btn variant="outlined" size="small" color="white" @click="clearNetworkError">
            닫기
          </v-btn>
        </div>
      </template>
    </v-banner>

    <!-- Offline Banner -->
    <v-banner
      v-if="isOffline"
      color="warning"
      icon="mdi-cloud-off-outline"
      sticky
      class="offline-banner"
    >
      <template #text>
        <div class="font-weight-medium">오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.</div>
      </template>
    </v-banner>

    <!-- Error Snackbars -->
    <div class="error-snackbars">
      <v-snackbar
        v-for="error in visibleErrors"
        :key="error.id"
        v-model="error.show"
        :color="getErrorColor(error.type)"
        :timeout="getErrorTimeout(error.type)"
        location="top right"
        class="error-snackbar"
        :class="`error-snackbar--${error.type}`"
        multi-line
        @update:model-value="(value) => !value && dismissError(error.id)"
      >
        <template #default>
          <div class="d-flex align-start">
            <v-icon :icon="getErrorIcon(error.type)" class="mr-3 mt-1" size="20" />
            <div class="flex-grow-1">
              <div class="font-weight-medium">{{ error.message }}</div>
              <div v-if="error.context" class="text-caption mt-1 opacity-80">
                {{ error.context }}
              </div>
              <div class="text-caption mt-1 opacity-60">
                {{ formatTime(error.timestamp) }}
              </div>
            </div>
          </div>
        </template>

        <template #actions>
          <v-btn variant="text" size="small" @click="dismissError(error.id)"> 닫기 </v-btn>
        </template>
      </v-snackbar>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useErrorStore } from '@/stores/error'

const errorStore = useErrorStore()

// Computed properties
const hasNetworkError = computed(() => errorStore.hasNetworkError)
const networkError = computed(() => errorStore.networkError)
const isOffline = computed(() => errorStore.isOffline)
const errors = computed(() => errorStore.errors)

// Visible errors with show state
const visibleErrors = computed(() => {
  return errors.value
    .filter((error) => !error.dismissed)
    .map((error) => ({
      ...error,
      show: true,
    }))
})

// Methods
const dismissError = (errorId) => {
  errorStore.dismissError(errorId)
}

const clearNetworkError = () => {
  errorStore.clearNetworkError()
}

const getErrorColor = (type) => {
  switch (type) {
    case errorStore.ERROR_TYPES.NETWORK:
      return 'error'
    case errorStore.ERROR_TYPES.AUTH:
      return 'warning'
    case errorStore.ERROR_TYPES.VALIDATION:
      return 'info'
    case errorStore.ERROR_TYPES.PERMISSION:
      return 'error'
    case errorStore.ERROR_TYPES.SERVER:
      return 'error'
    default:
      return 'error'
  }
}

const getErrorIcon = (type) => {
  switch (type) {
    case errorStore.ERROR_TYPES.NETWORK:
      return 'mdi-wifi-off'
    case errorStore.ERROR_TYPES.AUTH:
      return 'mdi-account-alert'
    case errorStore.ERROR_TYPES.VALIDATION:
      return 'mdi-alert-circle'
    case errorStore.ERROR_TYPES.PERMISSION:
      return 'mdi-lock-alert'
    case errorStore.ERROR_TYPES.SERVER:
      return 'mdi-server-network-off'
    default:
      return 'mdi-alert'
  }
}

const getErrorTimeout = (type) => {
  switch (type) {
    case errorStore.ERROR_TYPES.NETWORK:
    case errorStore.ERROR_TYPES.AUTH:
      return -1 // Don't auto-dismiss
    default:
      return 8000
  }
}

const formatTime = (timestamp) => {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp)
}
</script>

<style scoped>
.error-notification-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none;
}

.network-error-banner,
.offline-banner {
  pointer-events: auto;
}

.error-snackbars {
  position: fixed;
  top: 80px;
  right: 16px;
  z-index: 10000;
  pointer-events: none;
}

.error-snackbar {
  pointer-events: auto;
  margin-bottom: 8px;
}

.error-snackbar--network {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.error-snackbar--auth {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.error-snackbar--validation {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.error-snackbar--permission {
  border-left: 4px solid rgb(var(--v-theme-error));
}

@media (max-width: 600px) {
  .error-snackbars {
    top: 60px;
    right: 8px;
    left: 8px;
  }
}
</style>
