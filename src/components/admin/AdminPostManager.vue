<template>
  <div class="post-manager-container">
    <!-- 필터 및 검색 -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchTerm"
          label="게시글 검색"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="boardFilter"
          label="게시판 필터"
          :items="boardOptions"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="statusFilter"
          label="상태 필터"
          :items="statusOptions"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-switch
          v-model="includeDeleted"
          label="삭제된 글 포함"
          color="warning"
          density="compact"
        />
      </v-col>
    </v-row>

    <!-- 게시글 목록 -->
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-post" class="mr-2" />
        게시글 관리
        <v-spacer />
        <v-btn
          icon="mdi-refresh"
          variant="text"
          @click="loadPosts"
          :loading="loading"
        />
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredPosts"
        :loading="loading"
        class="post-table"
        item-value="id"
      >
        <template #item.title="{ item }">
          <div class="post-title-cell">
            <div class="d-flex align-center mb-1">
              <v-chip
                v-if="item.isPinned"
                color="error"
                size="x-small"
                class="mr-2"
              >
                고정
              </v-chip>
              <span
                class="font-weight-medium"
                :class="{
                  'text-decoration-line-through text-medium-emphasis':
                    item.isDeleted,
                }"
              >
                {{ item.title }}
              </span>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.board }} • {{ item.authorName || '알 수 없음' }}
            </div>
          </div>
        </template>

        <template #item.status="{ item }">
          <div class="d-flex flex-column gap-1">
            <v-chip
              :color="item.isDeleted ? 'error' : 'success'"
              size="small"
              variant="elevated"
            >
              {{ item.isDeleted ? '삭제됨' : '활성' }}
            </v-chip>
            <v-chip
              v-if="item.isPinned"
              color="warning"
              size="small"
              variant="elevated"
            >
              고정됨
            </v-chip>
          </div>
        </template>

        <template #item.stats="{ item }">
          <div class="stats-cell">
            <div class="d-flex align-center mb-1">
              <v-icon icon="mdi-eye" size="14" class="mr-1" />
              <span class="text-caption">{{ item.views || 0 }}</span>
            </div>
            <div class="d-flex align-center mb-1">
              <v-icon icon="mdi-thumb-up" size="14" class="mr-1" />
              <span class="text-caption">{{ item.likes || 0 }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon icon="mdi-comment" size="14" class="mr-1" />
              <span class="text-caption">{{ item.commentCount || 0 }}</span>
            </div>
          </div>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template #item.actions="{ item }">
          <v-menu>
            <template #activator="{ props }">
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                v-bind="props"
              />
            </template>
            <v-list>
              <v-list-item @click="viewPost(item)">
                <template #prepend>
                  <v-icon icon="mdi-eye" />
                </template>
                <v-list-item-title>보기</v-list-item-title>
              </v-list-item>
              <v-list-item @click="togglePin(item)">
                <template #prepend>
                  <v-icon :icon="item.isPinned ? 'mdi-pin-off' : 'mdi-pin'" />
                </template>
                <v-list-item-title>
                  {{ item.isPinned ? '고정 해제' : '고정' }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="toggleDelete(item)">
                <template #prepend>
                  <v-icon
                    :icon="item.isDeleted ? 'mdi-restore' : 'mdi-delete'"
                  />
                </template>
                <v-list-item-title>
                  {{ item.isDeleted ? '복원' : '삭제' }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>

    <!-- 게시글 상세 다이얼로그 -->
    <v-dialog v-model="viewDialog" max-width="800" scrollable>
      <v-card v-if="selectedPost">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-post" class="mr-2" />
          게시글 상세
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="viewDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <div class="mb-4">
            <h3 class="text-h6 mb-2">{{ selectedPost.title }}</h3>
            <div
              class="d-flex align-center text-caption text-medium-emphasis mb-3"
            >
              <v-chip size="small" class="mr-2">{{
                selectedPost.board
              }}</v-chip>
              <span
                >{{ selectedPost.authorName }} •
                {{ formatDate(selectedPost.createdAt) }}</span
              >
            </div>
          </div>

          <div class="post-content" v-html="selectedPost.content"></div>

          <v-divider class="my-4" />

          <div class="d-flex align-center justify-space-between">
            <div class="d-flex gap-4">
              <div class="d-flex align-center">
                <v-icon icon="mdi-eye" class="mr-1" />
                <span>{{ selectedPost.views || 0 }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon icon="mdi-thumb-up" class="mr-1" />
                <span>{{ selectedPost.likes || 0 }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon icon="mdi-comment" class="mr-1" />
                <span>{{ selectedPost.commentCount || 0 }}</span>
              </div>
            </div>

            <div class="d-flex gap-2">
              <v-btn
                :color="selectedPost.isPinned ? 'warning' : 'default'"
                variant="outlined"
                size="small"
                @click="togglePin(selectedPost)"
              >
                <v-icon
                  :icon="selectedPost.isPinned ? 'mdi-pin-off' : 'mdi-pin'"
                  class="mr-1"
                />
                {{ selectedPost.isPinned ? '고정 해제' : '고정' }}
              </v-btn>
              <v-btn
                :color="selectedPost.isDeleted ? 'success' : 'error'"
                variant="outlined"
                size="small"
                @click="toggleDelete(selectedPost)"
              >
                <v-icon
                  :icon="selectedPost.isDeleted ? 'mdi-restore' : 'mdi-delete'"
                  class="mr-1"
                />
                {{ selectedPost.isDeleted ? '복원' : '삭제' }}
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { adminService } from '@/services/admin';

const emit = defineEmits(['post-updated']);

const loading = ref(false);
const posts = ref([]);
const searchTerm = ref('');
const boardFilter = ref('all');
const statusFilter = ref('all');
const includeDeleted = ref(false);

// 다이얼로그 상태
const viewDialog = ref(false);
const selectedPost = ref(null);

// 테이블 헤더
const headers = [
  { title: '제목', key: 'title', width: '40%' },
  { title: '상태', key: 'status', width: '15%' },
  { title: '통계', key: 'stats', width: '15%' },
  { title: '작성일', key: 'createdAt', width: '15%' },
  { title: '작업', key: 'actions', width: '15%', sortable: false },
];

// 필터 옵션
const boardOptions = [
  { title: '전체', value: 'all' },
  { title: '자유게시판', value: 'free' },
  { title: '경기분석', value: 'analysis' },
  { title: '이적소식', value: 'transfer' },
  { title: '팬아트', value: 'fanart' },
];

const statusOptions = [
  { title: '전체', value: 'all' },
  { title: '활성', value: 'active' },
  { title: '고정', value: 'pinned' },
  { title: '삭제됨', value: 'deleted' },
];

// 필터링된 게시글 목록
const filteredPosts = computed(() => {
  let filtered = posts.value;

  // 검색어 필터
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(
      (post) =>
        post.title?.toLowerCase().includes(term) ||
        post.authorName?.toLowerCase().includes(term),
    );
  }

  // 게시판 필터
  if (boardFilter.value !== 'all') {
    filtered = filtered.filter((post) => post.board === boardFilter.value);
  }

  // 상태 필터
  if (statusFilter.value !== 'all') {
    switch (statusFilter.value) {
      case 'active':
        filtered = filtered.filter((post) => !post.isDeleted && !post.isPinned);
        break;
      case 'pinned':
        filtered = filtered.filter((post) => post.isPinned);
        break;
      case 'deleted':
        filtered = filtered.filter((post) => post.isDeleted);
        break;
    }
  }

  return filtered;
});

// 게시글 목록 로드
const loadPosts = async () => {
  loading.value = true;
  try {
    posts.value = await adminService.getPosts({
      limitCount: 100,
      includeDeleted: includeDeleted.value,
    });
  } catch (error) {
    // Failed to load posts
  } finally {
    loading.value = false;
  }
};

// 날짜 포맷팅
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('ko-KR');
};

// 게시글 보기
const viewPost = (post) => {
  selectedPost.value = post;
  viewDialog.value = true;
};

// 게시글 고정/해제
const togglePin = async (post) => {
  try {
    const newPinStatus = !post.isPinned;
    await adminService.togglePostPinned(post.id, newPinStatus);

    // 로컬 상태 업데이트
    const index = posts.value.findIndex((p) => p.id === post.id);
    if (index !== -1) {
      posts.value[index].isPinned = newPinStatus;
    }

    if (selectedPost.value && selectedPost.value.id === post.id) {
      selectedPost.value.isPinned = newPinStatus;
    }

    emit('post-updated');
  } catch (error) {
    // Failed to toggle post pin
  }
};

// 게시글 삭제/복원
const toggleDelete = async (post) => {
  try {
    const newDeleteStatus = !post.isDeleted;
    await adminService.togglePostDeleted(post.id, newDeleteStatus);

    // 로컬 상태 업데이트
    const index = posts.value.findIndex((p) => p.id === post.id);
    if (index !== -1) {
      posts.value[index].isDeleted = newDeleteStatus;
    }

    if (selectedPost.value && selectedPost.value.id === post.id) {
      selectedPost.value.isDeleted = newDeleteStatus;
    }

    emit('post-updated');
  } catch (error) {
    // Failed to toggle post delete
  }
};

onMounted(() => {
  loadPosts();
});
</script>

<style scoped>
.post-manager-container {
  max-width: 100%;
}

.post-table {
  border-radius: 8px;
}

.post-title-cell {
  max-width: 300px;
}

.stats-cell {
  min-width: 80px;
}

.post-content {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(var(--v-theme-surface), 0.5);
}

.text-medium-emphasis {
  opacity: 0.7;
}
</style>
