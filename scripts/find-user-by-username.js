/**
 * Username-based User Search Script
 * 사용자 이름으로 Firestore에서 사용자를 검색하는 스크립트
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

// Firebase 설정 (기존 스크립트에서 복사)
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
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

async function findUserByUsername(username) {
  if (!username) {
    log.error('사용자 이름을 입력해주세요. 예: node scripts/find-user-by-username.js choiyoh');
    process.exit(1);
  }

  log.info(`'${username}' 사용자를 검색합니다...`);

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      log.error(`'${username}' 사용자를 찾을 수 없습니다.`);
      process.exit(1);
    }

    querySnapshot.forEach((doc) => {
      log.success(`사용자를 찾았습니다! (UID: ${doc.id})`);
      console.log('사용자 데이터:');
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    log.error(`검색 중 오류 발생: ${error.message}`);
    process.exit(1);
  }
}

// 명령줄 인자에서 사용자 이름 가져오기
const username = process.argv[2];
findUserByUsername(username);