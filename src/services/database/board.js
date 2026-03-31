/**
 * Board Service
 * 게시판 관련 데이터베이스 작업
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, collections } from './constants';

export const boardService = {
  // 활성 게시판 목록 조회
  async getActiveBoards() {
    const q = query(
      collection(db, collections.boards),
      where('isActive', '==', true),
      orderBy('order', 'asc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  // 게시판 정보 조회
  async getBoard(boardId) {
    const boardDoc = await getDoc(doc(db, collections.boards, boardId));
    return boardDoc.exists() ? { id: boardDoc.id, ...boardDoc.data() } : null;
  },
};
