import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { collections } from '../database/constants';
import { toggleNoticePin, deleteNotice } from './notice';

export async function getPosts(options = {}) {
  const q = query(
    collection(db, collections.posts),
    orderBy('createdAt', 'desc'),
    limit(options.limitCount || 50),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function togglePostPinned(postId, isPinned) {
  return toggleNoticePin('admin', postId, isPinned);
}

export async function togglePostDeleted(postId, isDeleted) {
  if (isDeleted) {
    return deleteNotice('admin', postId);
  }
  await updateDoc(doc(db, collections.posts, postId), {
    isDeleted: false,
    updatedAt: serverTimestamp(),
  });
  return true;
}

export const postAdminService = {
  getPosts,
  togglePostPinned,
  togglePostDeleted,
};
