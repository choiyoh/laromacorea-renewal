<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-account-cog</v-icon>
      포인트 관리
    </v-card-title>

    <v-card-text>
      <!-- 포인트 조정 폼 -->
      <v-form ref="form" v-model="valid" @submit.prevent="adjustPoints">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="targetUserId"
              label="사용자 ID 또는 이메일"
              :rules="userIdRules"
              required
              prepend-icon="mdi-account"
              @blur="searchUser"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="pointsAmount"
              label="포인트 (양수: 지급, 음수: 차감)"
              type="number"
              :rules="pointsRules"
              required
              prepend-icon="mdi-coin"
            />
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="adjustmentNote"
              label="조정 사유"
              :rules="noteRules"
              required
              rows="3"
              prepend-icon="mdi-note-text"
            />
          </v-col>
        </v-row>

        <!-- 대상 사용자 정보 -->
        <v-card v-if="targetUser" variant="outlined" class="mb-4">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar class="me-3">
                <v-img
                  v-if="targetUser.photoURL"
                  :src="targetUser.photoURL"
                  :alt="targetUser.displayName"
                />
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="font-weight-medium">
                  {{ targetUser.displayName || targetUser.email }}
                </div>
                <div class="text-caption text-grey">
                  현재 포인트: {{ (targetUser.points || 0).toLocaleString() }}P
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-btn
          type="submit"
          color="primary"
          :loading="adjusting"
          :disabled="!valid || !targetUser"
          block
        >
          포인트 조정
        </v-btn>
      </v-form>

      <v-divider class="my-6" />

      <!-- 포인트 통계 -->
      <div class="mb-4">
        <h3 class="text-h6 mb-3">포인트 통계</h3>
        <v-btn variant="outlined" size="small" :loading="loadingStats" @click="loadStatistics">
          <v-icon start>mdi-refresh</v-icon>
          통계 새로고침
        </v-btn>
      </div>

      <v-row v-if="statistics">
        <v-col cols="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <div class="text-h6 text-success">{{ statistics.totalEarned.toLocaleString() }}</div>
              <div class="text-caption">총 지급</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <div class="text-h6 text-error">{{ statistics.totalSpent.toLocaleString() }}</div>
              <div class="text-caption">총 사용</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <div class="text-h6 text-warning">
                {{ statistics.totalAdjustments.toLocaleString() }}
              </div>
              <div class="text-caption">관리자 조정</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <div class="text-h6 text-primary">
                {{ statistics.totalTransactions.toLocaleString() }}
              </div>
              <div class="text-caption">총 거래</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <!-- 최근 포인트 내역 -->
      <div class="mb-4">
        <h3 class="text-h6 mb-3">최근 포인트 내역</h3>
        <v-btn variant="outlined" size="small" :loading="loadingHistory" @click="loadRecentHistory">
          <v-icon start>mdi-refresh</v-icon>
          내역 새로고침
        </v-btn>
      </div>

      <v-data-table
        v-if="recentHistory.length"
        :headers="historyHeaders"
        :items="recentHistory"
        :loading="loadingHistory"
        item-value="id"
        class="elevation-1"
      >
        <template #item.amount="{ item }">
          <v-chip :color="item.amount > 0 ? 'success' : 'error'" variant="text" size="small">
            {{ item.amount > 0 ? '+' : '' }}{{ item.amount.toLocaleString() }}P
          </v-chip>
        </template>

        <template #item.type="{ item }">
          <v-chip :color="getTypeColor(item.type)" variant="outlined" size="small">
            {{ getTypeText(item.type) }}
          </v-chip>
        </template>

        <template #item.reason="{ item }">
          {{ getReasonText(item.reason) }}
        </template>

        <template #item.createdAt="{ item }">
          {{ formatDateTime(item.createdAt) }}
        </template>
      </v-data-table>

      <div v-else-if="!loadingHistory" class="text-center py-4 text-grey">
        포인트 내역이 없습니다.
      </div>
    </v-card-text>

    <!-- 성공/에러 스낵바 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { pointsService } from '@/services/points'
import { userService } from '@/services/database'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 폼 상태
const form = ref(null)
const valid = ref(false)
const targetUserId = ref('')
const pointsAmount = ref(0)
const adjustmentNote = ref('')
const adjusting = ref(false)

// 대상 사용자 정보
const targetUser = ref(null)

// 통계 및 내역
const statistics = ref(null)
const recentHistory = ref([])
const loadingStats = ref(false)
const loadingHistory = ref(false)

// 스낵바
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})

// 유효성 검사 규칙
const userIdRules = [(v) => !!v || '사용자 ID 또는 이메일을 입력해주세요.']

const pointsRules = [
  (v) => (v !== null && v !== undefined && v !== '') || '포인트를 입력해주세요.',
  (v) => Number.isInteger(Number(v)) || '정수만 입력 가능합니다.',
  (v) => Math.abs(Number(v)) <= 10000 || '한 번에 최대 10,000포인트까지 조정 가능합니다.',
]

const noteRules = [
  (v) => !!v || '조정 사유를 입력해주세요.',
  (v) => v.length >= 5 || '조정 사유는 최소 5자 이상 입력해주세요.',
]

// 테이블 헤더
const historyHeaders = [
  { title: '사용자 ID', key: 'userId', width: '150px' },
  { title: '타입', key: 'type', width: '100px' },
  { title: '포인트', key: 'amount', width: '100px' },
  { title: '사유', key: 'reason', width: '150px' },
  { title: '일시', key: 'createdAt', width: '150px' },
]

// 사용자 검색
const searchUser = async () => {
  if (!targetUserId.value.trim()) {
    targetUser.value = null
    return
  }

  try {
    // UID로 검색 시도
    let user = await userService.getUser(targetUserId.value.trim())

    if (!user) {
      // 이메일로 검색 (실제로는 Firestore에서 이메일로 직접 검색하기 어려우므로
      // 여기서는 간단히 처리. 실제 구현에서는 Cloud Functions 등을 사용해야 함)
      showSnackbar('사용자를 찾을 수 없습니다. 정확한 사용자 ID를 입력해주세요.', 'error')
      targetUser.value = null
      return
    }

    targetUser.value = user
  } catch (error) {
    console.error('사용자 검색 실패:', error)
    showSnackbar('사용자 검색 중 오류가 발생했습니다.', 'error')
    targetUser.value = null
  }
}

// 포인트 조정
const adjustPoints = async () => {
  if (!form.value.validate() || !targetUser.value) return

  adjusting.value = true

  try {
    await pointsService.adminAdjustPoints(
      targetUser.value.uid,
      pointsAmount.value,
      userStore.user.uid,
      adjustmentNote.value,
    )

    showSnackbar(
      `${targetUser.value.displayName || targetUser.value.email}님의 포인트를 ${pointsAmount.value > 0 ? '지급' : '차감'}했습니다.`,
      'success',
    )

    // 폼 초기화
    targetUserId.value = ''
    pointsAmount.value = 0
    adjustmentNote.value = ''
    targetUser.value = null
    form.value.reset()

    // 통계 및 내역 새로고침
    loadStatistics()
    loadRecentHistory()
  } catch (error) {
    console.error('포인트 조정 실패:', error)
    showSnackbar(error.message || '포인트 조정에 실패했습니다.', 'error')
  } finally {
    adjusting.value = false
  }
}

// 통계 로드
const loadStatistics = async () => {
  loadingStats.value = true

  try {
    statistics.value = await pointsService.getPointsStatistics()
  } catch (error) {
    console.error('통계 로드 실패:', error)
    showSnackbar('통계를 불러올 수 없습니다.', 'error')
  } finally {
    loadingStats.value = false
  }
}

// 최근 내역 로드
const loadRecentHistory = async () => {
  loadingHistory.value = true

  try {
    recentHistory.value = await pointsService.getAllPointsHistory(50)
  } catch (error) {
    console.error('내역 로드 실패:', error)
    showSnackbar('내역을 불러올 수 없습니다.', 'error')
  } finally {
    loadingHistory.value = false
  }
}

// 유틸리티 함수들
const getTypeColor = (type) => {
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

const getTypeText = (type) => {
  switch (type) {
    case 'earned':
      return '획득'
    case 'spent':
      return '사용'
    case 'admin_adjustment':
      return '관리자'
    default:
      return '기타'
  }
}

const getReasonText = (reason) => {
  switch (reason) {
    case 'post_created':
      return '게시글 작성'
    case 'comment_created':
      return '댓글 작성'
    case 'post_liked':
      return '게시글 좋아요'
    case 'comment_liked':
      return '댓글 좋아요'
    case 'icon_purchase':
      return '아이콘 구매'
    case 'daily_login':
      return '일일 로그인'
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

const formatDateTime = (date) => {
  if (!date) return ''
  const targetDate = date instanceof Date ? date : new Date(date)
  return targetDate.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const showSnackbar = (message, color = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadStatistics()
  loadRecentHistory()
})
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}
</style>
