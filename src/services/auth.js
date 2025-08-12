// Authentication service
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  updatePassword,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

export class AuthService {
  // Sign in with email and password
  static async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Update last login time
      if (userCredential.user) {
        await this.updateUserLastLogin(userCredential.user.uid)
      }

      return userCredential.user
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  // Create new user account
  static async signUp(email, password, displayName = null) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update user profile if displayName provided
      if (displayName) {
        await updateProfile(user, { displayName })
      }

      // Create user document in Firestore
      await this.createUserDocument(user, displayName)

      // Send email verification
      await sendEmailVerification(user)

      return user
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  // Sign out current user
  static async signOut() {
    try {
      await signOut(auth)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  // Send password reset email
  static async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  // Update user password
  static async updateUserPassword(newPassword) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('No authenticated user')

      await updatePassword(user, newPassword)
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  // Update user profile
  static async updateUserProfile(updates) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('No authenticated user')

      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        })
      }

      // Update Firestore user document
      await this.updateUserDocument(user.uid, updates)

      return user
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  // Create user document in Firestore
  static async createUserDocument(user, displayName = null) {
    try {
      const userRef = doc(db, 'users', user.uid)
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        selectedIcon: null,
        points: 100, // Initial points for new users
        role: 'user',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isActive: true,
        emailVerified: user.emailVerified,
      }

      await setDoc(userRef, userData)
      return userData
    } catch (error) {
      console.error('Error creating user document:', error)
      throw error
    }
  }

  // Update user document in Firestore
  static async updateUserDocument(uid, updates) {
    try {
      const userRef = doc(db, 'users', uid)
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(userRef, updateData)
    } catch (error) {
      console.error('Error updating user document:', error)
      throw error
    }
  }

  // Update user last login time
  static async updateUserLastLogin(uid) {
    try {
      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error updating last login:', error)
    }
  }

  // Get user document from Firestore
  static async getUserDocument(uid) {
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        return userSnap.data()
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting user document:', error)
      throw error
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback)
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser
  }

  // Handle authentication errors
  static handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': '등록되지 않은 이메일입니다.',
      'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
      'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
      'auth/weak-password': '비밀번호는 최소 6자 이상이어야 합니다.',
      'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
      'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
      'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
      'auth/user-disabled': '비활성화된 계정입니다.',
      'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',
    }

    const message = errorMessages[error.code] || error.message || '알 수 없는 오류가 발생했습니다.'

    return {
      code: error.code,
      message,
      originalError: error,
    }
  }
}
