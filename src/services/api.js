// API service for Firestore operations (Legacy - 실제로는 database.js 사용)
// 이 파일은 테스트에서만 사용되며, 실제 코드에서는 database.js를 사용합니다.

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
} from 'firebase/firestore';
import { db } from './firebase';

export class ApiService {
  // Get collection reference
  static getCollection(collectionName) {
    return collection(db, collectionName);
  }

  // Get document reference
  static getDocRef(collectionName, docId) {
    return doc(db, collectionName, docId);
  }

  // Get all documents from a collection
  static async getDocuments(collectionName, queryConstraints = []) {
    const q = query(this.getCollection(collectionName), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Get a single document
  static async getDocument(collectionName, docId) {
    const docRef = this.getDocRef(collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      return null;
    }
  }

  // Add a new document
  static async addDocument(collectionName, data) {
    const docRef = await addDoc(this.getCollection(collectionName), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  }

  // Update a document
  static async updateDocument(collectionName, docId, data) {
    const docRef = this.getDocRef(collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    });
  }

  // Delete a document
  static async deleteDocument(collectionName, docId) {
    const docRef = this.getDocRef(collectionName, docId);
    await deleteDoc(docRef);
  }

  // 실시간 리스너는 사용하지 않으므로 제거 (onSnapshot 메서드 제거)
}
