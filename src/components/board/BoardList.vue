<template>
  <div class="board-list">
    <!-- 게시판 헤더 -->
    <div class="board-header mb-4">
      <div class="d-flex justify-space-between align-center">
        <!-- Board Title (Left) -->
        <div class="d-flex align-center">
          <v-icon :icon="boardConfig?.icon" size="large" class="me-2" />
          <h2 class="text-h5">{{ boardConfig?.name }}</h2>
        </div>

        <!-- Search and Write Button (Right) -->
        <div class="d-flex align-center" style="width: 400px">
          <v-text-field
            v-model="searchQuery"
            label="게시글 검색"
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-magnify"
            clearable
            @keydown.enter="handleSearch"
            @click:clear="handleClear"
            @click:prepend-inner="handleSearch"
          />
          <v-btn
            v-if="canWrite"
            color="primary"
            class="ms-2 flex-shrink-0"
            @click="handleWritePost"
          >
            글쓰기
          </v-btn>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-2">게시글을 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- 게시글 목록 -->
    <div v-else-if="posts.length > 0">
      <!-- 게시글 목록 헤더 -->
      <div class="post-list-header d-none d-md-flex align-center px-3 mb-2">
        <div class="flex-grow-1">
          <h4 class="text-subtitle-2 font-weight-medium">제목</h4>
        </div>
        <div class="post-meta-header d-flex align-center flex-shrink-0">
          <div class="me-4" style="width: 140px">
            <h4 class="text-subtitle-2 font-weight-medium">글쓴이</h4>
          </div>
          <div class="me-4" style="width: 100px">
            <h4 class="text-subtitle-2 font-weight-medium">등록일</h4>
          </div>
          <div style="width: 80px">
            <h4 class="text-subtitle-2 font-weight-medium">조회수</h4>
          </div>
        </div>
      </div>

      <!-- 공지사항 (고정 게시글) -->
      <div v-if="pinnedPosts.length > 0" class="pinned-posts mb-1">
        <PostListItem
          v-for="post in pinnedPosts"
          :key="post.id"
          :post="post"
          :is-pinned="true"
          :show-match-info="props.boardType === 'match'"
          @click="$emit('view-post', post.id)"
        />
      </div>

      <!-- 일반 게시글 -->
      <div class="regular-posts">
        <PostListItem
          v-for="post in regularPosts"
          :key="post.id"
          :post="post"
          :show-match-info="props.boardType === 'match'"
          @click="$emit('view-post', post.id)"
        />
      </div>

      <!-- 페이지네이션 -->
      <Pagination
        v-if="posts.length > 0"
        :current-page="currentPage"
        :has-more="hasMore"
        @prev="goToPrevPage"
        @next="goToNextPage"
      />
    </div>

    <!-- 빈 상태 -->
    <div v-else class="empty-state text-center py-12">
      <v-icon icon="mdi-post-outline" size="64" color="grey-lighten-1" />
      <h3 class="text-h6 mt-4 mb-2">게시글이 없습니다</h3>
      <p class="text-body-2 text-grey">
        {{
          isSearchActive
            ? '검색 결과가 없습니다.'
            : '첫 번째 게시글을 작성해보세요!'
        }}
      </p>
      <div class="mt-4">
        <v-btn
          v-if="isSearchActive"
          color="primary"
          variant="outlined"
          class="me-2"
          @click="handleClear"
        >
          검색 초기화
        </v-btn>
        <v-btn
          v-if="canWrite && !isSearchActive"
          color="primary"
          variant="outlined"
          @click="handleWritePost"
        >
          글쓰기
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useSearch } from '@/composables/useSearch';
import PostListItem from './PostListItem.vue';
import Pagination from '@/components/common/Pagination.vue';

const props = defineProps({
  boardType: {
    type: String,
    required: true,
  },
  boardConfig: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['view-post']);

// Stores
const userStore = useUserStore();
const router = useRouter();

// Search composable
const boardTypeRef = ref(props.boardType);
const {
  searchQuery,
  loading,
  error,
  posts,
  isSearchActive,
  currentPage,
  hasMore,
  fetchPosts,
  searchPosts,
  clearSearch,
  goToPage,
} = useSearch(boardTypeRef);

// Computed
const canWrite = computed(() => {
  if (!userStore.isAuthenticated) return false;
  if (props.boardConfig?.adminOnly) {
    return userStore.user?.role === 'admin';
  }
  // 인증된 사용자 중에서도 관리자 승인을 받은 사용자만 글쓰기 가능
  return userStore.isVerified;
});

const pinnedPosts = computed(() => {
  return posts.value.filter((post) => post.isPinned);
});

const regularPosts = computed(() => {
  return posts.value.filter((post) => !post.isPinned);
});

// Methods
function handleSearch() {
  // Trigger search only if there is a query
  if (searchQuery.value.trim()) {
    searchPosts();
  }
}

function handleClear() {
  clearSearch();
}

function goToPrevPage() {
  goToPage(currentPage.value - 1);
}

function goToNextPage() {
  goToPage(currentPage.value + 1);
}

function handleWritePost() {
  router.push(`/board/${props.boardType}/write`);
}

// Watchers
watch(
  () => props.boardType,
  (newBoardType) => {
    boardTypeRef.value = newBoardType;
  },
  { immediate: true },
);

// Lifecycle
onMounted(() => {
  fetchPosts(1);
});
</script>

<style scoped>
.board-list {
  max-width: 100%;
}

.board-header {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: 1rem;
}

.load-more-section {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-top: 2rem;
}

.pinned-posts {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: 1rem;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
}

.empty-state {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.post-list-header {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  border-bottom: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: 0.75rem;
}

@media (max-width: 959px) {
  .board-header > .d-flex {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .board-header .d-flex .align-center {
    width: 100% !important;
  }
}
</style>
