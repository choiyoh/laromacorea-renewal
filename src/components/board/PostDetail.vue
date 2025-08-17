<template>
  <div class="post-detail">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-2">게시글을 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- 게시글 상세 -->
    <div v-else-if="post">
      <!-- 게시글 헤더 -->
      <v-card class="post-header mb-4" variant="outlined">
        <v-card-text class="pa-4">
          <!-- 제목 -->
          <div class="d-flex align-center mb-3">
            <v-chip v-if="post.isPinned" size="small" color="error" variant="flat" class="me-2">
              공지
            </v-chip>
            <h1 class="text-h5 font-weight-bold">{{ post.title }}</h1>
          </div>

          <!-- 메타 정보 -->
          <div class="post-meta d-flex align-center justify-space-between flex-wrap">
            <div class="d-flex align-center">
              <!-- 작성자 -->
              <div class="d-flex align-center me-4">
                <v-avatar v-if="post.authorIcon" size="24" class="me-2">
                  <v-img :src="post.authorIcon" />
                </v-avatar>
                <span class="font-weight-medium">{{ post.authorName }}</span>
              </div>

              <!-- 작성일 -->
              <div class="text-grey me-4">
                <v-icon icon="mdi-clock-outline" size="16" class="me-1" />
                {{ formatDate(post.createdAt) }}
              </div>

              <!-- 조회수 -->
              <div class="text-grey me-4">
                <v-icon icon="mdi-eye-outline" size="16" class="me-1" />
                {{ post.viewCount || 0 }}
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="d-flex align-center">
              <v-btn
                v-if="canEdit"
                variant="outlined"
                size="small"
                prepend-icon="mdi-pencil"
                class="me-2"
                @click="$emit('edit-post')"
              >
                수정
              </v-btn>
              <v-btn
                v-if="canDelete"
                variant="outlined"
                color="error"
                size="small"
                prepend-icon="mdi-delete"
                @click="handleDeletePost"
              >
                삭제
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- 게시글 내용 -->
      <v-card class="post-content mb-4" variant="outlined">
        <v-card-text class="pa-4">
          <div class="post-body" v-html="post.content"></div>

          <!-- 미디어 첨부파일 -->
          <div v-if="post.mediaUrls && post.mediaUrls.length > 0" class="media-attachments mt-4">
            <v-divider class="mb-4" />
            <h3 class="text-subtitle-1 mb-3">첨부파일</h3>
            <div class="media-grid">
              <div v-for="(mediaUrl, index) in post.mediaUrls" :key="index" class="media-item">
                <v-img
                  v-if="isImage(mediaUrl)"
                  :src="mediaUrl"
                  class="rounded cursor-pointer"
                  cover
                  @click="openMediaViewer(mediaUrl)"
                />
                <video
                  v-else-if="isVideo(mediaUrl)"
                  :src="mediaUrl"
                  controls
                  class="rounded"
                  style="width: 100%; max-height: 300px"
                />
              </div>
            </div>
          </div>

          <!-- 태그 -->
          <div v-if="post.tags && post.tags.length > 0" class="post-tags mt-4">
            <v-divider class="mb-3" />
            <div class="d-flex flex-wrap gap-2">
              <v-chip
                v-for="tag in post.tags"
                :key="tag"
                size="small"
                variant="outlined"
                color="primary"
              >
                #{{ tag }}
              </v-chip>
            </div>
          </div>
        </v-card-text>

        <!-- 게시글 액션 -->
        <v-card-actions class="px-4 pb-4">
          <v-btn
            :color="isLiked ? 'primary' : 'default'"
            :variant="isLiked ? 'flat' : 'outlined'"
            prepend-icon="mdi-thumb-up"
            @click="handleLikePost"
          >
            추천 {{ post.likeCount || 0 }}
          </v-btn>
          <v-spacer />
          <v-btn variant="outlined" prepend-icon="mdi-share" @click="handleSharePost"> 공유 </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Match 정보 표시 (Match 게시판용) -->
      <div v-if="post.boardType === 'match' && post.matchData" class="match-info-section mb-4">
        <MatchInfo :match-data="post.matchData" />
      </div>

      <!-- 댓글 시스템 -->
      <MatchCommentSystem
        v-if="post.boardType === 'match'"
        :post-id="post.id"
        :match-data="post.matchData"
        :show-cheering-stats="true"
        @comment-added="handleCommentAdded"
        @comment-updated="handleCommentUpdated"
        @comment-deleted="handleCommentDeleted"
      />
      <CommentSystem
        v-else
        :post-id="post.id"
        :comments="comments"
        :loading="commentsLoading"
        @comment-added="handleCommentAdded"
        @comment-updated="handleCommentUpdated"
        @comment-deleted="handleCommentDeleted"
        @refresh-comments="fetchComments"
      />
    </div>

    <!-- 미디어 뷰어 다이얼로그 -->
    <v-dialog v-model="mediaViewerDialog" max-width="90vw">
      <v-card>
        <v-card-text class="pa-0">
          <v-img :src="selectedMedia" contain style="max-height: 80vh" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="mediaViewerDialog = false">닫기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 삭제 확인 다이얼로그 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>게시글 삭제</v-card-title>
        <v-card-text>
          정말로 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">취소</v-btn>
          <v-btn color="error" @click="confirmDeletePost">삭제</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { postService, commentService } from '@/services/database'
import CommentSystem from './CommentSystem.vue'
import MatchCommentSystem from './MatchCommentSystem.vue'
import MatchInfo from './MatchInfo.vue'

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['edit-post', 'delete-post', 'post-updated'])

// Stores
const userStore = useUserStore()

// State
const post = ref(null)
const comments = ref([])
const loading = ref(false)
const commentsLoading = ref(false)
const error = ref(null)
const isLiked = ref(false)
const mediaViewerDialog = ref(false)
const selectedMedia = ref('')
const deleteDialog = ref(false)

// Computed
const canEdit = computed(() => {
  if (!userStore.isAuthenticated || !post.value) return false
  return post.value.authorId === userStore.user.uid || userStore.user.role === 'admin'
})

const canDelete = computed(() => {
  if (!userStore.isAuthenticated || !post.value) return false
  return post.value.authorId === userStore.user.uid || userStore.user.role === 'admin'
})

// Methods
async function fetchPost() {
  loading.value = true
  error.value = null

  try {
    const fetchedPost = await postService.getPost(props.postId)
    if (!fetchedPost) {
      error.value = '게시글을 찾을 수 없습니다.'
      return
    }
    post.value = fetchedPost

    // Check if user has liked this post
    if (userStore.isAuthenticated) {
      isLiked.value = await postService.checkPostLike(props.postId, userStore.user.uid)
    }
  } catch (err) {
    error.value = '게시글을 불러오는 중 오류가 발생했습니다.'
    console.error('Error fetching post:', err)
  } finally {
    loading.value = false
  }
}

async function fetchComments() {
  if (!props.postId) {
    console.warn('No postId provided for fetchComments')
    return
  }

  console.log('Fetching comments for post:', props.postId)
  commentsLoading.value = true
  try {
    const fetchedComments = await commentService.getComments(props.postId)
    console.log('Fetched comments:', fetchedComments)
    comments.value = fetchedComments
  } catch (err) {
    console.error('Error fetching comments:', err)
  } finally {
    commentsLoading.value = false
  }
}

function formatDate(timestamp) {
  if (!timestamp) return ''

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
}

function isVideo(url) {
  return /\.(mp4|webm|ogg|mov)$/i.test(url)
}

function openMediaViewer(mediaUrl) {
  selectedMedia.value = mediaUrl
  mediaViewerDialog.value = true
}

async function handleLikePost() {
  if (!userStore.isAuthenticated) {
    // Show login prompt
    return
  }

  try {
    // Toggle like status

    isLiked.value = !isLiked.value

    // Update post like count optimistically
    if (isLiked.value) {
      post.value.likeCount = (post.value.likeCount || 0) + 1
    } else {
      post.value.likeCount = Math.max((post.value.likeCount || 0) - 1, 0)
    }

    // Call the actual like/unlike functionality
    const newLikeStatus = await postService.togglePostLike(props.postId, userStore.user.uid)
    isLiked.value = newLikeStatus
  } catch (err) {
    // Revert optimistic update on error
    isLiked.value = !isLiked.value
    if (isLiked.value) {
      post.value.likeCount = (post.value.likeCount || 0) + 1
    } else {
      post.value.likeCount = Math.max((post.value.likeCount || 0) - 1, 0)
    }
    console.error('Error toggling like:', err)
  }
}

function handleSharePost() {
  if (navigator.share) {
    navigator.share({
      title: post.value.title,
      url: window.location.href,
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href)
    // Show success message
  }
}

function handleDeletePost() {
  deleteDialog.value = true
}

async function confirmDeletePost() {
  try {
    await postService.deletePost(props.postId)
    deleteDialog.value = false
    emit('delete-post', props.postId)
  } catch (err) {
    console.error('Error deleting post:', err)
    // Show error message
  }
}

function handleCommentAdded(newComment) {
  comments.value.push(newComment)
  // Update post comment count
  if (post.value) {
    post.value.commentCount = (post.value.commentCount || 0) + 1
  }
}

function handleCommentUpdated(updatedComment) {
  const index = comments.value.findIndex((c) => c.id === updatedComment.id)
  if (index !== -1) {
    comments.value[index] = updatedComment
  }
}

function handleCommentDeleted(commentId) {
  comments.value = comments.value.filter((c) => c.id !== commentId)
  // Update post comment count
  if (post.value) {
    post.value.commentCount = Math.max((post.value.commentCount || 0) - 1, 0)
  }
}

// Lifecycle
onMounted(async () => {
  await fetchPost()
  await fetchComments()
})
</script>

<style scoped>
.post-detail {
  max-width: 100%;
}

.post-meta {
  font-size: 0.875rem;
}

.post-body {
  line-height: 1.6;
  word-break: break-word;
}

.post-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
}

.post-body :deep(p) {
  margin-bottom: 1rem;
}

.post-body :deep(h1),
.post-body :deep(h2),
.post-body :deep(h3),
.post-body :deep(h4),
.post-body :deep(h5),
.post-body :deep(h6) {
  margin: 1.5rem 0 1rem 0;
  font-weight: 600;
}

.post-body :deep(ul),
.post-body :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.post-body :deep(blockquote) {
  border-left: 4px solid rgb(var(--v-theme-primary));
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-radius: 0 4px 4px 0;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.media-item {
  border-radius: 8px;
  overflow: hidden;
}

.cursor-pointer {
  cursor: pointer;
}

.post-tags .v-chip {
  margin: 2px;
}

@media (max-width: 768px) {
  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .media-grid {
    grid-template-columns: 1fr;
  }

  .post-body {
    font-size: 0.95rem;
  }
}
</style>
