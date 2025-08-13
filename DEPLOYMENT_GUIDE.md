# 배포 가이드 (Deployment Guide)

## 개요

이 문서는 AS 로마 코리아 커뮤니티 사이트의 Firebase Hosting 배포 과정을 설명합니다.

## 사전 준비사항

### 1. Firebase CLI 설치

Firebase CLI가 설치되어 있지 않은 경우, 다음 중 하나의 방법으로 설치하세요:

#### 방법 1: npm으로 전역 설치 (권장)

```bash
npm install -g firebase-tools
```

#### 방법 2: 프로젝트 로컬 설치

```bash
npm install --save-dev firebase-tools
```

#### 방법 3: npx 사용 (설치 없이 실행)

```bash
npx firebase-tools --version
```

### 2. Firebase CLI 설치 확인

```bash
firebase --version
# 또는 npx를 사용하는 경우
npx firebase-tools --version
```

### 3. Firebase 로그인

```bash
firebase login
# 또는 npx를 사용하는 경우
npx firebase-tools login
```

### 4. Firebase 프로젝트 초기화 (이미 완료됨)

```bash
firebase init
# 또는 npx를 사용하는 경우
npx firebase-tools init
```

## 배포 과정

### 1. 프로덕션 빌드

```bash
npm run build:prod
```

### 2. 전체 배포 (Hosting + Rules)

```bash
npm run deploy
```

### 3. Hosting만 배포

```bash
npm run deploy:hosting
```

### 4. Rules만 배포

```bash
npm run deploy:rules
```

### 5. Firebase CLI 없이 배포 (npx 사용)

Firebase CLI가 전역 설치되어 있지 않은 경우, 프로젝트에 설치된 firebase-tools를 사용합니다:

```bash
# 빌드 후 배포
npm run build:prod
npx firebase-tools deploy

# Hosting만 배포
npx firebase-tools deploy --only hosting
```

## 환경별 설정

### Development

- `.env` 파일 사용
- Firebase Emulator 사용 가능
- 디버깅 모드 활성화

### Production

- `.env.production` 파일 사용
- 실제 Firebase 서비스 사용
- 최적화된 빌드
- 보안 헤더 적용

## 배포 전 체크리스트

### 코드 품질

- [ ] ESLint 검사 통과: `npm run lint`
- [ ] 단위 테스트 통과: `npm run test:run`
- [ ] 빌드 성공: `npm run build:prod`

### 환경 설정

- [ ] `.env.production` 파일 확인
- [ ] Firebase 프로젝트 설정 확인
- [ ] Security Rules 업데이트

### 성능 최적화

- [ ] 이미지 최적화 완료
- [ ] 번들 크기 확인
- [ ] 캐싱 설정 확인

## 배포 후 확인사항

### 기능 테스트

- [ ] 사용자 인증 (로그인/회원가입)
- [ ] 게시판 CRUD 기능
- [ ] 파일 업로드 기능
- [ ] 포인트 시스템
- [ ] 아이콘 상점

### 성능 테스트

- [ ] 페이지 로딩 속도
- [ ] 모바일 반응형 확인
- [ ] 크로스 브라우저 테스트

### SEO 확인

- [ ] 메타 태그 확인
- [ ] Open Graph 태그 확인
- [ ] 사이트맵 생성 확인

## 롤백 절차

문제 발생 시 이전 버전으로 롤백:

```bash
# Firebase Hosting 이전 버전 목록 확인
firebase hosting:releases

# 특정 버전으로 롤백
firebase hosting:rollback
```

## 모니터링

### Firebase Console

- Hosting 사용량 모니터링
- Firestore 사용량 확인
- Storage 사용량 확인
- Authentication 사용자 통계

### 성능 모니터링

- Google Analytics (설정된 경우)
- Firebase Performance Monitoring
- Lighthouse 점수 정기 확인

## 문제 해결

### 일반적인 문제들

1. **빌드 실패**
   - 의존성 설치: `npm install`
   - 캐시 정리: `npm run build -- --force`

2. **배포 실패**
   - Firebase 로그인 확인: `firebase login`
   - 프로젝트 설정 확인: `firebase use --add`

3. **라우팅 문제**
   - `firebase.json`의 rewrites 설정 확인
   - SPA 라우팅 설정 확인

## 보안 고려사항

### Firebase Security Rules

- Firestore Rules 정기 검토
- Storage Rules 정기 검토
- 사용자 권한 관리

### 환경 변수 보안

- API 키 노출 방지
- 민감한 정보 환경 변수 분리
- `.env` 파일 Git 제외

## 성능 최적화

### 캐싱 전략

- 정적 자산 장기 캐싱
- HTML 파일 캐싱 방지
- CDN 활용

### 번들 최적화

- Code Splitting 적용
- Tree Shaking 활용
- 불필요한 의존성 제거

## 연락처

배포 관련 문제 발생 시:

- 개발팀 연락
- Firebase 공식 문서 참조
- 커뮤니티 포럼 활용
