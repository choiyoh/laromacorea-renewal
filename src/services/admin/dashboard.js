import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  getCountFromServer,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { collections } from '../database/constants';
import { checkAdminPermission } from './permission';

export async function getDashboardStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsersSnap,
    totalPostsSnap,
    totalCommentsSnap,
    totalIconsSnap,
    activeUsersSnap,
    recentPostsSnap,
  ] = await Promise.all([
    getCountFromServer(collection(db, collections.users)),
    getCountFromServer(
      query(collection(db, collections.posts), where('isDeleted', '==', false)),
    ),
    getCountFromServer(
      query(
        collection(db, collections.comments),
        where('isDeleted', '==', false),
      ),
    ),
    getCountFromServer(collection(db, collections.icons)),
    getCountFromServer(
      query(
        collection(db, collections.users),
        where('lastLoginAt', '>', thirtyDaysAgo),
      ),
    ),
    getCountFromServer(
      query(
        collection(db, collections.posts),
        where('isDeleted', '==', false),
        where('createdAt', '>', sevenDaysAgo),
      ),
    ),
  ]);

  return {
    totalUsers: totalUsersSnap.data().count,
    totalPosts: totalPostsSnap.data().count,
    totalComments: totalCommentsSnap.data().count,
    totalIcons: totalIconsSnap.data().count,
    activeUsers: activeUsersSnap.data().count,
    recentPosts: recentPostsSnap.data().count,
  };
}

export async function adjustUserPointsWithHistory(
  userId,
  pointsChange,
  reason,
  adminId,
) {
  const userRef = doc(db, collections.users, userId);
  const batch = writeBatch(db);

  const userDoc = await getDoc(userRef);
  const currentPoints = userDoc.data()?.points || 0;
  const newPoints = Math.max(0, currentPoints + pointsChange);

  batch.update(userRef, { points: newPoints, updatedAt: serverTimestamp() });

  const pointHistoryRef = doc(collection(db, 'points_history'));
  batch.set(pointHistoryRef, {
    userId,
    change: pointsChange,
    previousPoints: currentPoints,
    newPoints,
    reason,
    adminId,
    createdAt: serverTimestamp(),
  });

  const historyRef = doc(collection(db, 'userHistory'));
  batch.set(historyRef, {
    userId,
    action: 'points_adjustment',
    oldValue: currentPoints,
    newValue: newPoints,
    reason,
    adminId,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return true;
}

export async function bulkAwardPoints(adminId, target, points, reason) {
  const isAdmin = await checkAdminPermission(adminId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  const { pointsService } = await import('../points');
  const result = await pointsService.bulkAwardPoints(
    target,
    points,
    reason,
    adminId,
  );

  await import('firebase/firestore').then(({ addDoc, collection: coll }) =>
    addDoc(coll(db, 'adminLogs'), {
      adminId,
      action: 'BULK_POINTS_AWARD',
      target,
      points,
      reason,
      targetCount: result.targetCount,
      totalPoints: result.totalPoints,
      createdAt: serverTimestamp(),
    }),
  );

  return result;
}

export async function getPointsHistory(adminId, options = {}) {
  const isAdmin = await checkAdminPermission(adminId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }
  const { pointsService } = await import('../points');
  return pointsService.getAllPointsHistory(options.limit || 100);
}

export async function getPointsStatistics(adminId) {
  const isAdmin = await checkAdminPermission(adminId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }
  const { pointsService } = await import('../points');
  return pointsService.getPointsStatistics();
}

export const dashboardService = {
  getDashboardStats,
  adjustUserPointsWithHistory,
  adjustUserPoints: adjustUserPointsWithHistory,
  bulkAwardPoints,
  getPointsHistory,
  getPointsStatistics,
};
