<template>
  <div class="comment-system">
    <!-- 댓글 헤더 -->
    <v-card class="comments-header mb-4" variant="outlined">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between">
          <h3 class="text-h6">
            댓글 <span class="text-primary">{{ comments.length }}</span>
          </h3>
          <v-select
            v-model="sortBy"
            :items="sortOptions"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 150px"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- 댓글 작성 폼 -->
    <v-card v-if="userStore.isAuthenticated" class="comment-form mb-4" variant="outlined">
      <v-card-text class="pa-4">
        <div class="d-flex align-start">
          <v-avatar size="40" class="me-3">
            <v-img v-if="userStore.user?.photoURL" :src="userStore.user.photoURL" />
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
            <div class="d-flex justify-end mt-2">
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
      </v-card-text>
    </v-card>

    <!-- 로그인 안내 -->
    <v-card v-else class="login-prompt mb-4" variant="outlined">
      <v-card-text class="pa-4 text-center">
        <p class="text-body-1 mb-3">댓글을 작성하려면 로그인이 필요합니다.</p>
        <v-btn color="primary" @click="$emit('login-required')">로그인</v-btn>
      </v-card-text>
    </v-card>

    <!-- 댓글 목록 -->
    <div class="comments-list">
      <!-- 로딩 상태 -->
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">댓글을 불러오는 중...</p>
      </div>

      <!-- 댓글이 없는 경우 -->
      <div v-else-if="sortedComments.length === 0" class="empty-comments text-center py-8">
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
              <v-avatar size="24" class="me-2">
                <v-img v-if="replyTarget?.authorIcon" :src="replyTarget.authorIcon" />
                <v-icon v-else icon="mdi-account-circle" />
              </v-avatar>
              <span class="font-weight-medium">{{ replyTarget?.authorName }}</span>
            </div>
            <p class="text-body-2">{{ replyTarget?.content }}</p>
          </div>

          <!-- 답글 입력 -->
          <v-textarea
            v-model="replyContent"
            placeholder="답글을 작성해주세요..."
            variant="outlined"
            rows="3"
            auto-grow
          />
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
          <v-textarea v-model="editContent" variant="outlined" rows="3" auto-grow />
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
          <v-btn color="error" :loading="deletingComment" @click="handleConfirmDelete">
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { commentService } from '@/services/database'
import CommentItem from './CommentItem.vue'

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
})

const emit = defineEmits(['comment-added', 'comment-updated', 'comment-deleted', 'login-required'])

// Stores
const userStore = useUserStore()

// State
const newCommentContent = ref('')
const submittingComment = ref(false)
const sortBy = ref('oldest')
const replyDialog = ref(false)
const replyTarget = ref(null)
const replyContent = ref('')
const submittingReply = ref(false)
const editDialog = ref(false)
const editTarget = ref(null)
const editContent = ref('')
const updatingComment = ref(false)
const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deletingComment = ref(false)

// Sort options
const sortOptions = [
  { title: '오래된 순', value: 'oldest' },
  { title: '최신 순', value: 'newest' },
  { title: '추천 순', value: 'likes' },
]

// Computed
const sortedComments = computed(() => {
  const topLevelComments = props.comments.filter((comment) => !comment.parentId)

  switch (sortBy.value) {
    case 'newest':
      return topLevelComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    case 'likes':
      return topLevelComments.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    case 'oldest':
    default:
      return topLevelComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }
})

// Methods
function getReplies(commentId) {
  return props.comments
    .filter((comment) => comment.parentId === commentId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

async function handleSubmitComment() {
  if (!newCommentContent.value.trim()) return

  submittingComment.value = true
  try {
    const commentData = {
      postId: props.postId,
      content: newCommentContent.value.trim(),
      authorId: userStore.user.uid,
      authorName: userStore.user.displayName || userStore.user.email,
      authorIcon: userStore.user.selectedIcon || null,
    }

    const commentId = await commentService.createComment(commentData)

    // Create the new comment object for immediate UI update
    const newComment = {
      id: commentId,
      ...commentData,
      createdAt: new Date(),
      updatedAt: new Date(),
      likeCount: 0,
      isDeleted: false,
      level: 0,
    }

    emit('comment-added', newComment)
    newCommentContent.value = ''
  } catch (err) {
    console.error('Error creating comment:', err)
    // Show error message
  } finally {
    submittingComment.value = false
  }
}

function handleReply(comment) {
  replyTarget.value = comment
  replyContent.value = ''
  replyDialog.value = true
}

async function handleSubmitReply() {
  if (!replyContent.value.trim() || !replyTarget.value) return

  submittingReply.value = true
  try {
    const replyData = {
      postId: props.postId,
      parentId: replyTarget.value.id,
      content: replyContent.value.trim(),
      authorId: userStore.user.uid,
      authorName: userStore.user.displayName || userStore.user.email,
      authorIcon: userStore.user.selectedIcon || null,
    }

    const replyId = await commentService.createComment(replyData)

    // Create the new reply object for immediate UI update
    const newReply = {
      id: replyId,
      ...replyData,
      createdAt: new Date(),
      updatedAt: new Date(),
      likeCount: 0,
      isDeleted: false,
      level: 1,
    }

    emit('comment-added', newReply)
    replyDialog.value = false
    replyTarget.value = null
    replyContent.value = ''
  } catch (err) {
    console.error('Error creating reply:', err)
    // Show error message
  } finally {
    submittingReply.value = false
  }
}

function handleEditComment(comment) {
  editTarget.value = comment
  editContent.value = comment.content
  editDialog.value = true
}

async function handleUpdateComment() {
  if (!editContent.value.trim() || !editTarget.value) return

  updatingComment.value = true
  try {
    await commentService.updateComment(editTarget.value.id, editContent.value.trim())

    // Update the comment in the UI
    const updatedComment = {
      ...editTarget.value,
      content: editContent.value.trim(),
      updatedAt: new Date(),
    }

    emit('comment-updated', updatedComment)
    editDialog.value = false
    editTarget.value = null
    editContent.value = ''
  } catch (err) {
    console.error('Error updating comment:', err)
    // Show error message
  } finally {
    updatingComment.value = false
  }
}

function handleDeleteComment(comment) {
  deleteTarget.value = comment
  deleteDialog.value = true
}

async function handleConfirmDelete() {
  if (!deleteTarget.value) return

  deletingComment.value = true
  try {
    await commentService.deleteComment(deleteTarget.value.id, props.postId)
    emit('comment-deleted', deleteTarget.value.id)
    deleteDialog.value = false
    deleteTarget.value = null
  } catch (err) {
    console.error('Error deleting comment:', err)
    // Show error message
  } finally {
    deletingComment.value = false
  }
}

async function handleLikeComment(comment) {
  if (!userStore.isAuthenticated) {
    emit('login-required')
    return
  }

  try {
    const newLikeStatus = await commentService.toggleCommentLike(comment.id, userStore.user.uid)

    // Update the comment in the local state
    const updatedComment = {
      ...comment,
      likeCount: newLikeStatus
        ? (comment.likeCount || 0) + 1
        : Math.max((comment.likeCount || 0) - 1, 0),
    }

    emit('comment-updated', updatedComment)
  } catch (err) {
    console.error('Error toggling comment like:', err)
    // Show error message
  }
}
</script>

<style scoped>
.comment-system {
  max-width: 100%;
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
  .comments-header .d-flex {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .comment-form .d-flex {
    flex-direction: column;
  }

  .comment-form .v-avatar {
    align-self: flex-start;
    margin-bottom: 1rem;
  }
}
</style>
