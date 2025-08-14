<template>
  <div class="home">
    <v-container fluid class="home-container">
      <!-- 헤더 섹션 -->
      <v-row class="mb-6">
        <v-col cols="12">
          <div class="text-center">
            <div class="main-logo-wrapper mb-4">
              <img src="/images/main-logo.gif" alt="La Roma Corea" class="main-logo-image" />
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- 경기 일정, 결과 및 공지사항 섹션 -->
      <v-row class="mb-4 info-cards-row">
        <!-- 다음 경기 (가장 중요) -->
        <v-col cols="12" sm="6" lg="4" class="mb-3">
          <div class="info-card-wrapper">
            <MatchSchedule />
          </div>
        </v-col>

        <!-- 최근 경기 결과 -->
        <v-col cols="12" sm="6" lg="4" class="mb-3">
          <div class="info-card-wrapper">
            <MatchResults />
          </div>
        </v-col>

        <!-- 공지사항 -->
        <v-col cols="12" sm="12" lg="4" class="mb-3">
          <div class="info-card-wrapper">
            <NoticeBoard />
          </div>
        </v-col>
      </v-row>

      <!-- 게시판별 최근 게시물 -->
      <v-row>
        <v-col v-for="board in boardTypes" :key="board.id" cols="12" md="6" lg="4" class="mb-4">
          <v-card class="board-section" variant="outlined" height="100%">
            <!-- 게시판 헤더 -->
            <v-card-title class="board-header-roma d-flex align-center py-2 px-4">
              <v-icon :icon="board.icon" color="white" class="mr-3" size="28" />
              <div class="flex-grow-1">
                <div class="text-h6 font-weight-bold text-white">
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
                    v-if="boardPosts[board.id] && boardPosts[board.id][index - 1]"
                    :to="`/board/${board.id}/post/${boardPosts[board.id][index - 1].id}`"
                    class="post-item"
                  >
                    <v-list-item-title
                      class="d-flex align-center justify-space-between post-title-row"
                    >
                      <div class="post-title-content">
                        <span v-if="boardPosts[board.id][index - 1].isPinned" class="pinned-badge">
                          <v-icon icon="mdi-pin" size="14" color="error" />
                        </span>
                        <span class="post-title">{{ boardPosts[board.id][index - 1].title }}</span>
                        <span
                          v-if="boardPosts[board.id][index - 1].commentCount > 0"
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
                    <v-list-item-title class="d-flex align-center justify-space-between">
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
import { ref, computed, onMounted } from 'vue'
import { useBoardsStore } from '@/stores/boards'
import { postService } from '@/services/database'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import MatchSchedule from '@/components/match/MatchSchedule.vue'
import MatchResults from '@/components/match/MatchResults.vue'

const boardsStore = useBoardsStore()
const loading = ref(true)
const boardPosts = ref({})

// 전체 통계
const totalStats = ref({
  users: 0,
  posts: 0,
  comments: 0,
})

const boardTypes = computed(() =>
  boardsStore.boardTypes.map((board) => ({
    ...board,
    color: getBoardColor(board.id),
    description: getBoardDescription(board.id),
  })),
)

// 게시판별 색상 설정
function getBoardColor(boardId) {
  const colors = {
    free: '#1976D2', // 파란색 - 자유게시판
    analysis: '#388E3C', // 초록색 - 경기분석
    transfer: '#F57C00', // 주황색 - 이적소식
    fanart: '#7B1FA2', // 보라색 - 팬아트
    notice: '#D32F2F', // 빨간색 - 공지사항
  }
  return colors[boardId] || '#1976D2'
}

// 게시판별 설명 설정
function getBoardDescription(boardId) {
  const descriptions = {
    free: '자유로운 이야기를 나누는 공간',
    analysis: '경기 분석과 전술 토론',
    transfer: '이적 소식과 루머',
    fanart: '팬아트와 창작물',
    notice: '공지사항과 중요 소식',
  }
  return descriptions[boardId] || '게시판 설명'
}

// 날짜 포맷팅
function formatDate(timestamp) {
  if (!timestamp) return ''

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days > 0) {
    return `${days}일 전`
  } else if (hours > 0) {
    return `${hours}시간 전`
  } else if (minutes > 0) {
    return `${minutes}분 전`
  } else {
    return '방금 전'
  }
}

// 실제 통계 데이터 로드
async function loadStats() {
  try {
    // 사용자 수 조회
    const usersSnapshot = await getDocs(collection(db, 'users'))
    totalStats.value.users = usersSnapshot.size

    // 게시글 수 조회 (삭제되지 않은 것만)
    const postsQuery = query(collection(db, 'posts'), where('isDeleted', '==', false))
    const postsSnapshot = await getDocs(postsQuery)
    totalStats.value.posts = postsSnapshot.size

    // 댓글 수 조회 (삭제되지 않은 것만)
    const commentsQuery = query(collection(db, 'comments'), where('isDeleted', '==', false))
    const commentsSnapshot = await getDocs(commentsQuery)
    totalStats.value.comments = commentsSnapshot.size
  } catch (error) {
    console.error('Failed to load stats:', error)
    // 에러 발생 시 기본값 유지
    totalStats.value = {
      users: 1247,
      posts: 3892,
      comments: 8456,
    }
  }
}

// 게시글의 실제 댓글 수와 좋아요 수 로드
async function loadPostStats(posts) {
  const postsWithStats = await Promise.all(
    posts.map(async (post) => {
      try {
        // 댓글 수 조회
        const commentsQuery = query(
          collection(db, 'comments'),
          where('postId', '==', post.id),
          where('isDeleted', '==', false),
        )
        const commentsSnapshot = await getDocs(commentsQuery)

        // 좋아요 수 조회 (likes 서브컬렉션)
        const likesSnapshot = await getDocs(collection(db, 'posts', post.id, 'likes'))

        return {
          ...post,
          commentCount: commentsSnapshot.size,
          likeCount: likesSnapshot.size,
        }
      } catch (error) {
        console.error(`Failed to load stats for post ${post.id}:`, error)
        return {
          ...post,
          commentCount: post.commentCount || 0,
          likeCount: post.likeCount || 0,
        }
      }
    }),
  )

  return postsWithStats
}

// 각 게시판별 최근 게시물 로드
async function loadBoardPosts() {
  loading.value = true

  try {
    const promises = boardTypes.value.map(async (board) => {
      try {
        const posts = await postService.getPosts(board.id, {
          limitCount: 5,
          sortBy: 'latest',
        })

        // 실제 댓글 수와 좋아요 수 로드
        const postsWithStats = await loadPostStats(posts)

        return { boardId: board.id, posts: postsWithStats }
      } catch (error) {
        console.error(`Failed to load posts for board ${board.id}:`, error)
        return { boardId: board.id, posts: [] }
      }
    })

    const results = await Promise.all(promises)

    // 결과를 boardPosts 객체에 저장
    results.forEach(({ boardId, posts }) => {
      boardPosts.value[boardId] = posts
    })
  } catch (error) {
    console.error('Failed to load board posts:', error)

    // 에러 발생 시 임시 데이터로 대체
    boardTypes.value.forEach((board) => {
      boardPosts.value[board.id] = generateMockPosts(board.id)
    })
  } finally {
    loading.value = false
  }
}

// 임시 게시물 데이터 생성 (실제 데이터가 없을 때)
function generateMockPosts(boardId) {
  const mockTitles = {
    free: [
      '오늘 경기 어떻게 보셨나요?',
      '로마 유니폼 구매 후기',
      '이탈리아 여행 다녀왔습니다',
      '새로운 시즌 기대되네요',
      '로마 팬이 된 계기',
    ],
    analysis: [
      '무리뉴 전술 분석',
      '펠레그리니 플레이 스타일',
      '상대팀 약점 분석',
      '이번 시즌 포메이션 변화',
      '선수별 스탯 비교',
    ],
    transfer: [
      '새로운 영입 루머',
      '여름 이적시장 정리',
      '임대 선수 복귀 소식',
      '계약 연장 뉴스',
      '방출 예정 선수들',
    ],
    fanart: [
      '로마 로고 리디자인',
      '선수 일러스트 작업',
      '경기장 사진 모음',
      '팬아트 콘테스트',
      '로마 배경화면 제작',
    ],
    notice: [
      '커뮤니티 이용 규칙',
      '새로운 기능 업데이트',
      '정기 점검 안내',
      '이벤트 당첨자 발표',
      '운영진 모집 공고',
    ],
  }

  const titles = mockTitles[boardId] || mockTitles.free

  return titles.map((title, index) => ({
    id: `${boardId}_${index}`,
    title,
    authorName: `로마팬${Math.floor(Math.random() * 100)}`,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    commentCount: Math.floor(Math.random() * 20),
    likeCount: Math.floor(Math.random() * 50),
    isPinned: index === 0 && Math.random() > 0.7,
  }))
}

onMounted(() => {
  loadStats()
  loadBoardPosts()
})
</script>

<style scoped>
.home {
  background: #ffffff;
  min-height: 100vh;
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
