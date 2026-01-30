/**
 * 게시글 작성자 아이콘 정보 마이그레이션 스크립트
 *
 * 목적:
 * 게시글(posts) 문서에 authorIcon, authorPhotoURL 필드가 없는 경우,
 * 작성자(users) 정보를 조회하여 해당 필드를 채워넣습니다.
 * 이를 통해 클라이언트에서 리스트 조회 시 별도의 유저 프로필 조회를 하지 않도록(N+1 문제 해결) 합니다.
 *
 * 사용법:
 * 1. serviceAccountKey.json 파일이 루트 또는 상위 디렉토리에 있어야 함
 * 2. node scripts/migrate-author-icons.js
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

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const DRY_RUN = false; // ⚠️ true면 실제 DB 저장 안 함 (로그만 출력), false로 바꾸면 실제 실행

async function migrate() {
  console.log(
    `🚀 게시글 작성자 아이콘 마이그레이션 시작... (${DRY_RUN ? '모의 실행 모드' : '실제 실행 모드'})`,
  );

  try {
    // 1. 모든 아이콘 정보 로드 (아이콘 ID -> URL 매핑용)
    console.log('📦 아이콘 정보 로딩 중...');
    const iconsSnapshot = await db.collection('icons').get();
    const iconMap = new Map();
    iconsSnapshot.forEach((doc) => {
      const data = doc.data();
      // data.url이 아이콘 이미지 주소라고 가정
      if (data.url) {
        iconMap.set(doc.id, data.url);
      }
    });
    console.log(`✅ ${iconMap.size}개의 아이콘 정보 로드 완료`);

    // 2. 모든 사용자 정보 로드 (사용자 ID -> { photoURL, selectedIcon } 매핑용)
    // 사용자가 많을 경우 배치로 처리해야 하지만, 수천 명 수준이면 한 번에 가져와도 무방함 (메모리 넉넉한 로컬 실행 시)
    console.log('👥 사용자 정보 로딩 중...');
    const usersSnapshot = await db.collection('users').get();
    const userMap = new Map();
    usersSnapshot.forEach((doc) => {
      userMap.set(doc.id, doc.data());
    });
    console.log(`✅ ${userMap.size}명의 사용자 정보 로드 완료`);

    // 3. 모든 게시글 스캔
    console.log('📚 게시글 스캔 및 업데이트 대상 선별 중...');
    const postsSnapshot = await db.collection('posts').get();

    let updateCount = 0;
    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of postsSnapshot.docs) {
      const post = doc.data();
      const needsUpdate = !post.authorIcon && !post.authorPhotoURL;
      // 이미 있더라도 확실하게 최신화하려면 조건을 빼도 되지만, 비용 절감을 위해 없는 것만 채움

      if (needsUpdate) {
        const authorId = post.authorId;
        const author = userMap.get(authorId);

        if (author) {
          const updates = {};
          let hasChanges = false;

          // 3-1. authorIcon 채우기
          if (author.selectedIcon && iconMap.has(author.selectedIcon)) {
            updates.authorIcon = iconMap.get(author.selectedIcon);
            hasChanges = true;
          }

          // 3-2. authorPhotoURL 채우기
          if (author.photoURL) {
            updates.authorPhotoURL = author.photoURL;
            hasChanges = true;
          }

          if (hasChanges) {
            batch.update(doc.ref, updates);
            batchCount++;
            updateCount++;

            if (DRY_RUN) {
              console.log(
                `[Dry Run] 게시글(${doc.id}) 업데이트 예정:`,
                updates,
              );
            }

            // 배치 커밋 (500개 단위)
            if (batchCount >= batchSize) {
              if (!DRY_RUN) {
                await batch.commit();
                console.log(`  ✅ ${updateCount}개 게시글 업데이트 완료...`);
              } else {
                console.log(`  🧪 [Dry Run] 배치 커밋 스킵 (${batchCount}개)`);
              }
              batch = db.batch(); // 새 배치 시작
              batchCount = 0;
            }
          }
        }
      }
    }

    // 남은 배치 커밋
    if (batchCount > 0) {
      if (!DRY_RUN) {
        await batch.commit();
        console.log(`  ✅ 나머지 ${batchCount}개 게시글 업데이트 완료`);
      } else {
        console.log(`  🧪 [Dry Run] 마지막 배치 커밋 스킵 (${batchCount}개)`);
      }
    }

    console.log(`\n🎉 마이그레이션 ${DRY_RUN ? '모의' : ''} 완료!`);
    console.log(
      `총 ${postsSnapshot.size}개 게시글 중 ${updateCount}개가 업데이트 ${DRY_RUN ? '예정입니다' : '되었습니다'}.`,
    );

    if (DRY_RUN) {
      console.log(
        '\n⚠️ 현재는 [모의 실행] 모드입니다. 실제 적용하려면 코드 상단의 DRY_RUN = false 로 변경 후 다시 실행하세요.',
      );
    }
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  }
}

migrate();
