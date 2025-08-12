# Design Document

## Overview

AS 로마 한국 팬 커뮤니티 사이트는 Vue.js 3 + Composition API를 기반으로 한 SPA(Single Page Application)로 구축됩니다. Firebase를 백엔드로 활용하여 실시간 데이터 동기화, 사용자 인증, 파일 저장소 기능을 제공합니다. 모바일 우선 반응형 디자인으로 모든 디바이스에서 최적의 사용자 경험을 제공합니다.

## Architecture

### Frontend Architecture

```
Vue.js 3 Application
├── Router (Vue Router 4)
├── State Management (Pinia)
├── UI Framework (Vuetify 3)
├── Components
│   ├── Layout Components
│   ├── Board Components
│   ├── User Components
│   └── Common Components
└── Services
    ├── Firebase Service
    ├── Auth Service
    └── API Service
```

### Backend Architecture (Firebase)

```
Firebase Services
├── Authentication (사용자 인증)
├── Firestore Database (게시판, 사용자 데이터)
├── Storage (미디어 파일)
├── Hosting (웹사이트 배포)
└── Functions (서버리스 로직)
```

### Database Schema (Firestore)

```
Collections:
├── users (사용자 정보)
├── boards (게시판 설정)
├── posts (게시글)
├── comments (댓글)
├── icons (아이콘 상점)
└── points_history (포인트 내역)
```

## Components and Interfaces

### 1. Layout Components

#### AppHeader.vue

- 로고, 네비게이션 메뉴
- 사용자 프로필 드롭다운
- 모바일 햄버거 메뉴
- 반응형 디자인

#### AppNavigation.vue

- 7개 게시판 메뉴
- 현재 페이지 하이라이트
- 모바일에서 사이드바 형태

#### AppFooter.vue

- 사이트 정보
- 소셜 미디어 링크
- 저작권 정보

### 2. Board Components

#### BoardList.vue

```vue
Props: - boardType: string (notice, squad, match, calcio, free, special, media, icon) - posts: Array
<Post></Post>
```

#### PostDetail.vue

```vue
Props: - postId: string Features: - 게시글 상세 내용 - 댓글 시스템 - 좋아요/추천 기능 - 공유 기능
```

#### PostEditor.vue

```vue
Features: - 리치 텍스트 에디터 - 이미지/동영상 업로드 - 미리보기 기능 - 임시저장
```

### 3. User Components

#### UserProfile.vue

```vue
Features: - 사용자 정보 표시 - 아이콘 선택 - 포인트 현황 - 작성글 목록
```

#### IconShop.vue

```vue
Features: - 아이콘 목록 표시 - 포인트로 구매 - 미리보기 기능 - 구매 내역
```

#### AuthModal.vue

```vue
Features: - 로그인/회원가입 폼 - 비밀번호 재설정 - 이메일 인증
```

### 4. Common Components

#### MediaUploader.vue

- 이미지/동영상 업로드
- 진행률 표시
- 파일 크기 제한
- 미리보기

#### CommentSystem.vue

- 댓글 작성/수정/삭제
- 대댓글 지원
- 실시간 업데이트
- 신고 기능

## Data Models

### User Model

```typescript
interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  selectedIcon?: string
  points: number
  role: 'user' | 'admin'
  createdAt: Date
  lastLoginAt: Date
  isActive: boolean
}
```

### Post Model

```typescript
interface Post {
  id: string
  boardType: BoardType
  title: string
  content: string
  authorId: string
  authorName: string
  authorIcon?: string
  createdAt: Date
  updatedAt: Date
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  tags: string[]
  mediaUrls: string[]
}
```

### Comment Model

```typescript
interface Comment {
  id: string
  postId: string
  parentId?: string // 대댓글용
  authorId: string
  authorName: string
  authorIcon?: string
  content: string
  createdAt: Date
  updatedAt: Date
  likeCount: number
  isDeleted: boolean
}
```

### Icon Model

```typescript
interface Icon {
  id: string
  name: string
  imageUrl: string
  price: number
  category: string
  isActive: boolean
  createdAt: Date
}
```

## Error Handling

### Frontend Error Handling

- Global error handler 설정
- 네트워크 오류 처리
- 사용자 친화적 에러 메시지
- 로딩 상태 관리

### Firebase Error Handling

- Authentication 에러 처리
- Firestore 권한 에러 처리
- Storage 업로드 에러 처리
- 오프라인 상태 처리

### Error Types

```typescript
enum ErrorType {
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error',
  PERMISSION_ERROR = 'permission_error',
  VALIDATION_ERROR = 'validation_error',
  SERVER_ERROR = 'server_error',
}
```

## Testing Strategy

### Unit Testing

- Vue Test Utils를 사용한 컴포넌트 테스트
- Vitest를 사용한 유틸리티 함수 테스트
- Firebase 서비스 모킹

### Integration Testing

- 게시판 CRUD 기능 테스트
- 사용자 인증 플로우 테스트
- 포인트 시스템 테스트

### E2E Testing

- Cypress를 사용한 전체 사용자 플로우 테스트
- 모바일 반응형 테스트
- 크로스 브라우저 테스트

### Performance Testing

- Lighthouse를 사용한 성능 측정
- 번들 크기 최적화
- 이미지 최적화

## UI/UX Design Principles

### Design System

- AS 로마 브랜드 컬러 (빨강, 노랑)
- 일관된 타이포그래피
- 아이콘 시스템
- 그리드 시스템

### Responsive Design

```scss
// Breakpoints
$mobile: 768px;
$tablet: 1024px;
$desktop: 1200px;

// Layout
- Mobile First 접근
- Flexible Grid System
- Touch-friendly UI Elements
```

### Accessibility

- WCAG 2.1 AA 준수
- 키보드 네비게이션 지원
- 스크린 리더 지원
- 색상 대비 최적화

## Security Considerations

### Firebase Security Rules

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 데이터만 수정 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 게시글은 인증된 사용자만 작성 가능
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (request.auth.uid == resource.data.authorId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### Content Security

- XSS 방지를 위한 입력 검증
- 이미지 업로드 파일 타입 제한
- 스팸 방지 시스템
- 부적절한 콘텐츠 신고 기능

## Performance Optimization

### Frontend Optimization

- Vue 3 Composition API 활용
- 컴포넌트 지연 로딩
- 이미지 지연 로딩
- 번들 분할 (Code Splitting)

### Firebase Optimization

- Firestore 쿼리 최적화
- 인덱스 설정
- 캐싱 전략
- CDN 활용

### SEO Optimization

- Vue Meta를 사용한 메타 태그 관리
- 구조화된 데이터 마크업
- 사이트맵 생성
- Open Graph 태그
