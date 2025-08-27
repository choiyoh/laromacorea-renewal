<template>
  <div class="icon-manager-container">
    <!-- 아이콘 업로드 -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card variant="outlined" class="pa-4">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-upload" class="mr-2" />
            새 아이콘 추가
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="uploadIcon">
              <v-row>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="newIcon.name"
                    label="아이콘 이름"
                    variant="outlined"
                    required
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-text-field
                    v-model.number="newIcon.price"
                    label="가격 (포인트)"
                    type="number"
                    variant="outlined"
                    required
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-select
                    v-model="newIcon.category"
                    label="카테고리"
                    :items="categoryOptions"
                    variant="outlined"
                    required
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-file-input
                    v-model="newIcon.file"
                    label="아이콘 파일"
                    accept="image/*"
                    variant="outlined"
                    prepend-icon="mdi-image"
                    required
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn
                    type="submit"
                    color="primary"
                    variant="elevated"
                    :loading="uploadLoading"
                    block
                  >
                    업로드
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 필터 및 검색 -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchTerm"
          label="아이콘 검색"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="categoryFilter"
          label="카테고리 필터"
          :items="categoryFilterOptions"
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
        <v-btn
          color="primary"
          variant="elevated"
          @click="loadIcons"
          :loading="loading"
          block
        >
          새로고침
        </v-btn>
      </v-col>
    </v-row>

    <!-- 아이콘 그리드 -->
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-emoticon" class="mr-2" />
        아이콘 관리
        <v-spacer />
        <v-chip color="info" variant="elevated">
          총 {{ filteredIcons.length }}개
        </v-chip>
      </v-card-title>

      <v-card-text>
        <v-row v-if="loading" class="justify-center">
          <v-col cols="12" class="text-center">
            <v-progress-circular indeterminate color="primary" />
            <p class="mt-2">아이콘을 불러오는 중...</p>
          </v-col>
        </v-row>

        <v-row v-else-if="filteredIcons.length === 0" class="justify-center">
          <v-col cols="12" class="text-center py-8">
            <v-icon
              icon="mdi-emoticon-sad"
              size="64"
              color="grey"
              class="mb-4"
            />
            <p class="text-h6 text-medium-emphasis">
              {{
                searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? '검색 조건에 맞는 아이콘이 없습니다'
                  : '등록된 아이콘이 없습니다'
              }}
            </p>
            <p
              v-if="
                !searchTerm &&
                categoryFilter === 'all' &&
                statusFilter === 'all'
              "
              class="text-body-2 text-medium-emphasis"
            >
              새 아이콘을 추가해보세요
            </p>
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col
            v-for="icon in filteredIcons"
            :key="icon.id"
            cols="6"
            sm="4"
            md="3"
            lg="2"
          >
            <v-card
              class="icon-card"
              :class="{ 'icon-card--inactive': !icon.isActive }"
              variant="outlined"
            >
              <div class="icon-preview">
                <v-img
                  :src="icon.url"
                  :alt="icon.name"
                  aspect-ratio="1"
                  class="icon-image"
                />
                <div v-if="!icon.isActive" class="inactive-overlay">
                  <v-icon icon="mdi-eye-off" color="white" size="24" />
                </div>
              </div>

              <v-card-text class="pa-3">
                <div class="text-subtitle-2 font-weight-bold mb-1">
                  {{ icon.name }}
                </div>
                <div class="d-flex align-center justify-space-between mb-2">
                  <v-chip
                    :color="getCategoryColor(icon.category)"
                    size="x-small"
                    variant="elevated"
                  >
                    {{ getCategoryText(icon.category) }}
                  </v-chip>
                  <div class="d-flex align-center">
                    <v-icon
                      icon="mdi-star"
                      color="warning"
                      size="14"
                      class="mr-1"
                    />
                    <span class="text-caption">{{ icon.price }}</span>
                  </div>
                </div>
                <div class="text-caption text-medium-emphasis">
                  구매: {{ icon.purchaseCount || 0 }}회
                </div>
              </v-card-text>

              <v-card-actions class="pa-2">
                <v-btn size="small" variant="text" @click="editIcon(icon)">
                  편집
                </v-btn>
                <v-spacer />
                <v-btn
                  size="small"
                  :color="icon.isActive ? 'warning' : 'success'"
                  variant="text"
                  @click="toggleIconStatus(icon)"
                >
                  {{ icon.isActive ? '비활성화' : '활성화' }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 아이콘 편집 다이얼로그 -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>아이콘 편집</v-card-title>
        <v-card-text>
          <v-form v-if="selectedIcon">
            <div class="text-center mb-4">
              <v-img
                :src="selectedIcon.url"
                :alt="selectedIcon.name"
                max-width="100"
                max-height="100"
                class="mx-auto"
              />
            </div>

            <v-text-field
              v-model="selectedIcon.name"
              label="아이콘 이름"
              variant="outlined"
              class="mb-3"
            />

            <v-text-field
              v-model.number="selectedIcon.price"
              label="가격 (포인트)"
              type="number"
              variant="outlined"
              class="mb-3"
            />

            <v-select
              v-model="selectedIcon.category"
              label="카테고리"
              :items="categoryOptions"
              variant="outlined"
              class="mb-3"
            />

            <v-textarea
              v-model="selectedIcon.description"
              label="설명"
              variant="outlined"
              rows="3"
              class="mb-3"
            />

            <v-switch
              v-model="selectedIcon.isActive"
              label="활성 상태"
              color="success"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog = false">취소</v-btn>
          <v-btn color="primary" @click="saveIcon">저장</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { adminService } from '@/services/admin';

const emit = defineEmits(['icon-updated']);

const loading = ref(false);
const uploadLoading = ref(false);
const icons = ref([]);
const searchTerm = ref('');
const categoryFilter = ref('all');
const statusFilter = ref('all');

// 다이얼로그 상태
const editDialog = ref(false);
const selectedIcon = ref(null);

// 새 아이콘 데이터
const newIcon = ref({
  name: '',
  price: 100,
  category: 'emotion',
  file: null,
  description: '',
});

// 카테고리 옵션
const categoryOptions = [
  { title: '감정', value: 'emotion' },
  { title: '스포츠', value: 'sports' },
  { title: '로마', value: 'roma' },
  { title: '축구', value: 'football' },
  { title: '기타', value: 'other' },
];

const categoryFilterOptions = [
  { title: '전체', value: 'all' },
  ...categoryOptions,
];

const statusOptions = [
  { title: '전체', value: 'all' },
  { title: '활성', value: 'active' },
  { title: '비활성', value: 'inactive' },
];

// 필터링된 아이콘 목록
const filteredIcons = computed(() => {
  let filtered = icons.value;

  // 검색어 필터
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(
      (icon) =>
        icon.name?.toLowerCase().includes(term) ||
        icon.description?.toLowerCase().includes(term),
    );
  }

  // 카테고리 필터
  if (categoryFilter.value !== 'all') {
    filtered = filtered.filter(
      (icon) => icon.category === categoryFilter.value,
    );
  }

  // 상태 필터
  if (statusFilter.value !== 'all') {
    const isActive = statusFilter.value === 'active';
    filtered = filtered.filter((icon) => icon.isActive === isActive);
  }

  return filtered;
});

// 카테고리 색상
const getCategoryColor = (category) => {
  switch (category) {
    case 'emotion':
      return 'yellow';
    case 'sports':
      return 'blue';
    case 'roma':
      return 'red';
    case 'football':
      return 'green';
    default:
      return 'grey';
  }
};

// 카테고리 텍스트
const getCategoryText = (category) => {
  switch (category) {
    case 'emotion':
      return '감정';
    case 'sports':
      return '스포츠';
    case 'roma':
      return '로마';
    case 'football':
      return '축구';
    default:
      return '기타';
  }
};

// 아이콘 목록 로드
const loadIcons = async () => {
  loading.value = true;
  try {
    icons.value = await adminService.getIcons();
  } catch (error) {
    console.error('아이콘 목록 로드 실패:', error);
    icons.value = [];
    // 에러 메시지 표시 (필요시 추가)
  } finally {
    loading.value = false;
  }
};

// 아이콘 업로드
const uploadIcon = async () => {
  // 파일 처리: v-file-input은 배열로 반환할 수 있음
  const file = Array.isArray(newIcon.value.file)
    ? newIcon.value.file[0]
    : newIcon.value.file;

  if (!file || !newIcon.value.name || !newIcon.value.price) {
    console.warn('필수 필드가 누락되었습니다');
    return;
  }

  // 현재 사용자 권한 확인을 위한 디버깅

  const { useUserStore } = await import('@/stores/user');
  const userStore = useUserStore();

  if (!userStore.isAuthenticated) {
    console.error('로그인되어 있지 않습니다');
    alert('먼저 로그인해주세요');
    return;
  }

  if (!userStore.isAdmin) {
    console.error('관리자 권한이 없습니다');
    alert('관리자 권한이 필요합니다');
    return;
  }

  uploadLoading.value = true;
  try {
    // 파일 업로드 및 아이콘 생성
    const iconData = {
      name: newIcon.value.name.trim(),
      price: Number(newIcon.value.price),
      category: newIcon.value.category,
      description: newIcon.value.description?.trim() || '',
      file: file, // 실제 File 객체 전달
    };

    await adminService.addIcon(iconData);

    // 폼 초기화
    newIcon.value = {
      name: '',
      price: 100,
      category: 'emotion',
      file: null,
      description: '',
    };

    // 목록 새로고침
    await loadIcons();
    emit('icon-updated');
  } catch (error) {
    console.error('아이콘 업로드 실패:', error);
    // 에러 메시지 표시 (필요시 추가)
  } finally {
    uploadLoading.value = false;
  }
};

// 아이콘 편집
const editIcon = (icon) => {
  selectedIcon.value = { ...icon };
  editDialog.value = true;
};

// 아이콘 저장
const saveIcon = async () => {
  try {
    await adminService.updateIconData(selectedIcon.value.id, {
      name: selectedIcon.value.name,
      price: selectedIcon.value.price,
      category: selectedIcon.value.category,
      description: selectedIcon.value.description,
      isActive: selectedIcon.value.isActive,
    });

    // 로컬 상태 업데이트
    const index = icons.value.findIndex((i) => i.id === selectedIcon.value.id);
    if (index !== -1) {
      icons.value[index] = { ...selectedIcon.value };
    }

    editDialog.value = false;
    emit('icon-updated');
  } catch (error) {
    console.error('Failed to save icon:', error);
  }
};

// 아이콘 상태 토글
const toggleIconStatus = async (icon) => {
  try {
    const newStatus = !icon.isActive;

    await adminService.updateIconData(icon.id, { isActive: newStatus });

    // 로컬 상태 업데이트
    const index = icons.value.findIndex((i) => i.id === icon.id);
    if (index !== -1) {
      icons.value[index].isActive = newStatus;
    }

    emit('icon-updated');
  } catch (error) {
    console.error('Failed to toggle icon status:', error);
  }
};

onMounted(() => {
  loadIcons();
});
</script>

<style scoped>
.icon-manager-container {
  max-width: 100%;
}

.icon-card {
  transition: transform 0.2s ease-in-out;
  position: relative;
}

.icon-card:hover {
  transform: translateY(-2px);
}

.icon-card--inactive {
  opacity: 0.6;
}

.icon-preview {
  position: relative;
  overflow: hidden;
}

.icon-image {
  border-radius: 8px 8px 0 0;
}

.inactive-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-medium-emphasis {
  opacity: 0.7;
}
</style>
