import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { collections } from '../database/constants';

export async function checkAdminPermission(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  const userDoc = await getDoc(doc(db, collections.users, userId));
  if (!userDoc.exists()) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  return userDoc.data().role === 'admin';
}
