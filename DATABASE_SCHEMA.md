# Firestore Database Schema

AS 로마 한국 팬 커뮤니티 사이트의 Firestore 데이터베이스 스키마 문서입니다.

## Collections Overview

### 1. users

사용자 정보를 저장하는 컬렉션

```javascript
{
  uid: string,              // Firebase Auth UID
  email: string,            // 이메일 주소
  displayName: string,      // 표시 이름
  photoURL: string?,        // 프로필 이미지 URL (선택사항)
  selectedIcon: string?,    // 선택한 아이콘 ID (선택사항)
  points: number,           // 보유 포인트 (기본값: 0)
  role: string,             // 사용자 역할 ('user' | 'admin')
  createdAt: timestamp,     // 계정 생성일
  lastLoginAt: timestamp,   // 마지막 로그인 시간
  isActive: boolean,        // 계정 활성 상태 (기본값: true)
  profile: {
    bio: string?,           // 자기소개 (선택사항)
    favoritePlayer: string?, // 좋아하는 선수 (선택사항)
    joinDate: timestamp     // 가입일
  }
}
```

### 2. posts

게시글 정보를 저장하는 컬렉션

```javascript
{
  id: string,               // 자동 생성 문서 ID
  boardType: string,        // 게시판 타입 ('notice'|'squad'|'match'|'calcio'|'free'|'special'|'media')
  title: string,            // 게시글 제목
  content: string,          // 게시글 내용
  authorId: string,         // 작성자 UID
  authorName: string,       // 작성자 이름
  authorIcon: string?,      // 작성자 아이콘 ID (선택사항)
  createdAt: timestamp,     // 작성일
  updatedAt: timestamp,     // 수정일
  viewCount: number,        // 조회수 (기본값: 0)
  likeCount: number,        // 좋아요 수 (기본값: 0)
  commentCount: number,     // 댓글 수 (기본값: 0)
  isPinned: boolean,        // 고정 여부 (기본값: false, 관리자만)
  tags: array,              // 태그 배열
  mediaUrls: array,         // 미디어 파일 URL 배열
  isDeleted: boolean        // 삭제 여부 (기본값: false)
}
```

### 3. comments

댓글 정보를 저장하는 컬렉션

```javascript
{
  id: string,               // 자동 생성 문서 ID
  postId: string,           // 게시글 ID
  parentId: string?,        // 부모 댓글 ID (대댓글용, 선택사항)
  authorId: string,         // 작성자 UID
  authorName: string,       // 작성자 이름
  authorIcon: string?,      // 작성자 아이콘 ID (선택사항)
  content: string,          // 댓글 내용
  createdAt: timestamp,     // 작성일
  updatedAt: timestamp,     // 수정일
  likeCount: number,        // 좋아요 수 (기본값: 0)
  isDeleted: boolean,       // 삭제 여부 (기본값: false)
  level: number             // 댓글 깊이 (0: 최상위, 1: 답글 등)
}
```

### 4. icons

아이콘 상점 아이템을 저장하는 컬렉션

```javascript
{
  id: string,               // 자동 생성 문서 ID
  name: string,             // 아이콘 이름
  imageUrl: string,         // 아이콘 이미지 URL
  price: number,            // 구매 가격 (포인트)
  category: string,         // 카테고리 ('player'|'logo'|'special'|'seasonal')
  description: string?,     // 아이콘 설명 (선택사항)
  isActive: boolean,        // 활성 상태 (기본값: true)
  createdAt: timestamp,     // 생성일
  createdBy: string,        // 생성한 관리자 ID
  purchaseCount: number     // 구매 횟수 (기본값: 0)
}
```

### 5. points_history

포인트 내역을 저장하는 컬렉션

```javascript
{
  id: string,               // 자동 생성 문서 ID
  userId: string,           // 사용자 UID
  type: string,             // 포인트 타입 ('earned'|'spent'|'admin_adjustment')
  amount: number,           // 포인트 변동량 (획득: 양수, 사용: 음수)
  reason: string,           // 변동 사유 ('post_created'|'comment_created'|'icon_purchase'|'admin_bonus')
  relatedId: string?,       // 관련 문서 ID (선택사항)
  createdAt: timestamp,     // 생성일
  adminId: string?          // 관리자 조정 시 관리자 ID (선택사항)
}
```

### 6. boards

게시판 설정을 저장하는 컬렉션

```javascript
{
  id: string,               // 게시판 타입 식별자
  name: string,             // 게시판 표시 이름
  description: string,      // 게시판 설명
  order: number,            // 표시 순서
  isActive: boolean,        // 활성 상태
  permissions: {
    read: array,            // 읽기 권한 역할 배열
    write: array,           // 쓰기 권한 역할 배열
    moderate: array         // 관리 권한 역할 배열
  },
  settings: {
    allowMedia: boolean,    // 미디어 업로드 허용 여부
    allowComments: boolean, // 댓글 허용 여부
    requireApproval: boolean // 승인 필요 여부
  }
}
```

## Subcollections

### users/{userId}/purchased_icons

사용자가 구매한 아이콘 목록

```javascript
{
  iconId: string,           // 아이콘 ID
  purchasedAt: timestamp,   // 구매일
  price: number             // 구매 당시 가격
}
```

### users/{userId}/notifications

사용자 알림 목록

```javascript
{
  type: string,             // 알림 타입
  title: string,            // 알림 제목
  message: string,          // 알림 내용
  isRead: boolean,          // 읽음 여부
  createdAt: timestamp,     // 생성일
  relatedId: string?        // 관련 문서 ID (선택사항)
}
```

## Security Rules

### 주요 보안 규칙

- 사용자는 자신의 데이터만 수정 가능
- 게시글은 인증된 사용자만 작성 가능
- Notice 게시판은 관리자만 작성 가능
- 아이콘 관리는 관리자만 가능
- 포인트 내역은 시스템 또는 관리자만 생성 가능

### 권한 체크 함수

```javascript
function isAuthenticated() // 인증된 사용자인지 확인
function isOwner(userId)   // 해당 데이터의 소유자인지 확인
function isAdmin()         // 관리자 권한인지 확인
function isValidUser()     // 유효한 사용자인지 확인
```

## Indexes

### 복합 인덱스

- posts: boardType + createdAt (DESC)
- posts: boardType + isPinned (DESC) + createdAt (DESC)
- posts: authorId + createdAt (DESC)
- comments: postId + createdAt (ASC)
- points_history: userId + createdAt (DESC)

### 배열 필드 인덱스

- posts.tags: CONTAINS
- posts.mediaUrls: CONTAINS

## 초기 데이터

### 게시판 설정

7개의 기본 게시판이 자동으로 생성됩니다:

1. Notice (공지사항)
2. Squad (스쿼드)
3. Match (경기)
4. Calcio (축구 소식)
5. Free (자유게시판)
6. Special (특별게시판)
7. Media (미디어)

### 기본 아이콘

- 기본 사용자 아이콘 (무료)
- AS 로마 로고 (100 포인트)
- 토티 아이콘 (500 포인트)

## 사용법

### 데이터베이스 초기화

```javascript
import { initializeDatabase } from '@/services/database-init'

// 앱 시작 시 한 번 실행
await initializeDatabase()
```

### 사용자 프로필 생성

```javascript
import { initializeUserProfile } from '@/services/database-init'

// 회원가입 시 실행
await initializeUserProfile(uid, userData)
```

### 데이터베이스 서비스 사용

```javascript
import { postService, commentService, userService } from '@/services/database'

// 게시글 목록 조회
const posts = await postService.getPosts('free')

// 댓글 작성
await commentService.createComment(commentData)

// 사용자 포인트 업데이트
await userService.updateUserPoints(uid, 10, 'post_created')
```

## 배포

Firebase CLI를 사용하여 규칙과 인덱스를 배포합니다:

```bash
# 보안 규칙 배포
firebase deploy --only firestore:rules

# 인덱스 배포
firebase deploy --only firestore:indexes

# 전체 배포
firebase deploy
```
