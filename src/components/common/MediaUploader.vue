<template>
  <div class="media-uploader">
    <!-- 업로드 영역 -->
    <v-card variant="outlined" class="upload-card">
      <div
        class="upload-area"
        :class="{ 'drag-over': isDragOver, disabled: disabled }"
        @drop="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @click="!disabled && $refs.fileInput.click()"
      >
        <v-icon
          :icon="uploadIcon"
          :size="iconSize"
          :color="disabled ? 'grey-lighten-2' : 'grey-lighten-1'"
        />
        <p class="text-body-2 mt-2" :class="{ 'text-grey-lighten-2': disabled }">
          {{ uploadText }}
        </p>
        <p class="text-caption text-grey">
          {{ acceptText }}
        </p>

        <!-- 파일 크기 제한 표시 -->
        <v-chip v-if="maxSize" size="small" variant="tonal" color="info" class="mt-2">
          최대 {{ formatFileSize(maxSize) }}
        </v-chip>
      </div>

      <!-- 숨겨진 파일 입력 -->
      <input
        ref="fileInput"
        type="file"
        :accept="acceptedTypes.join(',')"
        :multiple="multiple"
        :disabled="disabled"
        style="display: none"
        @change="handleFileSelect"
      />
    </v-card>

    <!-- 업로드 진행률 -->
    <div v-if="uploadProgress.length > 0" class="upload-progress mt-4">
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-2 py-2">
          <v-icon icon="mdi-upload" class="mr-2" />
          업로드 진행 중...
        </v-card-title>
        <v-card-text class="pt-0">
          <div v-for="(progress, index) in uploadProgress" :key="index" class="progress-item mb-3">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="text-caption text-truncate" style="max-width: 200px">
                {{ progress.name }}
              </span>
              <span class="text-caption"> {{ Math.round(progress.value) }}% </span>
            </div>
            <v-progress-linear
              :model-value="progress.value"
              :color="progress.error ? 'error' : 'primary'"
              height="4"
              rounded
            />
            <div v-if="progress.error" class="text-caption text-error mt-1">
              {{ progress.error }}
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- 업로드된 파일 목록 -->
    <div v-if="uploadedFiles.length > 0" class="uploaded-files mt-4">
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-2 py-2">
          <v-icon icon="mdi-file-multiple" class="mr-2" />
          업로드된 파일 ({{ uploadedFiles.length }})
        </v-card-title>
        <v-card-text class="pt-0">
          <v-row>
            <v-col v-for="(file, index) in uploadedFiles" :key="index" cols="12" sm="6" md="4">
              <MediaPreview :file="file" @remove="removeFile(index)" :show-remove="!disabled" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>

    <!-- 에러 메시지 -->
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mt-4"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { storageService } from '@/services/storage'
import MediaPreview from './MediaPreview.vue'

const props = defineProps({
  // 업로드된 파일 목록 (v-model)
  modelValue: {
    type: Array,
    default: () => [],
  },
  // 다중 파일 업로드 허용
  multiple: {
    type: Boolean,
    default: true,
  },
  // 허용된 파일 타입
  acceptedTypes: {
    type: Array,
    default: () => ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
  },
  // 최대 파일 크기 (바이트)
  maxSize: {
    type: Number,
    default: 10 * 1024 * 1024, // 10MB
  },
  // 최대 파일 개수
  maxFiles: {
    type: Number,
    default: 10,
  },
  // 업로드 경로
  uploadPath: {
    type: String,
    default: 'uploads',
  },
  // 비활성화 상태
  disabled: {
    type: Boolean,
    default: false,
  },
  // 자동 업로드 (false면 파일만 선택하고 수동으로 업로드)
  autoUpload: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'upload-start', 'upload-complete', 'upload-error'])

// Reactive data
const isDragOver = ref(false)
const uploadProgress = ref([])
const uploadedFiles = ref([...props.modelValue])
const errorMessage = ref('')

// Computed properties
const uploadIcon = computed(() => {
  if (props.disabled) return 'mdi-cloud-off'
  return isDragOver.value ? 'mdi-cloud-upload' : 'mdi-cloud-upload-outline'
})

const iconSize = computed(() => {
  return uploadedFiles.value.length > 0 ? 32 : 48
})

const uploadText = computed(() => {
  if (props.disabled) return '업로드 비활성화됨'
  if (uploadedFiles.value.length >= props.maxFiles) return '최대 파일 개수에 도달했습니다'
  return isDragOver.value ? '파일을 놓아주세요' : '클릭하거나 파일을 드래그하여 업로드'
})

const acceptText = computed(() => {
  const imageTypes = props.acceptedTypes.filter((type) => type.startsWith('image/'))
  const videoTypes = props.acceptedTypes.filter((type) => type.startsWith('video/'))

  const parts = []
  if (imageTypes.length > 0) parts.push('이미지')
  if (videoTypes.length > 0) parts.push('동영상')

  return `${parts.join(', ')} 파일만 업로드 가능`
})

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    uploadedFiles.value = [...newValue]
  },
  { deep: true },
)

// Watch for changes to uploadedFiles and emit update
watch(
  uploadedFiles,
  (newValue) => {
    emit('update:modelValue', [...newValue])
  },
  { deep: true },
)

// Methods
function handleDrop(event) {
  event.preventDefault()
  isDragOver.value = false

  if (props.disabled) return

  const files = Array.from(event.dataTransfer.files)
  processFiles(files)
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  processFiles(files)

  // Reset input
  event.target.value = ''
}

function processFiles(files) {
  if (files.length === 0) return

  // 파일 개수 제한 확인
  const remainingSlots = props.maxFiles - uploadedFiles.value.length
  if (remainingSlots <= 0) {
    errorMessage.value = '더 이상 파일을 추가할 수 없습니다.'
    return
  }

  const filesToProcess = files.slice(0, remainingSlots)
  if (files.length > remainingSlots) {
    errorMessage.value = `최대 ${props.maxFiles}개의 파일만 업로드할 수 있습니다. ${remainingSlots}개만 선택되었습니다.`
  }

  // 각 파일 검증 및 처리
  filesToProcess.forEach((file) => {
    const validation = storageService.validateFile(file, {
      maxSize: props.maxSize,
      allowedTypes: props.acceptedTypes,
    })

    if (!validation.isValid) {
      errorMessage.value = `${file.name}: ${validation.errors.join(', ')}`
      return
    }

    if (props.autoUpload) {
      uploadFile(file)
    } else {
      // 자동 업로드가 아닌 경우 파일 객체만 추가
      addFileToList(file)
    }
  })
}

async function uploadFile(file) {
  const progressIndex = uploadProgress.value.length
  const progressItem = {
    name: file.name,
    value: 0,
    error: null,
  }

  uploadProgress.value.push(progressItem)
  emit('upload-start', file)

  try {
    const fileName = `${props.uploadPath}/${Date.now()}_${file.name}`
    const fileType = storageService.getFileType(file)

    const uploadMethod =
      fileType === 'video' ? storageService.uploadVideo : storageService.uploadImage

    const downloadURL = await uploadMethod(file, fileName, (progress) => {
      uploadProgress.value[progressIndex].value = progress
    })

    const fileData = {
      name: file.name,
      url: downloadURL,
      type: fileType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }

    uploadedFiles.value.push(fileData)
    emit('upload-complete', fileData)
  } catch (error) {
    console.error('File upload error:', error)
    progressItem.error = '업로드 실패'
    emit('upload-error', { file, error })

    // 에러 상태를 잠시 보여준 후 제거
    setTimeout(() => {
      const index = uploadProgress.value.indexOf(progressItem)
      if (index > -1) {
        uploadProgress.value.splice(index, 1)
      }
    }, 3000)
    return
  }

  // 성공적으로 업로드된 경우 진행률에서 제거
  uploadProgress.value.splice(progressIndex, 1)
}

function addFileToList(file) {
  const fileData = {
    name: file.name,
    url: URL.createObjectURL(file), // 임시 URL
    type: storageService.getFileType(file),
    size: file.size,
    file: file, // 원본 파일 객체 보관
    uploaded: false,
  }

  uploadedFiles.value.push(fileData)
}

function removeFile(index) {
  const file = uploadedFiles.value[index]

  // 임시 URL인 경우 해제
  if (file.url.startsWith('blob:')) {
    URL.revokeObjectURL(file.url)
  }

  uploadedFiles.value.splice(index, 1)
}

function formatFileSize(bytes) {
  return storageService.formatFileSize(bytes)
}

// 외부에서 호출할 수 있는 메서드들
defineExpose({
  uploadPendingFiles: async () => {
    const pendingFiles = uploadedFiles.value.filter((file) => !file.uploaded && file.file)
    for (const fileData of pendingFiles) {
      await uploadFile(fileData.file)
    }
  },
  clearFiles: () => {
    uploadedFiles.value.forEach((file) => {
      if (file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url)
      }
    })
    uploadedFiles.value = []
  },
})
</script>

<style scoped>
.media-uploader {
  width: 100%;
}

.upload-area {
  min-height: 120px;
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.upload-area:hover:not(.disabled),
.upload-area.drag-over {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.upload-area.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.progress-item {
  border-radius: 4px;
}

.uploaded-files {
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .upload-area {
    min-height: 100px;
    padding: 1rem;
  }
}
</style>
