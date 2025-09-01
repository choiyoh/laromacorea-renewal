/**
 * 테스트용 사용자 생성 스크립트
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Firebase 설정 (실제 프로젝트 설정으로 교체 필요)
const firebaseConfig = {
  // 여기에 실제 Firebase 설정을 넣어주세요
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestUsers() {
  const testUsers = [
    {
      email: 'test1@example.com',
      displayName: '테스트유저1',
      points: 50,
      isActive: true,
      role: 'user',
      createdAt: serverTimestamp(),
      lastLoginAt: new Date(),
    },
    {
      email: 'test2@example.com',
      displayName: '테스트유저2',
      points: 150,
      isActive: true,
      role: 'user',
      createdAt: serverTimestamp(),
      lastLoginAt: new Date(),
    },
    {
      email: 'test3@example.com',
      displayName: '테스트유저3',
      points: 1200,
      isActive: true,
      role: 'user',
      createdAt: serverTimestamp(),
      lastLoginAt: new Date(),
    },
  ];

  try {
    for (const user of testUsers) {
      const docRef = await addDoc(collection(db, 'users'), user);
      console.log(
        `테스트 사용자 생성됨: ${user.displayName} (ID: ${docRef.id})`,
      );
    }
    console.log('모든 테스트 사용자가 성공적으로 생성되었습니다.');
  } catch (error) {
    console.error('테스트 사용자 생성 실패:', error);
  }
}

createTestUsers();
