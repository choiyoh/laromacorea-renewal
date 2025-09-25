<template>
  <div class="home">
    <v-container fluid class="home-container">
      <!-- 헤더 섹션 -->
      <v-row class="mb-6">
        <v-col cols="12">
          <div class="text-center">
            <div class="main-logo-wrapper mb-4">
              <img
                src="/images/main-logo.gif"
                alt="La Roma Corea"
                class="main-logo-image"
              />
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- 첫 번째 줄: Next Match, Recent Match, Notice -->
      <v-row class="mb-4 info-cards-row">
        <!-- 다음 경기 -->
        <v-col cols="12" md="4" class="mb-3">
          <div class="info-card-wrapper">
            <MatchSchedule />
          </div>
        </v-col>

        <!-- 최근 경기 결과 -->
        <v-col cols="12" md="4" class="mb-3">
          <div class="info-card-wrapper">
            <MatchResults />
          </div>
        </v-col>

        <!-- Notice 게시판 -->
        <v-col cols="12" md="4" class="mb-3">
          <v-card class="board-section" variant="outlined" height="100%">
            <!-- 게시판 헤더 -->
            <v-card-title
              class="board-header-roma d-flex align-center py-2 px-4"
            >
              <v-icon
                icon="mdi-bullhorn"
                color="white"
                class="mr-3"
                size="28"
              />
              <div class="flex-grow-1">
                <div class="text-h6 font-weight-bold text-white cinzel-font">Notice</div>
              </div>
              <v-btn
                to="/board/notice"
                variant="text"
                size="small"
                color="white"
                class="text-white"
              >
                더보기
                <v-icon icon="mdi-chevron-right" end color="white" />
              </v-btn>
            </v-card-title>

            <v-divider />

            <!-- 최근 게시물 목록 -->
            <v-card-text class="pa-0">
              <v-list class="py-0 post-list-fixed">
                <!-- 5줄 고정 표시 -->
                <template v-for="index in 5" :key="`notice-${index}`">
                  <v-list-item
                    v-if="
                      boardPosts['notice'] && boardPosts['notice'][index - 1]
                    "
                    class="post-item"
                    @click="
                      handlePostClick(
                        'notice',
                        boardPosts['notice'][index - 1].id,
                      )
                    "
                  >
                    <v-list-item-title
                      class="d-flex align-center justify-space-between post-title-row"
                    >
                      <div class="post-title-content">
                        <span
                          v-if="boardPosts['notice'][index - 1].isPinned"
                          class="pinned-badge"
                        >
                          <v-icon icon="mdi-pin" size="14" color="error" />
                        </span>
                        <span class="post-title">{{
                          boardPosts['notice'][index - 1].title
                        }}</span>
                        <span
                          v-if="
                            boardPosts['notice'][index - 1].commentCount > 0
                          "
                          class="comment-count"
                        >
                          [{{ boardPosts['notice'][index - 1].commentCount }}]
                        </span>
                      </div>
                      <div class="post-date">
                        <span class="text-caption">{{
                          formatDate(boardPosts['notice'][index - 1].createdAt)
                        }}</span>
                      </div>
                    </v-list-item-title>
                  </v-list-item>

                  <!-- 게시물이 없는 경우 빈 슬롯 -->
                  <v-list-item v-else class="post-item post-item-empty">
                    <v-list-item-title
                      class="d-flex align-center justify-space-between"
                    >
                      <span class="text-medium-emphasis">
                        <span v-if="index === 1">아직 게시물이 없습니다</span>
                        <span v-else>-</span>
                      </span>
                    </v-list-item-title>
                  </v-list-item>

                  <!-- 구분선 (마지막 항목 제외) -->
                  <v-divider v-if="index < 5" class="post-divider" />
                </template>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 게시판별 최근 게시물 (Notice 제외) -->
      <v-row>
        <v-col
          v-for="board in filteredBoardTypes"
          :key="board.id"
          cols="12"
          md="4"
          lg="4"
          class="mb-4"
        >
          <v-card class="board-section" variant="outlined" height="100%">
            <!-- 게시판 헤더 -->
            <v-card-title
              class="board-header-roma d-flex align-center py-2 px-4"
            >
              <v-icon :icon="board.icon" color="white" class="mr-3" size="28" />
              <div class="flex-grow-1">
                <div class="text-h6 font-weight-bold text-white cinzel-font">
                  {{ board.name }}
                </div>
                <!-- <div class="text-caption text-white" style="opacity: 0.9">
                  {{ board.description }}
                </div> -->
              </div>
              <v-btn
                :to="`/board/${board.id}`"
                variant="text"
                size="small"
                color="white"
                class="text-white"
              >
                더보기
                <v-icon icon="mdi-chevron-right" end color="white" />
              </v-btn>
            </v-card-title>

            <v-divider />

            <!-- 최근 게시물 목록 -->
            <v-card-text class="pa-0">
              <v-list class="py-0 post-list-fixed">
                <!-- 5줄 고정 표시 -->
                <template v-for="index in 5" :key="`${board.id}-${index}`">
                  <v-list-item
                    v-if="
                      boardPosts[board.id] && boardPosts[board.id][index - 1]
                    "
                    class="post-item"
                    @click="
                      handlePostClick(
                        board.id,
                        boardPosts[board.id][index - 1].id,
                      )
                    "
                  >
                    <v-list-item-title
                      class="d-flex align-center justify-space-between post-title-row"
                    >
                      <div class="post-title-content">
                        <span
                          v-if="boardPosts[board.id][index - 1].isPinned"
                          class="pinned-badge"
                        >
                          <v-icon icon="mdi-pin" size="14" color="error" />
                        </span>
                        <span class="post-title">{{
                          boardPosts[board.id][index - 1].title
                        }}</span>
                        <span
                          v-if="
                            boardPosts[board.id][index - 1].commentCount > 0
                          "
                          class="comment-count"
                        >
                          [{{ boardPosts[board.id][index - 1].commentCount }}]
                        </span>
                      </div>
                      <div class="post-date">
                        <span class="text-caption">{{
                          formatDate(boardPosts[board.id][index - 1].createdAt)
                        }}</span>
                      </div>
                    </v-list-item-title>
                  </v-list-item>

                  <!-- 게시물이 없는 경우 빈 슬롯 -->
                  <v-list-item v-else class="post-item post-item-empty">
                    <v-list-item-title
                      class="d-flex align-center justify-space-between"
                    >
                      <span class="text-medium-emphasis">
                        <span v-if="index === 1">아직 게시물이 없습니다</span>
                        <span v-else>-</span>
                      </span>
                    </v-list-item-title>
                  </v-list-item>

                  <!-- 구분선 (마지막 항목 제외) -->
                  <v-divider v-if="index < 5" class="post-divider" />
                </template>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 로딩 상태 -->
      <v-row v-if="loading" justify="center" class="my-8">
        <v-col cols="auto">
          <v-progress-circular indeterminate color="primary" size="48" />
          <div class="text-center mt-2">게시물을 불러오는 중...</div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '@vueuse/head';
import { useBoardsStore } from '@/stores/boards';
import { useUserStore } from '@/stores/user';

import { statsService } from '@/services/stats';
import MatchSchedule from '@/components/match/MatchSchedule.vue';
import MatchResults from '@/components/match/MatchResults.vue';

const router = useRouter();
const boardsStore = useBoardsStore();
const userStore = useUserStore();
const loading = ref(true);
const boardPosts = ref({});

// 전체 통계
const totalStats = ref({
  users: 0,
  posts: 0,
  comments: 0,
});

const boardTypes = computed(() =>
  boardsStore.boardTypes.map((board) => ({
    ...board,
    color: getBoardColor(board.id),
    description: getBoardDescription(board.id),
  })),
);

// Notice를 제외한 게시판 목록 (3-3 배치용)
const filteredBoardTypes = computed(() =>
  boardTypes.value.filter((board) => board.id !== 'notice'),
);

// 게시판별 색상 설정
function getBoardColor(boardId) {
  const colors = {
    free: '#1976D2', // 파란색 - Free
    analysis: '#388E3C', // 초록색 - Match Analysis
    transfer: '#F57C00', // 주황색 - Transfer News
    fanart: '#7B1FA2', // 보라색 - Fan Art
    notice: '#D32F2F', // 빨간색 - Notice
  };
  return colors[boardId] || '#1976D2';
}

// 게시판별 설명 설정
function getBoardDescription(boardId) {
  const descriptions = {
    free: 'Share your thoughts and stories freely',
    analysis: 'Match analysis and tactical discussions',
    transfer: 'Transfer news and rumors',
    fanart: 'Fan art and creative works',
    notice: 'Official announcements and important news',
  };
  return descriptions[boardId] || 'Board description';
}

// 게시물 클릭 핸들러
function handlePostClick(boardId, postId) {
  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!userStore.isAuthenticated) {
    router.push('/auth');
    return;
  }

  // 로그인된 사용자는 게시물 상세 페이지로 이동
  router.push(`/board/${boardId}/post/${postId}`);
}

// 날짜 포맷팅
function formatDate(timestamp) {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else {
    return '방금 전';
  }
}

// 캐싱된 통계 데이터 로드 (Firestore 읽기 사용량 최소화)
async function loadStats() {
  try {
    const stats = await statsService.getSiteStats();
    totalStats.value = {
      users: stats.users,
      posts: stats.posts,
      comments: stats.comments,
    };
  } catch (error) {
    console.error('통계 로드 실패:', error);
    // 에러 발생 시 기본값 유지
    totalStats.value = {
      users: 170,
      posts: 850,
      comments: 2100,
    };
  }
}

// 각 게시판별 최근 게시물 로드 (캐싱됨, 통계 쿼리 제거)
async function loadBoardPosts(forceRefresh = false) {
  loading.value = true;

  try {
    // 강제 새로고침 시 캐시 무효화
    if (forceRefresh) {
      statsService.invalidateCache();
    }

    const cachedPosts = await statsService.getBoardPosts(boardTypes.value);
    boardPosts.value = cachedPosts;
  } catch (error) {
    console.error('게시판 게시글 로드 실패:', error);
    // 에러 발생 시 빈 배열로 설정
    boardTypes.value.forEach((board) => {
      boardPosts.value[board.id] = [];
    });
  } finally {
    loading.value = false;
  }
}

// 임시 게시물 데이터 생성 (실제 데이터가 없을 때)

// SEO 메타 태그 설정
useHead({
  title: 'La Roma Corea - AS 로마 한국 팬 커뮤니티',
  meta: [
    {
      name: 'description',
      content:
        'AS 로마 한국 팬들을 위한 공식 커뮤니티. 경기 분석, 이적 소식, 팬 아트 등 다양한 콘텐츠를 만나보세요.',
    },
    {
      name: 'keywords',
      content: 'AS로마, 로마, 세리에A, 축구, 팬클럽, 커뮤니티, 이탈리아축구',
    },
    {
      property: 'og:title',
      content: 'La Roma Corea - AS 로마 한국 팬 커뮤니티',
    },
    {
      property: 'og:description',
      content:
        'AS 로마 한국 팬들을 위한 공식 커뮤니티. 경기 분석, 이적 소식, 팬 아트 등 다양한 콘텐츠를 만나보세요.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:image',
      content: '/images/main-logo.gif',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
  ],
});

// 페이지 포커스 시 데이터 새로고침
function handleVisibilityChange() {
  if (!document.hidden) {
    // 페이지가 다시 보일 때 데이터 새로고침
    loadBoardPosts(true);
  }
}

onMounted(() => {
  loadStats();
  loadBoardPosts();

  // 페이지 가시성 변경 이벤트 리스너 추가
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
.home {
  background: #ffffff;
  min-height: 100vh;
}

/* Cinzel 폰트 적용 */
.cinzel-font {
  font-family: 'Cinzel', serif !important;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.home-container {
  padding: 16px;
}

/* 메인 로고 스타일 */
.main-logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.main-logo-image {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid #e0e0e0;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.main-logo-image:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.board-section {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  background: #ffffff;
}

.board-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.board-header-roma {
  background: linear-gradient(180deg, #fbba00 0%, #990a2c 100%);
  border-bottom: none;
  color: white;
}

.board-header-roma .text-white {
  color: white !important;
}

.post-list-fixed {
  height: 300px; /* 5줄 고정 높이 */
}

.post-item {
  transition: background-color 0.2s;
  border-radius: 0;
  min-height: 56px; /* 각 항목 최소 높이 */
  height: 56px; /* 고정 높이 */
}

.post-item:hover:not(.post-item-empty) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.post-item-empty {
  cursor: default;
  opacity: 0.5;
}

.post-item-empty:hover {
  background-color: transparent;
}

.post-divider {
  margin: 0 16px;
  opacity: 0.3;
}

.post-title-row {
  width: 100%;
  align-items: center;
}

.post-title-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0; /* 텍스트 오버플로우를 위해 필요 */
}

.post-title {
  font-size: 0.9rem;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.pinned-badge {
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
  flex-shrink: 0;
}

.comment-count {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  font-size: 0.8rem;
  margin-left: 6px;
  flex-shrink: 0;
}

.post-date {
  flex-shrink: 0;
  margin-left: 12px;
}

.post-date .text-caption {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.border-bottom {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}

.text-medium-emphasis {
  opacity: 0.7;
}

/* 정보 카드 래퍼 스타일 */
.info-card-wrapper {
  height: 100%;
}

.info-card-wrapper .v-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.info-card-wrapper .v-card .v-card-text {
  flex: 1;
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .home {
    background: #ffffff;
  }

  .board-section {
    margin-bottom: 16px;
  }

  .main-logo-wrapper {
    padding: 12px;
  }

  .main-logo-image {
    max-width: 90%;
    border-radius: 10px;
  }

  /* 모바일에서는 정보 카드들이 세로로 쌓이므로 높이 제한 해제 */
  .info-card-wrapper {
    height: auto;
  }
}

@media (max-width: 600px) {
  .home-container {
    padding: 0 !important;
  }

  .post-title {
    font-size: 0.85rem;
  }

  .post-date .text-caption {
    font-size: 0.7rem;
  }

  .comment-count {
    font-size: 0.75rem;
  }

  .main-logo-wrapper {
    padding: 0;
    margin-bottom: 16px;
  }

  .main-logo-image {
    width: 100%;
    max-width: 100%;
    border-radius: 0;
    border: none;
    box-shadow: none;
  }

  .main-logo-image:hover {
    transform: none;
    box-shadow: none;
  }

  /* 모바일에서 게시판 카드들도 패딩 조정 */
  .board-section {
    margin-bottom: 8px;
    border-radius: 0;
  }

  /* v-row와 v-col 패딩 완전 제거 */
  .home .v-row {
    margin: 0 !important;
  }

  .home .v-col,
  .home .v-col-12,
  .home .v-col-md-6,
  .home .v-col-lg-4 {
    padding: 0 !important;
  }

  /* 통계 섹션 패딩 */
  .mb-6 {
    margin-bottom: 1rem !important;
  }

  .mb-4 {
    margin-bottom: 0.5rem !important;
  }
}
</style>
