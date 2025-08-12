<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-bullhorn</v-icon>
      공지사항 관리
    </v-card-title>

    <v-card-text>
      <!-- 새 공지사항 작성 버튼 -->
      <div class="mb-4">
        <v-btn color="primary" @click="openCreateDialog">
          <v-icon start>mdi-plus</v-icon>
          새 공지사항 작성
        </v-btn>
      </div>

      <!-- 공지사항 목록 -->
      <v-data-table
        :headers="headers"
        :items="notices"
        :loading="loading"
        item-value="id"
        class="elevation-1"
      >
        <template #item.title="{ item }">
          <div class="d-flex align-center">
            <v-chip
              v-if="item.isPinned"
              color="warning"
              variant="outlined"
              size="x-small"
              class="me-2"
            >
              고정
            </v-chip>
            <span>{{ item.title }}</span>
          </div>
        </template>

        <template #item.authorName="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="24" class="me-2">
              <v-img v-if="item.authorIcon" :src="item.authorIcon" />
              <v-icon v-else size="16">mdi-account</v-icon>
            </v-avatar>
            {{ item.authorName }}
          </div>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatDateTime(item.createdAt) }}
        </template>

        <template #item.viewCount="{ item }">
          {{ item.viewCount.toLocaleString() }}
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pin"
            size="small"
            variant="text"
            :color="item.isPinned ? 'warning' : 'grey'"
            @click="togglePin(item)"
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

    <!-- 공지사항 작성/수정 다이얼로그 -->
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          {{ editingNotice ? '공지사항 수정' : '새 공지사항 작성' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field v-model="noticeForm.title" label="제목" :rules="titleRules" required />

            <v-textarea
              v-model="noticeForm.content"
              label="내용"
              :rules="contentRules"
              required
              rows="10"
            />

            <v-switch
              v-model="noticeForm.isPinned"
              label="상단 고정"
              color="warning"
              hide-details
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">취소</v-btn>
          <v-btn color="primary" :loading="saving" :disabled="!valid" @click="saveNotice">
            {{ editingNotice ? '수정' : '작성' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 삭제 확인 다이얼로그 -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>공지사항 삭제</v-card-title>
        <v-card-text>
          정말로 이 공지사항을 삭제하시겠습니까?
          <br />
          <strong>{{ deletingNotice?.title }}</strong>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">취소</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteNotice">삭제</v-btn>
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
import { postService } from '@/services/database'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 상태
const loading = ref(false)
const notices = ref([])
const dialog = ref(false)
const deleteDialog = ref(false)
const valid = ref(false)
const saving = ref(false)
const deleting = ref(false)

// 편집 상태
const editingNotice = ref(null)
const deletingNotice = ref(null)

// 폼 데이터
const noticeForm = reactive({
  title: '',
  content: '',
  isPinned: true,
})

// 스낵바
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})

// 테이블 헤더
const headers = [
  { title: '제목', key: 'title', width: '40%' },
  { title: '작성자', key: 'authorName', width: '15%' },
  { title: '작성일', key: 'createdAt', width: '15%' },
  { title: '조회수', key: 'viewCount', width: '10%' },
  { title: '작업', key: 'actions', width: '20%', sortable: false },
]

// 유효성 검사 규칙
const titleRules = [
  (v) => !!v || '제목을 입력해주세요.',
  (v) => v.length <= 100 || '제목은 100자 이하로 입력해주세요.',
]

const contentRules = [
  (v) => !!v || '내용을 입력해주세요.',
  (v) => v.length >= 10 || '내용은 최소 10자 이상 입력해주세요.',
]

// 공지사항 목록 로드
const loadNotices = async () => {
  loading.value = true
  try {
    notices.value = await postService.getPosts('notice', null, 100)
  } catch (error) {
    console.error('공지사항 로드 실패:', error)
    showSnackbar('공지사항을 불러올 수 없습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// 새 공지사항 작성 다이얼로그 열기
const openCreateDialog = () => {
  editingNotice.value = null
  noticeForm.title = ''
  noticeForm.content = ''
  noticeForm.isPinned = true
  dialog.value = true
}

// 공지사항 수정 다이얼로그 열기
const openEditDialog = (notice) => {
  editingNotice.value = notice
  noticeForm.title = notice.title
  noticeForm.content = notice.content
  noticeForm.isPinned = notice.isPinned
  dialog.value = true
}

// 다이얼로그 닫기
const closeDialog = () => {
  dialog.value = false
  editingNotice.value = null
}

// 공지사항 저장
const saveNotice = async () => {
  if (!valid.value) return

  saving.value = true
  try {
    const noticeData = {
      title: noticeForm.title,
      content: noticeForm.content,
      isPinned: noticeForm.isPinned,
      authorId: userStore.user.uid,
      authorName: userStore.userDisplayName,
      authorIcon: userStore.userIcon,
    }

    if (editingNotice.value) {
      // 수정
      await AdminService.updateNotice(userStore.user.uid, editingNotice.value.id, noticeData)
      showSnackbar('공지사항이 수정되었습니다.', 'success')
    } else {
      // 새 작성
      await AdminService.createNotice(userStore.user.uid, noticeData)
      showSnackbar('공지사항이 작성되었습니다.', 'success')
    }

    closeDialog()
    loadNotices()
  } catch (error) {
    console.error('공지사항 저장 실패:', error)
    showSnackbar(error.message || '공지사항 저장에 실패했습니다.', 'error')
  } finally {
    saving.value = false
  }
}

// 고정 토글
const togglePin = async (notice) => {
  try {
    await AdminService.toggleNoticePin(userStore.user.uid, notice.id, !notice.isPinned)
    showSnackbar(`공지사항이 ${!notice.isPinned ? '고정' : '고정 해제'}되었습니다.`, 'success')
    loadNotices()
  } catch (error) {
    console.error('고정 설정 실패:', error)
    showSnackbar(error.message || '고정 설정에 실패했습니다.', 'error')
  }
}

// 삭제 확인
const confirmDelete = (notice) => {
  deletingNotice.value = notice
  deleteDialog.value = true
}

// 공지사항 삭제
const deleteNotice = async () => {
  if (!deletingNotice.value) return

  deleting.value = true
  try {
    await AdminService.deleteNotice(userStore.user.uid, deletingNotice.value.id)
    showSnackbar('공지사항이 삭제되었습니다.', 'success')
    deleteDialog.value = false
    deletingNotice.value = null
    loadNotices()
  } catch (error) {
    console.error('공지사항 삭제 실패:', error)
    showSnackbar(error.message || '공지사항 삭제에 실패했습니다.', 'error')
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
  loadNotices()
})
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}
</style>
