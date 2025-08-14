#!/usr/bin/env node

/**
 * 새로운 admin 계정 생성 스크립트
 * 기존 이메일 기반 관리자 계정을 대체하는 아이디 기반 admin 계정을 생성합니다.
 */

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

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

async function createAdminAccount() {
  try {
    console.log('🚀 새로운 admin 계정 생성을 시작합니다...')

    // 1. 기존 이메일 기반 관리자 계정 확인 및 삭제
    console.log('📧 기존 이메일 기반 관리자 계정 확인 중...')

    try {
      // 기존 관리자 계정으로 로그인 시도
      const oldAdminCredential = await signInWithEmailAndPassword(
        auth,
        'admin@laromacorea.com',
        'admin123456',
      )
      console.log('✅ 기존 관리자 계정 발견:', oldAdminCredential.user.uid)

      // Firestore에서 사용자 문서 삭제
      await deleteDoc(doc(db, 'users', oldAdminCredential.user.uid))
      console.log('🗑️ Firestore 사용자 문서 삭제 완료')

      // Firebase Auth에서 사용자 삭제
      await deleteUser(oldAdminCredential.user)
      console.log('🗑️ Firebase Auth 사용자 삭제 완료')
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('ℹ️ 기존 관리자 계정이 없습니다. 새 계정을 생성합니다.')
      } else {
        console.log('⚠️ 기존 계정 삭제 중 오류 (무시하고 계속):', error.message)
      }
    }

    // 2. 새로운 admin 계정 생성
    console.log('👤 새로운 admin 계정 생성 중...')

    const adminData = {
      username: 'admin',
      email: 'admin@laromacorea.com',
      displayName: '관리자',
      password: 'admin123456',
      tempEmail: 'admin@laromacorea.temp',
    }

    // Firebase Auth에 계정 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminData.tempEmail,
      adminData.password,
    )

    const user = userCredential.user
    console.log('✅ Firebase Auth 계정 생성 완료:', user.uid)

    // 프로필 업데이트
    await updateProfile(user, {
      displayName: adminData.displayName,
    })

    // 3. Firestore에 사용자 문서 생성
    console.log('📄 Firestore 사용자 문서 생성 중...')

    const userData = {
      uid: user.uid,
      username: adminData.username,
      email: adminData.email,
      tempEmail: adminData.tempEmail,
      displayName: adminData.displayName,
      photoURL: null,
      selectedIcon: null,
      points: 10000, // 관리자는 충분한 포인트
      role: 'admin', // 관리자 권한
      authMethod: 'username',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
      emailVerified: true, // 관리자는 이메일 인증 생략
    }

    await setDoc(doc(db, 'users', user.uid), userData)
    console.log('✅ Firestore 사용자 문서 생성 완료')

    // 4. 생성된 계정 확인
    console.log('🔍 생성된 계정 확인 중...')
    const userDoc = await getDoc(doc(db, 'users', user.uid))

    if (userDoc.exists()) {
      const data = userDoc.data()
      console.log('✅ 계정 생성 성공!')
      console.log('📋 계정 정보:')
      console.log(`   - UID: ${data.uid}`)
      console.log(`   - 아이디: ${data.username}`)
      console.log(`   - 이메일: ${data.email}`)
      console.log(`   - 닉네임: ${data.displayName}`)
      console.log(`   - 역할: ${data.role}`)
      console.log(`   - 포인트: ${data.points}`)
      console.log(`   - 인증 방식: ${data.authMethod}`)
    }

    console.log('\n🎉 admin 계정 생성이 완료되었습니다!')
    console.log('🔐 로그인 정보:')
    console.log('   - 아이디: admin')
    console.log('   - 비밀번호: admin123456')
    console.log('\n🌐 로그인 URL: https://laromacorea-renewal.web.app/auth')
    console.log('🛡️ 관리자 페이지: https://laromacorea-renewal.web.app/admin')
  } catch (error) {
    console.error('❌ admin 계정 생성 실패:', error)

    if (error.code === 'auth/email-already-in-use') {
      console.log(
        '💡 해결 방법: Firebase Console에서 기존 계정을 수동으로 삭제하고 다시 실행해주세요.',
      )
    }

    process.exit(1)
  }
}

// 스크립트 실행
createAdminAccount()
  .then(() => {
    console.log('✨ 스크립트 실행 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 스크립트 실행 실패:', error)
    process.exit(1)
  })
