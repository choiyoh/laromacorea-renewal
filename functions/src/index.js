const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Resets a user's password to a new temporary password.
 * This function should only be called by an authenticated administrator.
 * @param {object} data - The data sent to the function.
 * @param {string} data.userId - The UID of the user whose password needs to be reset.
 * @param {string} data.newPassword - The new temporary password for the user.
 * @param {object} context - The context of the function call.
 * @returns {object} - A result object indicating success or failure.
 */
exports.resetUserPasswordAdmin = functions.https.onCall(
  async (data, context) => {
    // 1. Check if the caller is authenticated and is an admin
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.',
      );
    }

    const callerUid = context.auth.uid;
    try {
      const callerUserRecord = await admin.auth().getUser(callerUid);
      if (
        !callerUserRecord.customClaims ||
        !callerUserRecord.customClaims.admin
      ) {
        // You might want to check a specific role, e.g., 'admin' or 'super_admin'
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(callerUid)
          .get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
          throw new functions.https.HttpsError(
            'permission-denied',
            'Only administrators can perform this action.',
          );
        }
      }
    } catch (error) {
      console.error('Admin permission check failed:', error);
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin permission check failed.',
        error.message,
      );
    }

    // 2. Validate input data
    const { userId, newPassword } = data;

    if (!userId || typeof userId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The userId is required and must be a string.',
      );
    }
    if (
      !newPassword ||
      typeof newPassword !== 'string' ||
      newPassword.length < 6
    ) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The newPassword is required and must be a string of at least 6 characters.',
      );
    }

    try {
      // 3. Update the user's password using Firebase Admin SDK
      await admin.auth().updateUser(userId, {
        password: newPassword,
      });

      // 4. Optionally, update Firestore to mark password reset required for next login
      // This part is already handled on the client side, but can be duplicated here for robustness
      // or removed from client if this function becomes the single source of truth.
      await admin.firestore().collection('users').doc(userId).update({
        passwordResetRequired: true,
        passwordResetAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Log the action in userHistory (can be moved here from client for consistency)
      await admin
        .firestore()
        .collection('userHistory')
        .add({
          userId,
          action: 'password_reset',
          reason: data.reason || 'Admin initiated password reset.',
          adminId: callerUid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`User ${userId} password reset by admin ${callerUid}.`);

      return { success: true, message: 'User password reset successfully.' };
    } catch (error) {
      console.error('Error resetting user password:', error);
      // Re-throw as an HttpsError for client-side handling
      if (error.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found.',
          error.message,
        );
      } else if (error.code === 'auth/invalid-password') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'The new password is too weak or invalid.',
          error.message,
        );
      } else {
        throw new functions.https.HttpsError(
          'internal',
          'Failed to reset user password.',
          error.message,
        );
      }
    }
  },
);

// ============================================
// Algolia Search Sync - Firestore 트리거
// ============================================

const {algoliasearch} = require('algoliasearch');

// Algolia 클라이언트 초기화 (환경 변수에서 가져옴)
// Firebase Functions 환경 변수 설정:
// firebase functions:config:set algolia.app_id="YOUR_APP_ID" algolia.admin_key="YOUR_ADMIN_KEY"
const algoliaAppId = functions.config().algolia?.app_id;
const algoliaAdminKey = functions.config().algolia?.admin_key;

let algoliaClient = null;
const ALGOLIA_POSTS_INDEX = 'posts';

/**
 * Algolia 클라이언트 초기화 (지연 초기화)
 */
function getAlgoliaClient() {
  if (!algoliaAppId || !algoliaAdminKey) {
    console.warn('Algolia 설정이 없습니다. 동기화를 건너뜁니다.');
    return null;
  }

  if (!algoliaClient) {
    algoliaClient = algoliasearch(algoliaAppId, algoliaAdminKey);
  }

  return algoliaClient;
}

/**
 * HTML 태그 제거 유틸리티
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Algolia record size limit을 넘지 않도록 UTF-8 byte 기준으로 자름
 */
function truncateUtf8(value, maxBytes) {
  if (!value || Buffer.byteLength(value, 'utf8') <= maxBytes) {
    return value || '';
  }

  let output = '';
  let bytes = 0;

  for (const char of value) {
    const charBytes = Buffer.byteLength(char, 'utf8');
    if (bytes + charBytes > maxBytes) break;
    output += char;
    bytes += charBytes;
  }

  return output;
}

/**
 * Firestore Timestamp/Date/number 값을 Algolia 정렬용 millis로 변환
 */
function toMillis(value) {
  if (value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (value && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  if (value && typeof value._seconds === 'number') {
    return value._seconds * 1000;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return value;
  }

  return Date.now();
}

/**
 * Firestore 게시물 데이터를 Algolia 형식으로 변환
 */
function transformPostForAlgolia(postId, postData) {
  return {
    objectID: postId,
    title: postData.title || '',
    content: truncateUtf8(stripHtml(postData.content || ''), 4000),
    authorName: postData.authorName || '',
    authorId: postData.authorId || '',
    boardType: postData.boardType || '',
    tags: postData.tags || [],
    viewCount: postData.viewCount || 0,
    likeCount: postData.likeCount || 0,
    commentCount: postData.commentCount || 0,
    isPinned: postData.isPinned || false,
    isDeleted: postData.isDeleted || false,
    createdAt: toMillis(postData.createdAt),
  };
}

/**
 * 게시물을 Algolia posts 인덱스에 저장
 */
async function savePostToAlgolia(postId, postData) {
  const client = getAlgoliaClient();
  if (!client) return false;

  const body = transformPostForAlgolia(postId, postData);
  await client.saveObject({
    indexName: ALGOLIA_POSTS_INDEX,
    body,
  });

  return true;
}

/**
 * 게시물을 Algolia posts 인덱스에서 삭제
 */
async function deletePostFromAlgolia(postId) {
  const client = getAlgoliaClient();
  if (!client) return false;

  await client.deleteObject({
    indexName: ALGOLIA_POSTS_INDEX,
    objectID: postId,
  });

  return true;
}

/**
 * 게시물 생성 시 Algolia에 추가
 */
exports.onPostCreated = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snapshot, context) => {
    const postId = context.params.postId;
    const postData = snapshot.data();

    // 삭제된 게시물은 인덱싱하지 않음
    if (postData.isDeleted) {
      return;
    }

    try {
      const saved = await savePostToAlgolia(postId, postData);
      if (saved) {
        console.log(`Algolia에 게시물 추가됨: ${postId}`);
      }
    } catch (error) {
      console.error('Algolia 게시물 추가 실패:', error);
    }
  });

/**
 * 게시물 수정 시 Algolia 업데이트
 */
exports.onPostUpdated = functions.firestore
  .document('posts/{postId}')
  .onUpdate(async (change, context) => {
    const postId = context.params.postId;
    const newData = change.after.data();

    try {
      if (newData.isDeleted) {
        // 삭제된 경우 Algolia에서도 제거
        const deleted = await deletePostFromAlgolia(postId);
        if (deleted) {
          console.log(`Algolia에서 게시물 삭제됨 (soft delete): ${postId}`);
        }
      } else {
        // 업데이트
        const saved = await savePostToAlgolia(postId, newData);
        if (saved) {
          console.log(`Algolia 게시물 업데이트됨: ${postId}`);
        }
      }
    } catch (error) {
      console.error('Algolia 게시물 업데이트 실패:', error);
    }
  });

/**
 * 게시물 삭제 시 Algolia에서 제거 (하드 삭제)
 */
exports.onPostDeleted = functions.firestore
  .document('posts/{postId}')
  .onDelete(async (snapshot, context) => {
    const postId = context.params.postId;

    try {
      const deleted = await deletePostFromAlgolia(postId);
      if (deleted) {
        console.log(`Algolia에서 게시물 삭제됨: ${postId}`);
      }
    } catch (error) {
      console.error('Algolia 게시물 삭제 실패:', error);
    }
  });
