<template>
  <v-card
    class="post-list-item"
    :class="{ 'pinned-post': isPinned }"
    variant="text"
    @click="$emit('click')"
  >
    <v-card-text class="py-2 px-3">
      <!-- Desktop Layout -->
      <div class="d-none d-md-flex align-center">
        <!-- Title and Badges -->
        <div class="flex-grow-1 d-flex align-center me-4" style="min-width: 0">
          <v-chip
            v-if="isPinned"
            size="small"
            color="primary"
            variant="flat"
            class="me-2 flex-shrink-0"
          >
            공지
          </v-chip>
          <h3
            class="post-title text-subtitle-1 font-weight-regular text-truncate"
          >
            {{ post.title }}
          </h3>
          <v-chip
            v-if="(post.commentCount || 0) > 0"
            size="small"
            color="primary"
            variant="tonal"
            class="ms-2 flex-shrink-0"
          >
            {{ post.commentCount || 0 }}
          </v-chip>
        </div>

        <!-- Meta Info -->
        <div class="post-meta d-flex align-center flex-shrink-0">
          <!-- Author -->
          <div class="d-flex align-start me-4" style="width: 140px">
            <UserAvatar
              :user-id="post.authorId"
              :display-name="post.authorName"
              :photo-u-r-l="post.authorPhotoURL"
              :static-icon-url="post.authorIcon"
              size="20"
              avatar-class="me-2 avatar-aligned"
            />
            <span class="text-truncate">{{ post.authorName || '익명' }}</span>
          </div>

          <!-- Date -->
          <div class="me-4 text-no-wrap" style="width: 100px">
            {{ formatDate(post.createdAt) }}
          </div>

          <!-- Views -->
          <div class="text-no-wrap" style="width: 80px">
            <v-icon icon="mdi-eye-outline" size="16" class="me-1" />
            {{ (post.viewCount || 0).toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- Mobile Layout -->
      <div class="d-md-none">
        <!-- Title Row -->
        <div class="d-flex align-start mb-2">
          <v-chip
            v-if="isPinned"
            size="small"
            color="primary"
            variant="flat"
            class="me-2 flex-shrink-0 mt-1"
          >
            공지
          </v-chip>
          <div class="flex-grow-1" style="min-width: 0">
            <h3 class="post-title-mobile text-subtitle-1 font-weight-regular">
              {{ post.title }}
            </h3>
          </div>
          <v-chip
            v-if="(post.commentCount || 0) > 0"
            size="small"
            color="primary"
            variant="tonal"
            class="ms-2 flex-shrink-0 mt-1"
          >
            {{ post.commentCount || 0 }}
          </v-chip>
        </div>

        <!-- Meta Row -->
        <div
          class="post-meta-mobile d-flex align-center justify-space-between text-caption"
        >
          <!-- Author (Left) -->
          <div class="d-flex align-start">
            <UserAvatar
              :user-id="post.authorId"
              :display-name="post.authorName"
              :photo-u-r-l="post.authorPhotoURL"
              :static-icon-url="post.authorIcon"
              size="16"
              avatar-class="me-1 avatar-aligned"
            />
            <span>{{ post.authorName || '익명' }}</span>
          </div>

          <!-- Date & Views (Right) -->
          <div class="d-flex align-center">
            <span class="me-2">{{ formatDate(post.createdAt) }}</span>
            <v-icon icon="mdi-eye-outline" size="12" class="me-1" />
            <span>{{ (post.viewCount || 0).toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import UserAvatar from '@/components/common/UserAvatar.vue';

defineProps({
  post: {
    type: Object,
    required: true,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  showMatchInfo: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['click']);

function formatDate(timestamp) {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 7) {
    return date
      .toLocaleDateString('ko-KR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\. /g, '.')
      .slice(0, -1);
  }
  if (diffDays >= 1) {
    return `${diffDays}일 전`;
  }
  if (diffHours >= 1) {
    return `${diffHours}시간 전`;
  }
  if (diffMinutes >= 1) {
    return `${diffMinutes}분 전`;
  }
  return '방금 전';
}
</script>

<style scoped>
/* AI가 수정/작성한 코드 - 2026-05-27 */
.avatar-aligned {
  margin-top: 2px; /* 텍스트 첫 번째 줄과 맞추기 위한 미세 조정 */
}

.post-list-item {
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.06);
  transition: background-color 0.2s ease, border-left-color 0.2s ease;
  background: transparent !important;
  color: rgb(var(--v-theme-on-surface));
}

.post-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.03) !important;
}

.post-list-item:hover .post-title,
.post-list-item:hover .post-title-mobile {
  color: rgb(var(--v-theme-primary)) !important;
}

.pinned-post {
  background-color: rgba(153, 10, 44, 0.04) !important;
  border-left: 3px solid #990a2c !important;
  
  .v-theme--dark & {
    background-color: rgba(255, 61, 96, 0.04) !important;
    border-left: 3px solid #ff3d60 !important;
  }
}

.post-title {
  font-size: 1rem !important;
  line-height: 1.4;
  font-weight: 500 !important;
  transition: color 0.2s ease;
}

.post-title-mobile {
  font-size: 0.95rem !important;
  line-height: 1.4;
  font-weight: 500 !important;
  transition: color 0.2s ease;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.post-meta {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.post-meta-mobile {
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 0.75rem;
}

.post-meta-mobile .v-avatar {
  opacity: 0.9;
}

.post-meta-mobile .v-icon {
  opacity: 0.7;
}
</style>
