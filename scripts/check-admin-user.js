#!/usr/bin/env node

/**
 * Admin User Check Script
 * 관리자 계정의 Firestore 데이터를 확인하는 스크립트
 */

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

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

async function checkAdminUser() {
  console.log(`${colors.blue}👤 관리자 계정 확인 시작${colors.reset}\n`)

  const adminEmail = 'admin@laromacorea.com'
  const adminPassword = 'admin123456'

  try {
    // 1. 관리자 계정으로 로그인
    log.info('관리자 계정으로 로그인 중...')
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
    const user = userCredential.user

    log.success(`로그인 성공: ${user.email}`)
    console.log('Firebase Auth 사용자 정보:')
    console.log(`  UID: ${user.uid}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Display Name: ${user.displayName}`)
    console.log(`  Email Verified: ${user.emailVerified}`)

    // 2. Firestore에서 사용자 문서 확인
    log.info('\nFirestore 사용자 문서 확인 중...')
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()
      log.success('Firestore 사용자 문서 발견')
      console.log('Firestore 사용자 데이터:')
      console.log(JSON.stringify(userData, null, 2))

      // 3. 관리자 권한 확인
      if (userData.role === 'admin') {
        log.success('✅ 관리자 권한 확인됨!')
      } else {
        log.error(`❌ 관리자 권한 없음. 현재 role: ${userData.role || 'undefined'}`)

        // 관리자 권한 부여
        log.info('관리자 권한을 부여하시겠습니까? (수동으로 업데이트 필요)')
      }

      // 4. 필수 필드 확인
      const requiredFields = ['uid', 'email', 'displayName', 'role', 'points', 'createdAt']
      const missingFields = requiredFields.filter((field) => !(field in userData))

      if (missingFields.length > 0) {
        log.warning(`누락된 필드: ${missingFields.join(', ')}`)
      } else {
        log.success('모든 필수 필드 존재')
      }
    } else {
      log.error('❌ Firestore 사용자 문서가 존재하지 않습니다!')
      log.info('사용자 문서를 생성해야 합니다.')
    }
  } catch (error) {
    log.error(`❌ 확인 실패: ${error.message}`)

    if (error.code === 'auth/user-not-found') {
      log.warning('관리자 계정이 존재하지 않습니다. 먼저 계정을 생성하세요.')
      log.info('npm run create-test-users 명령어를 실행하세요.')
    } else if (error.code === 'auth/wrong-password') {
      log.warning('비밀번호가 올바르지 않습니다.')
    }

    process.exit(1)
  }
}

checkAdminUser()
