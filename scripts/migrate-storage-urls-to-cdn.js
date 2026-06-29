/**
 * 기존 게시글의 Firebase Storage URL → CDN URL 일괄 마이그레이션 스크립트
 *
 * 목적:
 * Firestore의 posts 컬렉션에 저장된 게시글 본문(content), 미디어 URL(mediaUrls),
 * 작성자 프로필(authorPhotoURL, authorIcon) 등에 포함된 Firebase Storage 직접 URL을
 * Cloudflare Workers CDN 프록시 URL로 일괄 변환합니다.
 *
 * 이를 통해:
 * - Firebase Storage Egress(대역폭) 비용 절감
 * - Cloudflare 글로벌 엣지 캐시를 통한 이미지 로딩 속도 향상
 *
 * 사용법:
 * 1. serviceAccountKey.json 파일이 프로젝트 루트에 있어야 함
 * 2. node scripts/migrate-storage-urls-to-cdn.js
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES Module 환경 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Service Account 로드
let serviceAccount;
try {
  serviceAccount = require(join(__dirname, '../serviceAccountKey.json'));
} catch (e) {
  console.error('❌ serviceAccountKey.json 파일을 찾을 수 없습니다.');
  console.error('프로젝트 루트에 Firebase 서비스 계정 키 파일을 배치해주세요.');
  process.exit(1);
}

// ========================================
// 설정
// ========================================
const CDN_HOST = 'https://laromacorea-cdn.choeyoh.workers.dev';
const FIREBASE_STORAGE_HOST = 'https://firebasestorage.googleapis.com';
const STORAGE_BUCKET_NAME = 'laromacorea-renewal.firebasestorage.app';

// ⚠️ true면 모의 실행 (DB 수정 안 함), false면 실제 실행
const DRY_RUN = false;

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: STORAGE_BUCKET_NAME,
  });
}

const db = admin.firestore();

/**
 * Firebase Storage URL을 CDN URL로 변환
 */
function toCdnUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith(FIREBASE_STORAGE_HOST)) {
    return url.replace(FIREBASE_STORAGE_HOST, CDN_HOST);
  }
  return url;
}

/**
 * HTML 본문 내 모든 Firebase Storage URL을 CDN URL로 변환
 */
function replaceStorageUrlsInHtml(html) {
  if (!html || typeof html !== 'string') return html;
  const regex = new RegExp(FIREBASE_STORAGE_HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  return html.replace(regex, CDN_HOST);
}

/**
 * 문자열 배열 내 Firebase Storage URL을 CDN URL로 변환
 */
function replaceStorageUrlsInArray(urls) {
  if (!Array.isArray(urls)) return urls;
  return urls.map((url) => toCdnUrl(url));
}

/**
 * 단일 게시글 문서의 변환 대상 필드를 분석하고 변환 결과를 반환
 */
function analyzeAndConvert(postData) {
  const updates = {};
  let changeCount = 0;

  // 1. content (HTML 본문)
  if (postData.content && postData.content.includes(FIREBASE_STORAGE_HOST)) {
    const newContent = replaceStorageUrlsInHtml(postData.content);
    const urlCount = (postData.content.match(new RegExp(FIREBASE_STORAGE_HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    updates.content = newContent;
    changeCount += urlCount;
  }

  // 2. mediaUrls (미디어 게시판용)
  if (Array.isArray(postData.mediaUrls) && postData.mediaUrls.some((u) => u && u.includes(FIREBASE_STORAGE_HOST))) {
    updates.mediaUrls = replaceStorageUrlsInArray(postData.mediaUrls);
    changeCount += postData.mediaUrls.filter((u) => u && u.includes(FIREBASE_STORAGE_HOST)).length;
  }

  // 3. authorPhotoURL (작성자 프로필 이미지)
  if (postData.authorPhotoURL && postData.authorPhotoURL.includes(FIREBASE_STORAGE_HOST)) {
    updates.authorPhotoURL = toCdnUrl(postData.authorPhotoURL);
    changeCount++;
  }

  // 4. authorIcon (작성자 아이콘)
  if (postData.authorIcon && postData.authorIcon.includes(FIREBASE_STORAGE_HOST)) {
    updates.authorIcon = toCdnUrl(postData.authorIcon);
    changeCount++;
  }

  return { updates, changeCount };
}

async function migrate() {
  console.log('='.repeat(60));
  console.log(`🚀 Firebase Storage URL → CDN URL 마이그레이션`);
  console.log(`   모드: ${DRY_RUN ? '🧪 모의 실행 (DB 변경 없음)' : '⚡ 실제 실행'}`);
  console.log(`   CDN: ${CDN_HOST}`);
  console.log('='.repeat(60));

  try {
    // 모든 게시글 로드
    console.log('\n📚 게시글 목록 조회 중...');
    const postsSnapshot = await db.collection('posts').get();
    console.log(`✅ 총 ${postsSnapshot.size}개의 게시글 로드 완료\n`);

    let targetPostCount = 0;
    let totalUrlsConverted = 0;
    let errorCount = 0;

    for (const doc of postsSnapshot.docs) {
      const post = doc.data();
      const { updates, changeCount } = analyzeAndConvert(post);

      if (changeCount > 0) {
        targetPostCount++;
        totalUrlsConverted += changeCount;

        const changedFields = Object.keys(updates).join(', ');
        console.log(
          `📌 [${targetPostCount}] ID: ${doc.id} | "${post.title || '(제목 없음)'}" | URL ${changeCount}개 | 필드: ${changedFields}`,
        );

        if (!DRY_RUN) {
          try {
            await db.collection('posts').doc(doc.id).update({
              ...updates,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`   ✅ 업데이트 완료`);
          } catch (updateError) {
            errorCount++;
            console.error(`   ❌ 업데이트 실패: ${updateError.message}`);
          }
        }
      }
    }

    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log(`🎉 마이그레이션 ${DRY_RUN ? '모의 실행' : ''} 완료!`);
    console.log(`   📊 전체 게시글: ${postsSnapshot.size}개`);
    console.log(`   📝 변환 대상: ${targetPostCount}개`);
    console.log(`   🔗 변환된 URL: ${totalUrlsConverted}개`);
    if (errorCount > 0) {
      console.log(`   ❌ 에러: ${errorCount}개`);
    }
    if (DRY_RUN && targetPostCount > 0) {
      console.log(`\n   💡 실제 실행하려면 DRY_RUN = false 로 변경 후 재실행하세요.`);
    }
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  }
}

migrate();
