<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Error Handling & Loading Demo</v-card-title>
          <v-card-text>
            <v-row>
              <!-- Loading Examples -->
              <v-col cols="12" md="6">
                <h3 class="mb-4">Loading States</h3>

                <div class="mb-4">
                  <LoadingButton :async-action="simulateSuccess" color="primary" class="mr-2">
                    Success Operation
                  </LoadingButton>

                  <LoadingButton :async-action="simulateDelay" color="info" class="mr-2">
                    Slow Operation (3s)
                  </LoadingButton>
                </div>

                <div class="mb-4">
                  <v-btn color="warning" @click="toggleGlobalLoading">
                    Toggle Global Loading
                  </v-btn>
                </div>

                <div class="mb-4">
                  <h4>Skeleton Loaders</h4>
                  <v-switch v-model="showSkeletons" label="Show Skeleton Loading" />

                  <SkeletonLoader v-if="showSkeletons" type="post-list" :count="2" />

                  <div v-else>
                    <v-card class="mb-2" outlined>
                      <v-card-text>
                        <div class="d-flex align-center">
                          <v-avatar class="mr-3">
                            <v-icon>mdi-account</v-icon>
                          </v-avatar>
                          <div>
                            <div class="font-weight-medium">Sample Post Title</div>
                            <div class="text-caption">Posted by User • 2 hours ago</div>
                          </div>
                        </div>
                        <p class="mt-3 mb-0">
                          This is sample post content that would normally be loaded from the server.
                        </p>
                      </v-card-text>
                    </v-card>
                  </div>
                </div>
              </v-col>

              <!-- Error Examples -->
              <v-col cols="12" md="6">
                <h3 class="mb-4">Error Handling</h3>

                <div class="mb-4">
                  <v-btn color="error" class="mr-2 mb-2" @click="triggerValidationError">
                    Validation Error
                  </v-btn>

                  <v-btn color="error" class="mr-2 mb-2" @click="triggerAuthError">
                    Auth Error
                  </v-btn>

                  <v-btn color="error" class="mr-2 mb-2" @click="triggerNetworkError">
                    Network Error
                  </v-btn>

                  <v-btn color="error" class="mr-2 mb-2" @click="triggerPermissionError">
                    Permission Error
                  </v-btn>
                </div>

                <div class="mb-4">
                  <v-btn color="warning" class="mr-2" @click="simulateOffline">
                    Simulate Offline
                  </v-btn>

                  <v-btn color="success" @click="clearAllErrors"> Clear All Errors </v-btn>
                </div>

                <div class="mb-4">
                  <h4>Error Status</h4>
                  <v-chip :color="hasErrors ? 'error' : 'success'" class="mr-2">
                    Errors: {{ errors.length }}
                  </v-chip>

                  <v-chip :color="isOffline ? 'warning' : 'success'">
                    {{ isOffline ? 'Offline' : 'Online' }}
                  </v-chip>
                </div>

                <div v-if="hasErrors" class="mb-4">
                  <h4>Current Errors</h4>
                  <v-list density="compact">
                    <v-list-item
                      v-for="error in errors.slice(0, 3)"
                      :key="error.id"
                      :title="error.message"
                      :subtitle="error.type"
                    >
                      <template #prepend>
                        <v-icon :color="getErrorColor(error.type)">
                          {{ getErrorIcon(error.type) }}
                        </v-icon>
                      </template>
                      <template #append>
                        <v-btn
                          icon="mdi-close"
                          size="small"
                          variant="text"
                          @click="dismissError(error.id)"
                        />
                      </template>
                    </v-list-item>
                  </v-list>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useErrorStore } from '@/stores/error'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useGlobalLoading } from '@/composables/useLoading'
import LoadingButton from '@/components/common/LoadingButton.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'

const errorStore = useErrorStore()
const {
  handleError,
  handleAuthError,
  handleValidationError,
  handleNetworkError,
  handlePermissionError,
  dismissError,
  clearErrors,
} = useErrorHandler()
const { setGlobalLoading } = useGlobalLoading()

// Reactive state
const showSkeletons = ref(false)

// Computed properties
const hasErrors = computed(() => errorStore.hasErrors)
const errors = computed(() => errorStore.errors)
const isOffline = computed(() => errorStore.isOffline)

// Simulation methods
const simulateSuccess = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return 'Success!'
}

const simulateDelay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 3000))
  return 'Completed after delay'
}

const simulateFailure = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  throw new Error('Simulated failure')
}

const toggleGlobalLoading = () => {
  const isLoading = errorStore.globalLoading
  setGlobalLoading(!isLoading, isLoading ? null : 'Global operation in progress...')

  if (!isLoading) {
    setTimeout(() => {
      setGlobalLoading(false)
    }, 3000)
  }
}

// Error trigger methods
const triggerValidationError = () => {
  handleValidationError('이메일 형식이 올바르지 않습니다.', 'Form Validation')
}

const triggerAuthError = () => {
  const authError = {
    code: 'auth/user-not-found',
    message: 'User not found',
  }
  handleAuthError(authError, 'Authentication')
}

const triggerNetworkError = () => {
  const networkError = new Error('Failed to fetch')
  networkError.name = 'NetworkError'
  handleNetworkError(networkError, 'API Request')
}

const triggerPermissionError = () => {
  handlePermissionError('이 작업을 수행할 권한이 없습니다.', 'Permission Check')
}

const simulateOffline = () => {
  errorStore.setOfflineStatus(!isOffline.value)
}

const clearAllErrors = () => {
  clearErrors()
  errorStore.clearNetworkError()
  errorStore.setOfflineStatus(false)
}

// Helper methods
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
    default:
      return 'mdi-alert'
  }
}
</script>
