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
          <div class="d-flex align-center me-4" style="width: 140px">
            <v-avatar size="24" class="me-2">
              <v-img
                v-if="post.authorPhotoURL || post.authorIcon"
                :src="post.authorPhotoURL || post.authorIcon"
                :alt="post.authorName || '익명'"
              />
              <v-icon v-else icon="mdi-account" size="16" />
            </v-avatar>
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
          <div class="d-flex align-center">
            <v-avatar size="16" class="me-1">
              <v-img
                v-if="post.authorPhotoURL || post.authorIcon"
                :src="post.authorPhotoURL || post.authorIcon"
                :alt="post.authorName || '익명'"
              />
              <v-icon v-else icon="mdi-account" size="12" />
            </v-avatar>
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
.post-list-item {
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.post-list-item:hover .post-title,
.post-list-item:hover .post-title-mobile {
  color: rgba(var(--v-theme-primary), 1);
  text-decoration: underline;
}

.pinned-post {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.post-title {
  line-height: 1.4;
  transition: color 0.2s ease;
}

.post-title-mobile {
  line-height: 1.4;
  transition: color 0.2s ease;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.post-meta {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.post-meta-mobile {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.75rem;
}

.post-meta-mobile .v-avatar {
  opacity: 0.8;
}

.post-meta-mobile .v-icon {
  opacity: 0.7;
}
</style>
