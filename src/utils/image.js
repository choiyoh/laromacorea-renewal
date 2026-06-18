/**
 * Image & Media Utility for CDN Caching
 * Firebase Storage URL을 CDN 캐시 호스트로 치환하여 대역폭 요금을 방지합니다.
 */

// CDN 호스트 설정 (기본값은 동일 도메인의 상대 경로 프록시인 '/storage-proxy')
// 다른 외부 CDN 도메인을 사용할 경우 .env 파일에 VITE_MEDIA_CDN_URL=https://media.laromacorea.com 형태로 등록할 수 있습니다.
const CDN_HOST = import.meta.env.VITE_MEDIA_CDN_URL || '/storage-proxy';
const FIREBASE_STORAGE_HOST = 'https://firebasestorage.googleapis.com';

/**
 * 단일 Firebase Storage URL을 CDN 캐시 주소로 변환
 * @param {string} url - 원본 이미지 URL
 * @returns {string} 변환된 CDN URL
 */
export function toCdnUrl(url) {
  if (!url || typeof url !== 'string') return url;

  // 개발 환경이고 Firebase 에뮬레이터를 사용 중인 경우 원본 URL을 그대로 유지
  if (
    import.meta.env.VITE_APP_ENV === 'development' &&
    import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
  ) {
    return url;
  }

  // Firebase Storage 호스트 주소를 지정된 CDN_HOST로 치환
  if (url.startsWith(FIREBASE_STORAGE_HOST)) {
    return url.replace(FIREBASE_STORAGE_HOST, CDN_HOST);
  }

  return url;
}

/**
 * 게시글 HTML 본문 텍스트 내 포함된 모든 Firebase Storage 이미지 경로를 CDN 캐시 경로로 변환
 * @param {string} html - 원본 HTML 문자열
 * @returns {string} 변환된 HTML 문자열
 */
export function replaceHtmlStorageUrls(html) {
  if (!html || typeof html !== 'string') return html;

  // 개발 환경이고 Firebase 에뮬레이터를 사용 중인 경우 원본 HTML을 그대로 유지
  if (
    import.meta.env.VITE_APP_ENV === 'development' &&
    import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
  ) {
    return html;
  }

  // HTML 본문 내의 모든 Firebase Storage 도메인 주소를 CDN 호스트로 치환
  const regex = new RegExp(FIREBASE_STORAGE_HOST, 'g');
  return html.replace(regex, CDN_HOST);
}
