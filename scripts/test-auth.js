#!/usr/bin/env node

/**
 * Authentication Test Script
 * Firebase Authentication 설정을 테스트하는 스크립트
 */

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
} from 'firebase/auth'

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

async function testAuthentication() {
  console.log(`${colors.blue}🔐 Firebase Authentication 테스트 시작${colors.reset}\n`)

  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'testpassword123'

  try {
    // 1. 회원가입 테스트
    log.info('회원가입 테스트 중...')
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword)
    log.success(`회원가입 성공: ${userCredential.user.email}`)

    // 2. 로그인 테스트
    log.info('로그인 테스트 중...')
    await signInWithEmailAndPassword(auth, testEmail, testPassword)
    log.success('로그인 성공')

    // 3. 테스트 사용자 삭제
    log.info('테스트 사용자 삭제 중...')
    await deleteUser(userCredential.user)
    log.success('테스트 사용자 삭제 완료')

    log.success('\n🎉 Firebase Authentication이 정상적으로 작동합니다!')
    log.info('웹사이트에서 회원가입과 로그인을 사용할 수 있습니다.')
  } catch (error) {
    log.error(`\n❌ Authentication 테스트 실패: ${error.message}`)

    if (error.code === 'auth/operation-not-allowed') {
      log.warning('Firebase Console에서 Email/Password 인증을 활성화해야 합니다.')
      log.info(
        '1. https://console.firebase.google.com/project/laromacorea-renewal/authentication/providers 접속',
      )
      log.info('2. "Email/Password" 제공업체 클릭')
      log.info('3. "사용 설정" 토글 활성화')
      log.info('4. "저장" 클릭')
    } else if (error.code === 'auth/admin-restricted-operation') {
      log.warning('Firebase 프로젝트에서 Authentication이 활성화되지 않았습니다.')
      log.info('Firebase Console에서 Authentication을 활성화해주세요.')
    } else {
      log.error(`오류 코드: ${error.code}`)
      log.error(`오류 메시지: ${error.message}`)
    }

    process.exit(1)
  }
}

testAuthentication()
