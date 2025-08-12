<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-coin</v-icon>
      포인트 내역
      <v-spacer />
      <v-chip :color="totalPoints >= 0 ? 'success' : 'error'" variant="elevated" size="small">
        {{ totalPoints.toLocaleString() }}P
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- 로딩 상태 -->
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">포인트 내역을 불러오는 중...</p>
      </div>

      <!-- 에러 상태 -->
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <!-- 내역이 없는 경우 -->
      <div v-else-if="!history.length" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-coin-outline</v-icon>
        <p class="text-grey mt-2">포인트 내역이 없습니다.</p>
      </div>

      <!-- 포인트 내역 목록 -->
      <div v-else>
        <v-list lines="two">
          <v-list-item v-for="item in history" :key="item.id" class="px-0">
            <template #prepend>
              <v-avatar :color="getPointColor(item.type)" size="40">
                <v-icon :icon="getPointIcon(item.reason)" color="white" />
              </v-avatar>
            </template>

            <v-list-item-title>
              {{ getReasonText(item.reason) }}
              <v-chip
                :color="item.amount > 0 ? 'success' : 'error'"
                variant="text"
                size="small"
                class="ms-2"
              >
                {{ item.amount > 0 ? '+' : '' }}{{ item.amount.toLocaleString() }}P
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ formatDate(item.createdAt) }}
              <span v-if="item.note" class="ms-2 text-grey"> · {{ item.note }} </span>
            </v-list-item-subtitle>

            <!-- 관리자 조정인 경우 관리자 정보 표시 -->
            <template v-if="item.type === 'admin_adjustment' && item.adminId" #append>
              <v-chip size="x-small" color="warning" variant="outlined"> 관리자 </v-chip>
            </template>
          </v-list-item>
        </v-list>

        <!-- 더 보기 버튼 -->
        <div v-if="hasMore" class="text-center mt-4">
          <v-btn variant="outlined" :loading="loadingMore" @click="loadMore"> 더 보기 </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { pointsService } from '@/services/points'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 상태
const history = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref(null)
const hasMore = ref(true)
const limit = 20

// 계산된 속성
const totalPoints = computed(() => userStore.userPoints)

// 포인트 타입별 색상
const getPointColor = (type) => {
  switch (type) {
    case 'earned':
      return 'success'
    case 'spent':
      return 'error'
    case 'admin_adjustment':
      return 'warning'
    default:
      return 'grey'
  }
}

// 포인트 사유별 아이콘
const getPointIcon = (reason) => {
  switch (reason) {
    case 'post_created':
      return 'mdi-file-document-plus'
    case 'comment_created':
      return 'mdi-comment-plus'
    case 'post_liked':
    case 'comment_liked':
      return 'mdi-heart'
    case 'icon_purchase':
      return 'mdi-shopping'
    case 'daily_login':
      return 'mdi-calendar-check'
    case 'admin_bonus':
      return 'mdi-gift'
    case 'admin_penalty':
      return 'mdi-alert'
    case 'admin_adjustment':
      return 'mdi-account-cog'
    default:
      return 'mdi-coin'
  }
}

// 포인트 사유별 텍스트
const getReasonText = (reason) => {
  switch (reason) {
    case 'post_created':
      return '게시글 작성'
    case 'comment_created':
      return '댓글 작성'
    case 'post_liked':
      return '게시글 좋아요 받음'
    case 'comment_liked':
      return '댓글 좋아요 받음'
    case 'icon_purchase':
      return '아이콘 구매'
    case 'daily_login':
      return '일일 로그인 보너스'
    case 'admin_bonus':
      return '관리자 보너스'
    case 'admin_penalty':
      return '관리자 차감'
    case 'admin_adjustment':
      return '관리자 조정'
    default:
      return '기타'
  }
}

// 날짜 포맷팅
const formatDate = (date) => {
  if (!date) return ''

  const now = new Date()
  const targetDate = date instanceof Date ? date : new Date(date)
  const diffTime = now - targetDate
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return targetDate.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } else if (diffDays === 1) {
    return '어제'
  } else if (diffDays < 7) {
    return `${diffDays}일 전`
  } else {
    return targetDate.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    })
  }
}

// 포인트 내역 로드
const loadHistory = async (isLoadMore = false) => {
  if (!userStore.user?.uid) return

  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    error.value = null
  }

  try {
    const newHistory = await pointsService.getPointsHistory(
      userStore.user.uid,
      isLoadMore ? limit : limit,
    )

    if (isLoadMore) {
      // 중복 제거하고 추가
      const existingIds = new Set(history.value.map((item) => item.id))
      const uniqueNewHistory = newHistory.filter((item) => !existingIds.has(item.id))
      history.value.push(...uniqueNewHistory)

      // 더 이상 로드할 데이터가 없는지 확인
      hasMore.value = uniqueNewHistory.length === limit
    } else {
      history.value = newHistory
      hasMore.value = newHistory.length === limit
    }
  } catch (err) {
    console.error('포인트 내역 로드 실패:', err)
    error.value = err.message || '포인트 내역을 불러올 수 없습니다.'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 더 보기
const loadMore = () => {
  loadHistory(true)
}

// 새로고침
const refresh = () => {
  history.value = []
  hasMore.value = true
  loadHistory()
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadHistory()
})

// 외부에서 사용할 수 있도록 노출
defineExpose({
  refresh,
})
</script>

<style scoped>
.v-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.v-list-item:last-child {
  border-bottom: none;
}
</style>
