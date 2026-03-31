import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { collections } from '../database/constants';
import { checkAdminPermission } from './permission';

export async function getAllIcons() {
  try {
    const q = query(
      collection(db, collections.icons),
      orderBy('category', 'asc'),
      orderBy('createdAt', 'desc'),
    );
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
        purchaseCount: data.purchaseCount || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      };
    });
  } catch {
    return [];
  }
}

export async function createIcon(adminUserId, iconData) {
  const isAdmin = await checkAdminPermission(adminUserId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  const docRef = await addDoc(collection(db, collections.icons), {
    ...iconData,
    isActive: true,
    purchaseCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: adminUserId,
  });
  return docRef.id;
}

export async function updateIcon(adminUserId, iconId, updateData) {
  const isAdmin = await checkAdminPermission(adminUserId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  await updateDoc(doc(db, collections.icons, iconId), {
    ...updateData,
    updatedAt: serverTimestamp(),
    updatedBy: adminUserId,
  });
  return true;
}

export async function toggleIconStatus(adminUserId, iconId, isActive) {
  const isAdmin = await checkAdminPermission(adminUserId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  await updateDoc(doc(db, collections.icons, iconId), {
    isActive,
    updatedAt: serverTimestamp(),
    updatedBy: adminUserId,
  });
  return true;
}

export async function deleteIcon(adminUserId, iconId) {
  const isAdmin = await checkAdminPermission(adminUserId);
  if (!isAdmin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  await deleteDoc(doc(db, collections.icons, iconId));
  return true;
}

export async function addIcon(iconData) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('사용자가 로그인되어 있지 않습니다');
  }

  const isAdminUser = await checkAdminPermission(currentUser.uid);
  if (!isAdminUser) {
    throw new Error('관리자 권한이 필요합니다');
  }

  let iconUrl = '';
  const { file, ...dataToSave } = iconData;

  if (file && file instanceof File) {
    const uniqueFileName = `${Date.now()}_${file.name}`;
    const iconStorageRef = storageRef(storage, `icons/${uniqueFileName}`);
    const uploadResult = await uploadBytes(iconStorageRef, file);
    iconUrl = await getDownloadURL(uploadResult.ref);
  } else {
    iconUrl = `https://via.placeholder.com/100x100/FFD700/000000?text=${encodeURIComponent(dataToSave.name)}`;
  }

  const docRef = await addDoc(collection(db, collections.icons), {
    ...dataToSave,
    url: iconUrl,
    isActive: true,
    purchaseCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: currentUser.uid,
  });
  return docRef.id;
}

export async function updateIconData(iconId, iconData) {
  await updateDoc(doc(db, collections.icons, iconId), {
    ...iconData,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.uid || 'admin',
  });
  return true;
}

export async function deleteIconData(iconId) {
  await deleteDoc(doc(db, collections.icons, iconId));
  return true;
}

export async function purchaseIcon(userId, iconId, iconPrice) {
  const { pointsService } = await import('../points');
  await pointsService.deductPoints(userId, iconPrice, 'icon_purchase', iconId);

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
  batch.update(iconRef, { purchaseCount: increment(1) });

  await batch.commit();
}

export const iconAdminService = {
  getAllIcons,
  createIcon,
  updateIcon,
  toggleIconStatus,
  deleteIcon,
  addIcon,
  updateIconData,
  deleteIconData,
  getIcons: getAllIcons,
  purchaseIcon,
};
