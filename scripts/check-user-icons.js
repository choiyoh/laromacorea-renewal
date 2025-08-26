#!/usr/bin/env node

/**
 * 사용자 아이콘 정보를 확인하는 스크립트
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkUserIcons() {
  try {
    console.log('🔍 사용자 데이터 구조를 확인합니다...');

    // 사용자 컬렉션 확인
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📋 총 ${usersSnapshot.size}명의 사용자가 있습니다.`);

    usersSnapshot.forEach((doc, index) => {
      const userData = doc.data();
      console.log(`\n👤 사용자 ${index + 1} (ID: ${doc.id}):`);
      console.log('  - displayName:', userData.displayName || 'N/A');
      console.log('  - email:', userData.email || 'N/A');
      console.log('  - selectedIcon:', userData.selectedIcon || 'N/A');
      console.log('  - selectedIconData:', userData.selectedIconData || 'N/A');
      console.log('  - points:', userData.points || 0);
      console.log('  - purchasedIcons:', userData.purchasedIcons || 'N/A');

      // 모든 필드 출력
      console.log('  - 전체 데이터:', JSON.stringify(userData, null, 2));
    });

    // 아이콘 컬렉션 확인
    console.log('\n🎨 아이콘 컬렉션을 확인합니다...');
    const iconsSnapshot = await getDocs(collection(db, 'icons'));
    console.log(`📋 총 ${iconsSnapshot.size}개의 아이콘이 있습니다.`);

    iconsSnapshot.forEach((doc, index) => {
      const iconData = doc.data();
      console.log(`\n🎯 아이콘 ${index + 1} (ID: ${doc.id}):`);
      console.log('  - name:', iconData.name || 'N/A');
      console.log('  - url:', iconData.url || 'N/A');
      console.log('  - price:', iconData.price || 0);
      console.log('  - isActive:', iconData.isActive);
    });

    // 게시글 샘플 확인
    console.log('\n📝 게시글 샘플을 확인합니다...');
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    console.log(`📋 총 ${postsSnapshot.size}개의 게시글이 있습니다.`);

    let sampleCount = 0;
    postsSnapshot.forEach((doc) => {
      if (sampleCount < 3) {
        const postData = doc.data();
        console.log(`\n📄 게시글 샘플 ${sampleCount + 1} (ID: ${doc.id}):`);
        console.log('  - title:', postData.title || 'N/A');
        console.log('  - authorId:', postData.authorId || 'N/A');
        console.log('  - authorName:', postData.authorName || 'N/A');
        console.log('  - authorIcon:', postData.authorIcon || 'N/A');
        console.log('  - authorPhotoURL:', postData.authorPhotoURL || 'N/A');
        sampleCount++;
      }
    });

    // 댓글 샘플 확인
    console.log('\n💬 댓글 샘플을 확인합니다...');
    const commentsSnapshot = await getDocs(collection(db, 'comments'));
    console.log(`📋 총 ${commentsSnapshot.size}개의 댓글이 있습니다.`);

    let commentSampleCount = 0;
    commentsSnapshot.forEach((doc) => {
      if (commentSampleCount < 3) {
        const commentData = doc.data();
        console.log(
          `\n💭 댓글 샘플 ${commentSampleCount + 1} (ID: ${doc.id}):`,
        );
        console.log(
          '  - content:',
          (commentData.content || 'N/A').substring(0, 50) + '...',
        );
        console.log('  - authorId:', commentData.authorId || 'N/A');
        console.log('  - authorName:', commentData.authorName || 'N/A');
        console.log('  - authorIcon:', commentData.authorIcon || 'N/A');
        commentSampleCount++;
      }
    });
  } catch (error) {
    console.error('❌ 데이터 확인 중 오류가 발생했습니다:', error);
  }
}

// 스크립트 실행
checkUserIcons()
  .then(() => {
    console.log('\n✅ 데이터 확인 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
