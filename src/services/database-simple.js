/**
 * 간단한 데이터베이스 서비스 (인덱스 생성 대기 중)
 * Firestore 인덱스가 생성되는 동안 사용할 임시 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const collections = {
  posts: 'posts',
  comments: 'comments',
  users: 'users',
  boards: 'boards',
  points_history: 'points_history',
  icons: 'icons',
};

export const postService = {
  // 간단한 게시글 목록 조회 (인덱스 없이)
  async getPosts(boardType, options = {}) {
    try {
      const { limitCount = 20 } = options;

      let q;
      if (boardType) {
        // 특정 게시판의 게시글만 조회
        q = query(
          collection(db, collections.posts),
          where('boardType', '==', boardType),
          orderBy('createdAt', 'desc'),
          limit(limitCount),
        );
      } else {
        // 모든 게시글 조회
        q = query(
          collection(db, collections.posts),
          orderBy('createdAt', 'desc'),
          limit(limitCount),
        );
      }

      const snapshot = await getDocs(q);
      const posts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((post) => !post.isDeleted); // 클라이언트 사이드에서 삭제된 게시글 필터링

      return posts;
    } catch (error) {
      // Error fetching posts
      throw error;
    }
  },

  // 게시글 검색 (간단한 버전)
  async searchPosts(searchQuery, options = {}) {
    try {
      const { boardType = null, limitCount = 20 } = options;

      let q;
      if (boardType) {
        q = query(
          collection(db, collections.posts),
          where('boardType', '==', boardType),
          orderBy('createdAt', 'desc'),
          limit(limitCount * 2), // 검색 필터링을 위해 더 많이 가져옴
        );
      } else {
        q = query(
          collection(db, collections.posts),
          orderBy('createdAt', 'desc'),
          limit(limitCount * 2),
        );
      }

      const snapshot = await getDocs(q);
      const query = searchQuery.toLowerCase();

      const posts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((post) => !post.isDeleted) // 삭제된 게시글 제외
        .filter(
          (post) =>
            post.title.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query) ||
            (post.authorName &&
              post.authorName.toLowerCase().includes(query)) ||
            (post.tags &&
              post.tags.some((tag) => tag.toLowerCase().includes(query))),
        )
        .slice(0, limitCount);

      return posts;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  },

  // 게시글 상세 조회
  async getPost(postId) {
    try {
      const postDoc = await getDoc(doc(db, collections.posts, postId));
      if (!postDoc.exists()) return null;

      const postData = { id: postDoc.id, ...postDoc.data() };

      // 삭제된 게시글은 반환하지 않음
      if (postData.isDeleted) return null;

      // 조회수 증가
      await updateDoc(doc(db, collections.posts, postId), {
        viewCount: increment(1),
      });

      return postData;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // 게시글 생성
  async createPost(postData) {
    try {
      const newPost = {
        ...postData,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        isPinned: false,
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, collections.posts), newPost);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // 게시글 수정
  async updatePost(postId, updateData) {
    try {
      const updatedData = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, collections.posts, postId), updatedData);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // 게시글 삭제 (소프트 삭제)
  async deletePost(postId) {
    try {
      await updateDoc(doc(db, collections.posts, postId), {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },
};

export default {
  postService,
};
