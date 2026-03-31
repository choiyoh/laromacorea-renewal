import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { collections } from '../database/constants';
import { checkAdminPermission } from './permission';

export async function createNotice(adminUserId, noticeData) {
  if (!adminUserId || typeof adminUserId !== 'string') {
    throw new Error('유효하지 않은 관리자 ID입니다.');
  }
  if (!noticeData || typeof noticeData !== 'object') {
    throw new Error('유효하지 않은 공지사항 데이터입니다.');
  }
  if (!noticeData.title || !noticeData.content) {
    throw new Error('제목과 내용은 필수입니다.');
  }

  const isAdmin = await checkAdminPermission(adminUserId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  const adminDoc = await getDoc(doc(db, collections.users, adminUserId));
  const adminData = adminDoc.data();

  const docRef = await addDoc(collection(db, collections.posts), {
    title: noticeData.title,
    content: noticeData.content,
    boardType: 'notice',
    type: noticeData.type || 'general',
    priority: noticeData.priority || 'normal',
    isPinned: noticeData.isPinned !== undefined ? noticeData.isPinned : true,
    isPopup: noticeData.isPopup || false,
    isActive: noticeData.isActive !== undefined ? noticeData.isActive : true,
    startDate: noticeData.startDate || null,
    endDate: noticeData.endDate || null,
    isDeleted: false,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    authorId: adminUserId,
    authorName: adminData?.displayName || '관리자',
    authorEmail: adminData?.email || '',
    authorPhotoURL: adminData?.photoURL || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    const { statsService } = await import('../stats');
    statsService.invalidateCache();
  } catch {
    // cache invalidation failure is non-critical
  }

  return docRef.id;
}

export async function updateNotice(adminUserId, postId, updateData) {
  if (!adminUserId || typeof adminUserId !== 'string') {
    throw new Error('유효하지 않은 관리자 ID입니다.');
  }
  if (!postId || typeof postId !== 'string') {
    throw new Error('유효하지 않은 게시글 ID입니다.');
  }

  const isAdmin = await checkAdminPermission(adminUserId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  const postRef = doc(db, collections.posts, postId);
  const postDoc = await getDoc(postRef);

  if (!postDoc.exists()) {
    throw new Error('공지사항을 찾을 수 없습니다.');
  }
  if (postDoc.data().boardType !== 'notice') {
    throw new Error('공지사항이 아닙니다.');
  }

  const updateFields = {
    ...updateData,
    updatedAt: serverTimestamp(),
    updatedBy: adminUserId,
  };
  if (updateData.startDate === '') updateFields.startDate = null;
  if (updateData.endDate === '') updateFields.endDate = null;

  await updateDoc(postRef, updateFields);

  try {
    const { statsService } = await import('../stats');
    statsService.invalidateCache();
  } catch {
    // cache invalidation failure is non-critical
  }

  return true;
}

export async function deleteNotice(adminUserId, postId) {
  if (!adminUserId || typeof adminUserId !== 'string') {
    throw new Error('유효하지 않은 관리자 ID입니다.');
  }
  if (!postId || typeof postId !== 'string') {
    throw new Error('유효하지 않은 게시글 ID입니다.');
  }

  const isAdmin = await checkAdminPermission(adminUserId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  const postRef = doc(db, collections.posts, postId);
  const postDoc = await getDoc(postRef);

  if (!postDoc.exists()) {
    throw new Error('공지사항을 찾을 수 없습니다.');
  }
  if (postDoc.data().boardType !== 'notice') {
    throw new Error('공지사항이 아닙니다.');
  }

  await updateDoc(postRef, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: adminUserId,
    updatedAt: serverTimestamp(),
  });

  try {
    const { statsService } = await import('../stats');
    statsService.invalidateCache();
  } catch {
    // cache invalidation failure is non-critical
  }

  return true;
}

export async function toggleNoticePin(adminUserId, postId, isPinned) {
  const isAdmin = await checkAdminPermission(adminUserId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  await updateDoc(doc(db, collections.posts, postId), {
    isPinned,
    updatedAt: serverTimestamp(),
  });
  return true;
}

export async function getNotices(options = {}) {
  let q;
  if (options.includeInactive) {
    q = query(
      collection(db, collections.posts),
      where('boardType', '==', 'notice'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(options.limitCount || 50),
    );
  } else {
    q = query(
      collection(db, collections.posts),
      where('boardType', '==', 'notice'),
      where('isDeleted', '==', false),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(options.limitCount || 20),
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    };
  });
}

export const noticeService = {
  createNotice,
  updateNotice,
  deleteNotice,
  toggleNoticePin,
  getNotices,
  createNoticeData: createNotice,
};
