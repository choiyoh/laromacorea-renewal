<template>
  <v-container class="pa-4">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h3 mb-6">미디어 업로드 시스템 테스트</h1>

        <v-alert type="info" variant="tonal" class="mb-6">
          이 페이지는 미디어 업로드 시스템을 테스트하기 위한 페이지입니다. 실제 Firebase Storage에
          파일이 업로드됩니다.
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>기본 미디어 업로더</v-card-title>
          <v-card-text>
            <MediaUploader
              v-model="basicFiles"
              :max-files="5"
              :max-size="10 * 1024 * 1024"
              upload-path="test/basic"
              @upload-complete="onUploadComplete"
              @upload-error="onUploadError"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>이미지 전용 업로더</v-card-title>
          <v-card-text>
            <MediaUploader
              v-model="imageFiles"
              :max-files="3"
              :max-size="5 * 1024 * 1024"
              :accepted-types="['image/jpeg', 'image/png', 'image/gif']"
              upload-path="test/images"
              @upload-complete="onUploadComplete"
              @upload-error="onUploadError"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>수동 업로드</v-card-title>
          <v-card-text>
            <MediaUploader
              ref="manualUploader"
              v-model="manualFiles"
              :auto-upload="false"
              :max-files="3"
              upload-path="test/manual"
              @upload-complete="onUploadComplete"
              @upload-error="onUploadError"
            />

            <div class="mt-4">
              <v-btn
                color="primary"
                :disabled="manualFiles.length === 0"
                :loading="isUploading"
                @click="uploadManualFiles"
              >
                수동 업로드 시작
              </v-btn>
              <v-btn
                color="error"
                variant="outlined"
                class="ml-2"
                :disabled="manualFiles.length === 0"
                @click="clearManualFiles"
              >
                모두 삭제
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>업로드 결과</v-card-title>
          <v-card-text>
            <div v-if="uploadResults.length === 0" class="text-center text-grey py-4">
              아직 업로드된 파일이 없습니다.
            </div>

            <v-list v-else>
              <v-list-item v-for="result in uploadResults" :key="result.id">
                <template #prepend>
                  <v-icon
                    :icon="result.success ? 'mdi-check-circle' : 'mdi-alert-circle'"
                    :color="result.success ? 'success' : 'error'"
                  />
                </template>

                <v-list-item-title>{{ result.fileName }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ result.success ? '업로드 성공' : result.error }}
                  <br />
                  <small>{{ formatTime(result.timestamp) }}</small>
                </v-list-item-subtitle>

                <template #append>
                  <v-chip
                    :color="result.success ? 'success' : 'error'"
                    size="small"
                    variant="tonal"
                  >
                    {{ result.success ? '성공' : '실패' }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>

            <div v-if="uploadResults.length > 0" class="mt-4">
              <v-btn color="error" variant="outlined" @click="clearResults"> 결과 지우기 </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 업로드된 파일 통계 -->
    <v-row v-if="allFiles.length > 0">
      <v-col cols="12">
        <v-card>
          <v-card-title>업로드된 파일 통계</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" color="primary">
                  <v-card-text class="text-center">
                    <div class="text-h4">{{ allFiles.length }}</div>
                    <div class="text-caption">총 파일 수</div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" color="success">
                  <v-card-text class="text-center">
                    <div class="text-h4">{{ imageCount }}</div>
                    <div class="text-caption">이미지 파일</div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" color="info">
                  <v-card-text class="text-center">
                    <div class="text-h4">{{ videoCount }}</div>
                    <div class="text-caption">동영상 파일</div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card variant="tonal" color="warning">
                  <v-card-text class="text-center">
                    <div class="text-h4">{{ totalSize }}</div>
                    <div class="text-caption">총 크기</div>
                  </v-card-text>
                </v-card>
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
import MediaUploader from '@/components/common/MediaUploader.vue'
import { storageService } from '@/services/storage'

// Reactive data
const basicFiles = ref([])
const imageFiles = ref([])
const manualFiles = ref([])
const isUploading = ref(false)
const uploadResults = ref([])

// Refs
const manualUploader = ref(null)

// Computed properties
const allFiles = computed(() => [...basicFiles.value, ...imageFiles.value, ...manualFiles.value])

const imageCount = computed(() => allFiles.value.filter((file) => file.type === 'image').length)

const videoCount = computed(() => allFiles.value.filter((file) => file.type === 'video').length)

const totalSize = computed(() => {
  const bytes = allFiles.value.reduce((total, file) => total + (file.size || 0), 0)
  return storageService.formatFileSize(bytes)
})

// Methods
function onUploadComplete(fileData) {
  uploadResults.value.unshift({
    id: Date.now() + Math.random(),
    fileName: fileData.name,
    success: true,
    timestamp: new Date(),
    url: fileData.url,
  })
}

function onUploadError({ file, error }) {
  uploadResults.value.unshift({
    id: Date.now() + Math.random(),
    fileName: file.name,
    success: false,
    error: error.message || '업로드 실패',
    timestamp: new Date(),
  })
}

async function uploadManualFiles() {
  if (!manualUploader.value) return

  isUploading.value = true
  try {
    await manualUploader.value.uploadPendingFiles()
  } finally {
    isUploading.value = false
  }
}

function clearManualFiles() {
  if (manualUploader.value) {
    manualUploader.value.clearFiles()
  }
}

function clearResults() {
  uploadResults.value = []
}

function formatTime(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}
</script>

<style scoped>
.v-card {
  height: 100%;
}
</style>
