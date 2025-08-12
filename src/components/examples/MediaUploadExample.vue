<template>
  <div class="media-upload-example pa-4">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h2 class="text-h4 mb-4">미디어 업로드 시스템 예제</h2>
        </v-col>
      </v-row>

      <v-row>
        <!-- 기본 업로더 -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>기본 업로더</v-card-title>
            <v-card-text>
              <MediaUploader
                v-model="basicFiles"
                :max-files="5"
                :max-size="5 * 1024 * 1024"
                upload-path="examples/basic"
                @upload-complete="onUploadComplete"
                @upload-error="onUploadError"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 이미지 전용 업로더 -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>이미지 전용 업로더</v-card-title>
            <v-card-text>
              <MediaUploader
                v-model="imageFiles"
                :max-files="3"
                :max-size="2 * 1024 * 1024"
                :accepted-types="['image/jpeg', 'image/png', 'image/gif']"
                upload-path="examples/images"
                @upload-complete="onUploadComplete"
                @upload-error="onUploadError"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 수동 업로드 -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>수동 업로드</v-card-title>
            <v-card-text>
              <MediaUploader
                ref="manualUploader"
                v-model="manualFiles"
                :auto-upload="false"
                :max-files="3"
                upload-path="examples/manual"
                @upload-complete="onUploadComplete"
                @upload-error="onUploadError"
              />

              <div class="mt-4">
                <v-btn
                  color="primary"
                  :disabled="manualFiles.length === 0"
                  :loading="isManualUploading"
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

        <!-- 비활성화된 업로더 -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>비활성화된 업로더</v-card-title>
            <v-card-text>
              <MediaUploader
                v-model="disabledFiles"
                :disabled="true"
                upload-path="examples/disabled"
              />

              <div class="mt-4">
                <v-btn color="primary" variant="outlined" @click="toggleDisabled">
                  {{ isDisabled ? '활성화' : '비활성화' }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 업로드 결과 -->
      <v-row v-if="uploadResults.length > 0">
        <v-col cols="12">
          <v-card>
            <v-card-title>업로드 결과</v-card-title>
            <v-card-text>
              <v-list>
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

              <div class="mt-4">
                <v-btn color="error" variant="outlined" @click="clearResults"> 결과 지우기 </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MediaUploader from '../common/MediaUploader.vue'

// Reactive data
const basicFiles = ref([])
const imageFiles = ref([])
const manualFiles = ref([])
const disabledFiles = ref([])
const isDisabled = ref(true)
const isManualUploading = ref(false)
const uploadResults = ref([])

// Refs
const manualUploader = ref(null)

// Methods
function onUploadComplete(fileData) {
  uploadResults.value.unshift({
    id: Date.now() + Math.random(),
    fileName: fileData.name,
    success: true,
    timestamp: new Date(),
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

  isManualUploading.value = true
  try {
    await manualUploader.value.uploadPendingFiles()
  } finally {
    isManualUploading.value = false
  }
}

function clearManualFiles() {
  if (manualUploader.value) {
    manualUploader.value.clearFiles()
  }
}

function toggleDisabled() {
  isDisabled.value = !isDisabled.value
}

function clearResults() {
  uploadResults.value = []
}
</script>

<style scoped>
.media-upload-example {
  min-height: 100vh;
  background-color: rgb(var(--v-theme-background));
}
</style>
