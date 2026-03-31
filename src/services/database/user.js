/**
 * User Service
 * 사용자 관련 데이터베이스 작업
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, collections } from './constants';
import { pointsService } from '../points';

export const userService = {
  // 사용자 정보 조회
  async getUser(uid) {
    const userDoc = await getDoc(doc(db, collections.users, uid));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  },

  // 아이디로 사용자 조회
  async getUserByUsername(username) {
    const q = query(
      collection(db, collections.users),
      where('username', '==', username),
      limit(1),
    );
    const snapshot = await getDocs(q);
    return snapshot.empty
      ? null
      : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  },

  // 아이디 중복 체크
  async checkUsernameAvailability(username) {
    const q = query(
      collection(db, collections.users),
      where('username', '==', username),
      limit(1),
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  },

  // 닉네임 중복 체크
  async checkDisplayNameAvailability(displayName) {
    const q = query(
      collection(db, collections.users),
      where('displayName', '==', displayName),
      limit(1),
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  },

  // 사용자 프로필 업데이트
  async updateUserProfile(uid, profileData) {
    const userRef = doc(db, collections.users, uid);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    });
  },

  // 사용자 정보 업데이트
  async updateUser(uid, userData) {
    const userRef = doc(db, collections.users, uid);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    });
  },

  // 사용자 포인트 업데이트 (레거시 - pointsService 사용 권장)
  async updateUserPoints(uid, pointsChange, reason, relatedId = null) {
    if (pointsChange > 0) {
      await pointsService.awardPoints(uid, pointsChange, reason, relatedId);
    } else {
      await pointsService.deductPoints(
        uid,
        Math.abs(pointsChange),
        reason,
        relatedId,
      );
    }
  },
};
