<template>
  <div class="match-comment-system">
    <!-- 응원 통계 -->
    <v-card
      v-if="showCheeringStats"
      class="cheering-stats mb-4"
      variant="tonal"
    >
      <v-card-text class="pa-3">
        <div class="text-subtitle-2 mb-3 d-flex align-center">
          <v-icon icon="mdi-chart-bar" class="me-2" />
          응원 현황
        </div>

        <v-row>
          <v-col cols="6">
            <div class="stat-item text-center">
              <div
                class="stat-value text-h6 font-weight-bold"
                style="color: #dc143c"
              >
                {{ cheeringStats.roma }}
              </div>
              <div class="stat-label text-caption">로마 응원</div>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="stat-item text-center">
              <div
                class="stat-value text-h6 font-weight-bold"
                style="color: #ffd700"
              >
                {{ cheeringStats.general }}
              </div>
              <div class="stat-label text-caption">일반 응원</div>
            </div>
          </v-col>
        </v-row>

        <!-- 응원 진행률 -->
        <div class="cheering-progress mt-3">
          <v-progress-linear
            :model-value="cheeringPercentage"
            color="error"
            background-color="warning"
            height="8"
            rounded
          />
          <div class="text-center text-caption mt-1">
            총 {{ totalCheering }}명이 응원 중! 🔥
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 빠른 응원 버튼 -->
    <v-card class="quick-cheering mb-4" variant="outlined">
      <v-card-text class="pa-3">
        <div class="text-subtitle-2 mb-3">빠른 응원</div>

        <div class="cheering-buttons">
          <v-row dense>
            <v-col cols="6" sm="3" v-for="cheer in quickCheers" :key="cheer.id">
              <v-btn
                :color="cheer.color"
                variant="outlined"
                size="small"
                block
                @click="handleQuickCheer(cheer)"
              >
                {{ cheer.emoji }} {{ cheer.text }}
              </v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>

    <!-- 댓글 작성 폼 -->
    <v-card class="comment-form mb-4" variant="outlined">
      <v-card-text class="pa-3">
        <div class="d-flex align-start">
          <v-avatar size="24" class="me-3">
            <v-img
              v-if="userStore.user?.photoURL"
              :src="userStore.user.photoURL"
            />
            <v-icon v-else icon="mdi-account-circle" />
          </v-avatar>

          <div class="flex-grow-1">
            <v-textarea
              v-model="newComment"
              placeholder="응원 메시지를 남겨주세요! 💪"
              variant="outlined"
              rows="3"
              density="compact"
              :disabled="!userStore.isAuthenticated"
            />

            <!-- 응원 타입 선택 -->
            <div
              class="comment-options d-flex align-center justify-space-between mt-2"
            >
              <v-chip-group v-model="commentType" mandatory>
                <v-chip value="general" size="small" variant="outlined">
                  💛 일반 응원
                </v-chip>
                <v-chip
                  value="roma"
                  size="small"
                  variant="outlined"
                  color="error"
                >
                  ❤️ 로마 응원
                </v-chip>
                <v-chip
                  value="prediction"
                  size="small"
                  variant="outlined"
                  color="primary"
                >
                  🎯 경기 예측
                </v-chip>
              </v-chip-group>

              <v-btn
                color="primary"
                size="small"
                :disabled="!canSubmitComment"
                @click="handleSubmitComment"
              >
                응원하기
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 댓글 목록 -->
    <div class="comments-list">
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate size="24" />
        <p class="text-caption mt-2">댓글을 불러오는 중...</p>
      </div>

      <div
        v-else-if="groupedComments.length === 0"
        class="empty-comments text-center py-8"
      >
        <v-icon icon="mdi-comment-outline" size="48" color="grey-lighten-1" />
        <p class="text-body-2 text-grey mt-2">
          첫 번째 응원 메시지를 남겨보세요!
        </p>
      </div>

      <div v-else>
        <!-- 댓글 그룹별 표시 -->
        <div
          v-for="group in groupedComments"
          :key="group.type"
          class="comment-group mb-4"
        >
          <div class="group-header d-flex align-center mb-3">
            <v-icon :icon="getGroupIcon(group.type)" class="me-2" />
            <span class="text-subtitle-2 font-weight-bold">
              {{ getGroupTitle(group.type) }}
            </span>
            <v-chip size="x-small" variant="outlined" class="ml-2">
              {{ group.comments.length }}
            </v-chip>
          </div>

          <div class="group-comments">
            <MatchCommentItem
              v-for="comment in group.comments"
              :key="comment.id"
              :comment="comment"
              :is-match-comment="true"
              @like="handleCommentLike"
              @reply="handleCommentReply"
              @edit="handleCommentEdit"
              @delete="handleCommentDelete"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 더 보기 버튼 -->
    <div v-if="hasMoreComments" class="text-center mt-4">
      <v-btn
        variant="outlined"
        :loading="loadingMore"
        @click="loadMoreComments"
      >
        더 많은 응원 메시지 보기
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { commentService } from '@/services/database';
import MatchCommentItem from './MatchCommentItem.vue';

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
  matchData: {
    type: Object,
    default: () => ({}),
  },
  showCheeringStats: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  'comment-added',
  'comment-updated',
  'comment-deleted',
]);

// Stores
const userStore = useUserStore();

// State
const comments = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMoreComments = ref(false);
const newComment = ref('');
const commentType = ref('general');

// Quick cheering options
const quickCheers = ref([
  { id: 1, text: 'FORZA ROMA!', emoji: '🔥', color: 'error', type: 'roma' },
  { id: 2, text: 'DAJE ROMA!', emoji: '💪', color: 'error', type: 'roma' },
  { id: 3, text: '승리하자!', emoji: '🏆', color: 'warning', type: 'general' },
  { id: 4, text: '화이팅!', emoji: '⚡', color: 'primary', type: 'general' },
  { id: 5, text: '골 넣자!', emoji: '⚽', color: 'success', type: 'general' },
  { id: 6, text: '응원해요!', emoji: '📣', color: 'info', type: 'general' },
  { id: 7, text: '로마니스타!', emoji: '❤️', color: 'error', type: 'roma' },
  { id: 8, text: '최고야!', emoji: '👏', color: 'success', type: 'general' },
]);

// Computed
const canSubmitComment = computed(() => {
  return userStore.isAuthenticated && newComment.value.trim().length > 0;
});

const cheeringStats = computed(() => {
  const stats = { roma: 0, general: 0, prediction: 0 };

  comments.value.forEach((comment) => {
    if (comment.cheerType) {
      stats[comment.cheerType] = (stats[comment.cheerType] || 0) + 1;
    }
  });

  return stats;
});

const totalCheering = computed(() => {
  return Object.values(cheeringStats.value).reduce(
    (sum, count) => sum + count,
    0,
  );
});

const cheeringPercentage = computed(() => {
  if (totalCheering.value === 0) return 0;
  return (cheeringStats.value.roma / totalCheering.value) * 100;
});

const groupedComments = computed(() => {
  const groups = {
    roma: { type: 'roma', comments: [] },
    general: { type: 'general', comments: [] },
    prediction: { type: 'prediction', comments: [] },
  };

  comments.value.forEach((comment) => {
    const type = comment.cheerType || 'general';
    if (groups[type]) {
      groups[type].comments.push(comment);
    }
  });

  // Filter out empty groups and sort by comment count
  return Object.values(groups)
    .filter((group) => group.comments.length > 0)
    .sort((a, b) => b.comments.length - a.comments.length);
});

// Methods
async function fetchComments() {
  loading.value = true;
  try {
    const fetchedComments = await commentService.getComments(props.postId);
    comments.value = fetchedComments;
  } catch (error) {
    // Error fetching comments
  } finally {
    loading.value = false;
  }
}

async function handleQuickCheer(cheer) {
  if (!userStore.isAuthenticated) {
    // Show login prompt
    return;
  }

  const commentData = {
    postId: props.postId,
    content: cheer.text,
    authorId: userStore.user.uid,
    authorName: userStore.userDisplayName,
    authorIcon: userStore.user.selectedIconData?.url || null,
    cheerType: cheer.type,
    isQuickCheer: true,
  };

  try {
    const commentId = await commentService.createComment(commentData);
    const newCommentObj = {
      id: commentId,
      ...commentData,
      createdAt: new Date(),
      likeCount: 0,
    };

    comments.value.push(newCommentObj);
    emit('comment-added', newCommentObj);
  } catch (error) {
    // Error creating quick cheer
  }
}

async function handleSubmitComment() {
  if (!canSubmitComment.value) return;

  const commentData = {
    postId: props.postId,
    content: newComment.value.trim(),
    authorId: userStore.user.uid,
    authorName: userStore.userDisplayName,
    authorIcon: userStore.user.selectedIconData?.url || null,
    cheerType: commentType.value,
    isQuickCheer: false,
  };

  try {
    const commentId = await commentService.createComment(commentData);
    const newCommentObj = {
      id: commentId,
      ...commentData,
      createdAt: new Date(),
      likeCount: 0,
    };

    comments.value.push(newCommentObj);
    emit('comment-added', newCommentObj);

    // Reset form
    newComment.value = '';
    commentType.value = 'general';
  } catch (error) {
    // Error creating comment
  }
}

async function handleCommentLike(commentId) {
  if (!userStore.isAuthenticated) return;

  try {
    const isLiked = await commentService.toggleCommentLike(
      commentId,
      userStore.user.uid,
    );

    // Update local comment
    const comment = comments.value.find((c) => c.id === commentId);
    if (comment) {
      comment.likeCount += isLiked ? 1 : -1;
      comment.isLiked = isLiked;
    }
  } catch (error) {
    // Error toggling comment like
  }
}

function handleCommentReply(comment) {
  // Set reply context
  newComment.value = `@${comment.authorName} `;
  commentType.value = comment.cheerType || 'general';
}

function handleCommentEdit(comment) {
  // Handle comment editing
}

async function handleCommentDelete(commentId) {
  try {
    await commentService.deleteComment(commentId, props.postId);
    comments.value = comments.value.filter((c) => c.id !== commentId);
    emit('comment-deleted', commentId);
  } catch (error) {
    // Error deleting comment
  }
}

async function loadMoreComments() {
  loadingMore.value = true;
  try {
    // Implement pagination logic here
    // For now, just set hasMoreComments to false
    hasMoreComments.value = false;
  } catch (error) {
    // Error loading more comments
  } finally {
    loadingMore.value = false;
  }
}

function getGroupIcon(type) {
  switch (type) {
    case 'roma':
      return 'mdi-heart';
    case 'prediction':
      return 'mdi-target';
    default:
      return 'mdi-comment-text';
  }
}

function getGroupTitle(type) {
  switch (type) {
    case 'roma':
      return '로마 응원단';
    case 'prediction':
      return '경기 예측';
    default:
      return '일반 응원';
  }
}

// Lifecycle
onMounted(() => {
  fetchComments();
});

// Watch for post changes
watch(
  () => props.postId,
  () => {
    if (props.postId) {
      fetchComments();
    }
  },
);
</script>

<style scoped>
.match-comment-system {
  max-width: 100%;
}

.cheering-stats {
  background: linear-gradient(
    135deg,
    rgba(220, 20, 60, 0.1) 0%,
    rgba(255, 215, 0, 0.1) 100%
  );
}

.stat-item {
  padding: 0.5rem;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 0.5);
}

.cheering-progress {
  position: relative;
}

.quick-cheering {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
}

.cheering-buttons .v-btn {
  text-transform: none;
  font-size: 0.75rem;
}

.comment-form {
  background-color: rgba(var(--v-theme-surface), 0.8);
}

.comment-group {
  border-left: 3px solid rgba(var(--v-theme-primary), 0.3);
  padding-left: 1rem;
  margin-left: 0.5rem;
}

.group-header {
  position: sticky;
  top: 0;
  background-color: rgba(var(--v-theme-background), 0.9);
  backdrop-filter: blur(8px);
  padding: 0.5rem 0;
  z-index: 1;
}

.group-comments {
  margin-left: 1rem;
}

.empty-comments {
  background-color: rgba(var(--v-theme-surface), 0.3);
  border-radius: 12px;
  border: 2px dashed rgba(var(--v-theme-primary), 0.2);
}

@media (max-width: 768px) {
  .cheering-buttons .v-col {
    margin-bottom: 0.5rem;
  }

  .comment-options {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .comment-group {
    margin-left: 0;
    padding-left: 0.5rem;
  }

  .group-comments {
    margin-left: 0.5rem;
  }
}
</style>
