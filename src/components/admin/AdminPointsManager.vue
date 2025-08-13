<template>
  <div class="points-manager-container">
    <!-- 포인트 통계 -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card color="primary" variant="elevated">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon icon="mdi-star" size="32" class="mr-3" />
              <div>
                <div class="text-h5 font-weight-bold">{{ totalPoints }}</div>
                <div class="text-subtitle-2">총 포인트</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="success" variant="elevated">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon icon="mdi-plus-circle" size="32" class="mr-3" />
              <div>
                <div class="text-h5 font-weight-bold">{{ todayEarned }}</div>
                <div class="text-subtitle-2">오늘 획득</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="warning" variant="elevated">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon icon="mdi-minus-circle" size="32" class="mr-3" />
              <div>
                <div class="text-h5 font-weight-bold">{{ todaySpent }}</div>
                <div class="text-subtitle-2">오늘 사용</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="info" variant="elevated">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon icon="mdi-account-star" size="32" class="mr-3" />
              <div>
                <div class="text-h5 font-weight-bold">{{ avgPoints }}</div>
                <div class="text-subtitle-2">평균 포인트</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 포인트 관리 탭 -->
    <v-card variant="outlined">
      <v-tabs v-model="activeTab" color="primary">
        <v-tab value="history">
          <v-icon icon="mdi-history" class="mr-2" />
          포인트 히스토리
        </v-tab>
        <v-tab value="bulk">
          <v-icon icon="mdi-account-multiple" class="mr-2" />
          일괄 지급
        </v-tab>
        <v-tab value="settings">
          <v-icon icon="mdi-cog" class="mr-2" />
          포인트 설정
        </v-tab>
      </v-tabs>

      <v-card-text class="pa-6">
        <v-window v-model="activeTab">
          <!-- 포인트 히스토리 탭 -->
          <v-window-item value="history">
            <div class="mb-4">
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="searchTerm"
                    label="사용자 검색"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="typeFilter"
                    label="유형 필터"
                    :items="typeOptions"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="dateFilter"
                    label="날짜 필터"
                    type="date"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn
                    color="primary"
                    variant="elevated"
                    @click="loadHistory"
                    :loading="loading"
                    block
                  >
                    새로고침
                  </v-btn>
                </v-col>
              </v-row>
            </div>

            <v-data-table
              :headers="historyHeaders"
              :items="filteredHistory"
              :loading="loading"
              class="history-table"
            >
              <template #item.user="{ item }">
                <div class="d-flex align-center">
                  <v-avatar size="24" class="mr-2">
                    <v-img v-if="item.userPhoto" :src="item.userPhoto" />
                    <v-icon v-else icon="mdi-account" />
                  </v-avatar>
                  <span>{{ item.userName || '알 수 없음' }}</span>
                </div>
              </template>

              <template #item.points="{ item }">
                <v-chip
                  :color="item.points > 0 ? 'success' : 'error'"
                  size="small"
                  variant="elevated"
                >
                  {{ item.points > 0 ? '+' : '' }}{{ item.points }}
                </v-chip>
              </template>

              <template #item.type="{ item }">
                <v-chip :color="getTypeColor(item.type)" size="small" variant="outlined">
                  {{ getTypeText(item.type) }}
                </v-chip>
              </template>

              <template #item.createdAt="{ item }">
                {{ formatDateTime(item.createdAt) }}
              </template>
            </v-data-table>
          </v-window-item>

          <!-- 일괄 지급 탭 -->
          <v-window-item value="bulk">
            <v-form @submit.prevent="bulkAwardPoints">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-4">
                    <h3 class="text-h6 mb-4">일괄 포인트 지급</h3>

                    <v-select
                      v-model="bulkTarget"
                      label="대상 선택"
                      :items="bulkTargetOptions"
                      variant="outlined"
                      class="mb-3"
                    />

                    <v-text-field
                      v-model.number="bulkPoints"
                      label="지급할 포인트"
                      type="number"
                      variant="outlined"
                      class="mb-3"
                    />

                    <v-textarea
                      v-model="bulkReason"
                      label="지급 사유"
                      variant="outlined"
                      rows="3"
                      class="mb-3"
                    />

                    <v-btn
                      type="submit"
                      color="primary"
                      variant="elevated"
                      :loading="bulkLoading"
                      block
                    >
                      <v-icon icon="mdi-star" class="mr-2" />
                      포인트 지급
                    </v-btn>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-4">
                    <h3 class="text-h6 mb-4">개별 포인트 지급</h3>

                    <v-autocomplete
                      v-model="individualUser"
                      label="사용자 선택"
                      :items="userOptions"
                      item-title="displayName"
                      item-value="id"
                      variant="outlined"
                      class="mb-3"
                      clearable
                    />

                    <v-text-field
                      v-model.number="individualPoints"
                      label="지급할 포인트"
                      type="number"
                      variant="outlined"
                      class="mb-3"
                    />

                    <v-textarea
                      v-model="individualReason"
                      label="지급 사유"
                      variant="outlined"
                      rows="3"
                      class="mb-3"
                    />

                    <v-btn
                      color="success"
                      variant="elevated"
                      @click="awardIndividualPoints"
                      :loading="individualLoading"
                      :disabled="!individualUser"
                      block
                    >
                      <v-icon icon="mdi-account-star" class="mr-2" />
                      개별 지급
                    </v-btn>
                  </v-card>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <!-- 포인트 설정 탭 -->
          <v-window-item value="settings">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4">
                  <h3 class="text-h6 mb-4">포인트 획득 설정</h3>

                  <div class="setting-item">
                    <v-text-field
                      v-model.number="settings.postPoints"
                      label="게시글 작성"
                      type="number"
                      variant="outlined"
                      suffix="포인트"
                      class="mb-3"
                    />
                  </div>

                  <div class="setting-item">
                    <v-text-field
                      v-model.number="settings.commentPoints"
                      label="댓글 작성"
                      type="number"
                      variant="outlined"
                      suffix="포인트"
                      class="mb-3"
                    />
                  </div>

                  <div class="setting-item">
                    <v-text-field
                      v-model.number="settings.likePoints"
                      label="좋아요 받기"
                      type="number"
                      variant="outlined"
                      suffix="포인트"
                      class="mb-3"
                    />
                  </div>

                  <div class="setting-item">
                    <v-text-field
                      v-model.number="settings.dailyLoginPoints"
                      label="일일 로그인"
                      type="number"
                      variant="outlined"
                      suffix="포인트"
                      class="mb-3"
                    />
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4">
                  <h3 class="text-h6 mb-4">포인트 사용 설정</h3>

                  <div class="setting-item">
                    <v-text-field
                      v-model.number="settings.iconPrice"
                      label="아이콘 구매"
                      type="number"
                      variant="outlined"
                      suffix="포인트"
                      class="mb-3"
                    />
                  </div>

                  <div class="setting-item">
                    <v-text-field
                      v-model.number="settings.highlightPrice"
                      label="게시글 강조"
                      type="number"
                      variant="outlined"
                      suffix="포인트"
                      class="mb-3"
                    />
                  </div>

                  <div class="setting-item">
                    <v-text-field
                      v-model.number="settings.pinPrice"
                      label="게시글 고정"
                      type="number"
                      variant="outlined"
                      suffix="포인트"
                      class="mb-3"
                    />
                  </div>

                  <v-btn
                    color="primary"
                    variant="elevated"
                    @click="saveSettings"
                    :loading="settingsLoading"
                    block
                  >
                    <v-icon icon="mdi-content-save" class="mr-2" />
                    설정 저장
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminService } from '@/services/admin'
import { useUserStore } from '@/stores/user'

const emit = defineEmits(['points-updated'])

const userStore = useUserStore()
const activeTab = ref('history')
const loading = ref(false)
const bulkLoading = ref(false)
const individualLoading = ref(false)
const settingsLoading = ref(false)

// 통계 데이터
const totalPoints = ref(0)
const todayEarned = ref(0)
const todaySpent = ref(0)
const avgPoints = ref(0)

// 히스토리 데이터
const history = ref([])
const searchTerm = ref('')
const typeFilter = ref('all')
const dateFilter = ref('')

// 일괄 지급 데이터
const bulkTarget = ref('all_users')
const bulkPoints = ref(0)
const bulkReason = ref('')

// 개별 지급 데이터
const individualUser = ref(null)
const individualPoints = ref(0)
const individualReason = ref('')
const userOptions = ref([])

// 설정 데이터
const settings = ref({
  postPoints: 10,
  commentPoints: 5,
  likePoints: 2,
  dailyLoginPoints: 5,
  iconPrice: 100,
  highlightPrice: 50,
  pinPrice: 200,
})

// 테이블 헤더
const historyHeaders = [
  { title: '사용자', key: 'user' },
  { title: '포인트', key: 'points' },
  { title: '유형', key: 'type' },
  { title: '사유', key: 'reason' },
  { title: '일시', key: 'createdAt' },
]

// 필터 옵션
const typeOptions = [
  { title: '전체', value: 'all' },
  { title: '게시글 작성', value: 'post_create' },
  { title: '댓글 작성', value: 'comment_create' },
  { title: '좋아요 받기', value: 'like_received' },
  { title: '관리자 지급', value: 'admin_bonus' },
  { title: '관리자 차감', value: 'admin_penalty' },
  { title: '아이콘 구매', value: 'icon_purchase' },
]

const bulkTargetOptions = [
  { title: '모든 사용자', value: 'all_users' },
  { title: '활성 사용자', value: 'active_users' },
  { title: '신규 사용자 (7일)', value: 'new_users' },
  { title: 'VIP 사용자', value: 'vip_users' },
]

// 필터링된 히스토리
const filteredHistory = computed(() => {
  let filtered = history.value

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter((item) => item.userName?.toLowerCase().includes(term))
  }

  if (typeFilter.value !== 'all') {
    filtered = filtered.filter((item) => item.type === typeFilter.value)
  }

  if (dateFilter.value) {
    const filterDate = new Date(dateFilter.value)
    filtered = filtered.filter((item) => {
      const itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)
      return itemDate.toDateString() === filterDate.toDateString()
    })
  }

  return filtered
})

// 유형 색상
const getTypeColor = (type) => {
  switch (type) {
    case 'admin_bonus':
      return 'success'
    case 'admin_penalty':
      return 'error'
    case 'post_create':
      return 'primary'
    case 'comment_create':
      return 'info'
    case 'like_received':
      return 'warning'
    case 'icon_purchase':
      return 'purple'
    default:
      return 'grey'
  }
}

// 유형 텍스트
const getTypeText = (type) => {
  switch (type) {
    case 'admin_bonus':
      return '관리자 지급'
    case 'admin_penalty':
      return '관리자 차감'
    case 'post_create':
      return '게시글 작성'
    case 'comment_create':
      return '댓글 작성'
    case 'like_received':
      return '좋아요 받기'
    case 'icon_purchase':
      return '아이콘 구매'
    default:
      return '기타'
  }
}

// 날짜 시간 포맷팅
const formatDateTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString('ko-KR')
}

// 통계 로드
const loadStats = async () => {
  try {
    const stats = await adminService.getSystemStats()
    totalPoints.value = stats.totalPoints || 0
    avgPoints.value = Math.floor(totalPoints.value / (stats.totalUsers || 1))

    // 오늘 포인트 통계는 실제 구현에서는 별도 API 필요
    todayEarned.value = 150
    todaySpent.value = 80
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// 히스토리 로드
const loadHistory = async () => {
  loading.value = true
  try {
    // 실제 구현에서는 포인트 히스토리 API 호출
    history.value = [
      {
        id: 1,
        userId: 'user1',
        userName: '로마팬123',
        userPhoto: null,
        points: 10,
        type: 'post_create',
        reason: '게시글 작성',
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 'user2',
        userName: '티포시',
        userPhoto: null,
        points: -50,
        type: 'admin_penalty',
        reason: '부적절한 댓글',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    ]
  } catch (error) {
    console.error('Failed to load history:', error)
  } finally {
    loading.value = false
  }
}

// 사용자 목록 로드
const loadUsers = async () => {
  try {
    const users = await adminService.getUsers({ limitCount: 100 })
    userOptions.value = users.map((user) => ({
      id: user.id,
      displayName: user.displayName || user.email,
      email: user.email,
    }))
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

// 일괄 포인트 지급
const bulkAwardPoints = async () => {
  bulkLoading.value = true
  try {
    // 실제 구현에서는 일괄 지급 API 호출
    console.log('Bulk award:', {
      bulkTarget: bulkTarget.value,
      bulkPoints: bulkPoints.value,
      bulkReason: bulkReason.value,
    })

    // 초기화
    bulkPoints.value = 0
    bulkReason.value = ''

    emit('points-updated')
  } catch (error) {
    console.error('Failed to bulk award points:', error)
  } finally {
    bulkLoading.value = false
  }
}

// 개별 포인트 지급
const awardIndividualPoints = async () => {
  individualLoading.value = true
  try {
    await adminService.adjustUserPoints(
      individualUser.value,
      individualPoints.value,
      individualReason.value,
      userStore.user.uid,
    )

    // 초기화
    individualUser.value = null
    individualPoints.value = 0
    individualReason.value = ''

    emit('points-updated')
    loadHistory()
  } catch (error) {
    console.error('Failed to award individual points:', error)
  } finally {
    individualLoading.value = false
  }
}

// 설정 저장
const saveSettings = async () => {
  settingsLoading.value = true
  try {
    // 실제 구현에서는 설정 저장 API 호출
    console.log('Save settings:', settings.value)
  } catch (error) {
    console.error('Failed to save settings:', error)
  } finally {
    settingsLoading.value = false
  }
}

onMounted(() => {
  loadStats()
  loadHistory()
  loadUsers()
})
</script>

<style scoped>
.points-manager-container {
  max-width: 100%;
}

.history-table {
  border-radius: 8px;
}

.setting-item {
  margin-bottom: 16px;
}
</style>
