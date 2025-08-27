<template>
  <div class="comment-system">
    <!-- 댓글 헤더 -->
    <div class="comments-header mb-4">
      <div class="text-body-1 font-weight-medium mb-3">
        댓글 <span class="text-grey-darken-1">{{ comments.length }}</span>
      </div>
      <div class="custom-divider"></div>
    </div>

    <!-- 댓글 작성 폼 -->
    <div
      v-if="userStore.isAuthenticated && canWriteComment"
      class="comment-form mb-6"
    >
      <!-- Desktop Layout -->
      <div class="d-none d-md-flex align-start">
        <v-avatar size="32" class="me-3">
          <v-img
            v-if="userStore.userIcon?.url"
            :src="userStore.userIcon.url"
            :alt="userStore.userIcon.name"
          />
          <v-img
            v-else-if="userStore.user?.photoURL"
            :src="userStore.user.photoURL"
          />
          <v-icon v-else icon="mdi-account-circle" />
        </v-avatar>
        <div class="flex-grow-1">
          <v-textarea
            v-model="newCommentContent"
            placeholder="댓글을 작성해주세요..."
            variant="outlined"
            rows="3"
            auto-grow
            hide-details
            :disabled="submittingComment"
          />
          <div class="d-flex justify-end mt-3">
            <v-btn
              color="primary"
              :loading="submittingComment"
              :disabled="!newCommentContent.trim()"
              @click="handleSubmitComment"
            >
              댓글 작성
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Mobile Layout -->
      <div class="d-md-none">
        <div class="d-flex align-center mb-3">
          <v-avatar size="24" class="me-2">
            <v-img
              v-if="userStore.userIcon?.url"
              :src="userStore.userIcon.url"
              :alt="userStore.userIcon.name"
            />
            <v-img
              v-else-if="userStore.user?.photoURL"
              :src="userStore.user.photoURL"
            />
            <v-icon v-else icon="mdi-account-circle" />
          </v-avatar>
          <span class="text-body-2 font-weight-medium">댓글 작성</span>
        </div>
        <v-textarea
          v-model="newCommentContent"
          placeholder="댓글을 작성해주세요..."
          variant="outlined"
          rows="4"
          auto-grow
          hide-details
          :disabled="submittingComment"
        />
        <div class="d-flex justify-end mt-3">
          <v-btn
            color="primary"
            :loading="submittingComment"
            :disabled="!newCommentContent.trim()"
            @click="handleSubmitComment"
          >
            댓글 작성
          </v-btn>
        </div>
      </div>
      <div class="custom-divider mt-6"></div>
    </div>

    <!-- 비인증 회원 안내 -->
    <div
      v-else-if="userStore.isAuthenticated && !canWriteComment"
      class="verification-prompt mb-6 text-center py-6"
    >
      <v-alert type="info" variant="tonal" class="mb-4">
        <v-icon icon="mdi-shield-check" class="me-2" />
        인증회원만 댓글 작성이 가능합니다
      </v-alert>
      <p class="text-body-2 text-grey-darken-1">
        관리자 승인을 통해 인증회원으로 등급을 변경할 수 있습니다.
      </p>
      <div class="custom-divider mt-6"></div>
    </div>

    <!-- 로그인 안내 -->
    <div v-else class="login-prompt mb-6 text-center py-6">
      <p class="text-body-1 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
      <v-btn color="primary" @click="$emit('login-required')">로그인</v-btn>
      <div class="custom-divider mt-6"></div>
    </div>

    <!-- 댓글 목록 -->
    <div class="comments-list">
      <!-- 로딩 상태 -->
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">댓글을 불러오는 중...</p>
      </div>

      <!-- 댓글이 없는 경우 -->
      <div
        v-else-if="sortedComments.length === 0"
        class="empty-comments text-center py-8"
      >
        <v-icon icon="mdi-comment-outline" size="48" color="grey-lighten-1" />
        <p class="text-body-1 mt-2">첫 번째 댓글을 작성해보세요!</p>
      </div>

      <!-- 댓글 목록 -->
      <div v-else>
        <CommentItem
          v-for="comment in sortedComments"
          :key="comment.id"
          :comment="comment"
          :post-id="postId"
          :replies="getReplies(comment.id)"
          @reply="handleReply"
          @edit="handleEditComment"
          @delete="handleDeleteComment"
          @like="handleLikeComment"
        />
      </div>
    </div>

    <!-- 답글 작성 다이얼로그 -->
    <v-dialog v-model="replyDialog" max-width="600">
      <v-card>
        <v-card-title>답글 작성</v-card-title>
        <v-card-text>
          <!-- 원본 댓글 -->
          <div class="original-comment mb-4 pa-3 bg-grey-lighten-4 rounded">
            <div class="d-flex align-center mb-2">
              <UserAvatar
                :user-id="replyTarget?.authorId"
                :display-name="replyTarget?.authorName"
                :static-icon-url="replyTarget?.authorIcon"
                size="20"
                default-icon="mdi-account-circle"
                avatar-class="me-2"
              />
              <span class="font-weight-medium">{{
                replyTarget?.authorName
              }}</span>
            </div>
            <p class="text-body-2">{{ replyTarget?.content }}</p>
          </div>

          <!-- 답글 입력 -->
          <div class="d-flex align-start">
            <v-avatar size="24" class="me-3 mt-1">
              <v-img
                v-if="userStore.userIcon?.url"
                :src="userStore.userIcon.url"
                :alt="userStore.userIcon.name"
              />
              <v-img
                v-else-if="userStore.user?.photoURL"
                :src="userStore.user.photoURL"
              />
              <v-icon v-else icon="mdi-account-circle" />
            </v-avatar>
            <v-textarea
              v-model="replyContent"
              placeholder="답글을 작성해주세요..."
              variant="outlined"
              rows="3"
              auto-grow
              class="flex-grow-1"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="replyDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            :loading="submittingReply"
            :disabled="!replyContent.trim()"
            @click="handleSubmitReply"
          >
            답글 작성
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 댓글 수정 다이얼로그 -->
    <v-dialog v-model="editDialog" max-width="600">
      <v-card>
        <v-card-title>댓글 수정</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="editContent"
            variant="outlined"
            rows="3"
            auto-grow
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog = false">취소</v-btn>
          <v-btn
            color="primary"
            :loading="updatingComment"
            :disabled="!editContent.trim()"
            @click="handleUpdateComment"
          >
            수정
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 댓글 삭제 확인 다이얼로그 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>댓글 삭제</v-card-title>
        <v-card-text>
          정말로 이 댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">취소</v-btn>
          <v-btn
            color="error"
            :loading="deletingComment"
            @click="handleConfirmDelete"
          >
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { commentService } from '@/services/database';
import CommentItem from './CommentItem.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
  comments: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  boardType: {
    type: String,
    default: '',
  },
});

const emit = defineEmits([
  'comment-added',
  'comment-updated',
  'comment-deleted',
  'login-required',
  'refresh-comments',
]);

// Stores
const userStore = useUserStore();

// State
const newCommentContent = ref('');
const submittingComment = ref(false);
const replyDialog = ref(false);
const replyTarget = ref(null);
const replyContent = ref('');
const submittingReply = ref(false);
const editDialog = ref(false);
const editTarget = ref(null);
const editContent = ref('');
const updatingComment = ref(false);
const deleteDialog = ref(false);
const deleteTarget = ref(null);
const deletingComment = ref(false);

// 댓글 작성 권한 체크
const canWriteComment = computed(() => {
  if (!userStore.isAuthenticated) return false;
  if (userStore.isVerified) return true; // 관리자도 isVerified에 포함됨
  // 비인증 회원은 공지사항에만 댓글 작성 가능
  if (props.boardType === 'notice') return true;
  return false;
});

// Computed
const sortedComments = computed(() => {
  const topLevelComments = props.comments.filter(
    (comment) => !comment.parentId,
  );

  // 기본적으로 오래된 순으로 정렬
  return topLevelComments.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
});

// Methods
function getReplies(commentId) {
  return props.comments
    .filter((comment) => comment.parentId === commentId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

async function handleSubmitComment() {
  if (!newCommentContent.value.trim()) return;

  submittingComment.value = true;
  try {
    const commentData = {
      postId: props.postId,
      content: newCommentContent.value.trim(),
      authorId: userStore.user.uid,
      authorName: userStore.user.displayName || userStore.user.email,
      authorIcon: userStore.user.selectedIconData?.url || null,
    };

    const commentId = await commentService.createComment(commentData);

    // 댓글 작성 후 댓글 목록을 다시 로드하여 동기화
    newCommentContent.value = '';

    // 댓글 목록 새로고침 요청
    emit('refresh-comments');

    // 댓글 추가 이벤트 발생
    emit('comment-added', commentId);
  } catch (err) {
    // Show error message
  } finally {
    submittingComment.value = false;
  }
}

function handleReply(comment) {
  replyTarget.value = comment;
  replyContent.value = '';
  replyDialog.value = true;
}

async function handleSubmitReply() {
  if (!replyContent.value.trim() || !replyTarget.value) return;

  submittingReply.value = true;
  try {
    const replyData = {
      postId: props.postId,
      parentId: replyTarget.value.id,
      content: replyContent.value.trim(),
      authorId: userStore.user.uid,
      authorName: userStore.user.displayName || userStore.user.email,
      authorIcon: userStore.user.selectedIconData?.url || null,
    };

    const replyId = await commentService.createComment(replyData);

    replyDialog.value = false;
    replyTarget.value = null;
    replyContent.value = '';

    // 댓글 목록 새로고침 요청
    emit('refresh-comments');
  } catch (err) {
    // Show error message
  } finally {
    submittingReply.value = false;
  }
}

function handleEditComment(comment) {
  editTarget.value = comment;
  editContent.value = comment.content;
  editDialog.value = true;
}

async function handleUpdateComment() {
  if (!editContent.value.trim() || !editTarget.value) return;

  updatingComment.value = true;
  try {
    await commentService.updateComment(
      editTarget.value.id,
      editContent.value.trim(),
    );

    // Update the comment in the UI
    const updatedComment = {
      ...editTarget.value,
      content: editContent.value.trim(),
      updatedAt: new Date(),
    };

    emit('comment-updated', updatedComment);
    editDialog.value = false;
    editTarget.value = null;
    editContent.value = '';
  } catch (err) {
    // Show error message
  } finally {
    updatingComment.value = false;
  }
}

function handleDeleteComment(comment) {
  deleteTarget.value = comment;
  deleteDialog.value = true;
}

async function handleConfirmDelete() {
  if (!deleteTarget.value) return;

  deletingComment.value = true;
  try {
    await commentService.deleteComment(deleteTarget.value.id, props.postId);
    emit('comment-deleted', deleteTarget.value.id);
    deleteDialog.value = false;
    deleteTarget.value = null;
  } catch (err) {
    // Show error message
  } finally {
    deletingComment.value = false;
  }
}

async function handleLikeComment(comment) {
  if (!userStore.isAuthenticated) {
    emit('login-required');
    return;
  }

  try {
    const newLikeStatus = await commentService.toggleCommentLike(
      comment.id,
      userStore.user.uid,
    );

    // Update the comment in the local state
    const updatedComment = {
      ...comment,
      likeCount: newLikeStatus
        ? (comment.likeCount || 0) + 1
        : Math.max((comment.likeCount || 0) - 1, 0),
    };

    emit('comment-updated', updatedComment);
  } catch (err) {
    // Show error message
  }
}
</script>

<style scoped>
.comment-system {
  max-width: 100%;
}

.custom-divider {
  height: 2px;
  background-image: url('/images/s_top_bg.gif');
  background-repeat: repeat-x;
  background-position: center;
  width: 100%;
}

.comment-form .v-textarea {
  background-color: rgb(var(--v-theme-surface));
}

.empty-comments {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.original-comment {
  border-left: 3px solid rgb(var(--v-theme-primary));
}

@media (max-width: 768px) {
  .comments-header {
    padding: 0 8px;
  }

  .comment-form {
    padding: 0 8px;
  }
}
</style>
