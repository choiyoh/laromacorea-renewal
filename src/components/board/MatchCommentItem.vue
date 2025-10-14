<template>
  <v-card
    class="match-comment-item mb-3"
    :class="{
      'roma-comment': comment.cheerType === 'roma',
      'prediction-comment': comment.cheerType === 'prediction',
    }"
    variant="outlined"
  >
    <v-card-text class="pa-3">
      <div class="d-flex align-start">
        <!-- 사용자 아바타 -->
        <div class="comment-avatar me-3">
          <UserAvatar
            :user-id="comment.authorId"
            :display-name="currentAuthorName"
            :static-icon-url="comment.authorIcon"
            size="24"
            default-icon="mdi-account-circle"
            avatar-class="avatar-aligned"
          />

          <!-- 응원 타입 배지 -->
          <v-chip
            v-if="comment.cheerType"
            :color="getCheerTypeColor(comment.cheerType)"
            size="x-small"
            variant="flat"
            class="cheer-badge"
          >
            {{ getCheerTypeEmoji(comment.cheerType) }}
          </v-chip>
        </div>

        <!-- 댓글 내용 -->
        <div class="comment-content flex-grow-1">
          <!-- 작성자 정보 -->
          <div
            class="comment-header d-flex align-center justify-space-between mb-2"
          >
            <div class="d-flex align-center">
              <span class="font-weight-medium text-body-2">{{
                currentAuthorName
              }}</span>

              <!-- 빠른 응원 표시 -->
              <v-chip
                v-if="comment.isQuickCheer"
                size="x-small"
                variant="outlined"
                color="primary"
                class="ml-2"
              >
                빠른응원
              </v-chip>

              <!-- 시간 -->
              <span class="text-caption text-grey ml-2">
                {{ formatCommentTime(comment.createdAt) }}
              </span>
            </div>

            <!-- 액션 메뉴 -->
            <v-menu v-if="canEditOrDelete">
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  size="x-small"
                  variant="text"
                  v-bind="props"
                />
              </template>
              <v-list density="compact">
                <v-list-item v-if="canEdit" @click="$emit('edit', comment)">
                  <template #prepend>
                    <v-icon icon="mdi-pencil" size="16" />
                  </template>
                  <v-list-item-title>수정</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="canDelete" @click="handleDelete">
                  <template #prepend>
                    <v-icon icon="mdi-delete" size="16" />
                  </template>
                  <v-list-item-title>삭제</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>

          <!-- 댓글 텍스트 -->
          <div class="comment-text mb-2">
            <p
              class="text-body-2 mb-0"
              v-html="formatCommentContent(comment.content)"
            ></p>
          </div>

          <!-- 댓글 액션 -->
          <div class="comment-actions d-flex align-center">
            <v-btn
              :color="comment.isLiked ? 'error' : 'default'"
              :variant="comment.isLiked ? 'flat' : 'text'"
              size="small"
              density="compact"
              @click="$emit('like', comment.id)"
            >
              <v-icon
                :icon="comment.isLiked ? 'mdi-heart' : 'mdi-heart-outline'"
                size="16"
                class="me-1"
              />
              {{ comment.likeCount || 0 }}
            </v-btn>

            <v-btn
              variant="text"
              size="small"
              density="compact"
              class="ml-2"
              @click="$emit('reply', comment)"
            >
              <v-icon icon="mdi-reply" size="16" class="me-1" />
              답글
            </v-btn>

            <!-- 응원 강도 표시 (로마 응원 댓글용) -->
            <div
              v-if="comment.cheerType === 'roma'"
              class="cheer-intensity ml-auto"
            >
              <div class="d-flex align-center">
                <v-icon
                  v-for="n in getCheerIntensity(comment.content)"
                  :key="n"
                  icon="mdi-fire"
                  size="12"
                  color="error"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>

    <!-- 답글 목록 (향후 구현) -->
    <div
      v-if="comment.replies && comment.replies.length > 0"
      class="replies-section"
    >
      <v-divider />
      <div class="pa-2 pl-6">
        <!-- 답글 구현 예정 -->
      </div>
    </div>
  </v-card>

  <!-- 삭제 확인 다이얼로그 -->
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title>댓글 삭제</v-card-title>
      <v-card-text> 정말로 이 응원 메시지를 삭제하시겠습니까? </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="deleteDialog = false">취소</v-btn>
        <v-btn color="error" @click="confirmDelete">삭제</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useUserInfo } from '@/composables/useUserInfo';
import UserAvatar from '@/components/common/UserAvatar.vue';

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  isMatchComment: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['like', 'reply', 'edit', 'delete']);

// Stores & Composables
const userStore = useUserStore();
const { getUserDisplayName } = useUserInfo();

// State
const currentAuthorName = ref(props.comment.authorName || '익명');
const deleteDialog = ref(false);

// Computed
const canEdit = computed(() => {
  return (
    userStore.isAuthenticated && userStore.user?.uid === props.comment.authorId
  );
});

const canDelete = computed(() => {
  return (
    userStore.isAuthenticated &&
    (userStore.user?.uid === props.comment.authorId ||
      userStore.user?.role === 'admin')
  );
});

const canEditOrDelete = computed(() => {
  return canEdit.value || canDelete.value;
});

// Methods
function getCheerTypeColor(type) {
  switch (type) {
    case 'roma':
      return 'error';
    case 'prediction':
      return 'primary';
    default:
      return 'warning';
  }
}

function getCheerTypeEmoji(type) {
  switch (type) {
    case 'roma':
      return '❤️';
    case 'prediction':
      return '🎯';
    default:
      return '💛';
  }
}

function formatCommentTime(timestamp) {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) {
    return '방금 전';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}시간 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

function formatCommentContent(content) {
  if (!content) return '';

  // Convert line breaks to <br>
  let formatted = content.replace(/\n/g, '<br>');

  // Highlight mentions
  formatted = formatted.replace(/@(\w+)/g, '<span class="mention">@$1</span>');

  // Add emphasis to Roma-related keywords
  const romaKeywords = ['로마', 'ROMA', 'FORZA', 'DAJE', '로마니스타'];
  romaKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formatted = formatted.replace(
      regex,
      `<strong class="roma-keyword">${keyword}</strong>`,
    );
  });

  return formatted;
}

function getCheerIntensity(content) {
  if (!content) return 0;

  // Calculate cheer intensity based on content
  let intensity = 0;

  // Check for exclamation marks
  const exclamations = (content.match(/!/g) || []).length;
  intensity += Math.min(exclamations, 3);

  // Check for Roma keywords
  const romaKeywords = ['FORZA', 'DAJE', '로마니스타', '승리'];
  romaKeywords.forEach((keyword) => {
    if (content.toUpperCase().includes(keyword)) {
      intensity += 1;
    }
  });

  // Check for emojis
  const emojiCount = (
    content.match(
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
    ) || []
  ).length;
  intensity += Math.min(Math.floor(emojiCount / 2), 2);

  return Math.min(Math.max(intensity, 1), 5); // Min 1, Max 5
}

function handleDelete() {
  deleteDialog.value = true;
}

function confirmDelete() {
  emit('delete', props.comment.id);
  deleteDialog.value = false;
}

// 최신 작성자 정보 로드
const loadAuthorInfo = async () => {
  if (!props.comment.authorId) return;

  try {
    const displayName = await getUserDisplayName(
      props.comment.authorId,
      props.comment.authorName || '익명'
    );
    currentAuthorName.value = displayName;
  } catch (error) {
    console.warn('Failed to load author info:', error);
  }
};

onMounted(() => {
  loadAuthorInfo();
});
</script>

<style scoped>
.avatar-aligned {
  margin-top: 2px; /* 텍스트 첫 번째 줄과 맞추기 위한 미세 조정 */
}

.match-comment-item {
  transition: all 0.2s ease;
  position: relative;
}

.match-comment-item:hover {
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
}

.roma-comment {
  border-left: 3px solid #dc143c;
  background: linear-gradient(
    90deg,
    rgba(220, 20, 60, 0.05) 0%,
    transparent 100%
  );
}

.prediction-comment {
  border-left: 3px solid rgb(var(--v-theme-primary));
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    transparent 100%
  );
}

.comment-avatar {
  position: relative;
}

.cheer-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  min-width: 20px !important;
  height: 20px !important;
}

.comment-content {
  min-width: 0; /* Prevent flex item from overflowing */
}

.comment-text {
  word-break: break-word;
  line-height: 1.5;
}

.comment-text :deep(.mention) {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.comment-text :deep(.roma-keyword) {
  color: #dc143c;
  font-weight: 600;
}

.comment-actions {
  margin-top: 0.5rem;
}

.cheer-intensity {
  display: flex;
  align-items: center;
  gap: 1px;
}

.replies-section {
  background-color: rgba(var(--v-theme-surface), 0.3);
}

@media (max-width: 768px) {
  .comment-header {
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .comment-header > .d-flex {
    flex-wrap: wrap;
    gap: 0.5rem;
    min-width: 0; /* Prevent overflow */
  }

  .comment-header .font-weight-medium {
    word-break: break-word;
  }

  .comment-actions {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .cheer-intensity {
    margin-top: 0.5rem;
    margin-left: 0 !important;
  }
}
</style>
