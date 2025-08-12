# 미디어 업로드 시스템

AS 로마 한국 팬 커뮤니티 사이트의 미디어 업로드 시스템 구현 문서입니다.

## 개요

이 시스템은 Firebase Storage를 활용하여 이미지와 동영상 파일을 업로드하고 관리하는 기능을 제공합니다. 사용자 친화적인 드래그 앤 드롭 인터페이스와 진행률 표시, 파일 검증 등의 기능을 포함합니다.

## 주요 구성 요소

### 1. MediaUploader 컴포넌트 (`src/components/common/MediaUploader.vue`)

재사용 가능한 미디어 업로드 컴포넌트입니다.

#### 주요 기능

- 드래그 앤 드롭 파일 업로드
- 파일 타입 및 크기 검증
- 실시간 업로드 진행률 표시
- 자동/수동 업로드 모드
- 파일 미리보기
- 에러 처리 및 사용자 피드백

#### Props

```vue
<MediaUploader
  v-model="files"
  :max-files="10"
  :max-size="50 * 1024 * 1024"
  :accepted-types="['image/jpeg', 'image/png', 'image/gif', 'video/mp4']"
  :auto-upload="true"
  :disabled="false"
  upload-path="posts"
  @upload-complete="onUploadComplete"
  @upload-error="onUploadError"
/>
```

#### Events

- `upload-complete`: 파일 업로드 완료 시 발생
- `upload-error`: 업로드 실패 시 발생
- `update:modelValue`: 파일 목록 변경 시 발생

### 2. MediaPreview 컴포넌트 (`src/components/common/MediaPreview.vue`)

업로드된 파일의 미리보기를 표시하는 컴포넌트입니다.

#### 기능

- 이미지 미리보기
- 동영상 미리보기 (컨트롤 포함)
- 파일 정보 표시 (이름, 크기, 타입)
- 삭제 버튼
- 업로드 상태 표시

### 3. Storage Service (`src/services/storage.js`)

Firebase Storage와의 상호작용을 담당하는 서비스입니다.

#### 주요 메서드

- `uploadImage(file, path, onProgress)`: 이미지 업로드
- `uploadVideo(file, path, onProgress)`: 동영상 업로드
- `validateFile(file, options)`: 파일 검증
- `deleteFile(url)`: 파일 삭제
- `resizeImage(file, options)`: 이미지 리사이징
- `generateThumbnail(file, size)`: 썸네일 생성
- `generateVideoThumbnail(file, time)`: 동영상 썸네일 생성

### 4. Media Upload Composable (`src/composables/useMediaUpload.js`)

미디어 업로드 로직을 관리하는 컴포저블입니다.

#### 사용 예시

```javascript
import { useMediaUpload } from '@/composables/useMediaUpload'

const { files, uploadProgress, isUploading, addFile, uploadAllPending, removeFile, clearFiles } =
  useMediaUpload({
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
    uploadPath: 'posts',
  })
```

## 사용 방법

### 1. 기본 사용법

```vue
<template>
  <MediaUploader
    v-model="uploadedFiles"
    :max-files="5"
    :max-size="10 * 1024 * 1024"
    upload-path="posts"
    @upload-complete="onUploadComplete"
  />
</template>

<script setup>
import { ref } from 'vue'
import MediaUploader from '@/components/common/MediaUploader.vue'

const uploadedFiles = ref([])

function onUploadComplete(fileData) {
  console.log('업로드 완료:', fileData)
}
</script>
```

### 2. 수동 업로드 모드

```vue
<template>
  <MediaUploader ref="uploader" v-model="files" :auto-upload="false" upload-path="manual" />

  <v-btn @click="uploadFiles">업로드 시작</v-btn>
</template>

<script setup>
import { ref } from 'vue'

const uploader = ref(null)
const files = ref([])

async function uploadFiles() {
  await uploader.value.uploadPendingFiles()
}
</script>
```

### 3. PostEditor에서의 사용

PostEditor 컴포넌트에서는 Media 게시판에서만 미디어 업로드 기능이 활성화됩니다:

```vue
<div v-if="showMediaUpload" class="media-upload mb-4">
  <MediaUploader
    v-model="uploadedFiles"
    :max-files="10"
    :max-size="50 * 1024 * 1024"
    upload-path="posts"
    @upload-complete="onMediaUploadComplete"
  />
</div>
```

## 파일 제한 사항

### 기본 설정

- **최대 파일 크기**:
  - 이미지: 10MB
  - 동영상: 50MB
- **지원 파일 형식**:
  - 이미지: JPEG, PNG, GIF
  - 동영상: MP4, WebM
- **최대 파일 개수**: 10개 (설정 가능)

### Firebase Storage Rules

```javascript
// 게시글 미디어 파일
match /posts/{postId}/{fileName} {
  allow read: if true;
  allow write: if isAuthenticated() &&
                  (isValidImageFile() || isValidVideoFile());
  allow delete: if isAuthenticated() &&
                   (isAuthor(postId) || isAdmin());
}
```

## 에러 처리

### 클라이언트 사이드 검증

- 파일 크기 제한 확인
- 파일 타입 검증
- 최대 파일 개수 제한

### 서버 사이드 검증

- Firebase Storage Rules를 통한 권한 검증
- 파일 크기 및 타입 재검증

### 사용자 피드백

- 실시간 업로드 진행률 표시
- 에러 메시지 표시
- 성공/실패 상태 알림

## 성능 최적화

### 이미지 최적화

- 클라이언트 사이드 이미지 리사이징
- 썸네일 자동 생성
- 지연 로딩 지원

### 업로드 최적화

- 청크 업로드 지원 (Firebase SDK 내장)
- 재시도 로직
- 네트워크 상태 감지

## 테스트

### 단위 테스트

```bash
npm run test:unit -- MediaUploader.spec.js
```

### 통합 테스트

테스트 페이지에서 실제 업로드 기능을 확인할 수 있습니다:
`/test/media-upload` (개발 환경에서만 접근 가능)

## 보안 고려사항

### 파일 검증

- 파일 확장자와 MIME 타입 이중 검증
- 악성 파일 업로드 방지
- 파일 크기 제한

### 접근 권한

- 인증된 사용자만 업로드 가능
- 작성자 또는 관리자만 삭제 가능
- Firebase Security Rules를 통한 서버 사이드 검증

### 스토리지 관리

- 사용하지 않는 파일 자동 정리 (향후 구현)
- 스토리지 사용량 모니터링
- CDN을 통한 파일 배포

## 향후 개선 사항

1. **이미지 편집 기능**: 크롭, 회전, 필터 등
2. **동영상 처리**: 썸네일 자동 생성, 압축
3. **클라우드 함수 연동**: 서버 사이드 이미지 처리
4. **진행률 개선**: 더 정확한 업로드 진행률 표시
5. **오프라인 지원**: 네트워크 복구 시 자동 재업로드

## 문제 해결

### 일반적인 문제

1. **업로드 실패**
   - 네트워크 연결 확인
   - 파일 크기 및 형식 확인
   - Firebase 설정 확인

2. **느린 업로드 속도**
   - 파일 크기 최적화
   - 네트워크 상태 확인
   - 이미지 리사이징 활용

3. **권한 오류**
   - 사용자 인증 상태 확인
   - Firebase Security Rules 확인

### 디버깅

개발자 도구의 콘솔에서 업로드 관련 로그를 확인할 수 있습니다:

```javascript
// 업로드 진행률 로그
console.log('Upload progress:', progress)

// 업로드 완료 로그
console.log('Upload complete:', downloadURL)

// 에러 로그
console.error('Upload error:', error)
```
