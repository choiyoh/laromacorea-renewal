<template>
  <div class="notice-manager-container">
    <!-- 공지사항 작성 -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card variant="outlined" class="pa-4">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-plus-circle" class="mr-2" />
            새 공지사항 작성
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="createNotice">
              <v-row>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="newNotice.title"
                    label="공지사항 제목"
                    variant="outlined"
                    required
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-select
                    v-model="newNotice.type"
                    label="유형"
                    :items="noticeTypeOptions"
                    variant="outlined"
                    required
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-select
                    v-model="newNotice.priority"
                    label="우선순위"
                    :items="priorityOptions"
                    variant="outlined"
                    required
                  />
                </v-col>
              </v-row>

              <v-textarea
                v-model="newNotice.content"
                label="공지사항 내용"
                variant="outlined"
                rows="6"
                class="mb-3"
                required
              />

              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="newNotice.startDate"
                    label="시작일"
                    type="datetime-local"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="newNotice.endDate"
                    label="종료일"
                    type="datetime-local"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4" class="d-flex align-center">
                  <v-switch
                    v-model="newNotice.isPinned"
                    label="상단 고정"
                    color="warning"
                    class="mr-4"
                  />
                  <v-switch
                    v-model="newNotice.isPopup"
                    label="팝업 표시"
                    color="error"
                  />
                </v-col>
              </v-row>

              <div class="d-flex justify-end">
                <v-btn
                  type="submit"
                  color="primary"
                  variant="elevated"
                  :loading="createLoading"
                >
                  <v-icon icon="mdi-bullhorn" class="mr-2" />
                  공지사항 등록
                </v-btn>
              </div>
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
          label="공지사항 검색"
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
          :items="typeFilterOptions"
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
          @click="loadNotices"
          :loading="loading"
          block
        >
          새로고침
        </v-btn>
      </v-col>
    </v-row>

    <!-- 공지사항 목록 -->
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-bullhorn" class="mr-2" />
        공지사항 관리
        <v-spacer />
        <v-chip color="info" variant="elevated">
          총 {{ filteredNotices.length }}개
        </v-chip>
      </v-card-title>

      <v-card-text>
        <v-list v-if="filteredNotices.length > 0" class="notice-list">
          <v-list-item
            v-for="notice in filteredNotices"
            :key="notice.id"
            class="notice-item"
          >
            <template #prepend>
              <v-avatar :color="getTypeColor(notice.type)" size="40">
                <v-icon :icon="getTypeIcon(notice.type)" />
              </v-avatar>
            </template>

            <v-list-item-title class="d-flex align-center">
              <div class="d-flex align-center flex-wrap gap-2 mb-1">
                <v-chip
                  v-if="notice.isPinned"
                  color="warning"
                  size="small"
                  variant="elevated"
                >
                  고정
                </v-chip>
                <v-chip
                  v-if="notice.isPopup"
                  color="error"
                  size="small"
                  variant="elevated"
                >
                  팝업
                </v-chip>
                <v-chip
                  :color="getPriorityColor(notice.priority)"
                  size="small"
                  variant="outlined"
                >
                  {{ getPriorityText(notice.priority) }}
                </v-chip>
              </div>
              <span class="font-weight-bold">{{ notice.title }}</span>
            </v-list-item-title>

            <v-list-item-subtitle class="mt-2">
              <div
                class="notice-content"
                v-html="getContentPreview(notice.content)"
              ></div>
              <div class="d-flex align-center justify-space-between mt-2">
                <div class="text-caption text-medium-emphasis">
                  {{ formatDate(notice.createdAt) }} • 조회
                  {{ notice.views || 0 }}회
                </div>
                <v-chip
                  :color="notice.isActive ? 'success' : 'error'"
                  size="x-small"
                  variant="elevated"
                >
                  {{ notice.isActive ? '활성' : '비활성' }}
                </v-chip>
              </div>
            </v-list-item-subtitle>

            <template #append>
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
                  <v-list-item @click="viewNotice(notice)">
                    <template #prepend>
                      <v-icon icon="mdi-eye" />
                    </template>
                    <v-list-item-title>보기</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="editNotice(notice)">
                    <template #prepend>
                      <v-icon icon="mdi-pencil" />
                    </template>
                    <v-list-item-title>편집</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="toggleNoticeStatus(notice)">
                    <template #prepend>
                      <v-icon
                        :icon="notice.isActive ? 'mdi-eye-off' : 'mdi-eye'"
                      />
                    </template>
                    <v-list-item-title>
                      {{ notice.isActive ? '비활성화' : '활성화' }}
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="deleteNotice(notice)" class="text-error">
                    <template #prepend>
                      <v-icon icon="mdi-delete" />
                    </template>
                    <v-list-item-title>삭제</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>

        <div v-else class="text-center py-8">
          <v-icon
            icon="mdi-bullhorn-outline"
            size="64"
            color="grey"
            class="mb-4"
          />
          <p class="text-h6 text-medium-emphasis">공지사항이 없습니다</p>
        </div>
      </v-card-text>
    </v-card>

    <!-- 공지사항 상세/편집 다이얼로그 -->
    <v-dialog v-model="detailDialog" max-width="800" scrollable>
      <v-card v-if="selectedNotice">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-bullhorn" class="mr-2" />
          {{ isEditing ? '공지사항 편집' : '공지사항 상세' }}
          <v-spacer />
          <v-btn
            v-if="!isEditing"
            icon="mdi-pencil"
            variant="text"
            @click="startEdit"
          />
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-form v-if="isEditing" @submit.prevent="saveNotice">
            <v-text-field
              v-model="selectedNotice.title"
              label="제목"
              variant="outlined"
              class="mb-3"
            />

            <v-row class="mb-3">
              <v-col cols="6">
                <v-select
                  v-model="selectedNotice.type"
                  label="유형"
                  :items="noticeTypeOptions"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="selectedNotice.priority"
                  label="우선순위"
                  :items="priorityOptions"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <v-textarea
              v-model="selectedNotice.content"
              label="내용"
              variant="outlined"
              rows="8"
              class="mb-3"
            />

            <v-row class="mb-3">
              <v-col cols="6">
                <v-text-field
                  v-model="selectedNotice.startDate"
                  label="시작일"
                  type="datetime-local"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="selectedNotice.endDate"
                  label="종료일"
                  type="datetime-local"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <div class="d-flex gap-4 mb-3">
              <v-switch
                v-model="selectedNotice.isPinned"
                label="상단 고정"
                color="warning"
              />
              <v-switch
                v-model="selectedNotice.isPopup"
                label="팝업 표시"
                color="error"
              />
              <v-switch
                v-model="selectedNotice.isActive"
                label="활성 상태"
                color="success"
              />
            </div>
          </v-form>

          <div v-else>
            <div class="mb-4">
              <h3 class="text-h5 mb-2">{{ selectedNotice.title }}</h3>
              <div class="d-flex align-center flex-wrap gap-2 mb-3">
                <v-chip
                  :color="getTypeColor(selectedNotice.type)"
                  size="small"
                  variant="elevated"
                >
                  {{ getTypeText(selectedNotice.type) }}
                </v-chip>
                <v-chip
                  :color="getPriorityColor(selectedNotice.priority)"
                  size="small"
                  variant="outlined"
                >
                  {{ getPriorityText(selectedNotice.priority) }}
                </v-chip>
                <v-chip
                  v-if="selectedNotice.isPinned"
                  color="warning"
                  size="small"
                  variant="elevated"
                >
                  고정
                </v-chip>
                <v-chip
                  v-if="selectedNotice.isPopup"
                  color="error"
                  size="small"
                  variant="elevated"
                >
                  팝업
                </v-chip>
              </div>
              <div class="text-caption text-medium-emphasis mb-3">
                작성일: {{ formatDate(selectedNotice.createdAt) }} • 조회:
                {{ selectedNotice.views || 0 }}회
              </div>
            </div>

            <div
              class="notice-content-detail"
              v-html="selectedNotice.content"
            ></div>

            <v-divider class="my-4" />

            <div class="d-flex align-center justify-space-between">
              <div>
                <div v-if="selectedNotice.startDate" class="text-caption">
                  시작일: {{ formatDate(selectedNotice.startDate) }}
                </div>
                <div v-if="selectedNotice.endDate" class="text-caption">
                  종료일: {{ formatDate(selectedNotice.endDate) }}
                </div>
              </div>
              <v-chip
                :color="selectedNotice.isActive ? 'success' : 'error'"
                variant="elevated"
              >
                {{ selectedNotice.isActive ? '활성' : '비활성' }}
              </v-chip>
            </div>
          </div>
        </v-card-text>

        <v-card-actions v-if="isEditing">
          <v-spacer />
          <v-btn @click="cancelEdit">취소</v-btn>
          <v-btn color="primary" @click="saveNotice" :loading="saveLoading"
            >저장</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { adminService } from '@/services/admin';
import { useUserStore } from '@/stores/user';

const emit = defineEmits(['notice-updated']);

const userStore = useUserStore();
const loading = ref(false);
const createLoading = ref(false);
const saveLoading = ref(false);
const notices = ref([]);
const searchTerm = ref('');
const typeFilter = ref('all');
const statusFilter = ref('all');

// 다이얼로그 상태
const detailDialog = ref(false);
const selectedNotice = ref(null);
const isEditing = ref(false);

// 새 공지사항 데이터
const newNotice = ref({
  title: '',
  content: '',
  type: 'general',
  priority: 'normal',
  startDate: '',
  endDate: '',
  isPinned: false,
  isPopup: false,
});

// 옵션들
const noticeTypeOptions = [
  { title: '일반', value: 'general' },
  { title: '업데이트', value: 'update' },
  { title: '이벤트', value: 'event' },
  { title: '점검', value: 'maintenance' },
  { title: '긴급', value: 'urgent' },
];

const typeFilterOptions = [
  { title: '전체', value: 'all' },
  ...noticeTypeOptions,
];

const priorityOptions = [
  { title: '낮음', value: 'low' },
  { title: '보통', value: 'normal' },
  { title: '높음', value: 'high' },
  { title: '긴급', value: 'urgent' },
];

const statusOptions = [
  { title: '전체', value: 'all' },
  { title: '활성', value: 'active' },
  { title: '비활성', value: 'inactive' },
];

// 필터링된 공지사항 목록
const filteredNotices = computed(() => {
  let filtered = notices.value;

  // 검색어 필터
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(
      (notice) =>
        notice.title?.toLowerCase().includes(term) ||
        notice.content?.toLowerCase().includes(term),
    );
  }

  // 유형 필터
  if (typeFilter.value !== 'all') {
    filtered = filtered.filter((notice) => notice.type === typeFilter.value);
  }

  // 상태 필터
  if (statusFilter.value !== 'all') {
    const isActive = statusFilter.value === 'active';
    filtered = filtered.filter((notice) => notice.isActive === isActive);
  }

  return filtered.sort((a, b) => {
    // 고정된 공지사항을 먼저 표시
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // 우선순위 순으로 정렬
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 2;
    const bPriority = priorityOrder[b.priority] || 2;

    if (aPriority !== bPriority) return bPriority - aPriority;

    // 생성일 순으로 정렬
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
});

// 유형 색상
const getTypeColor = (type) => {
  switch (type) {
    case 'urgent':
      return 'error';
    case 'maintenance':
      return 'warning';
    case 'event':
      return 'success';
    case 'update':
      return 'info';
    default:
      return 'primary';
  }
};

// 유형 아이콘
const getTypeIcon = (type) => {
  switch (type) {
    case 'urgent':
      return 'mdi-alert';
    case 'maintenance':
      return 'mdi-wrench';
    case 'event':
      return 'mdi-calendar-star';
    case 'update':
      return 'mdi-update';
    default:
      return 'mdi-information';
  }
};

// 유형 텍스트
const getTypeText = (type) => {
  const option = noticeTypeOptions.find((opt) => opt.value === type);
  return option ? option.title : '일반';
};

// 우선순위 색상
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'normal':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'grey';
  }
};

// 우선순위 텍스트
const getPriorityText = (priority) => {
  const option = priorityOptions.find((opt) => opt.value === priority);
  return option ? option.title : '보통';
};

// 날짜 포맷팅
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('ko-KR');
};

// 내용 미리보기 (HTML 태그 제거 후 길이 제한)
const getContentPreview = (content) => {
  if (!content) return '';

  // HTML 태그 제거
  const textContent = content.replace(/<[^>]*>/g, '');

  // 길이 제한
  if (textContent.length > 100) {
    return textContent.substring(0, 100) + '...';
  }

  return textContent;
};

// 공지사항 목록 로드
const loadNotices = async () => {
  loading.value = true;
  try {
    notices.value = await adminService.getNotices({ includeInactive: true });
  } catch (error) {
    console.error('Failed to load notices:', error);
    // 임시 데이터
    notices.value = [
      {
        id: '1',
        title: '시스템 점검 안내',
        content:
          '2025년 1월 15일 오전 2시부터 4시까지 시스템 점검이 진행됩니다. 점검 시간 동안 서비스 이용이 제한될 수 있습니다.',
        type: 'maintenance',
        priority: 'high',
        isPinned: true,
        isPopup: false,
        isActive: true,
        views: 150,
        createdAt: new Date(),
        startDate: '2025-01-15T02:00',
        endDate: '2025-01-15T04:00',
      },
      {
        id: '2',
        title: '새로운 아이콘 추가',
        content:
          'AS 로마 관련 새로운 아이콘들이 추가되었습니다. 아이콘 상점에서 확인해보세요!',
        type: 'update',
        priority: 'normal',
        isPinned: false,
        isPopup: true,
        isActive: true,
        views: 89,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    ];
  } finally {
    loading.value = false;
  }
};

// 공지사항 생성
const createNotice = async () => {
  createLoading.value = true;
  try {
    await adminService.createNotice(userStore.user.uid, newNotice.value);

    // 폼 초기화
    newNotice.value = {
      title: '',
      content: '',
      type: 'general',
      priority: 'normal',
      startDate: '',
      endDate: '',
      isPinned: false,
      isPopup: false,
    };

    // 목록 새로고침
    loadNotices();
    emit('notice-updated');
  } catch (error) {
    console.error('Failed to create notice:', error);
  } finally {
    createLoading.value = false;
  }
};

// 공지사항 보기
const viewNotice = (notice) => {
  selectedNotice.value = { ...notice };
  isEditing.value = false;
  detailDialog.value = true;
};

// 공지사항 편집 시작
const editNotice = (notice) => {
  selectedNotice.value = { ...notice };
  isEditing.value = true;
  detailDialog.value = true;
};

const startEdit = () => {
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

// 공지사항 저장
const saveNotice = async () => {
  saveLoading.value = true;
  try {
    // 실제 구현에서는 공지사항 업데이트 API 호출
    console.log('Save notice:', selectedNotice.value);

    // 로컬 상태 업데이트
    const index = notices.value.findIndex(
      (n) => n.id === selectedNotice.value.id,
    );
    if (index !== -1) {
      notices.value[index] = { ...selectedNotice.value };
    }

    isEditing.value = false;
    emit('notice-updated');
  } catch (error) {
    console.error('Failed to save notice:', error);
  } finally {
    saveLoading.value = false;
  }
};

// 공지사항 상태 토글
const toggleNoticeStatus = async (notice) => {
  try {
    // 실제 구현에서는 공지사항 상태 업데이트 API 호출
    const newStatus = !notice.isActive;

    // 로컬 상태 업데이트
    const index = notices.value.findIndex((n) => n.id === notice.id);
    if (index !== -1) {
      notices.value[index].isActive = newStatus;
    }

    emit('notice-updated');
  } catch (error) {
    console.error('Failed to toggle notice status:', error);
  }
};

// 공지사항 삭제
const deleteNotice = async (notice) => {
  if (confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
    try {
      // 실제 구현에서는 공지사항 삭제 API 호출

      // 로컬 상태에서 제거
      const index = notices.value.findIndex((n) => n.id === notice.id);
      if (index !== -1) {
        notices.value.splice(index, 1);
      }

      emit('notice-updated');
    } catch (error) {
      console.error('Failed to delete notice:', error);
    }
  }
};

// 다이얼로그 닫기
const closeDialog = () => {
  detailDialog.value = false;
  isEditing.value = false;
  selectedNotice.value = null;
};

onMounted(() => {
  loadNotices();
});
</script>

<style scoped>
.notice-manager-container {
  max-width: 100%;
}

.notice-list {
  max-height: 600px;
  overflow-y: auto;
}

.notice-item {
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.notice-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.notice-content {
  line-height: 1.4;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.notice-content-detail {
  line-height: 1.6;
  background-color: rgba(var(--v-theme-surface), 0.5);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 8px;
  padding: 16px;
  word-break: break-word;
}

.notice-content-detail :deep(p) {
  margin-bottom: 1em;
}

.notice-content-detail :deep(p:last-child) {
  margin-bottom: 0;
}

.notice-content-detail :deep(br) {
  line-height: 1.6;
}

.notice-content-detail :deep(ul),
.notice-content-detail :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.notice-content-detail :deep(blockquote) {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 3px solid rgba(var(--v-theme-primary), 0.5);
  font-style: italic;
}

.text-medium-emphasis {
  opacity: 0.7;
}
</style>
