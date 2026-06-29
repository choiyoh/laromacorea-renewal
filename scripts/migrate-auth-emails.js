/**
 * Firebase Auth 이메일 마이그레이션 스크립트
 * 
 * 기존 회원들의 Firebase Auth 이메일을 임시 이메일(@laromacorea.temp)에서
 * Firestore에 저장된 실제 이메일로 변경합니다.
 * 
 * 사용법: 
 *   1. Firebase Admin 서비스 계정 키를 환경 변수로 설정
 *      export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
 *   2. node scripts/migrate-auth-emails.js [--dry-run]
 */

import admin from 'firebase-admin';
import fs from 'fs';

// Firebase Admin 초기화
// 서비스 계정 키는 GOOGLE_APPLICATION_CREDENTIALS 환경 변수로 제공
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// --dry-run 플래그 확인
const dryRun = process.argv.includes('--dry-run');

async function migrateUsers() {
  console.log(dryRun ? '[DRY RUN] 변경사항을 적용하지 않습니다.\n' : '[LIVE] 실제 마이그레이션을 시작합니다.\n');
  
  const usersSnapshot = await db.collection('users').get();
  console.log(`총 ${usersSnapshot.size}명의 사용자를 확인합니다.\n`);
  
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  const results = [];
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const uid = doc.id;
    const firestoreEmail = userData.email;
    const tempEmail = userData.tempEmail;
    
    // 건너뛸 조건:
    // 1. Firestore에 이메일이 없는 경우
    if (!firestoreEmail) {
      console.log(`[SKIP] ${uid}: Firestore에 이메일 정보 없음`);
      skipped++;
      continue;
    }
    
    // 2. 이미 실제 이메일을 사용 중인 경우 (tempEmail과 같으면 이미 마이그레이션 완료)
    if (tempEmail && tempEmail === firestoreEmail) {
      console.log(`[SKIP] ${uid}: 이미 실제 이메일 사용 중 (${firestoreEmail})`);
      skipped++;
      continue;
    }
    
    try {
      // 현재 Firebase Auth 사용자 정보 확인
      let authUser;
      try {
        authUser = await auth.getUser(uid);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          console.log(`[SKIP] ${uid}: Firebase Auth에 사용자 없음`);
          skipped++;
          continue;
        }
        throw err;
      }
      
      const currentAuthEmail = authUser.email;
      
      // 이미 실제 이메일과 같으면 건너뛰기
      if (currentAuthEmail === firestoreEmail) {
        console.log(`[SKIP] ${uid}: 이미 마이그레이션 완료 (Auth: ${currentAuthEmail})`);
        skipped++;
        continue;
      }
      
      if (!dryRun) {
        // Firebase Auth 이메일 업데이트
        await auth.updateUser(uid, { email: firestoreEmail });
        console.log(`[MIGRATED] ${uid}: ${currentAuthEmail} → ${firestoreEmail}`);
      } else {
        console.log(`[DRY RUN] ${uid}: ${currentAuthEmail} → ${firestoreEmail}`);
      }
      
      migrated++;
      results.push({ uid, before: currentAuthEmail, after: firestoreEmail, status: 'migrated' });
      
    } catch (error) {
      console.error(`[FAILED] ${uid}: ${error.message}`);
      failed++;
      results.push({ uid, email: firestoreEmail, status: 'failed', error: error.message });
    }
  }
  
  // 결과 요약
  console.log('\n====================');
  console.log('마이그레이션 완료');
  console.log('====================');
  console.log(`마이그레이션: ${migrated}명`);
  console.log(`건너뛰기: ${skipped}명`);
  console.log(`실패: ${failed}명`);
  
  if (failed > 0) {
    console.log('\n실패한 사용자:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  - ${r.uid} (${r.email}): ${r.error}`);
    });
  }
  
  // 결과를 JSON 파일로 저장 (마이그레이션 로그)
  if (!dryRun && migrated > 0) {
    const logFile = `migration-log-${Date.now()}.json`;
    fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
    console.log(`\n마이그레이션 로그 저장됨: ${logFile}`);
  }
  
  console.log('\n완료.');
}

migrateUsers().catch(console.error);
