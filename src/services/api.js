// API service for Firestore operations
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'

export class ApiService {
  // Get collection reference
  static getCollection(collectionName) {
    return collection(db, collectionName)
  }

  // Get document reference
  static getDocument(collectionName, docId) {
    return doc(db, collectionName, docId)
  }

  // Get all documents from a collection
  static async getDocuments(collectionName, queryConstraints = []) {
    try {
      const q = query(this.getCollection(collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      throw error
    }
  }

  // Get a single document
  static async getDocument(collectionName, docId) {
    try {
      const docRef = this.getDocument(collectionName, docId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        }
      } else {
        return null
      }
    } catch (error) {
      throw error
    }
  }

  // Add a new document
  static async addDocument(collectionName, data) {
    try {
      const docRef = await addDoc(this.getCollection(collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return docRef.id
    } catch (error) {
      throw error
    }
  }

  // Update a document
  static async updateDocument(collectionName, docId, data) {
    try {
      const docRef = this.getDocument(collectionName, docId)
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      })
    } catch (error) {
      throw error
    }
  }

  // Delete a document
  static async deleteDocument(collectionName, docId) {
    try {
      const docRef = this.getDocument(collectionName, docId)
      await deleteDoc(docRef)
    } catch (error) {
      throw error
    }
  }

  // Listen to real-time updates
  static onSnapshot(collectionName, callback, queryConstraints = []) {
    const q = query(this.getCollection(collectionName), ...queryConstraints)
    return onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      callback(documents)
    })
  }
}
