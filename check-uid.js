// 현재 사용자 UID 확인 스크립트
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDhKGKJOhJJJJJJJJJJJJJJJJJJJJJJJJJ', // 실제 config로 교체 필요
  authDomain: 'laromacorea-renewal.firebaseapp.com',
  projectId: 'laromacorea-renewal',
  storageBucket: 'laromacorea-renewal.firebasestorage.app',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdefghijklmnop',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 현재 사용자 확인
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log('Current User UID:', user.uid);
    console.log('Email:', user.email);

    // Firestore에서 사용자 문서 확인
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      console.log('User Document:', userDoc.data());
      console.log('Current Role:', userDoc.data().role);
    } else {
      console.log('User document does not exist');
    }
  } else {
    console.log('No user logged in');
  }
});
