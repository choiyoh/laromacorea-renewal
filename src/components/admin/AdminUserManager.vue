<template>
  <div class="user-manager-container">
    <!-- 검색 및 필터 -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchTerm"
          label="사용자 검색"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          @input="searchUsers"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="statusFilter"
          label="상태 필터"
          :items="statusOptions"
          variant="outlined"
          density="compact"
          @update:model-value="filterUsers"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="roleFilter"
          label="역할 필터"
          :items="roleOptions"
          variant="outlined"
          density="compact"
          @update:model-value="filterUsers"
        />
      </v-col>
    </v-row>

    <!-- 사용자 목록 -->
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-account-group" class="mr-2" />
        사용자 관리
        <v-spacer />
        <v-btn icon="mdi-refresh" variant="text" @click="loadUsers" :loading="loading" />
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredUsers"
        :loading="loading"
        class="user-table"
        item-value="id"
      >
        <template #item.avatar="{ item }">
          <v-avatar size="32" class="my-2">
            <v-img v-if="item.photoURL" :src="item.photoURL" :alt="item.displayName" />
            <v-icon v-else icon="mdi-account" />
          </v-avatar>
        </template>

        <template #item.displayName="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.displayName || '이름 없음' }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
          </div>
        </template>

        <template #item.role="{ item }">
          <v-chip :color="getRoleColor(item.role)" size="small" variant="elevated">
            {{ getRoleText(item.role) }}
          </v-chip>
        </template>

        <template #item.isActive="{ item }">
          <v-chip :color="item.isActive ? 'success' : 'error'" size="small" variant="elevated">
            {{ item.isActive ? '활성' : '비활성' }}
          </v-chip>
        </template>

        <template #item.points="{ item }">
          <div class="d-flex align-center">
            <v-icon icon="mdi-star" color="warning" size="16" class="mr-1" />
            {{ item.points || 0 }}
          </div>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template #item.actions="{ item }">
          <v-menu>
            <template #activator="{ props }">
              <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
            </template>
            <v-list>
              <v-list-item @click="editUser(item)">
                <template #prepend>
                  <v-icon icon="mdi-pencil" />
                </template>
                <v-list-item-title>편집</v-list-item-title>
              </v-list-item>
              <v-list-item @click="adjustPoints(item)">
                <template #prepend>
                  <v-icon icon="mdi-star" />
                </template>
                <v-list-item-title>포인트 조정</v-list-item-title>
              </v-list-item>
              <v-list-item @click="toggleUserStatus(item)">
                <template #prepend>
                  <v-icon :icon="item.isActive ? 'mdi-account-off' : 'mdi-account-check'" />
                </template>
                <v-list-item-title>
                  {{ item.isActive ? '비활성화' : '활성화' }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>

    <!-- 사용자 편집 다이얼로그 -->
    <v-dialog v-model="editDialog" max-width="600">
      <v-card>
        <v-card-title>사용자 편집</v-card-title>
        <v-card-text>
          <v-form v-if="selectedUser">
            <v-text-field
              v-model="selectedUser.displayName"
              label="표시 이름"
              variant="outlined"
              class="mb-3"
            />
            <v-text-field
              v-model="selectedUser.email"
              label="이메일"
              variant="outlined"
              readonly
              class="mb-3"
            />
            <v-select
              v-model="selectedUser.role"
              label="역할"
              :items="roleOptions"
              variant="outlined"
              class="mb-3"
            />
            <v-switch v-model="selectedUser.isActive" label="활성 상태" color="success" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog = false">취소</v-btn>
          <v-btn color="primary" @click="saveUser">저장</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 포인트 조정 다이얼로그 -->
    <v-dialog v-model="pointsDialog" max-width="500">
      <v-card>
        <v-card-title>포인트 조정</v-card-title>
        <v-card-text>
          <div v-if="selectedUser" class="mb-4">
            <div class="text-h6">{{ selectedUser.displayName }}</div>
            <div class="text-body-2 text-medium-emphasis">
              현재 포인트: {{ selectedUser.points || 0 }}
            </div>
          </div>
          <v-text-field
            v-model.number="pointsAdjustment"
            label="조정할 포인트 (음수는 차감)"
            type="number"
            variant="outlined"
            class="mb-3"
          />
          <v-textarea v-model="pointsReason" label="조정 사유" variant="outlined" rows="3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="pointsDialog = false">취소</v-btn>
          <v-btn color="primary" @click="savePointsAdjustment">적용</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminService } from '@/services/admin'
import { useUserStore } from '@/stores/user'

const emit = defineEmits(['user-updated'])

const userStore = useUserStore()
const loading = ref(false)
const users = ref([])
const searchTerm = ref('')
const statusFilter = ref('all')
const roleFilter = ref('all')

// 다이얼로그 상태
const editDialog = ref(false)
const pointsDialog = ref(false)
const selectedUser = ref(null)
const pointsAdjustment = ref(0)
const pointsReason = ref('')

// 테이블 헤더
const headers = [
  { title: '아바타', key: 'avatar', sortable: false },
  { title: '사용자', key: 'displayName' },
  { title: '역할', key: 'role' },
  { title: '상태', key: 'isActive' },
  { title: '포인트', key: 'points' },
  { title: '가입일', key: 'createdAt' },
  { title: '작업', key: 'actions', sortable: false },
]

// 필터 옵션
const statusOptions = [
  { title: '전체', value: 'all' },
  { title: '활성', value: 'active' },
  { title: '비활성', value: 'inactive' },
]

const roleOptions = [
  { title: '전체', value: 'all' },
  { title: '사용자', value: 'user' },
  { title: '관리자', value: 'admin' },
  { title: '모더레이터', value: 'moderator' },
]

// 필터링된 사용자 목록
const filteredUsers = computed(() => {
  let filtered = users.value

  // 검색어 필터
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term),
    )
  }

  // 상태 필터
  if (statusFilter.value !== 'all') {
    const isActive = statusFilter.value === 'active'
    filtered = filtered.filter((user) => user.isActive === isActive)
  }

  // 역할 필터
  if (roleFilter.value !== 'all') {
    filtered = filtered.filter((user) => user.role === roleFilter.value)
  }

  return filtered
})

// 사용자 목록 로드
const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await adminService.getUsers({ limitCount: 100 })
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

// 사용자 검색
const searchUsers = async () => {
  if (searchTerm.value.length > 2) {
    loading.value = true
    try {
      const searchResults = await adminService.searchUsers(searchTerm.value)
      users.value = searchResults
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      loading.value = false
    }
  } else if (searchTerm.value === '') {
    loadUsers()
  }
}

// 필터 적용
const filterUsers = () => {
  // 필터링은 computed에서 처리됨
}

// 역할 색상
const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return 'error'
    case 'moderator':
      return 'warning'
    default:
      return 'primary'
  }
}

// 역할 텍스트
const getRoleText = (role) => {
  switch (role) {
    case 'admin':
      return '관리자'
    case 'moderator':
      return '모더레이터'
    default:
      return '사용자'
  }
}

// 날짜 포맷팅
const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('ko-KR')
}

// 사용자 편집
const editUser = (user) => {
  selectedUser.value = { ...user }
  editDialog.value = true
}

// 사용자 저장
const saveUser = async () => {
  try {
    await adminService.updateUserRole(selectedUser.value.id, selectedUser.value.role)
    await adminService.updateUserStatus(selectedUser.value.id, selectedUser.value.isActive)

    // 로컬 상태 업데이트
    const index = users.value.findIndex((u) => u.id === selectedUser.value.id)
    if (index !== -1) {
      users.value[index] = { ...selectedUser.value }
    }

    editDialog.value = false
    emit('user-updated')
  } catch (error) {
    console.error('Failed to save user:', error)
  }
}

// 포인트 조정
const adjustPoints = (user) => {
  selectedUser.value = user
  pointsAdjustment.value = 0
  pointsReason.value = ''
  pointsDialog.value = true
}

// 포인트 조정 저장
const savePointsAdjustment = async () => {
  try {
    await adminService.adjustUserPoints(
      selectedUser.value.id,
      pointsAdjustment.value,
      pointsReason.value,
      userStore.user.uid,
    )

    // 로컬 상태 업데이트
    const index = users.value.findIndex((u) => u.id === selectedUser.value.id)
    if (index !== -1) {
      users.value[index].points = (users.value[index].points || 0) + pointsAdjustment.value
    }

    pointsDialog.value = false
    emit('user-updated')
  } catch (error) {
    console.error('Failed to adjust points:', error)
  }
}

// 사용자 상태 토글
const toggleUserStatus = async (user) => {
  try {
    const newStatus = !user.isActive
    await adminService.updateUserStatus(user.id, newStatus)

    // 로컬 상태 업데이트
    const index = users.value.findIndex((u) => u.id === user.id)
    if (index !== -1) {
      users.value[index].isActive = newStatus
    }

    emit('user-updated')
  } catch (error) {
    console.error('Failed to toggle user status:', error)
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-manager-container {
  max-width: 100%;
}

.user-table {
  border-radius: 8px;
}

.text-medium-emphasis {
  opacity: 0.7;
}
</style>
