<template>
  <div class="comment-item" :class="{ 'reply-comment': comment.level > 0 }">
    <v-card variant="outlined" class="mb-3">
      <v-card-text class="pa-3">
        <div class="d-flex align-start">
          <!-- 작성자 아바타 -->
          <v-avatar :size="comment.level > 0 ? 32 : 40" class="me-3">
            <v-img v-if="comment.authorIcon" :src="comment.authorIcon" />
            <v-icon v-else icon="mdi-account-circle" />
          </v-avatar>

          <div class="flex-grow-1">
            <!-- 댓글 헤더 -->
            <div class="comment-header d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center">
                <span class="font-weight-medium me-2">{{ comment.authorName }}</span>
                <span class="text-caption text-grey">{{ formatDate(comment.createdAt) }}</span>
                <v-chip
                  v-if="comment.updatedAt && comment.updatedAt !== comment.createdAt"
                  size="x-small"
                  variant="outlined"
                  class="ms-2"
                >
                  수정됨
                </v-chip>
              </div>

              <!-- 댓글 액션 메뉴 -->
              <v-menu v-if="canEdit || canDelete">
                <template #activator="{ props: menuProps }">
                  <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="menuProps" />
                </template>
                <v-list density="compact">
                  <v-list-item v-if="canEdit" @click="$emit('edit', comment)">
                    <template #prepend>
                      <v-icon icon="mdi-pencil" />
                    </template>
                    <v-list-item-title>수정</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="canDelete" @click="$emit('delete', comment)">
                    <template #prepend>
                      <v-icon icon="mdi-delete" color="error" />
                    </template>
                    <v-list-item-title class="text-error">삭제</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>

            <!-- 댓글 내용 -->
            <div class="comment-content mb-2">
              <p class="text-body-2" style="white-space: pre-wrap">{{ comment.content }}</p>
            </div>

            <!-- 댓글 액션 -->
            <div class="comment-actions d-flex align-center">
              <v-btn
                size="small"
                variant="text"
                :color="isLiked ? 'primary' : 'default'"
                prepend-icon="mdi-thumb-up"
                @click="handleLike"
              >
                {{ comment.likeCount || 0 }}
              </v-btn>

              <v-btn
                v-if="comment.level === 0 && userStore.isAuthenticated"
                size="small"
                variant="text"
                prepend-icon="mdi-reply"
                @click="$emit('reply', comment)"
              >
                답글
              </v-btn>

              <v-btn
                v-if="comment.level === 0"
                size="small"
                variant="text"
                prepend-icon="mdi-share"
                @click="handleShare"
              >
                공유
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 답글 목록 -->
    <div v-if="replies.length > 0" class="replies ms-6">
      <CommentItem
        v-for="reply in replies"
        :key="reply.id"
        :comment="reply"
        :post-id="postId"
        :replies="[]"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @like="$emit('like', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  postId: {
    type: String,
    required: true,
  },
  replies: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['reply', 'edit', 'delete', 'like'])

// Stores
const userStore = useUserStore()

// State
const isLiked = ref(false) // TODO: Get actual like status from database

// Computed
const canEdit = computed(() => {
  if (!userStore.isAuthenticated) return false
  return props.comment.authorId === userStore.user.uid || userStore.user.role === 'admin'
})

const canDelete = computed(() => {
  if (!userStore.isAuthenticated) return false
  return props.comment.authorId === userStore.user.uid || userStore.user.role === 'admin'
})

// Methods
function formatDate(timestamp) {
  if (!timestamp) return ''

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    return `${diffInMinutes}분 전`
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}시간 전`
  } else if (diffInHours < 24 * 7) {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
}

async function handleLike() {
  if (!userStore.isAuthenticated) {
    // Show login prompt
    return
  }

  // Toggle like status optimistically
  isLiked.value = !isLiked.value
  emit('like', props.comment)
}

function handleShare() {
  const commentUrl = `${window.location.href}#comment-${props.comment.id}`

  if (navigator.share) {
    navigator.share({
      title: `${props.comment.authorName}님의 댓글`,
      url: commentUrl,
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(commentUrl)
    // TODO: Show success message
  }
}
</script>

<style scoped>
.comment-item {
  position: relative;
}

.reply-comment {
  margin-left: 2rem;
  position: relative;
}

.reply-comment::before {
  content: '';
  position: absolute;
  left: -1rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: rgba(var(--v-theme-primary), 0.3);
}

.comment-content {
  line-height: 1.5;
  word-break: break-word;
}

.comment-actions .v-btn {
  min-width: auto;
  padding: 0 8px;
}

.replies {
  position: relative;
}

.replies::before {
  content: '';
  position: absolute;
  left: -1.5rem;
  top: -1rem;
  bottom: 1rem;
  width: 2px;
  background-color: rgba(var(--v-theme-primary), 0.2);
}

@media (max-width: 768px) {
  .reply-comment {
    margin-left: 1rem;
  }

  .replies {
    margin-left: 0;
  }

  .replies::before {
    left: -0.5rem;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .comment-actions {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
}
</style>
