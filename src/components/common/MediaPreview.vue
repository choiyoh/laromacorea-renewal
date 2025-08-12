<template>
  <v-card class="media-preview" variant="outlined">
    <div class="media-container">
      <!-- 이미지 미리보기 -->
      <div v-if="file.type === 'image'" class="image-preview">
        <v-img :src="file.url" :alt="file.name" aspect-ratio="16/9" cover class="preview-image" />
      </div>

      <!-- 동영상 미리보기 -->
      <div v-else-if="file.type === 'video'" class="video-preview">
        <video :src="file.url" class="preview-video" controls preload="metadata" />
      </div>

      <!-- 기타 파일 -->
      <div v-else class="file-preview">
        <v-icon icon="mdi-file" size="48" color="grey-lighten-1" />
        <p class="text-caption mt-2">{{ file.name }}</p>
      </div>

      <!-- 삭제 버튼 -->
      <v-btn
        v-if="showRemove"
        icon="mdi-close"
        size="small"
        color="error"
        variant="elevated"
        class="remove-btn"
        @click="$emit('remove')"
      />

      <!-- 업로드 상태 표시 -->
      <v-chip
        v-if="file.uploaded === false"
        size="small"
        color="warning"
        variant="elevated"
        class="status-chip"
      >
        대기중
      </v-chip>
    </div>

    <!-- 파일 정보 -->
    <v-card-text class="pa-2">
      <div class="file-info">
        <p class="text-caption text-truncate mb-1" :title="file.name">
          {{ file.name }}
        </p>
        <div class="d-flex align-center justify-space-between">
          <v-chip :color="getTypeColor(file.type)" size="x-small" variant="tonal">
            {{ getTypeLabel(file.type) }}
          </v-chip>
          <span class="text-caption text-grey">
            {{ formatFileSize(file.size) }}
          </span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { storageService } from '@/services/storage'

defineProps({
  file: {
    type: Object,
    required: true,
  },
  showRemove: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['remove'])

// Methods
function getTypeColor(type) {
  switch (type) {
    case 'image':
      return 'success'
    case 'video':
      return 'info'
    default:
      return 'grey'
  }
}

function getTypeLabel(type) {
  switch (type) {
    case 'image':
      return '이미지'
    case 'video':
      return '동영상'
    default:
      return '파일'
  }
}

function formatFileSize(bytes) {
  return storageService.formatFileSize(bytes)
}
</script>

<style scoped>
.media-preview {
  position: relative;
  height: 100%;
}

.media-container {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.image-preview,
.video-preview,
.file-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-preview {
  background-color: rgba(var(--v-theme-surface), 0.5);
  flex-direction: column;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

.status-chip {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.file-info {
  min-height: 40px;
}

@media (max-width: 768px) {
  .media-container {
    height: 120px;
  }
}
</style>
