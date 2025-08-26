#!/usr/bin/env node

/**
 * 기존 게시글과 댓글에 사용자 아이콘 정보를 업데이트하는 스크립트
 * 구매한 아이콘이 기존 글에 표시되지 않는 문제를 해결합니다.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
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

async function updateExistingPostsAndComments() {
  try {
    console.log('🔄 기존 게시글과 댓글의 아이콘 정보 업데이트를 시작합니다...');

    // 1. 아이콘 정보 가져오기
    console.log('🎨 아이콘 정보를 가져오는 중...');
    const iconsSnapshot = await getDocs(collection(db, 'icons'));
    const iconMap = new Map();

    iconsSnapshot.forEach((doc) => {
      const iconData = doc.data();
      iconMap.set(doc.id, iconData.url);
    });

    console.log(`✅ ${iconMap.size}개의 아이콘 정보를 찾았습니다.`);

    // 2. 모든 사용자의 아이콘 정보 가져오기
    console.log('📋 사용자 아이콘 정보를 가져오는 중...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userIconMap = new Map();

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.selectedIcon && iconMap.has(userData.selectedIcon)) {
        const iconUrl = iconMap.get(userData.selectedIcon);
        userIconMap.set(doc.id, iconUrl);
        console.log(
          `  ✓ 사용자 "${userData.displayName}" - 아이콘: ${iconUrl}`,
        );
      }
    });

    console.log(`✅ ${userIconMap.size}명의 사용자 아이콘 정보를 찾았습니다.`);

    // 3. 게시글 업데이트
    console.log('📝 게시글 아이콘 정보 업데이트 중...');
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    let updatedPostsCount = 0;

    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      const authorId = postData.authorId;

      // 아이콘이 없거나 null인 경우에만 업데이트
      if (
        (!postData.authorIcon || postData.authorIcon === null) &&
        userIconMap.has(authorId)
      ) {
        const iconUrl = userIconMap.get(authorId);

        await updateDoc(doc(db, 'posts', postDoc.id), {
          authorIcon: iconUrl,
        });

        updatedPostsCount++;
        console.log(`  ✓ 게시글 "${postData.title}" 아이콘 업데이트 완료`);
      }
    }

    console.log(
      `✅ ${updatedPostsCount}개의 게시글 아이콘이 업데이트되었습니다.`,
    );

    // 4. 댓글 업데이트
    console.log('💬 댓글 아이콘 정보 업데이트 중...');
    const commentsSnapshot = await getDocs(collection(db, 'comments'));
    let updatedCommentsCount = 0;

    for (const commentDoc of commentsSnapshot.docs) {
      const commentData = commentDoc.data();
      const authorId = commentData.authorId;

      // 아이콘이 없거나 null인 경우에만 업데이트
      if (
        (!commentData.authorIcon || commentData.authorIcon === null) &&
        userIconMap.has(authorId)
      ) {
        const iconUrl = userIconMap.get(authorId);

        await updateDoc(doc(db, 'comments', commentDoc.id), {
          authorIcon: iconUrl,
        });

        updatedCommentsCount++;
        console.log(
          `  ✓ 댓글 (${commentData.content.substring(0, 30)}...) 아이콘 업데이트 완료`,
        );
      }
    }

    console.log(
      `✅ ${updatedCommentsCount}개의 댓글 아이콘이 업데이트되었습니다.`,
    );

    // 5. 매치 댓글 업데이트 (있는 경우)
    console.log('⚽ 매치 댓글 아이콘 정보 업데이트 중...');
    const matchCommentsSnapshot = await getDocs(
      collection(db, 'matchComments'),
    );
    let updatedMatchCommentsCount = 0;

    for (const matchCommentDoc of matchCommentsSnapshot.docs) {
      const matchCommentData = matchCommentDoc.data();
      const authorId = matchCommentData.authorId;

      // 아이콘이 없거나 null인 경우에만 업데이트
      if (
        (!matchCommentData.authorIcon ||
          matchCommentData.authorIcon === null) &&
        userIconMap.has(authorId)
      ) {
        const iconUrl = userIconMap.get(authorId);

        await updateDoc(doc(db, 'matchComments', matchCommentDoc.id), {
          authorIcon: iconUrl,
        });

        updatedMatchCommentsCount++;
        console.log(`  ✓ 매치 댓글 아이콘 업데이트 완료`);
      }
    }

    console.log(
      `✅ ${updatedMatchCommentsCount}개의 매치 댓글 아이콘이 업데이트되었습니다.`,
    );

    // 6. 사용자 selectedIconData 업데이트
    console.log('👤 사용자 selectedIconData 업데이트 중...');
    let updatedUsersCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      if (
        userData.selectedIcon &&
        iconMap.has(userData.selectedIcon) &&
        !userData.selectedIconData
      ) {
        const iconUrl = iconMap.get(userData.selectedIcon);

        // 아이콘 이름 찾기
        const iconsSnapshotForName = await getDocs(collection(db, 'icons'));
        let iconName = 'Unknown';
        iconsSnapshotForName.forEach((iconDoc) => {
          if (iconDoc.id === userData.selectedIcon) {
            iconName = iconDoc.data().name || 'Unknown';
          }
        });

        await updateDoc(doc(db, 'users', userDoc.id), {
          selectedIconData: {
            id: userData.selectedIcon,
            name: iconName,
            url: iconUrl,
          },
        });

        updatedUsersCount++;
        console.log(
          `  ✓ 사용자 "${userData.displayName}" selectedIconData 업데이트 완료`,
        );
      }
    }

    console.log(
      `✅ ${updatedUsersCount}명의 사용자 selectedIconData가 업데이트되었습니다.`,
    );

    console.log(
      '\n🎉 모든 기존 게시글과 댓글의 아이콘 정보 업데이트가 완료되었습니다!',
    );
    console.log(`📊 업데이트 요약:`);
    console.log(`   - 게시글: ${updatedPostsCount}개`);
    console.log(`   - 댓글: ${updatedCommentsCount}개`);
    console.log(`   - 매치 댓글: ${updatedMatchCommentsCount}개`);
    console.log(`   - 사용자 데이터: ${updatedUsersCount}명`);
    console.log(
      `   - 총 ${updatedPostsCount + updatedCommentsCount + updatedMatchCommentsCount + updatedUsersCount}개 항목 업데이트`,
    );
  } catch (error) {
    console.error('❌ 아이콘 정보 업데이트 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  updateExistingPostsAndComments()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { updateExistingPostsAndComments };
