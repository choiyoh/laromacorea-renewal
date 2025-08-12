<template>
  <div class="post-edit-view">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" lg="10" xl="8">
          <!-- 브레드크럼 -->
          <v-breadcrumbs :items="breadcrumbs" class="pa-0 mb-4" />

          <!-- 로딩 상태 -->
          <div v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" />
            <p class="mt-2">게시글을 불러오는 중...</p>
          </div>

          <!-- 에러 상태 -->
          <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
            {{ error }}
          </v-alert>

          <!-- 권한 없음 -->
          <v-alert v-else-if="!canEdit" type="warning" variant="tonal" class="mb-4">
            이 게시글을 수정할 권한이 없습니다.
          </v-alert>

          <!-- 게시글 수정 에디터 -->
          <PostEditor
            v-else-if="post"
            :board-type="boardType"
            :post="post"
            :is-edit="true"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { postService } from '@/services/database'
import PostEditor from '@/components/board/PostEditor.vue'

const props = defineProps({
  boardType: {
    type: String,
    required: true,
  },
  postId: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const userStore = useUserStore()

// State
const post = ref(null)
const loading = ref(false)
const error = ref(null)

// Board configuration
const boardConfig = {
  notice: { name: '공지사항', icon: 'mdi-bullhorn' },
  squad: { name: '스쿼드', icon: 'mdi-account-group' },
  match: { name: '경기', icon: 'mdi-soccer' },
  calcio: { name: '칼치오', icon: 'mdi-newspaper' },
  free: { name: '자유게시판', icon: 'mdi-forum' },
  special: { name: '스페셜', icon: 'mdi-star' },
  media: { name: '미디어', icon: 'mdi-play-circle' },
}

// Computed
const breadcrumbs = computed(() => [
  {
    title: '홈',
    disabled: false,
    to: '/',
  },
  {
    title: boardConfig[props.boardType]?.name || props.boardType,
    disabled: false,
    to: `/board/${props.boardType}`,
  },
  {
    title: post.value?.title || '게시글',
    disabled: false,
    to: `/board/${props.boardType}/post/${props.postId}`,
  },
  {
    title: '수정',
    disabled: true,
  },
])

const canEdit = computed(() => {
  if (!userStore.isAuthenticated || !post.value) return false

  // 작성자 본인이거나 관리자인 경우
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

    if (fetchedPost.boardType !== props.boardType) {
      error.value = '잘못된 게시판입니다.'
      return
    }

    post.value = fetchedPost
  } catch (err) {
    error.value = '게시글을 불러오는 중 오류가 발생했습니다.'
    console.error('Error fetching post:', err)
  } finally {
    loading.value = false
  }
}

function handleSubmit() {
  // 게시글 수정 완료 후 게시글 상세로 이동
  router.push(`/board/${props.boardType}/post/${props.postId}`)
}

function handleCancel() {
  // 취소 시 게시글 상세로 이동
  router.push(`/board/${props.boardType}/post/${props.postId}`)
}

// Lifecycle
onMounted(() => {
  fetchPost()
})
</script>

<style scoped>
.post-edit-view {
  min-height: calc(100vh - 64px);
  background-color: rgb(var(--v-theme-background));
}

@media (max-width: 768px) {
  .post-edit-view {
    min-height: calc(100vh - 56px);
  }
}
</style>
