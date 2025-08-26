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
        <v-btn
          icon="mdi-refresh"
          variant="text"
          @click="loadUsers"
          :loading="loading"
        />
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredUsers"
        :loading="loading"
        class="user-table"
        item-value="id"
      >
        <template v-slot:item.avatar="{ item }">
          <v-avatar size="32" class="my-2">
            <v-img
              v-if="item.photoURL"
              :src="item.photoURL"
              :alt="item.displayName"
            />
            <v-icon v-else icon="mdi-account" />
          </v-avatar>
        </template>

        <template v-slot:item.displayName="{ item }">
          <div>
            <div class="font-weight-medium">
              {{ item.displayName || '이름 없음' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ item.email }}
            </div>
          </div>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            size="small"
            variant="elevated"
          >
            {{ getRoleText(item.role) }}
          </v-chip>
        </template>

        <template v-slot:item.isActive="{ item }">
          <v-chip
            :color="item.isActive ? 'success' : 'error'"
            size="small"
            variant="elevated"
          >
            {{ item.isActive ? '활성' : '비활성' }}
          </v-chip>
        </template>

        <template v-slot:item.points="{ item }">
          <div class="d-flex align-center">
            <v-icon icon="mdi-star" color="warning" size="16" class="mr-1" />
            {{ item.points || 0 }}
          </div>
        </template>

        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                v-bind="props"
              />
            </template>
            <v-list>
              <v-list-item @click="openUserDetail(item)">
                <template v-slot:prepend>
                  <v-icon icon="mdi-account-details" />
                </template>
                <v-list-item-title>상세 관리</v-list-item-title>
              </v-list-item>
              <v-list-item @click="editUser(item)">
                <template v-slot:prepend>
                  <v-icon icon="mdi-pencil" />
                </template>
                <v-list-item-title>기본 편집</v-list-item-title>
              </v-list-item>
              <v-list-item @click="adjustPoints(item)">
                <template v-slot:prepend>
                  <v-icon icon="mdi-star" />
                </template>
                <v-list-item-title>포인트 조정</v-list-item-title>
              </v-list-item>
              <v-list-item @click="toggleUserStatus(item)">
                <template v-slot:prepend>
                  <v-icon
                    :icon="
                      item.isActive ? 'mdi-account-off' : 'mdi-account-check'
                    "
                  />
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
            <v-switch
              v-model="selectedUser.isActive"
              label="활성 상태"
              color="success"
            />
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
          <v-textarea
            v-model="pointsReason"
            label="조정 사유"
            variant="outlined"
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="pointsDialog = false">취소</v-btn>
          <v-btn color="primary" @click="savePointsAdjustment">적용</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 사용자 상세 관리 다이얼로그 -->
    <v-dialog v-model="userDetailDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-avatar size="40" class="mr-3">
            <v-img v-if="selectedUser?.photoURL" :src="selectedUser.photoURL" />
            <v-icon v-else icon="mdi-account" />
          </v-avatar>
          <div>
            <div class="text-h6">
              {{ selectedUser?.displayName || '이름 없음' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ selectedUser?.email }}
            </div>
          </div>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="userDetailDialog = false"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-0">
          <v-container>
            <!-- 기본 정보 섹션 -->
            <v-row>
              <v-col cols="12">
                <div class="text-h6 mb-3">기본 정보</div>
                <v-card variant="outlined" class="mb-4">
                  <v-card-text>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="userDetailForm.displayName"
                          label="닉네임"
                          variant="outlined"
                          density="compact"
                          :readonly="!isEditingBasicInfo"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          :value="selectedUser?.email"
                          label="이메일"
                          variant="outlined"
                          density="compact"
                          readonly
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="userDetailForm.role"
                          label="권한"
                          :items="detailedRoleOptions"
                          variant="outlined"
                          density="compact"
                          :readonly="!isEditingRole"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="userDetailForm.status"
                          label="계정 상태"
                          :items="statusDetailOptions"
                          variant="outlined"
                          density="compact"
                          :readonly="!isEditingStatus"
                        />
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- 관리 액션 섹션 -->
            <v-row>
              <v-col cols="12">
                <div class="text-h6 mb-3">관리 액션</div>
                <v-card variant="outlined" class="mb-4">
                  <v-card-text>
                    <v-row>
                      <v-col cols="12" sm="6" md="4">
                        <v-btn
                          block
                          color="primary"
                          variant="outlined"
                          prepend-icon="mdi-account-edit"
                          @click="toggleEditBasicInfo"
                        >
                          {{ isEditingBasicInfo ? '저장' : '닉네임 변경' }}
                        </v-btn>
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-btn
                          block
                          color="warning"
                          variant="outlined"
                          prepend-icon="mdi-shield-account"
                          @click="toggleEditRole"
                        >
                          {{ isEditingRole ? '저장' : '권한 변경' }}
                        </v-btn>
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-btn
                          block
                          color="error"
                          variant="outlined"
                          prepend-icon="mdi-key-variant"
                          @click="resetPassword"
                        >
                          비밀번호 초기화
                        </v-btn>
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-btn
                          block
                          color="success"
                          variant="outlined"
                          prepend-icon="mdi-coin"
                          @click="openPointsManagement"
                        >
                          포인트 관리
                        </v-btn>
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-btn
                          block
                          :color="selectedUser?.isActive ? 'error' : 'success'"
                          variant="outlined"
                          :prepend-icon="
                            selectedUser?.isActive
                              ? 'mdi-account-cancel'
                              : 'mdi-account-check'
                          "
                          @click="toggleEditStatus"
                        >
                          {{
                            selectedUser?.isActive ? '계정 정지' : '계정 활성화'
                          }}
                        </v-btn>
                      </v-col>
                      <v-col cols="12" sm="6" md="4">
                        <v-btn
                          block
                          color="info"
                          variant="outlined"
                          prepend-icon="mdi-history"
                          @click="viewUserHistory"
                        >
                          변경 이력
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- 활동 통계 섹션 -->
            <v-row>
              <v-col cols="12">
                <div class="text-h6 mb-3">활동 통계</div>
                <v-card variant="outlined">
                  <v-card-text>
                    <v-row>
                      <v-col cols="6" md="3">
                        <div class="text-center">
                          <div class="text-h4 text-primary">
                            {{ selectedUser?.stats?.posts || 0 }}
                          </div>
                          <div class="text-caption">게시글</div>
                        </div>
                      </v-col>
                      <v-col cols="6" md="3">
                        <div class="text-center">
                          <div class="text-h4 text-success">
                            {{ selectedUser?.stats?.comments || 0 }}
                          </div>
                          <div class="text-caption">댓글</div>
                        </div>
                      </v-col>
                      <v-col cols="6" md="3">
                        <div class="text-center">
                          <div class="text-h4 text-warning">
                            {{ selectedUser?.points || 0 }}
                          </div>
                          <div class="text-caption">포인트</div>
                        </div>
                      </v-col>
                      <v-col cols="6" md="3">
                        <div class="text-center">
                          <div class="text-h4 text-error">
                            {{ selectedUser?.stats?.likes || 0 }}
                          </div>
                          <div class="text-caption">받은 좋아요</div>
                        </div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 비밀번호 초기화 확인 다이얼로그 -->
    <v-dialog v-model="passwordResetDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert" class="mr-2" />
          비밀번호 초기화 확인
        </v-card-title>
        <v-card-text>
          <div class="mb-4">
            <strong>{{ selectedUser?.displayName }}</strong
            >님의 비밀번호를 초기화하시겠습니까?
          </div>
          <v-alert type="warning" variant="tonal" class="mb-4">
            비밀번호가 <strong>qwer1234</strong>로 초기화되며, 사용자는 다음
            로그인 시 비밀번호 변경이 필요합니다.
          </v-alert>
          <v-textarea
            v-model="passwordResetReason"
            label="초기화 사유 (필수)"
            variant="outlined"
            rows="3"
            :rules="[(v) => !!v || '초기화 사유를 입력해주세요']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="passwordResetDialog = false">취소</v-btn>
          <v-btn
            color="error"
            @click="confirmPasswordReset"
            :disabled="!passwordResetReason"
          >
            초기화
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { adminService } from '@/services/admin';
import { useUserStore } from '@/stores/user';

const emit = defineEmits(['user-updated']);

const userStore = useUserStore();
const loading = ref(false);
const users = ref([]);
const searchTerm = ref('');
const statusFilter = ref('all');
const roleFilter = ref('all');

// 다이얼로그 상태
const editDialog = ref(false);
const pointsDialog = ref(false);
const userDetailDialog = ref(false);
const passwordResetDialog = ref(false);
const selectedUser = ref(null);
const pointsAdjustment = ref(0);
const pointsReason = ref('');
const passwordResetReason = ref('');

// 사용자 상세 관리 폼
const userDetailForm = ref({
  displayName: '',
  role: '',
  status: '',
});

// 편집 상태
const isEditingBasicInfo = ref(false);
const isEditingRole = ref(false);
const isEditingStatus = ref(false);

// 테이블 헤더
const headers = [
  { title: '아바타', key: 'avatar', sortable: false },
  { title: '사용자', key: 'displayName' },
  { title: '역할', key: 'role' },
  { title: '상태', key: 'isActive' },
  { title: '포인트', key: 'points' },
  { title: '가입일', key: 'createdAt' },
  { title: '작업', key: 'actions', sortable: false },
];

// 필터 옵션
const statusOptions = [
  { title: '전체', value: 'all' },
  { title: '활성', value: 'active' },
  { title: '비활성', value: 'inactive' },
];

const roleOptions = [
  { title: '전체', value: 'all' },
  { title: '사용자', value: 'user' },
  { title: '관리자', value: 'admin' },
  { title: '모더레이터', value: 'moderator' },
];

// 상세 관리용 옵션들
const detailedRoleOptions = [
  { title: '일반 사용자', value: 'user' },
  { title: '모더레이터', value: 'moderator' },
  { title: '관리자', value: 'admin' },
  { title: '최고 관리자', value: 'super_admin' },
];

const statusDetailOptions = [
  { title: '정상', value: 'active' },
  { title: '정지', value: 'suspended' },
  { title: '탈퇴', value: 'deleted' },
];

// 필터링된 사용자 목록
const filteredUsers = computed(() => {
  let filtered = users.value;

  // 검색어 필터
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term),
    );
  }

  // 상태 필터
  if (statusFilter.value !== 'all') {
    const isActive = statusFilter.value === 'active';
    filtered = filtered.filter((user) => user.isActive === isActive);
  }

  // 역할 필터
  if (roleFilter.value !== 'all') {
    filtered = filtered.filter((user) => user.role === roleFilter.value);
  }

  return filtered;
});

// 사용자 목록 로드
const loadUsers = async () => {
  loading.value = true;
  try {
    users.value = await adminService.getUsers({ limitCount: 100 });
    console.log('로드된 사용자 목록:', users.value);
    console.log('사용자 수:', users.value.length);
  } catch (error) {
    console.error('Failed to load users:', error);
  } finally {
    loading.value = false;
  }
};

// 사용자 검색
const searchUsers = async () => {
  if (searchTerm.value.length > 2) {
    loading.value = true;
    try {
      const searchResults = await adminService.searchUsers(searchTerm.value);
      users.value = searchResults;
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      loading.value = false;
    }
  } else if (searchTerm.value === '') {
    loadUsers();
  }
};

// 필터 적용
const filterUsers = () => {
  // 필터링은 computed에서 처리됨
};

// 역할 색상
const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return 'error';
    case 'moderator':
      return 'warning';
    default:
      return 'primary';
  }
};

// 역할 텍스트
const getRoleText = (role) => {
  switch (role) {
    case 'admin':
      return '관리자';
    case 'moderator':
      return '모더레이터';
    default:
      return '사용자';
  }
};

// 날짜 포맷팅
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('ko-KR');
};

// 사용자 편집
const editUser = (user) => {
  selectedUser.value = { ...user };
  editDialog.value = true;
};

// 사용자 저장
const saveUser = async () => {
  try {
    await adminService.updateUserRole(
      selectedUser.value.id,
      selectedUser.value.role,
    );
    await adminService.updateUserStatus(
      selectedUser.value.id,
      selectedUser.value.isActive,
    );

    // 로컬 상태 업데이트
    const index = users.value.findIndex((u) => u.id === selectedUser.value.id);
    if (index !== -1) {
      users.value[index] = { ...selectedUser.value };
    }

    editDialog.value = false;
    emit('user-updated');
  } catch (error) {
    console.error('Failed to save user:', error);
  }
};

// 포인트 조정
const adjustPoints = (user) => {
  selectedUser.value = user;
  pointsAdjustment.value = 0;
  pointsReason.value = '';
  pointsDialog.value = true;
};

// 포인트 조정 저장
const savePointsAdjustment = async () => {
  try {
    await adminService.adjustUserPointsWithHistory(
      selectedUser.value.id,
      pointsAdjustment.value,
      pointsReason.value,
      userStore.user?.uid || 'admin',
    );

    // 로컬 상태 업데이트
    const index = users.value.findIndex((u) => u.id === selectedUser.value.id);
    if (index !== -1) {
      users.value[index].points =
        (users.value[index].points || 0) + pointsAdjustment.value;
    }

    pointsDialog.value = false;
    emit('user-updated');
  } catch (error) {
    console.error('Failed to adjust points:', error);
  }
};

// 사용자 상태 토글
const toggleUserStatus = async (user) => {
  try {
    const newStatus = !user.isActive;
    console.log(
      `사용자 ${user.displayName}의 상태를 ${newStatus ? '활성화' : '비활성화'}로 변경합니다.`,
    );

    await adminService.updateUserStatus(user.id, newStatus);

    // 사용자 목록 새로고침으로 최신 상태 반영
    await loadUsers();

    emit('user-updated');
    console.log('사용자 상태 변경 완료');
  } catch (error) {
    console.error('Failed to toggle user status:', error);
    alert('사용자 상태 변경에 실패했습니다: ' + error.message);
  }
};

// 사용자 상세 관리 열기
const openUserDetail = async (user) => {
  selectedUser.value = user;
  userDetailForm.value = {
    displayName: user.displayName || '',
    role: user.role || 'user',
    status: user.isActive ? 'active' : 'suspended',
  };

  // 사용자 통계 로드
  try {
    const stats = await adminService.getUserStats(user.id);
    selectedUser.value.stats = stats;
  } catch (error) {
    console.error('Failed to load user stats:', error);
    selectedUser.value.stats = { posts: 0, comments: 0, likes: 0 };
  }

  userDetailDialog.value = true;
};

// 기본 정보 편집 토글
const toggleEditBasicInfo = async () => {
  if (isEditingBasicInfo.value) {
    // 저장
    try {
      await adminService.updateUserNickname(
        selectedUser.value.id,
        userDetailForm.value.displayName,
        '관리자에 의한 닉네임 변경',
      );

      selectedUser.value.displayName = userDetailForm.value.displayName;

      // 로컬 상태 업데이트
      const index = users.value.findIndex(
        (u) => u.id === selectedUser.value.id,
      );
      if (index !== -1) {
        users.value[index].displayName = userDetailForm.value.displayName;
      }

      isEditingBasicInfo.value = false;
      emit('user-updated');
    } catch (error) {
      console.error('Failed to update nickname:', error);
    }
  } else {
    isEditingBasicInfo.value = true;
  }
};

// 권한 편집 토글
const toggleEditRole = async () => {
  if (isEditingRole.value) {
    // 저장
    try {
      await adminService.updateUserRoleWithHistory(
        userStore.user?.uid || 'admin',
        selectedUser.value.id,
        userDetailForm.value.role,
        '관리자에 의한 권한 변경',
      );

      selectedUser.value.role = userDetailForm.value.role;

      // 로컬 상태 업데이트
      const index = users.value.findIndex(
        (u) => u.id === selectedUser.value.id,
      );
      if (index !== -1) {
        users.value[index].role = userDetailForm.value.role;
      }

      isEditingRole.value = false;
      emit('user-updated');
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  } else {
    isEditingRole.value = true;
  }
};

// 상태 편집 토글 - 바로 상태 변경
const toggleEditStatus = async () => {
  try {
    const newStatus = !selectedUser.value.isActive;
    await adminService.updateUserStatus(selectedUser.value.id, newStatus);

    selectedUser.value.isActive = newStatus;
    userDetailForm.value.status = newStatus ? 'active' : 'suspended';

    // 사용자 목록 새로고침
    await loadUsers();

    emit('user-updated');
    console.log(
      `사용자 상태가 ${newStatus ? '활성화' : '비활성화'}되었습니다.`,
    );
  } catch (error) {
    console.error('Failed to update status:', error);
    alert('사용자 상태 변경에 실패했습니다: ' + error.message);
  }
};

// 비밀번호 초기화
const resetPassword = () => {
  passwordResetReason.value = '';
  passwordResetDialog.value = true;
};

// 비밀번호 초기화 확인
const confirmPasswordReset = async () => {
  try {
    await adminService.resetUserPassword(
      selectedUser.value.id,
      'qwer1234',
      passwordResetReason.value,
    );

    passwordResetDialog.value = false;

    // 성공 알림
    // TODO: 토스트 알림 추가
    console.log('비밀번호가 초기화되었습니다.');

    emit('user-updated');
  } catch (error) {
    console.error('Failed to reset password:', error);
  }
};

// 포인트 관리 열기
const openPointsManagement = () => {
  pointsAdjustment.value = 0;
  pointsReason.value = '';
  pointsDialog.value = true;
};

// 사용자 변경 이력 보기
const viewUserHistory = async () => {
  try {
    const history = await adminService.getUserHistory(selectedUser.value.id);
    console.log('User history:', history);
    // TODO: 이력 표시 모달 구현
  } catch (error) {
    console.error('Failed to load user history:', error);
  }
};

onMounted(() => {
  loadUsers();
});
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
