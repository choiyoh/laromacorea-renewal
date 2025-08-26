# La Roma Corea - Community Renewal

AS 로마 한국 팬 커뮤니티의 새로운 웹 플랫폼입니다.

## 🏟️ 프로젝트 소개

La Roma Corea는 AS 로마를 사랑하는 한국 팬들을 위한 종합 커뮤니티 플랫폼입니다. 경기 분석, 이적 소식, 팬 아트 등 다양한 콘텐츠를 통해 팬들이 소통할 수 있는 공간을 제공합니다.

## ✨ 주요 기능

### 📱 반응형 디자인

- 모바일, 태블릿, 데스크톱 완벽 지원
- AS 로마 공식 컬러 테마 적용

### 🏆 게시판 시스템

- **Free**: 자유로운 소통 공간
- **Match Analysis**: 경기 분석과 전술 토론
- **Transfer News**: 이적 소식과 루머
- **Fan Art**: 팬 아트와 창작물
- **Media**: 사진과 동영상 공유
- **Notice**: 공지사항과 중요 알림

### ⚽ 경기 정보

- 실시간 경기 일정 확인
- 최근 경기 결과 표시
- 경기별 응원 댓글 시스템

### 👤 사용자 시스템

- Firebase 인증 기반 회원가입/로그인
- 사용자 프로필 관리
- 포인트 시스템으로 활동 보상

### 🎨 아이콘 상점

- 포인트로 구매 가능한 프로필 아이콘
- 실시간 아이콘 적용 시스템
- 댓글/게시글에 아이콘 표시

### 🛡️ 관리자 기능

- 사용자 관리 (권한, 포인트 조정)
- 게시글/댓글 관리
- 아이콘 상점 관리

## 🛠️ 기술 스택

### Frontend

- **Vue 3** - Composition API 사용
- **Vuetify 3** - Material Design 컴포넌트
- **Pinia** - 상태 관리
- **Vue Router** - 라우팅

### Backend & Database

- **Firebase Authentication** - 사용자 인증
- **Firestore** - NoSQL 데이터베이스
- **Firebase Storage** - 파일 저장소
- **Firebase Hosting** - 웹 호스팅

### 개발 도구

- **Vite** - 빌드 도구
- **ESLint** - 코드 품질 관리
- **Prettier** - 코드 포맷팅
- **Vitest** - 단위 테스트

## 🚀 설치 및 실행

### 필수 요구사항

- Node.js 18+
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone [repository-url]
cd laromacorea-renewal

# 의존성 설치
npm install
```

### 환경 설정

`.env` 파일을 생성하고 Firebase 설정을 추가하세요:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 개발 서버 실행

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
```

### 테스트 실행

```bash
npm run test:unit
```

### 코드 검사

```bash
npm run lint
```

## 📁 프로젝트 구조

```
src/
├── components/          # Vue 컴포넌트
│   ├── admin/          # 관리자 컴포넌트
│   ├── board/          # 게시판 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   ├── match/          # 경기 관련 컴포넌트
│   └── user/           # 사용자 컴포넌트
├── views/              # 페이지 컴포넌트
├── stores/             # Pinia 스토어
├── services/           # API 서비스
├── composables/        # Vue 컴포저블
├── utils/              # 유틸리티 함수
├── styles/             # 스타일 파일
└── router/             # 라우터 설정
```

## 🔧 주요 설정

### Firebase Security Rules

Firestore 보안 규칙이 적용되어 있어 인증된 사용자만 데이터에 접근할 수 있습니다.

### 성능 최적화

- 컴포넌트 지연 로딩
- 이미지 지연 로딩
- 코드 스플리팅
- 번들 최적화

### SEO 최적화

- Vue Meta를 통한 동적 메타 태그
- Open Graph 태그 지원
- 구조화된 데이터

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

La Roma Corea - [웹사이트](https://laromacorea.com)

프로젝트 링크: [GitHub Repository](https://github.com/your-username/laromacorea-renewal)
