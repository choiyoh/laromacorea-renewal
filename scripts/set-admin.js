// 사용자에게 관리자 권한 부여 스크립트
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

// Firebase 설정 (실제 프로젝트 설정으로 교체)
const firebaseConfig = {
  apiKey: 'AIzaSyDhKGKJOhJJJJJJJJJJJJJJJJJJJJJJJJJ',
  authDomain: 'laromacorea-renewal.firebaseapp.com',
  projectId: 'laromacorea-renewal',
  storageBucket: 'laromacorea-renewal.firebasestorage.app',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdefghijklmnop',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAdminRole(userId) {
  try {
    const userRef = doc(db, 'users', userId);

    // 먼저 사용자 문서가 존재하는지 확인
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // 기존 문서 업데이트
      await updateDoc(userRef, {
        role: 'admin',
        updatedAt: new Date(),
      });
      console.log(`✅ 사용자 ${userId}에게 관리자 권한이 부여되었습니다.`);
    } else {
      // 문서가 없으면 새로 생성
      await setDoc(userRef, {
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(
        `✅ 사용자 ${userId}의 문서를 생성하고 관리자 권한을 부여했습니다.`,
      );
    }

    // 결과 확인
    const updatedDoc = await getDoc(userRef);
    console.log('업데이트된 사용자 정보:', updatedDoc.data());
  } catch (error) {
    console.error('❌ 관리자 권한 부여 실패:', error);
  }
}

// 특정 사용자에게 관리자 권한 부여
const targetUserId = 'xXPhnpTSToVN8ZK0Aahdy38hp2o1';
setAdminRole(targetUserId);
