<template>
  <v-card class="user-profile-card">
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-account-circle</v-icon>
      사용자 프로필
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- 프로필 정보 섹션 -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-h6">기본 정보</v-card-title>
            <v-card-text>
              <v-form
                ref="profileForm"
                v-model="profileFormValid"
                @submit.prevent="updateProfile"
              >
                <v-text-field
                  v-model="profileData.displayName"
                  label="표시 이름"
                  :rules="displayNameRules"
                  :disabled="loading"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                />

                <v-text-field
                  v-model="profileData.email"
                  label="이메일"
                  :disabled="true"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                />

                <v-textarea
                  v-model="profileData.bio"
                  label="자기소개"
                  :rules="bioRules"
                  :disabled="loading"
                  variant="outlined"
                  density="compact"
                  rows="3"
                  counter="200"
                  class="mb-3"
                />

                <v-text-field
                  v-model="profileData.favoritePlayer"
                  label="좋아하는 선수"
                  :disabled="loading"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                />

                <v-btn
                  type="submit"
                  color="primary"
                  :loading="loading"
                  :disabled="!profileFormValid"
                  block
                >
                  프로필 업데이트
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 포인트 및 아이콘 섹션 -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-h6">포인트 현황</v-card-title>
            <v-card-text>
              <div class="text-center">
                <v-icon size="48" color="amber">mdi-star</v-icon>
                <div class="text-h4 font-weight-bold text-amber mt-2">
                  {{ userPoints.toLocaleString() }}
                </div>
                <div class="text-body-2 text-medium-emphasis">보유 포인트</div>
              </div>

              <v-divider class="my-4" />

              <div class="text-body-2 text-medium-emphasis mb-2">
                포인트 획득 방법:
              </div>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>게시글 작성: +10 포인트</v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>댓글 작성: +5 포인트</v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title
                    >게시글 좋아요 받음: +1 포인트</v-list-item-title
                  >
                </v-list-item>
                <v-list-item>
                  <v-list-item-title
                    >댓글 좋아요 받음: +1 포인트</v-list-item-title
                  >
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- 선택된 아이콘 섹션 -->
          <v-card variant="outlined">
            <v-card-title class="text-h6">선택된 아이콘</v-card-title>
            <v-card-text>
              <div v-if="selectedIcon" class="text-center">
                <v-avatar size="64" class="mb-2">
                  <v-img :src="selectedIcon.url" :alt="selectedIcon.name" />
                </v-avatar>
                <div class="text-subtitle-1 font-weight-medium">
                  {{ selectedIcon.name }}
                </div>
                <v-btn
                  color="error"
                  variant="outlined"
                  size="small"
                  @click="removeIcon"
                  :loading="loading"
                  class="mt-2"
                >
                  아이콘 해제
                </v-btn>
              </div>
              <div v-else class="text-center text-medium-emphasis">
                <v-icon size="64" class="mb-2">mdi-account-circle</v-icon>
                <div>선택된 아이콘이 없습니다</div>
                <v-btn
                  color="primary"
                  variant="outlined"
                  size="small"
                  @click="$emit('go-to-icon-shop')"
                  class="mt-2"
                >
                  아이콘 상점 가기
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 포인트 내역 섹션 -->
      <v-row>
        <v-col cols="12">
          <PointsHistory ref="pointsHistoryRef" />
        </v-col>
      </v-row>

      <!-- 계정 정보 섹션 -->
      <v-row>
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-h6">계정 정보</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6">
                  <div class="text-body-2 text-medium-emphasis">가입일</div>
                  <div class="text-body-1">
                    {{ formatDate(user?.createdAt) }}
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-body-2 text-medium-emphasis">
                    마지막 로그인
                  </div>
                  <div class="text-body-1">
                    {{ formatDate(user?.lastLoginAt) }}
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-body-2 text-medium-emphasis">계정 상태</div>
                  <v-chip
                    :color="user?.isActive ? 'success' : 'error'"
                    size="small"
                    variant="flat"
                  >
                    {{ user?.isActive ? '활성' : '비활성' }}
                  </v-chip>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-body-2 text-medium-emphasis">권한</div>
                  <v-chip
                    :color="user?.role === 'admin' ? 'primary' : 'default'"
                    size="small"
                    variant="flat"
                  >
                    {{ user?.role === 'admin' ? '관리자' : '일반 사용자' }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 비밀번호 변경 섹션 -->
      <v-row>
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-h6">비밀번호 변경</v-card-title>
            <v-card-text>
              <v-form
                ref="passwordForm"
                v-model="passwordFormValid"
                @submit.prevent="updatePassword"
              >
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="passwordData.newPassword"
                      label="새 비밀번호"
                      type="password"
                      :rules="passwordRules"
                      :disabled="loading"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="passwordData.confirmPassword"
                      label="비밀번호 확인"
                      type="password"
                      :rules="confirmPasswordRules"
                      :disabled="loading"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                </v-row>
                <v-btn
                  type="submit"
                  color="warning"
                  :loading="loading"
                  :disabled="!passwordFormValid"
                >
                  비밀번호 변경
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- 성공/에러 스낵바 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false"> 닫기 </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { userService, iconService } from '@/services/database';
import PointsHistory from './PointsHistory.vue';

// Emits
const emit = defineEmits(['go-to-icon-shop']);

// Composables
const {
  user,
  updateProfile: updateAuthProfile,
  updatePassword: updateAuthPassword,
} = useAuth();

// Reactive data
const loading = ref(false);
const profileFormValid = ref(false);
const passwordFormValid = ref(false);
const selectedIcon = ref(null);
const pointsHistoryRef = ref(null);

const profileData = ref({
  displayName: '',
  email: '',
  bio: '',
  favoritePlayer: '',
});

const passwordData = ref({
  newPassword: '',
  confirmPassword: '',
});

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Computed
const userPoints = computed(() => user.value?.points || 0);

// Form validation rules
const displayNameRules = [
  (v) => !!v || '표시 이름은 필수입니다',
  (v) => (v && v.length >= 2) || '표시 이름은 최소 2자 이상이어야 합니다',
  (v) => (v && v.length <= 20) || '표시 이름은 최대 20자까지 가능합니다',
];

const bioRules = [
  (v) => !v || v.length <= 200 || '자기소개는 최대 200자까지 가능합니다',
];

const passwordRules = [
  (v) => !!v || '새 비밀번호는 필수입니다',
  (v) => (v && v.length >= 6) || '비밀번호는 최소 6자 이상이어야 합니다',
];

const confirmPasswordRules = [
  (v) => !!v || '비밀번호 확인은 필수입니다',
  (v) => v === passwordData.value.newPassword || '비밀번호가 일치하지 않습니다',
];

// Methods
const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};

const formatDate = (timestamp) => {
  if (!timestamp) return '-';

  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const loadUserProfile = async () => {
  if (!user.value?.uid) return;

  try {
    loading.value = true;

    // 사용자 정보 로드
    const userData = await userService.getUser(user.value.uid);
    if (userData) {
      profileData.value = {
        displayName: userData.displayName || '',
        email: userData.email || '',
        bio: userData.profile?.bio || '',
        favoritePlayer: userData.profile?.favoritePlayer || '',
      };
    }

    // 선택된 아이콘 정보 로드
    if (user.value.selectedIcon) {
      await loadSelectedIcon(user.value.selectedIcon);
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
    showSnackbar('프로필 정보를 불러오는데 실패했습니다', 'error');
  } finally {
    loading.value = false;
  }
};

const loadSelectedIcon = async (iconId) => {
  try {
    const icons = await iconService.getActiveIcons();
    selectedIcon.value = icons.find((icon) => icon.id === iconId) || null;
  } catch (error) {
    console.error('Error loading selected icon:', error);
  }
};

const updateProfile = async () => {
  if (!profileFormValid.value) return;

  try {
    loading.value = true;

    const updates = {
      displayName: profileData.value.displayName,
      profile: {
        bio: profileData.value.bio,
        favoritePlayer: profileData.value.favoritePlayer,
      },
    };

    await updateAuthProfile(updates);
    showSnackbar('프로필이 성공적으로 업데이트되었습니다');
  } catch (error) {
    console.error('Error updating profile:', error);
    showSnackbar('프로필 업데이트에 실패했습니다', 'error');
  } finally {
    loading.value = false;
  }
};

const updatePassword = async () => {
  if (!passwordFormValid.value) return;

  try {
    loading.value = true;

    await updateAuthPassword(passwordData.value.newPassword);

    // 폼 초기화
    passwordData.value = {
      newPassword: '',
      confirmPassword: '',
    };

    showSnackbar('비밀번호가 성공적으로 변경되었습니다');
  } catch (error) {
    console.error('Error updating password:', error);
    showSnackbar('비밀번호 변경에 실패했습니다', 'error');
  } finally {
    loading.value = false;
  }
};

const removeIcon = async () => {
  try {
    loading.value = true;

    await updateAuthProfile({ selectedIcon: null });
    selectedIcon.value = null;

    showSnackbar('아이콘이 해제되었습니다');
  } catch (error) {
    console.error('Error removing icon:', error);
    showSnackbar('아이콘 해제에 실패했습니다', 'error');
  } finally {
    loading.value = false;
  }
};

// Watchers
watch(
  user,
  (newUser) => {
    if (newUser) {
      loadUserProfile();
    }
  },
  { immediate: true },
);

// Lifecycle
onMounted(() => {
  if (user.value) {
    loadUserProfile();
  }
});
</script>

<style scoped>
.user-profile-card {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
