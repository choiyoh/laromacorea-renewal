#!/usr/bin/env node

/**
 * Set User Admin Script
 * 특정 사용자에게 관리자 권한을 부여하는 스크립트
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
  apiKey: 'AIzaSyB1U6nGlj44w0OuYWStPz2Uh5Lv--63kK8',
  authDomain: 'laromacorea-renewal.firebaseapp.com',
  projectId: 'laromacorea-renewal',
  storageBucket: 'laromacorea-renewal.firebasestorage.app',
  messagingSenderId: '210421182725',
  appId: '1:210421182725:web:968be34d1c9ababb51876c',
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

async function setUserAdmin(userId) {
  try {
    log.info(`사용자 ${userId}에게 관리자 권한 부여 중...`);

    const userRef = doc(db, 'users', userId);

    // 1. 사용자 문서 확인
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // 기존 문서 업데이트
      const userData = userSnap.data();
      log.info(
        `기존 사용자 발견: ${userData.email || userData.displayName || 'Unknown'}`,
      );

      await updateDoc(userRef, {
        role: 'admin',
        updatedAt: new Date(),
      });

      log.success('✅ 기존 사용자에게 관리자 권한이 부여되었습니다!');
    } else {
      // 새 문서 생성
      log.warning('사용자 문서가 존재하지 않습니다. 새로 생성합니다.');

      await setDoc(userRef, {
        uid: userId,
        role: 'admin',
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      log.success('✅ 새 사용자 문서를 생성하고 관리자 권한을 부여했습니다!');
    }

    // 2. 결과 확인
    const updatedSnap = await getDoc(userRef);
    const updatedData = updatedSnap.data();

    log.info('\n=== 업데이트된 사용자 정보 ===');
    console.log('UID:', updatedData.uid);
    console.log('Email:', updatedData.email || 'N/A');
    console.log('Display Name:', updatedData.displayName || 'N/A');
    console.log('Role:', updatedData.role);
    console.log('Points:', updatedData.points || 0);
    console.log(
      'Created At:',
      updatedData.createdAt?.toDate?.() || updatedData.createdAt,
    );
    console.log(
      'Updated At:',
      updatedData.updatedAt?.toDate?.() || updatedData.updatedAt,
    );

    if (updatedData.role === 'admin') {
      log.success('\n🎉 관리자 권한 부여 완료!');
      log.info('이제 Storage 규칙을 원래대로 되돌릴 수 있습니다.');
    } else {
      log.error('\n❌ 관리자 권한 부여 실패');
    }
  } catch (error) {
    log.error(`❌ 권한 부여 실패: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// 특정 사용자 UID
const targetUserId = 'xXPhnpTSToVN8ZK0Aahdy38hp2o1';

log.info('🚀 관리자 권한 부여 스크립트 시작');
log.info(`대상 사용자 UID: ${targetUserId}`);

setUserAdmin(targetUserId);
