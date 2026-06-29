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
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export class AuthService {
  // Sign in with username or email and password
  static async signIn(usernameOrEmail, password) {
    try {
      let email = usernameOrEmail;

      // 이메일 형식이 아닌 경우 아이디로 간주하고 사용자 찾기
      if (!usernameOrEmail.includes('@')) {
        const userInfo = await this.getUserByUsername(usernameOrEmail);
        if (!userInfo) {
          throw new Error('존재하지 않는 아이디입니다.');
        }
        email = userInfo.email;
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // 사용자 문서에서 계정 상태 확인
      if (userCredential.user) {
        const userDoc = await this.getUserDocument(userCredential.user.uid);

        // 계정이 비활성화된 경우 로그인 차단
        if (userDoc && userDoc.isActive === false) {
          // Firebase Auth에서 로그아웃
          await signOut(auth);
          throw new Error('운영자에 의해 제재된 멤버입니다');
        }

        await this.updateUserLastLogin(userCredential.user.uid);
      }

      return userCredential.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get user by username
  static async getUserByUsername(username) {
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '==', username),
        limit(1),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  // Check username availability
  static async checkUsernameAvailability(username) {
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '==', username),
        limit(1),
      );
      const snapshot = await getDocs(q);
      return snapshot.empty;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  // Check display name availability
  static async checkDisplayNameAvailability(displayName) {
    try {
      const q = query(
        collection(db, 'users'),
        where('displayName', '==', displayName),
        limit(1),
      );
      const snapshot = await getDocs(q);
      return snapshot.empty;
    } catch (error) {
      console.error('Error checking display name availability:', error);
      return false;
    }
  }

  // Check email availability
  static async checkEmailAvailability(email) {
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', email),
        limit(1),
      );
      const snapshot = await getDocs(q);
      return snapshot.empty;
    } catch (error) {
      console.error('Error checking email availability:', error);
      return false;
    }
  }

  // Create new user account with username
  static async signUp(email, password, displayName, username) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Update user profile if displayName provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create user document in Firestore with username and email
      await this.createUserDocument(user, displayName, username, email);

      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Sign out current user
  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Send password reset email
  static async resetPassword(email) {
    try {
      // Firestore에서 실제 이메일로 사용자 확인
      const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        throw { code: 'auth/user-not-found' };
      }
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Update user password
  static async updateUserPassword(newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      await updatePassword(user, newPassword);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Update user profile
  static async updateUserProfile(updates) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      // Update Firestore user document
      await this.updateUserDocument(user.uid, updates);

      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Create user document in Firestore
  static async createUserDocument(
    user,
    displayName = null,
    username = null,
    email = null,
  ) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userData = {
        uid: user.uid,
        email: email || user.email, // 실제 이메일 저장
        username: username || null, // 아이디
        displayName:
          displayName || user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        selectedIcon: null,
        points: 100, // Initial points for new users
        role: 'user',
        verified: false, // 기본적으로 비인증 회원으로 시작
        authMethod: username ? 'username' : 'email', // 인증 방식
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isActive: true,
        emailVerified: username ? true : user.emailVerified, // 아이디 기반은 이메일 인증 생략
      };

      await setDoc(userRef, userData);
      return userData;
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  // Update user document in Firestore
  static async updateUserDocument(uid, updates) {
    try {
      const userRef = doc(db, 'users', uid);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating user document:', error);
      throw error;
    }
  }

  // Update user last login time
  static async updateUserLastLogin(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Get user document from Firestore
  static async getUserDocument(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user document:', error);
      throw error;
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Handle authentication errors
  static handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': '등록되지 않은 이메일입니다.',
      'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
      'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
      'auth/weak-password': '비밀번호는 최소 6자 이상이어야 합니다.',
      'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
      'auth/too-many-requests':
        '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
      'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
      'auth/user-disabled': '비활성화된 계정입니다.',
      'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',
    };

    const message =
      errorMessages[error.code] ||
      error.message ||
      '알 수 없는 오류가 발생했습니다.';

    return {
      code: error.code,
      message,
      originalError: error,
    };
  }
}
