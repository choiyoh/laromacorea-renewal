<template>
  <div class="post-editor">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-pencil" class="me-2" />
          {{ isEdit ? '게시글 수정' : '게시글 작성' }}
        </div>
        <div v-if="userStore.user" class="d-flex align-center text-caption">
          <v-avatar size="20" class="me-2">
            <v-img
              v-if="userStore.user.photoURL"
              :src="userStore.user.photoURL"
              :alt="userStore.userDisplayName"
            />
            <v-icon v-else icon="mdi-account" size="16" />
          </v-avatar>
          {{ userStore.userDisplayName }}
        </div>
      </v-card-title>

      <div class="custom-divider"></div>

      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <!-- 제목 입력 -->
          <v-text-field
            v-model="formData.title"
            label="제목"
            variant="outlined"
            :rules="titleRules"
            required
            class="mb-4"
          />

          <!-- 게시판 선택 (새 글 작성시만) -->
          <v-select
            v-if="!isEdit && !boardType"
            v-model="formData.boardType"
            :items="boardOptions"
            label="게시판"
            variant="outlined"
            :rules="boardRules"
            required
            class="mb-4"
            @update:model-value="handleBoardTypeChange"
          />

          <!-- Match 게시판 템플릿 -->
          <div
            v-if="formData.boardType === 'match' && !isEdit"
            class="match-template mb-4"
          >
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-soccer" class="me-2" />
                Match Post Template
              </v-card-title>
              <v-card-text>
                <v-btn
                  color="primary"
                  variant="outlined"
                  block
                  @click="showMatchTemplate = true"
                >
                  <v-icon icon="mdi-plus" class="me-2" />
                  Use Today's Match Template
                </v-btn>
              </v-card-text>
            </v-card>
          </div>

          <!-- 리치 텍스트 에디터 -->
          <div class="editor-container mb-4">
            <div ref="editorContainer" class="editor-wrapper">
              <div ref="editor" class="editor" />
            </div>
            <div v-if="contentError" class="error-message">
              {{ contentError }}
            </div>
          </div>

          <!-- 미디어 업로드 (Media 게시판용) -->
          <div v-if="showMediaUpload" class="media-upload mb-4">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-1">
                <v-icon icon="mdi-image-multiple" class="me-2" />
                미디어 파일
              </v-card-title>
              <v-card-text>
                <MediaUploader
                  v-model="uploadedFiles"
                  :max-files="10"
                  :max-size="50 * 1024 * 1024"
                  :accepted-types="[
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'video/mp4',
                    'video/webm',
                  ]"
                  upload-path="posts"
                  @upload-complete="onMediaUploadComplete"
                  @upload-error="onMediaUploadError"
                />
              </v-card-text>
            </v-card>
          </div>

          <!-- 임시저장 알림 -->
          <v-alert
            v-if="draftSaved"
            type="info"
            variant="tonal"
            class="mb-4"
            dismissible
          >
            임시저장되었습니다.
          </v-alert>
        </v-form>
      </v-card-text>

      <div class="custom-divider"></div>

      <v-card-actions class="pa-4">
        <v-btn variant="outlined" @click="saveDraft" :disabled="loading">
          임시저장
        </v-btn>
        <v-spacer />
        <v-btn variant="outlined" @click="$emit('cancel')" :disabled="loading">
          취소
        </v-btn>
        <v-btn
          color="primary"
          @click="handleSubmit"
          :loading="loading"
          :disabled="!valid || loading"
        >
          {{ isEdit ? '수정' : '작성' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Match Template Dialog -->
    <v-dialog
      v-model="showMatchTemplate"
      max-width="900px"
      scrollable
      persistent
      class="match-template-dialog"
    >
      <MatchPostTemplate
        :available-matches="availableMatches"
        @create-post="handleMatchTemplateCreate"
        @cancel="showMatchTemplate = false"
      />
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { postService } from '@/services/database';
import { storageService } from '@/services/storage';
import { matchService } from '@/services/match';

import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import MediaUploader from '../common/MediaUploader.vue';
import MatchPostTemplate from './MatchPostTemplate.vue';

const props = defineProps({
  boardType: {
    type: String,
    default: null,
  },
  post: {
    type: Object,
    default: null,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'cancel']);

// Stores
const userStore = useUserStore();

// Refs
const form = ref(null);
const editor = ref(null);
const editorContainer = ref(null);

// State
const valid = ref(false);
const loading = ref(false);
const quillEditor = ref(null);
const contentError = ref('');
const uploadedFiles = ref([]);
const draftSaved = ref(false);
const showMatchTemplate = ref(false);
const availableMatches = ref([]);

// Form data
const formData = ref({
  title: '',
  content: '',
  boardType: props.boardType || '',
  tags: [],
  mediaUrls: [],
});

// Board options
const boardOptions = [
  { title: 'Notice', value: 'notice' },
  { title: 'Squad', value: 'squad' },
  { title: 'Match', value: 'match' },
  { title: 'Calcio', value: 'calcio' },
  { title: 'Free', value: 'free' },
  { title: 'Special', value: 'special' },
  { title: 'Media', value: 'media' },
];

// Validation rules
const titleRules = [
  (v) => !!v || '제목을 입력해주세요',
  (v) => (v && v.length >= 2) || '제목은 2글자 이상이어야 합니다',
  (v) => (v && v.length <= 100) || '제목은 100글자 이하여야 합니다',
];

const boardRules = [(v) => !!v || '게시판을 선택해주세요'];

// Computed
const showMediaUpload = computed(() => {
  return formData.value.boardType === 'media';
});

// Methods
function initializeEditor() {
  if (!editor.value) return;

  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ size: ['small', false, 'large', 'huge'] }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ['link', 'video'],
  ];

  quillEditor.value = new Quill(editor.value, {
    theme: 'snow',
    modules: {
      toolbar: toolbarOptions,
    },
    placeholder: '내용을 입력해주세요...',
  });

  // 내용 변경 감지
  quillEditor.value.on('text-change', () => {
    formData.value.content = quillEditor.value.root.innerHTML;
    validateContent();
  });

  // 이미지 업로드 핸들러
  quillEditor.value.getModule('toolbar').addHandler('image', handleImageInsert);
}

function validateContent() {
  const text = quillEditor.value.getText().trim();
  if (text.length === 0) {
    contentError.value = '내용을 입력해주세요';
    return false;
  } else if (text.length < 10) {
    contentError.value = '내용은 10글자 이상이어야 합니다';
    return false;
  } else {
    contentError.value = '';
    return true;
  }
}

async function handleImageInsert() {
  // Quill 에디터가 초기화되었는지 확인
  if (!quillEditor.value) {
    alert('에디터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    // 사용자 로그인 확인
    if (!userStore.user) {
      alert('이미지 업로드를 위해 로그인이 필요합니다.');
      return;
    }

    const validation = storageService.validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB for editor images
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    });

    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    try {
      // 업로드 진행 상태를 HTML로 직접 추가 (Quill API 사용하지 않음)
      const currentContent = quillEditor.value.root.innerHTML;
      const uploadingHtml = '<p><em>이미지 업로드 중...</em></p>';
      quillEditor.value.root.innerHTML = currentContent + uploadingHtml;

      // 파일 업로드
      const fileName = `posts/${Date.now()}_${file.name}`;
      const downloadURL = await storageService.uploadFile(file, fileName);

      // 업로드 완료 후 이미지로 교체
      const imageHtml = `<p><img src="${downloadURL}" alt="업로드된 이미지"></p><p><br></p>`;
      const updatedContent = quillEditor.value.root.innerHTML.replace(
        uploadingHtml,
        imageHtml,
      );
      quillEditor.value.root.innerHTML = updatedContent;

      // 내용 변경 이벤트 트리거
      formData.value.content = quillEditor.value.root.innerHTML;
    } catch (error) {
      console.error('Image upload error:', error);

      // 업로드 중 텍스트 제거
      try {
        const currentContent = quillEditor.value.root.innerHTML;
        const cleanedContent = currentContent.replace(
          '<p><em>이미지 업로드 중...</em></p>',
          '',
        );
        quillEditor.value.root.innerHTML = cleanedContent;
      } catch (cleanupError) {
        console.warn('Failed to cleanup upload text:', cleanupError);
      }

      // 에러 메시지 표시
      let errorMessage = '이미지 업로드에 실패했습니다.';
      if (error.code === 'storage/unauthorized') {
        errorMessage =
          '이미지 업로드 권한이 없습니다. 로그인 상태를 확인해주세요.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = '저장 공간이 부족합니다.';
      } else if (error.code === 'storage/invalid-format') {
        errorMessage = '지원하지 않는 이미지 형식입니다.';
      } else if (error.message) {
        errorMessage += ` (${error.message})`;
      }

      alert(errorMessage);
    }
  };
}

// Media upload event handlers
function onMediaUploadComplete(fileData) {
  // Add the uploaded file URL to mediaUrls array
  if (!formData.value.mediaUrls.includes(fileData.url)) {
    formData.value.mediaUrls.push(fileData.url);
  }
}

function onMediaUploadError({ file, error }) {
  alert(
    `${file.name} 업로드에 실패했습니다: ${error.message || '알 수 없는 오류'}`,
  );
}

// Watch for changes in uploadedFiles to sync with mediaUrls
watch(
  uploadedFiles,
  (newFiles) => {
    // Update mediaUrls based on uploaded files
    formData.value.mediaUrls = newFiles
      .filter((file) => file.uploaded && file.url)
      .map((file) => file.url);
  },
  { deep: true },
);

async function handleSubmit() {
  if (!form.value.validate() || !validateContent()) {
    return;
  }

  // 사용자 로그인 확인
  if (!userStore.user) {
    alert('로그인이 필요합니다.');
    return;
  }

  loading.value = true;

  try {
    const postData = {
      title: formData.value.title.trim(),
      content: formData.value.content,
      boardType: formData.value.boardType,
      tags: formData.value.tags || [],
      mediaUrls: formData.value.mediaUrls || [],
      authorId: userStore.user.uid,
      authorName: userStore.userDisplayName,
      authorEmail: userStore.user.email,
      authorPhotoURL: userStore.user.photoURL || null,
      authorIcon: userStore.user.selectedIconData?.url || null,
    };

    // 경기 게시글 관련 데이터 추가
    if (formData.value.isMatchPost) {
      postData.matchId = formData.value.matchId;
      postData.matchData = formData.value.matchData;
      postData.templateOptions = formData.value.templateOptions;
      postData.isMatchPost = true;
    }

    let result;
    if (props.isEdit) {
      result = await postService.updatePost(props.post.id, postData);
    } else {
      result = await postService.createPost(postData);
    }

    // 성공 메시지 표시
    const message = props.isEdit
      ? '게시글이 수정되었습니다.'
      : '게시글이 작성되었습니다.';

    // 임시저장 데이터 삭제
    clearDraft();

    // 성공 알림 (간단한 방법)
    if (window.alert) {
      alert(message);
    }

    emit('submit', result);
  } catch (error) {
    alert(`게시글 저장에 실패했습니다: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

function saveDraft() {
  const draftData = {
    ...formData.value,
    content: quillEditor.value.root.innerHTML,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(
    `post_draft_${props.boardType || 'general'}`,
    JSON.stringify(draftData),
  );
  draftSaved.value = true;

  setTimeout(() => {
    draftSaved.value = false;
  }, 3000);
}

function loadDraft() {
  const draftKey = `post_draft_${props.boardType || 'general'}`;
  const savedDraft = localStorage.getItem(draftKey);

  if (savedDraft) {
    try {
      const draftData = JSON.parse(savedDraft);
      formData.value = { ...formData.value, ...draftData };

      nextTick(() => {
        if (quillEditor.value && draftData.content) {
          quillEditor.value.root.innerHTML = draftData.content;
        }
      });
    } catch (error) {
      // Error loading draft
    }
  }
}

function clearDraft() {
  const draftKey = `post_draft_${props.boardType || 'general'}`;
  localStorage.removeItem(draftKey);
}

function handleBoardTypeChange(boardType) {
  if (boardType === 'match') {
    loadAvailableMatches();
  }
}

async function loadAvailableMatches() {
  try {
    // Get upcoming matches
    let matches = await matchService.getUpcomingMatches();

    // If no matches from API, use mock data
    if (!matches || matches.length === 0) {
      matches = matchService.getMockMatches();
    }

    availableMatches.value = matches;
  } catch (error) {
    // Fallback to sample data
    availableMatches.value = matchService.getMockMatches();
  }
}

function handleMatchTemplateCreate(postData) {
  // Apply template data to form
  formData.value.title = postData.title;
  formData.value.tags = postData.tags;

  // Set content in editor
  if (quillEditor.value) {
    quillEditor.value.root.innerHTML = postData.content;
    formData.value.content = postData.content;
  }

  // Store match-specific data
  formData.value.matchId = postData.matchId;
  formData.value.matchData = postData.matchData;
  formData.value.templateOptions = postData.templateOptions;
  formData.value.isMatchPost = true;

  showMatchTemplate.value = false;
}

// Lifecycle
onMounted(async () => {
  await nextTick();
  initializeEditor();

  // Match 게시판이면 경기 데이터 미리 로드
  if (props.boardType === 'match' || formData.value.boardType === 'match') {
    await loadAvailableMatches();
  }

  if (props.isEdit && props.post) {
    formData.value = {
      title: props.post.title,
      content: props.post.content,
      boardType: props.post.boardType,
      tags: props.post.tags || [],
      mediaUrls: props.post.mediaUrls || [],
    };

    if (quillEditor.value) {
      quillEditor.value.root.innerHTML = props.post.content;
    }

    // Load existing media files
    if (props.post.mediaUrls) {
      uploadedFiles.value = props.post.mediaUrls.map((url, index) => ({
        name: `media_${index}`,
        url,
        type: url.includes('video') ? 'video' : 'image',
        size: 0,
        uploaded: true,
        uploadedAt: new Date().toISOString(),
      }));
    }
  } else {
    loadDraft();
  }
});

onUnmounted(() => {
  if (quillEditor.value) {
    quillEditor.value = null;
  }
});

// Auto-save draft every 30 seconds
let autoSaveInterval;
watch(
  () => formData.value,
  () => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
    }

    autoSaveInterval = setInterval(() => {
      if (
        formData.value.title ||
        (quillEditor.value && quillEditor.value.getText().trim())
      ) {
        saveDraft();
      }
    }, 30000);
  },
  { deep: true },
);

onUnmounted(() => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
});
</script>

<style>
.ql-editing {
  left: 0 !important;
  top: 0 !important;
}

.ql-editor .ql-video {
  width: 600px !important;
  min-height: 320px !important;
}

@media (max-width: 768px) {
  .ql-editor .ql-video {
    width: 100% !important;
    min-height: auto !important;
  }
}
</style>

<style scoped>
.post-editor {
  max-width: 100%;
}

.custom-divider {
  height: 2px;
  background-image: url('/images/s_top_bg.gif');
  background-repeat: repeat-x;
  background-position: center;
  width: 100%;
}

.editor-container {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

.editor-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-bottom: 8px;
}

.editor-wrapper {
  min-height: 300px;
}

.editor {
  min-height: 250px;
}

.error-message {
  color: rgb(var(--v-theme-error));
  font-size: 0.75rem;
  margin-top: 4px;
  padding-left: 12px;
}

/* Quill editor customization */
:deep(.ql-editor) {
  min-height: 250px;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.ql-toolbar) {
  border-top: none;
  border-left: none;
  border-right: none;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep(.ql-container) {
  border: none;
  font-family: inherit;
}

/* Dialog styling */
:deep(.match-template-dialog .v-overlay__content) {
  background-color: rgb(var(--v-theme-surface));
  border-radius: 8px;
}

:deep(.match-template-dialog .v-card) {
  background-color: rgb(var(--v-theme-surface)) !important;
}

@media (max-width: 768px) {
  :deep(.ql-toolbar) {
    padding: 8px;
  }

  :deep(.ql-formats) {
    margin-right: 8px;
  }

  :deep(.match-template-dialog) {
    margin: 16px;
  }

  :deep(.match-template-dialog .v-overlay__content) {
    max-height: 90vh;
  }
}
</style>
