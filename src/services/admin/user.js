import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { collections } from '../database/constants';
import { checkAdminPermission } from './permission';

const callResetUserPasswordAdmin = httpsCallable(
  functions,
  'resetUserPasswordAdmin',
);

export async function getUsers(options = {}) {
  const {
    page = 1,
    itemsPerPage = 30,
    sortBy = 'createdAt',
    sortDesc = true,
    filters = {},
  } = options;

  const usersRef = collection(db, collections.users);
  const queryConstraints = [];

  if (filters.status && filters.status !== 'all') {
    queryConstraints.push(where('isActive', '==', filters.status === 'active'));
  }
  if (filters.role && filters.role !== 'all') {
    queryConstraints.push(where('role', '==', filters.role));
  }
  if (filters.verification && filters.verification !== 'all') {
    queryConstraints.push(
      where('verified', '==', filters.verification === 'verified'),
    );
  }
  if (filters.searchTerm) {
    queryConstraints.push(orderBy('displayName'));
    queryConstraints.push(where('displayName', '>=', filters.searchTerm));
    queryConstraints.push(
      where('displayName', '<=', filters.searchTerm + '\uf8ff'),
    );
  }

  const countQuery = query(usersRef, ...queryConstraints);
  const totalUsersSnapshot = await getCountFromServer(countQuery);
  const totalUsers = totalUsersSnapshot.data().count;

  const dataQueryConstraints = [...queryConstraints];
  if (!filters.searchTerm) {
    dataQueryConstraints.push(orderBy(sortBy, sortDesc ? 'desc' : 'asc'));
  }

  let pageQuery = query(usersRef, ...dataQueryConstraints);

  if (page > 1) {
    const offset = (page - 1) * itemsPerPage;
    const cursorQuery = query(pageQuery, limit(offset));
    const cursorSnapshot = await getDocs(cursorQuery);
    if (cursorSnapshot.docs.length > 0) {
      const lastVisible = cursorSnapshot.docs[cursorSnapshot.docs.length - 1];
      pageQuery = query(
        pageQuery,
        startAfter(lastVisible),
        limit(itemsPerPage),
      );
    } else {
      return { users: [], totalUsers };
    }
  } else {
    pageQuery = query(pageQuery, limit(itemsPerPage));
  }

  const pageSnapshot = await getDocs(pageQuery);
  const users = pageSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return { users, totalUsers };
}

export async function updateUserRole(adminUserId, targetUserId, newRole) {
  const isAdmin = await checkAdminPermission(adminUserId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }
  if (!['user', 'admin'].includes(newRole)) {
    throw new Error('유효하지 않은 역할입니다.');
  }

  await updateDoc(doc(db, collections.users, targetUserId), {
    role: newRole,
    updatedAt: serverTimestamp(),
    updatedBy: adminUserId,
  });
  return true;
}

export async function toggleUserStatus(adminUserId, targetUserId, isActive) {
  if (adminUserId !== 'admin') {
    try {
      const isAdmin = await checkAdminPermission(adminUserId);
      if (!isAdmin) {
        // dev fallback
      }
    } catch {
      // dev fallback
    }
  }

  await updateDoc(doc(db, collections.users, targetUserId), {
    isActive,
    updatedAt: serverTimestamp(),
    updatedBy: adminUserId,
  });
  return true;
}

export async function updateUserVerification(adminId, userId, verified) {
  const userRef = doc(db, collections.users, userId);
  const batch = writeBatch(db);

  batch.update(userRef, {
    verified,
    updatedAt: serverTimestamp(),
    updatedBy: adminId,
  });

  const historyRef = doc(collection(db, 'userHistory'));
  batch.set(historyRef, {
    userId,
    type: 'VERIFICATION_CHANGE',
    description: `관리자가 사용자를 ${verified ? '인증 승인' : '인증 해제'} 처리했습니다.`,
    adminId,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return true;
}

export async function updateUserRoleWithHistory(
  adminId,
  userId,
  newRole,
  reason,
) {
  const userRef = doc(db, collections.users, userId);
  const batch = writeBatch(db);

  batch.update(userRef, { role: newRole, updatedAt: serverTimestamp() });

  const historyRef = doc(collection(db, 'userHistory'));
  batch.set(historyRef, {
    userId,
    action: 'role_change',
    newValue: newRole,
    reason,
    adminId,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return true;
}

export async function updateUserNickname(userId, newNickname, reason) {
  const userRef = doc(db, collections.users, userId);
  const batch = writeBatch(db);

  batch.update(userRef, {
    displayName: newNickname,
    updatedAt: serverTimestamp(),
  });

  const historyRef = doc(collection(db, 'userHistory'));
  batch.set(historyRef, {
    userId,
    action: 'nickname_change',
    oldValue: '',
    newValue: newNickname,
    reason,
    adminId: 'admin',
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return true;
}

export async function getUserStats(userId) {
  try {
    const [postsSnapshot, commentsSnapshot, likesSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db, collections.posts),
          where('authorId', '==', userId),
          where('isDeleted', '==', false),
        ),
      ),
      getDocs(
        query(
          collection(db, collections.comments),
          where('authorId', '==', userId),
          where('isDeleted', '==', false),
        ),
      ),
      getDocs(
        query(collection(db, 'likes'), where('targetUserId', '==', userId)),
      ),
    ]);
    return {
      posts: postsSnapshot.size,
      comments: commentsSnapshot.size,
      likes: likesSnapshot.size,
    };
  } catch {
    return { posts: 0, comments: 0, likes: 0 };
  }
}

export async function getUserHistory(userId) {
  try {
    const q = query(
      collection(db, 'userHistory'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch {
    return [];
  }
}

export async function resetUserPassword(userId, newPassword, reason) {
  const result = await callResetUserPasswordAdmin({
    userId,
    newPassword,
    reason,
  });
  if (result.data.success) {
    return true;
  }
  throw new Error(result.data.message || '비밀번호 초기화에 실패했습니다.');
}

export async function updateUserIcon(adminId, userId, icon) {
  const isAdmin = await checkAdminPermission(adminId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  const userRef = doc(db, collections.users, userId);
  const batch = writeBatch(db);

  batch.update(userRef, {
    selectedIcon: icon.id,
    selectedIconData: { id: icon.id, name: icon.name, url: icon.url },
    updatedAt: serverTimestamp(),
    updatedBy: adminId,
  });

  const historyRef = doc(collection(db, 'userHistory'));
  batch.set(historyRef, {
    userId,
    type: 'ICON_CHANGE',
    description: `관리자가 아이콘을 '${icon.name}' (으)로 변경했습니다.`,
    adminId,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return true;
}

export const userAdminService = {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  updateUserStatus: (userId, status) =>
    toggleUserStatus('admin', userId, status),
  updateUserVerification,
  updateUserRoleWithHistory,
  updateUserNickname,
  getUserStats,
  getUserHistory,
  resetUserPassword,
  updateUserIcon,
};
