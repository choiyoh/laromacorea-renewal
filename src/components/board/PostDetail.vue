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
      <div class="post-header mb-6">
        <!-- 제목 -->
        <div class="d-flex align-center mb-4">
          <v-chip
            v-if="post.isPinned"
            size="small"
            color="error"
            variant="flat"
            class="me-3"
          >
            공지
          </v-chip>
          <h1 class="text-h4 font-weight-bold">{{ post.title }}</h1>
        </div>

        <!-- 메타 정보 -->
        <div class="post-meta mb-4">
          <!-- Desktop Layout -->
          <div class="d-none d-md-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <!-- 작성자 -->
              <div class="d-flex align-start me-6">
                <UserAvatar
                  :user-id="post.authorId"
                  :display-name="post.authorName"
                  :photo-u-r-l="post.authorPhotoURL"
                  :static-icon-url="post.authorIcon"
                  size="24"
                  avatar-class="me-2 avatar-aligned"
                />
                <span class="text-subtitle-1 font-weight-medium">{{
                  post.authorName || '익명'
                }}</span>
              </div>

              <!-- 작성일 -->
              <div class="text-grey-darken-1 me-6">
                <v-icon icon="mdi-clock-outline" size="18" class="me-1" />
                {{ formatDate(post.createdAt) }}
              </div>

              <!-- 조회수 -->
              <div class="text-grey-darken-1 me-6">
                <v-icon icon="mdi-eye-outline" size="18" class="me-1" />
                {{ post.viewCount || 0 }}
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="d-flex align-center">
              <v-btn
                v-if="canEdit"
                variant="text"
                size="small"
                prepend-icon="mdi-pencil"
                class="me-2"
                @click="$emit('edit-post')"
              >
                수정
              </v-btn>
              <v-btn
                v-if="canDelete"
                variant="text"
                color="error"
                size="small"
                prepend-icon="mdi-delete"
                @click="handleDeletePost"
              >
                삭제
              </v-btn>
            </div>
          </div>

          <!-- Mobile Layout -->
          <div class="d-md-none">
            <!-- 작성자 정보 -->
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-start">
                <UserAvatar
                  :user-id="post.authorId"
                  :display-name="post.authorName"
                  :photo-u-r-l="post.authorPhotoURL"
                  :static-icon-url="post.authorIcon"
                  size="22"
                  avatar-class="me-2 avatar-aligned"
                />
                <span class="text-body-1 font-weight-medium">{{
                  post.authorName || '익명'
                }}</span>
              </div>

              <!-- 모바일 액션 버튼 -->
              <v-menu v-if="canEdit || canDelete">
                <template #activator="{ props: menuProps }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="text"
                    v-bind="menuProps"
                  />
                </template>
                <v-list density="compact">
                  <v-list-item v-if="canEdit" @click="$emit('edit-post')">
                    <template #prepend>
                      <v-icon icon="mdi-pencil" />
                    </template>
                    <v-list-item-title>수정</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="canDelete" @click="handleDeletePost">
                    <template #prepend>
                      <v-icon icon="mdi-delete" color="error" />
                    </template>
                    <v-list-item-title class="text-error"
                      >삭제</v-list-item-title
                    >
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>

            <!-- 메타 정보 -->
            <div class="d-flex align-center text-caption text-grey-darken-1">
              <v-icon icon="mdi-clock-outline" size="14" class="me-1" />
              <span class="me-3">{{ formatDate(post.createdAt) }}</span>
              <v-icon icon="mdi-eye-outline" size="14" class="me-1" />
              <span>{{ post.viewCount || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="custom-divider mb-6"></div>
      </div>

      <!-- 게시글 내용 -->
      <div class="post-content mb-4">
        <div class="post-body mb-6" v-html="post.content"></div>

        <!-- 트위터 임베드 -->
        <TweetEmbed v-if="post.tweetUrl" :tweet-url="post.tweetUrl" />

        <!-- 미디어 첨부파일 -->
        <div
          v-if="post.mediaUrls && post.mediaUrls.length > 0"
          class="media-attachments mb-6"
        >
          <div class="custom-divider mb-4"></div>
          <h3 class="text-h6 mb-4">첨부파일</h3>
          <div class="media-grid">
            <div
              v-for="(mediaUrl, index) in post.mediaUrls"
              :key="index"
              class="media-item"
            >
              <v-img
                v-if="isImage(mediaUrl)"
                :src="mediaUrl"
                class="rounded cursor-pointer"
                cover
                loading="lazy"
                :eager="index < 2"
                @click="openMediaViewer(mediaUrl)"
              />
              <video
                v-else-if="isVideo(mediaUrl)"
                :src="mediaUrl"
                controls
                preload="metadata"
                class="rounded"
                style="width: 100%; max-height: 300px"
              />
            </div>
          </div>
        </div>

        <!-- 태그 -->
        <div v-if="post.tags && post.tags.length > 0" class="post-tags mb-6">
          <div class="custom-divider mb-4"></div>
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

        <!-- 게시글 액션 -->
        <div class="post-actions">
          <div class="d-flex align-center">
            <v-btn
              :color="isLiked ? 'primary' : 'default'"
              :variant="isLiked ? 'flat' : 'text'"
              prepend-icon="mdi-thumb-up"
              @click="handleLikePost"
            >
              추천 {{ post.likeCount || 0 }}
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn @click="goToList" color="primary"> 목록 </v-btn>
          </div>
        </div>
      </div>

      <!-- 이전/다음 글 네비게이션 -->
      <div
        v-if="adjacentPosts.prevPost || adjacentPosts.nextPost"
        class="post-navigation mb-6"
      >
        <div class="custom-divider mb-4"></div>

        <!-- 이전 글 -->
        <div v-if="adjacentPosts.prevPost" class="nav-post prev-post mb-1">
          <v-card
            variant="outlined"
            class="nav-card cursor-pointer"
            @click="navigateToPost(adjacentPosts.prevPost.id)"
          >
            <v-card-text class="pa-1">
              <!-- Desktop Layout -->
              <div class="d-none d-md-block">
                <div class="d-flex align-center">
                  <div class="nav-label me-3">
                    <v-icon icon="mdi-chevron-left" size="18" class="me-1" />
                    이전글
                  </div>
                  <div class="nav-post-title me-3 flex-grow-1">
                    {{ adjacentPosts.prevPost.title }}
                    <v-icon icon="mdi-comment-outline" size="12" class="me-1" />
                    <span>{{ adjacentPosts.prevPost.commentCount || 0 }}</span>
                  </div>
                  <div class="nav-post-meta">
                    <div
                      class="d-flex align-center justify-space-between text-caption text-grey-darken-1"
                    >
                      <div class="d-flex align-center">
                        <UserAvatar
                          :user-id="adjacentPosts.prevPost.authorId"
                          :display-name="adjacentPosts.prevPost.authorName"
                          :photo-u-r-l="adjacentPosts.prevPost.authorPhotoURL"
                          :static-icon-url="adjacentPosts.prevPost.authorIcon"
                          size="16"
                          avatar-class="me-1"
                        />
                        <span>{{
                          adjacentPosts.prevPost.authorName || '익명'
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mobile Layout -->
              <div class="d-md-none">
                <div class="d-flex align-center">
                  <div class="nav-label me-2 flex-shrink-0">
                    <v-icon icon="mdi-chevron-left" size="16" class="me-1" />
                    이전글
                  </div>
                  <div class="nav-post-title flex-grow-1 me-2">
                    {{ adjacentPosts.prevPost.title }}
                    <v-icon icon="mdi-comment-outline" size="10" class="me-1" />
                    <span>{{ adjacentPosts.prevPost.commentCount || 0 }}</span>
                  </div>
                  <div class="nav-post-meta">
                    <div
                      class="d-flex align-center text-caption text-grey-darken-1"
                    >
                      <UserAvatar
                        :user-id="adjacentPosts.prevPost.authorId"
                        :display-name="adjacentPosts.prevPost.authorName"
                        :photo-u-r-l="adjacentPosts.prevPost.authorPhotoURL"
                        :static-icon-url="adjacentPosts.prevPost.authorIcon"
                        size="14"
                        avatar-class="me-1"
                      />
                      <span style="white-space: nowrap">{{
                        adjacentPosts.prevPost.authorName || '익명'
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
        <div class="custom-divider" v-if="adjacentPosts.prevPost"></div>
        <!-- 다음 글 -->
        <div v-if="adjacentPosts.nextPost" class="nav-post next-post mt-1">
          <v-card
            variant="outlined"
            class="nav-card cursor-pointer"
            @click="navigateToPost(adjacentPosts.nextPost.id)"
          >
            <v-card-text class="pa-1">
              <!-- Desktop Layout -->
              <div class="d-none d-md-block">
                <div class="d-flex align-center">
                  <div class="nav-label me-3">
                    다음글
                    <v-icon icon="mdi-chevron-right" size="18" class="ms-1" />
                  </div>
                  <div class="nav-post-title me-3 flex-grow-1">
                    {{ adjacentPosts.nextPost.title }}
                    <v-icon icon="mdi-comment-outline" size="12" class="me-1" />
                    <span>{{ adjacentPosts.nextPost.commentCount || 0 }}</span>
                  </div>

                  <div class="nav-post-meta">
                    <div
                      class="d-flex align-center justify-space-between text-caption text-grey-darken-1"
                    >
                      <div class="d-flex align-center">
                        <UserAvatar
                          :user-id="adjacentPosts.nextPost.authorId"
                          :display-name="adjacentPosts.nextPost.authorName"
                          :photo-u-r-l="adjacentPosts.nextPost.authorPhotoURL"
                          :static-icon-url="adjacentPosts.nextPost.authorIcon"
                          size="16"
                          avatar-class="me-1"
                        />
                        <span>{{
                          adjacentPosts.nextPost.authorName || '익명'
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mobile Layout -->
              <div class="d-md-none">
                <div class="d-flex align-center">
                  <div class="nav-label me-2 flex-shrink-0">
                    다음글
                    <v-icon icon="mdi-chevron-right" size="16" class="ms-1" />
                  </div>
                  <div class="nav-post-title flex-grow-1 me-2">
                    {{ adjacentPosts.nextPost.title }}
                    <v-icon icon="mdi-comment-outline" size="10" class="me-1" />
                    <span>{{ adjacentPosts.nextPost.commentCount || 0 }}</span>
                  </div>
                  <div class="nav-post-meta">
                    <div
                      class="d-flex align-center text-caption text-grey-darken-1"
                    >
                      <UserAvatar
                        :user-id="adjacentPosts.nextPost.authorId"
                        :display-name="adjacentPosts.nextPost.authorName"
                        :photo-u-r-l="adjacentPosts.nextPost.authorPhotoURL"
                        :static-icon-url="adjacentPosts.nextPost.authorIcon"
                        size="14"
                        avatar-class="me-1"
                      />
                      <span style="white-space: nowrap">{{
                        adjacentPosts.nextPost.authorName || '익명'
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>

      <!-- Match 정보 표시 (Match 게시판용) -->
      <div
        v-if="post.boardType === 'match' && post.matchData"
        class="match-info-section mb-4"
      >
        <MatchInfo :match-data="post.matchData" />
      </div>

      <!-- 댓글 시스템 -->
      <MatchCommentSystem
        v-if="post.boardType === 'match'"
        :post-id="post.id"
        :match-data="post.matchData"
        :show-cheering-stats="true"
        @comment-updated="handleCommentUpdated"
        @comment-deleted="handleCommentDeleted"
      />
      <CommentSystem
        v-else
        :post-id="post.id"
        :comments="comments"
        :total-comments="post.commentCount"
        :loading="commentsLoading"
        :loading-more="commentsLoadingMore"
        :has-more="hasMoreComments"
        :board-type="post.boardType"
        @comment-added="handleCommentAdded"
        @comment-updated="handleCommentUpdated"
        @comment-deleted="handleCommentDeleted"
        @refresh-comments="() => fetchComments(false)"
        @load-more="() => fetchComments(true)"
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
          정말로 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수
          없습니다.
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
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { postService, commentService } from '@/services/database';
import { useRouter } from 'vue-router';
import { useMobileOptimization } from '@/composables/useMobileOptimization';
import CommentSystem from './CommentSystem.vue';
import MatchCommentSystem from './MatchCommentSystem.vue';
import MatchInfo from './MatchInfo.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import TweetEmbed from '@/components/common/TweetEmbed.vue';

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  'edit-post',
  'delete-post',
  'post-updated',
  'navigate-to-post',
  'go-to-list',
]);

const router = useRouter();

// Stores
const userStore = useUserStore();

// Mobile optimization
const { isMobile, getOptimizedImageUrl, getCommentLoadingStrategy } =
  useMobileOptimization();

// State
const post = ref(null);
const comments = ref([]);
const lastCommentDoc = ref(null); // 댓글 페이지네이션을 위한 마지막 문서 참조
const loading = ref(false);
const commentsLoading = ref(false);
const commentsLoadingMore = ref(false);
const hasMoreComments = ref(false);
const error = ref(null);
const isLiked = ref(false);
const mediaViewerDialog = ref(false);
const selectedMedia = ref('');
const deleteDialog = ref(false);
const adjacentPosts = ref({ prevPost: null, nextPost: null });

// Computed
const canEdit = computed(() => {
  if (!userStore.isAuthenticated || !post.value) return false;
  return (
    post.value.authorId === userStore.user.uid ||
    userStore.user.role === 'admin'
  );
});

const canDelete = computed(() => {
  if (!userStore.isAuthenticated || !post.value) return false;
  return (
    post.value.authorId === userStore.user.uid ||
    userStore.user.role === 'admin'
  );
});

// Methods
async function fetchPost() {
  loading.value = true;
  error.value = null;

  try {
    const fetchedPost = await postService.getPost(props.postId);
    if (!fetchedPost) {
      error.value = '게시글을 찾을 수 없습니다.';
      return;
    }
    post.value = fetchedPost;

    // 병렬로 처리하여 로딩 시간 단축
    const promises = [];

    // Check if user has liked this post (비동기)
    if (userStore.isAuthenticated) {
      promises.push(
        postService
          .checkPostLike(props.postId, userStore.user.uid)
          .then((liked) => {
            isLiked.value = liked;
          })
          .catch(() => {
            isLiked.value = false;
          }),
      );
    }

    // Fetch adjacent posts (비동기)
    promises.push(
      fetchAdjacentPosts().catch((error) => {
        console.warn('Failed to fetch adjacent posts:', error);
      }),
    );

    // 모든 비동기 작업을 병렬로 처리
    await Promise.allSettled(promises);
  } catch (err) {
    error.value = '게시글을 불러오는 중 오류가 발생했습니다.';
  } finally {
    loading.value = false;
  }
}

async function fetchComments(loadMore = false) {
  if (!props.postId) return;

  if (loadMore) {
    commentsLoadingMore.value = true;
  } else {
    commentsLoading.value = true;
    comments.value = [];
    lastCommentDoc.value = null;
  }

  try {
    // 모바일 최적화된 댓글 로딩 전략 사용
    const strategy = getCommentLoadingStrategy();
    const limitCount = loadMore ? strategy.loadMore : strategy.initialLoad;

    const {
      comments: fetchedComments,
      lastDoc,
      hasMore,
    } = await commentService.getComments(props.postId, post.value.boardType, {
      lastDoc: lastCommentDoc.value,
      limitCount,
    });

    comments.value.push(...fetchedComments);
    lastCommentDoc.value = lastDoc;
    hasMoreComments.value = hasMore;

    // 댓글 수 동기화는 첫 로드 시에만 실행하여 정확한 총 댓글 수를 표시
    if (!loadMore && post.value) {
      const actualCommentCount = await commentService.syncPostCommentCount(
        props.postId,
      );
      post.value.commentCount = actualCommentCount;
    }
  } catch (err) {
    console.error('댓글을 불러오는 중 오류가 발생했습니다:', err);
  } finally {
    commentsLoading.value = false;
    commentsLoadingMore.value = false;
  }
}

function formatDate(timestamp) {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

function isVideo(url) {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
}

function openMediaViewer(mediaUrl) {
  selectedMedia.value = mediaUrl;
  mediaViewerDialog.value = true;
}

async function handleLikePost() {
  if (!userStore.isAuthenticated) {
    // Show login prompt
    return;
  }

  try {
    // Toggle like status

    isLiked.value = !isLiked.value;

    // Update post like count optimistically
    if (isLiked.value) {
      post.value.likeCount = (post.value.likeCount || 0) + 1;
    } else {
      post.value.likeCount = Math.max((post.value.likeCount || 0) - 1, 0);
    }

    // Call the actual like/unlike functionality
    const newLikeStatus = await postService.togglePostLike(
      props.postId,
      userStore.user.uid,
    );
    isLiked.value = newLikeStatus;
  } catch (err) {
    // Revert optimistic update on error
    isLiked.value = !isLiked.value;
    if (isLiked.value) {
      post.value.likeCount = (post.value.likeCount || 0) + 1;
    } else {
      post.value.likeCount = Math.max((post.value.likeCount || 0) - 1, 0);
    }
  }
}

function handleDeletePost() {
  deleteDialog.value = true;
}

async function confirmDeletePost() {
  try {
    await postService.deletePost(props.postId);
    deleteDialog.value = false;
    emit('delete-post', props.postId);
  } catch (err) {
    // Show error message
  }
}

function handleCommentAdded() {
  // 댓글이 추가되면 게시글의 댓글 수 증가
  if (post.value) {
    post.value.commentCount = (post.value.commentCount || 0) + 1;
  }
}

function handleCommentUpdated(updatedComment) {
  const index = comments.value.findIndex((c) => c.id === updatedComment.id);
  if (index !== -1) {
    comments.value[index] = updatedComment;
  }
}

function handleCommentDeleted(commentId) {
  comments.value = comments.value.filter((c) => c.id !== commentId);
  // Update post comment count
  if (post.value) {
    post.value.commentCount = Math.max((post.value.commentCount || 0) - 1, 0);
  }
}

async function fetchAdjacentPosts() {
  if (!post.value) return;

  try {
    const result = await postService.getAdjacentPosts(
      props.postId,
      post.value.boardType,
    );

    adjacentPosts.value = result;
  } catch (error) {
    console.error('Error fetching adjacent posts:', error);
  }
}

function goToList() {
  emit('go-to-list');
}

function navigateToPost(postId) {
  emit('navigate-to-post', postId);
}

// Lifecycle
onMounted(async () => {
  await fetchPost();
  if (post.value && post.value.boardType !== 'match') {
    await fetchComments();
  }
});

watch(
  () => props.postId,
  async (newPostId, oldPostId) => {
    if (newPostId && newPostId !== oldPostId) {
      await fetchPost();
      if (post.value && post.value.boardType !== 'match') {
        await fetchComments();
      }
    }
  },
);
</script>

<style scoped>
.avatar-aligned {
  margin-top: 2px; /* 텍스트 첫 번째 줄과 맞추기 위한 미세 조정 */
}

.post-detail {
  max-width: 100%;
}

.post-header {
  padding: 0 4px;
}

.post-meta {
  font-size: 0.875rem;
}

.post-content {
  padding: 0 4px;
}

.post-body {
  line-height: 1.5;
  word-break: break-word;
  font-size: 1rem;
  min-height: 200px;
}

.post-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
  /* 이미지 로딩 최적화 */
  loading: lazy;
  /* 모바일에서 이미지 압축 */
  image-rendering: optimizeQuality;
}

.post-body :deep(h1),
.post-body :deep(h2),
.post-body :deep(h3),
.post-body :deep(h4),
.post-body :deep(h5),
.post-body :deep(h6) {
  margin: 2rem 0 1rem 0;
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
  margin: 1.5rem 0;
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

.custom-divider {
  height: 2px;
  background-image: url('/images/s_top_bg.gif');
  background-repeat: repeat-x;
  background-position: center;
  width: 100%;
}

.post-tags .v-chip {
  margin: 2px;
}

.post-actions {
  padding: 0;
}

.post-navigation {
  margin-top: 1rem;
}

.nav-post {
  margin-bottom: 1rem;
}

.nav-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
}

.nav-card {
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
}

.nav-card:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
  transform: translateY(-1px);
}

.nav-post-title {
  font-weight: 500;
  font-size: 0.95rem;
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface));
}

/* Desktop: 한 줄로 표시 */
@media (min-width: 768px) {
  .nav-post-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* Mobile: 여러 줄 표시 */
@media (max-width: 767px) {
  .nav-post-title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 0.85rem;
    line-height: 1.3;
    font-weight: 500;
  }

  .nav-label {
    font-size: 0.75rem;
    align-self: flex-start;
    margin-top: 1px;
    line-height: 1.2;
  }

  /* 모바일 전용 간결한 스타일 */
  .d-md-none .v-card-text {
    padding: 8px 12px !important;
  }

  .d-md-none .nav-post-meta {
    margin-top: 4px;
  }

  .d-md-none .nav-post-meta .text-caption {
    font-size: 0.65rem;
    line-height: 1.2;
  }

  .d-md-none .nav-post-meta .d-flex {
    gap: 4px;
  }

  .d-md-none .nav-post-meta .me-2 {
    margin-right: 6px !important;
  }

  /* 모바일에서 카드 간격 줄이기 */
  .nav-post.prev-post {
    margin-bottom: 8px !important;
  }

  /* 모바일에서 mb-2를 mb-1로 변경 */
  .d-md-none .mb-2 {
    margin-bottom: 4px !important;
  }
}

@media (min-width: 960px) {
  .post-body :deep(img) {
    max-width: 60%;
  }
}

@media (max-width: 768px) {
  .post-header h1 {
    font-size: 1.5rem !important;
    line-height: 1.3;
  }

  .media-grid {
    grid-template-columns: 1fr;
  }

  .post-body {
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .post-header,
  .post-content,
  .post-actions {
    padding: 0;
  }

  .nav-post-meta .text-caption {
    font-size: 0.65rem;
  }

  /* 네비게이션 전체 여백 줄이기 */
  .post-navigation {
    margin-top: 1.5rem !important;
    margin-bottom: 1.5rem !important;
  }
}
</style>