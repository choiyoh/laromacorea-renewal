#!/usr/bin/env node

/**
 * Test Users Creation Script
 * 테스트용 사용자 계정을 생성하는 스크립트
 */

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

// Firebase 설정
const firebaseConfig = {
  apiKey: 'AIzaSyB1U6nGlj44w0OuYWStPz2Uh5Lv--63kK8',
  authDomain: 'laromacorea-renewal.firebaseapp.com',
  projectId: 'laromacorea-renewal',
  storageBucket: 'laromacorea-renewal.firebasestorage.app',
  messagingSenderId: '210421182725',
  appId: '1:210421182725:web:968be34d1c9ababb51876c',
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
}

// 테스트 사용자 데이터
const testUsers = [
  {
    email: 'admin@laromacorea.com',
    password: 'admin123456',
    displayName: '관리자',
    role: 'admin',
    points: 1000,
  },
  {
    email: 'user1@laromacorea.com',
    password: 'user123456',
    displayName: '로마팬1',
    role: 'user',
    points: 150,
  },
  {
    email: 'user2@laromacorea.com',
    password: 'user123456',
    displayName: '로마팬2',
    role: 'user',
    points: 200,
  },
]

async function createTestUser(userData) {
  try {
    // Firebase Auth에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password,
    )

    const user = userCredential.user

    // 프로필 업데이트
    await updateProfile(user, {
      displayName: userData.displayName,
    })

    // Firestore에 사용자 문서 생성
    const userDoc = {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName,
      photoURL: null,
      selectedIcon: null,
      points: userData.points,
      role: userData.role,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
      emailVerified: user.emailVerified,
    }

    await setDoc(doc(db, 'users', user.uid), userDoc)

    log.success(`사용자 생성 완료: ${userData.displayName} (${userData.email})`)
    return user
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      log.warning(`이미 존재하는 사용자: ${userData.email}`)
    } else {
      log.error(`사용자 생성 실패 (${userData.email}): ${error.message}`)
    }
    return null
  }
}

async function createTestUsers() {
  console.log(`${colors.blue}👥 테스트 사용자 생성 시작${colors.reset}\n`)

  let successCount = 0
  let skipCount = 0

  for (const userData of testUsers) {
    const result = await createTestUser(userData)
    if (result) {
      successCount++
    } else {
      skipCount++
    }
  }

  console.log(`\n${colors.blue}📊 생성 결과${colors.reset}`)
  log.success(`생성된 사용자: ${successCount}명`)
  if (skipCount > 0) {
    log.warning(`건너뛴 사용자: ${skipCount}명 (이미 존재)`)
  }

  console.log(`\n${colors.blue}🔑 테스트 계정 정보${colors.reset}`)
  console.log('관리자 계정:')
  console.log('  이메일: admin@laromacorea.com')
  console.log('  비밀번호: admin123456')
  console.log('')
  console.log('일반 사용자 계정:')
  console.log('  이메일: user1@laromacorea.com')
  console.log('  비밀번호: user123456')
  console.log('')
  console.log('  이메일: user2@laromacorea.com')
  console.log('  비밀번호: user123456')
  console.log('')
  log.info('이제 웹사이트에서 이 계정들로 로그인할 수 있습니다!')
  log.info('사이트 URL: https://laromacorea-renewal.web.app/auth')
}

createTestUsers().catch((error) => {
  log.error(`테스트 사용자 생성 중 오류 발생: ${error.message}`)
  process.exit(1)
})
