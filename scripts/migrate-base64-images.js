/**
 * 기존 게시글 본문의 base64 이미지 추출 및 Firebase Storage 마이그레이션 스크립트
 *
 * 목적:
 * 본문(posts.content)에 base64(data:image/...) 형태로 직접 박혀 있는 이미지를 추출하여
 * Firebase Storage에 파일로 업로드하고, 본문 내의 경로를 CDN 캐시 URL로 교체합니다.
 * 이를 통해 Firestore Egress 요금 폭탄을 해결하고 문서 크기를 최적화합니다.
 *
 * 사용법:
 * 1. serviceAccountKey.json 파일이 프로젝트 루트에 있어야 함
 * 2. node scripts/migrate-base64-images.js
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

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

// CDN 호스트 설정 (앞단에 적용한 Workers CDN 주소)
const CDN_HOST = 'https://laromacorea-cdn.choeyoh.workers.dev';
const STORAGE_BUCKET_NAME = 'laromacorea-renewal.firebasestorage.app'; // Firebase Storage 버킷 이름

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: STORAGE_BUCKET_NAME,
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const DRY_RUN = false; // ⚠️ true면 모의 실행만 진행 (실제 DB/Storage 수정 안 함)

async function migrate() {
  console.log(
    `🚀 기존 base64 이미지 마이그레이션 시작... (${DRY_RUN ? '모의 실행 모드' : '실제 실행 모드'})`,
  );

  try {
    // 1. 모든 게시글 로드
    console.log('📚 게시글 목록 조회 중...');
    const postsSnapshot = await db.collection('posts').get();
    console.log(
      `✅ 총 ${postsSnapshot.size}개의 게시글 로드 완료. 분석 중...`,
    );

    let targetCount = 0;
    let totalImagesMigrated = 0;

    for (const doc of postsSnapshot.docs) {
      const post = doc.data();
      const content = post.content || '';

      // base64 이미지가 포함되어 있는지 검사
      if (content.includes('data:image/') && content.includes(';base64,')) {
        targetCount++;
        console.log(
          `\n📌 대상 게시글 발견 [ID: ${doc.id}] Title: "${post.title}"`,
        );

        let newContent = content;

        // 정규식으로 src="data:image/...;base64,..." 매칭
        const base64Regex = /src="data:(image\/[a-zA-Z+]*);base64,([^"]*)"/g;
        let matchIndex = 0;

        // 모든 base64 이미지를 추출 및 치환
        const matches = [...content.matchAll(base64Regex)];

        if (matches.length > 0) {
          console.log(`  🔍 발견된 base64 이미지 개수: ${matches.length}개`);

          for (const match of matches) {
            matchIndex++;
            const mimeType = match[1]; // image/png, image/jpeg 등
            const base64Data = match[2]; // 순수 base64 데이터
            const extension = mimeType.split('/')[1] || 'jpg';

            // 바이너리 버퍼로 복원
            const buffer = Buffer.from(base64Data, 'base64');
            const fileSizeKB = Math.round(buffer.length / 1024);

            // 고유 토큰 및 파일명 생성
            const token = crypto.randomUUID();
            const filename = `posts/migration_${doc.id}_${matchIndex}.${extension}`;

            console.log(
              `  📷 [이미지 #${matchIndex}] 크기: ${fileSizeKB}KB, 파일명: ${filename}`,
            );

            if (!DRY_RUN) {
              // Firebase Storage에 업로드
              const fileRef = bucket.file(filename);
              await fileRef.save(buffer, {
                metadata: {
                  contentType: mimeType,
                  metadata: {
                    firebaseStorageDownloadTokens: token,
                  },
                },
              });

              // CDN 다운로드 URL 생성
              const encodedPath = encodeURIComponent(filename);
              const cdnUrl = `${CDN_HOST}/v0/b/${STORAGE_BUCKET_NAME}/o/${encodedPath}?alt=media&token=${token}`;

              // HTML 본문 내 주소 교체
              newContent = newContent.replace(match[0], `src="${cdnUrl}"`);
              totalImagesMigrated++;
            } else {
              console.log(`  🧪 [Dry Run] 이미지 업로드 및 URL 교체 예정`);
            }
          }

          // DB 업데이트
          if (!DRY_RUN && newContent !== content) {
            await db.collection('posts').doc(doc.id).update({
              content: newContent,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`  ✅ 게시글 본문 DB 업데이트 완료!`);
          }
        }
      }
    }

    console.log(`\n🎉 마이그레이션 ${DRY_RUN ? '모의' : ''} 완료!`);
    console.log(
      `총 ${postsSnapshot.size}개 게시글 중 ${targetCount}개 게시글 수정 완료.`,
    );
    console.log(
      `총 ${totalImagesMigrated}개의 base64 이미지가 성공적으로 Firebase Storage로 추출되었습니다.`,
    );
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  }
}

migrate();
