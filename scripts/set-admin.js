// 사용자에게 관리자 권한 및 커스텀 클레임 부여 스크립트
// 사용법: node scripts/set-admin.js <USER_ID>
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// 중요: Firebase 콘솔에서 다운로드한 서비스 계정 키 파일의 경로를 입력하세요.
// 프로젝트 루트에 파일을 두고 경로를 './serviceAccountKey.json' 와 같이 지정하는 것을 권장합니다.
import serviceAccount from '../serviceAccountKey.json' assert { type: "json" };

// Firebase Admin SDK 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

async function setAdminRole(userId) {
  if (!userId) {
    console.error('❌ 사용자 ID를 입력해주세요. 사용법: node scripts/set-admin.js <USER_ID>');
    return;
  }

  try {
    // 1. 커스텀 클레임 설정
    await admin.auth().setCustomUserClaims(userId, { admin: true });
    console.log(`✅ 사용자 ${userId}에게 'admin: true' 커스텀 클레임을 설정했습니다.`);
    console.log('적용을 위해 사용자는 다시 로그인해야 할 수 있습니다.');

    // 2. Firestore 사용자 문서에 role 필드 업데이트 (기존 로직과 호환성 유지)
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      await userRef.update({
        role: 'admin',
        updatedAt: new Date(),
      });
      console.log(`✅ Firestore 사용자 문서의 role을 'admin'으로 업데이트했습니다.`);
    } else {
      console.warn(`⚠️ 사용자 문서 ${userId}가 Firestore에 존재하지 않습니다. role 필드를 업데이트하지 못했습니다.`);
    }

    console.log(`✨ 작업 완료: 사용자 ${userId}가 이제 관리자입니다.`);

  } catch (error) {
    console.error('❌ 관리자 권한 부여 실패:', error);
    if (error.code === 'auth/user-not-found') {
      console.error(`Firebase Authentication에 ${userId} 사용자가 존재하지 않습니다.`);
    }
  }
}

// 명령줄 인자로부터 사용자 ID를 받습니다.
const targetUserId = process.argv[2];
setAdminRole(targetUserId);
