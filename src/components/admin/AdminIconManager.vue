<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-emoticon</v-icon>
      아이콘 상점 관리
    </v-card-title>

    <v-card-text>
      <!-- 새 아이콘 추가 버튼 -->
      <div class="mb-4">
        <v-btn color="primary" @click="openCreateDialog">
          <v-icon start>mdi-plus</v-icon>
          새 아이콘 추가
        </v-btn>
      </div>

      <!-- 아이콘 목록 -->
      <v-data-table
        :headers="headers"
        :items="icons"
        :loading="loading"
        item-value="id"
        class="elevation-1"
      >
        <template #item.imageUrl="{ item }">
          <v-avatar size="40">
            <v-img :src="item.imageUrl" :alt="item.name" />
          </v-avatar>
        </template>

        <template #item.name="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.name }}</div>
            <div class="text-caption text-grey">{{ item.category }}</div>
          </div>
        </template>

        <template #item.price="{ item }">
          <v-chip color="primary" variant="outlined" size="small">
            {{ item.price.toLocaleString() }}P
          </v-chip>
        </template>

        <template #item.isActive="{ item }">
          <v-chip :color="item.isActive ? 'success' : 'error'" variant="outlined" size="small">
            {{ item.isActive ? '활성' : '비활성' }}
          </v-chip>
        </template>

        <template #item.purchaseCount="{ item }">
          {{ (item.purchaseCount || 0).toLocaleString() }}
        </template>

        <template #item.createdAt="{ item }">
          {{ formatDateTime(item.createdAt) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            :color="item.isActive ? 'error' : 'success'"
            @click="toggleStatus(item)"
          />
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            color="primary"
            @click="openEditDialog(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card-text>

    <!-- 아이콘 추가/수정 다이얼로그 -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          {{ editingIcon ? '아이콘 수정' : '새 아이콘 추가' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="iconForm.name"
                  label="아이콘 이름"
                  :rules="nameRules"
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="iconForm.category"
                  label="카테고리"
                  :items="categories"
                  :rules="categoryRules"
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="iconForm.price"
                  label="가격 (포인트)"
                  type="number"
                  :rules="priceRules"
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="iconForm.isActive"
                  label="활성 상태"
                  color="success"
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="iconForm.imageUrl"
                  label="이미지 URL"
                  :rules="imageUrlRules"
                  required
                />
              </v-col>

              <!-- 이미지 미리보기 -->
              <v-col v-if="iconForm.imageUrl" cols="12">
                <div class="text-subtitle-2 mb-2">미리보기:</div>
                <v-avatar size="60">
                  <v-img
                    :src="iconForm.imageUrl"
                    :alt="iconForm.name"
                    @error="imageError = true"
                    @load="imageError = false"
                  />
                </v-avatar>
                <div v-if="imageError" class="text-error text-caption mt-1">
                  이미지를 불러올 수 없습니다.
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">취소</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!valid || imageError"
            @click="saveIcon"
          >
            {{ editingIcon ? '수정' : '추가' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 삭제 확인 다이얼로그 -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>아이콘 삭제</v-card-title>
        <v-card-text>
          정말로 이 아이콘을 삭제하시겠습니까?
          <br />
          <strong>{{ deletingIcon?.name }}</strong>
          <br />
          <small class="text-warning"> 이미 구매한 사용자들은 계속 사용할 수 있습니다. </small>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">취소</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteIcon">삭제</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 스낵바 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { AdminService } from '@/services/admin'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 상태
const loading = ref(false)
const icons = ref([])
const dialog = ref(false)
const deleteDialog = ref(false)
const valid = ref(false)
const saving = ref(false)
const deleting = ref(false)
const imageError = ref(false)

// 편집 상태
const editingIcon = ref(null)
const deletingIcon = ref(null)

// 폼 데이터
const iconForm = reactive({
  name: '',
  category: '',
  price: 100,
  imageUrl: '',
  isActive: true,
})

// 스낵바
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})

// 카테고리 옵션
const categories = ['기본', '스페셜', '시즌', '이벤트', '프리미엄']

// 테이블 헤더
const headers = [
  { title: '이미지', key: 'imageUrl', width: '80px', sortable: false },
  { title: '이름', key: 'name', width: '20%' },
  { title: '가격', key: 'price', width: '10%' },
  { title: '상태', key: 'isActive', width: '10%' },
  { title: '구매수', key: 'purchaseCount', width: '10%' },
  { title: '등록일', key: 'createdAt', width: '15%' },
  { title: '작업', key: 'actions', width: '15%', sortable: false },
]

// 유효성 검사 규칙
const nameRules = [
  (v) => !!v || '아이콘 이름을 입력해주세요.',
  (v) => v.length <= 20 || '아이콘 이름은 20자 이하로 입력해주세요.',
]

const categoryRules = [(v) => !!v || '카테고리를 선택해주세요.']

const priceRules = [
  (v) => (v !== null && v !== undefined && v !== '') || '가격을 입력해주세요.',
  (v) => Number.isInteger(Number(v)) || '정수만 입력 가능합니다.',
  (v) => Number(v) >= 0 || '가격은 0 이상이어야 합니다.',
  (v) => Number(v) <= 10000 || '가격은 10,000포인트 이하로 설정해주세요.',
]

const imageUrlRules = [
  (v) => !!v || '이미지 URL을 입력해주세요.',
  (v) => {
    try {
      new URL(v)
      return true
    } catch {
      return '유효한 URL을 입력해주세요.'
    }
  },
]

// 아이콘 목록 로드
const loadIcons = async () => {
  loading.value = true
  try {
    icons.value = await AdminService.getAllIcons()
  } catch (error) {
    console.error('아이콘 로드 실패:', error)
    showSnackbar('아이콘 목록을 불러올 수 없습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// 새 아이콘 추가 다이얼로그 열기
const openCreateDialog = () => {
  editingIcon.value = null
  iconForm.name = ''
  iconForm.category = ''
  iconForm.price = 100
  iconForm.imageUrl = ''
  iconForm.isActive = true
  imageError.value = false
  dialog.value = true
}

// 아이콘 수정 다이얼로그 열기
const openEditDialog = (icon) => {
  editingIcon.value = icon
  iconForm.name = icon.name
  iconForm.category = icon.category
  iconForm.price = icon.price
  iconForm.imageUrl = icon.imageUrl
  iconForm.isActive = icon.isActive
  imageError.value = false
  dialog.value = true
}

// 다이얼로그 닫기
const closeDialog = () => {
  dialog.value = false
  editingIcon.value = null
  imageError.value = false
}

// 아이콘 저장
const saveIcon = async () => {
  if (!valid.value || imageError.value) return

  saving.value = true
  try {
    const iconData = {
      name: iconForm.name,
      category: iconForm.category,
      price: iconForm.price,
      imageUrl: iconForm.imageUrl,
      isActive: iconForm.isActive,
    }

    if (editingIcon.value) {
      // 수정
      await AdminService.updateIcon(userStore.user.uid, editingIcon.value.id, iconData)
      showSnackbar('아이콘이 수정되었습니다.', 'success')
    } else {
      // 새 추가
      await AdminService.createIcon(userStore.user.uid, iconData)
      showSnackbar('아이콘이 추가되었습니다.', 'success')
    }

    closeDialog()
    loadIcons()
  } catch (error) {
    console.error('아이콘 저장 실패:', error)
    showSnackbar(error.message || '아이콘 저장에 실패했습니다.', 'error')
  } finally {
    saving.value = false
  }
}

// 상태 토글
const toggleStatus = async (icon) => {
  try {
    await AdminService.toggleIconStatus(userStore.user.uid, icon.id, !icon.isActive)
    showSnackbar(`아이콘이 ${!icon.isActive ? '활성화' : '비활성화'}되었습니다.`, 'success')
    loadIcons()
  } catch (error) {
    console.error('아이콘 상태 변경 실패:', error)
    showSnackbar(error.message || '아이콘 상태 변경에 실패했습니다.', 'error')
  }
}

// 삭제 확인
const confirmDelete = (icon) => {
  deletingIcon.value = icon
  deleteDialog.value = true
}

// 아이콘 삭제
const deleteIcon = async () => {
  if (!deletingIcon.value) return

  deleting.value = true
  try {
    await AdminService.deleteIcon(userStore.user.uid, deletingIcon.value.id)
    showSnackbar('아이콘이 삭제되었습니다.', 'success')
    deleteDialog.value = false
    deletingIcon.value = null
    loadIcons()
  } catch (error) {
    console.error('아이콘 삭제 실패:', error)
    showSnackbar(error.message || '아이콘 삭제에 실패했습니다.', 'error')
  } finally {
    deleting.value = false
  }
}

// 유틸리티 함수
const formatDateTime = (date) => {
  if (!date) return ''
  const targetDate = date instanceof Date ? date : new Date(date.seconds * 1000)
  return targetDate.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const showSnackbar = (message, color = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadIcons()
})
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}
</style>
