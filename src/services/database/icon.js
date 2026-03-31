/**
 * Icon Service
 * 아이콘 관련 데이터베이스 작업
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, collections } from './constants';
import { pointsService } from '../points';

export const iconService = {
  // 활성 아이콘 목록 조회
  async getActiveIcons() {
    const q = query(
      collection(db, collections.icons),
      where('isActive', '==', true),
      orderBy('category', 'asc'),
      orderBy('price', 'asc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  // 아이콘 구매
  async purchaseIcon(userId, iconId, iconPrice) {
    await pointsService.deductPoints(
      userId,
      iconPrice,
      'icon_purchase',
      iconId,
    );

    const batch = writeBatch(db);

    const purchaseRef = doc(
      db,
      collections.users,
      userId,
      'purchased_icons',
      iconId,
    );
    batch.set(purchaseRef, {
      iconId,
      purchasedAt: serverTimestamp(),
      price: iconPrice,
    });

    const iconRef = doc(db, collections.icons, iconId);
    batch.update(iconRef, {
      purchaseCount: increment(1),
    });

    await batch.commit();
  },

  // 사용자 구매 아이콘 목록 조회
  async getUserPurchasedIcons(userId) {
    const snapshot = await getDocs(
      collection(db, collections.users, userId, 'purchased_icons'),
    );
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
};
