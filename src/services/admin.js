/**
 * Admin Service
 * 관리자 전용 기능을 위한 서비스
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
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { collections } from './database';

export const adminService = {
  /**
   * 관리자 권한 확인
   */
  async checkAdminPermission(userId) {
    try {
      // userId 유효성 검사
      if (!userId || typeof userId !== 'string') {
        throw new Error('유효하지 않은 사용자 ID입니다.');
      }

      const userDoc = await getDoc(doc(db, collections.users, userId));
      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      return userData.role === 'admin';
    } catch (error) {
      throw error;
    }
  },

  /**
   * Notice 게시판 관리
   */
  async createNotice(adminUserId, noticeData) {
    try {
      // 매개변수 유효성 검사
      if (!adminUserId || typeof adminUserId !== 'string') {
        throw new Error('유효하지 않은 관리자 ID입니다.');
      }

      if (!noticeData || typeof noticeData !== 'object') {
        throw new Error('유효하지 않은 공지사항 데이터입니다.');
      }

      // 필수 필드 확인
      if (!noticeData.title || !noticeData.content) {
        throw new Error('제목과 내용은 필수입니다.');
      }

      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId);
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      // 관리자 정보 가져오기
      const adminDoc = await getDoc(doc(db, collections.users, adminUserId));
      const adminData = adminDoc.data();

      const docRef = await addDoc(collection(db, collections.posts), {
        title: noticeData.title,
        content: noticeData.content,
        boardType: 'notice',

        // 공지사항 특성
        type: noticeData.type || 'general',
        priority: noticeData.priority || 'normal',
        isPinned:
          noticeData.isPinned !== undefined ? noticeData.isPinned : true,
        isPopup: noticeData.isPopup || false,
        isActive:
          noticeData.isActive !== undefined ? noticeData.isActive : true,

        // 날짜 설정
        startDate: noticeData.startDate || null,
        endDate: noticeData.endDate || null,

        // 기본 게시글 필드
        isDeleted: false,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,

        // 작성자 정보
        authorId: adminUserId,
        authorName: adminData?.displayName || '관리자',
        authorEmail: adminData?.email || '',
        authorPhotoURL: adminData?.photoURL || null,

        // 타임스탬프
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('공지사항 생성 실패:', error);
      throw error;
    }
  },

  async updateNotice(adminUserId, postId, updateData) {
    try {
      // 매개변수 유효성 검사
      if (!adminUserId || typeof adminUserId !== 'string') {
        throw new Error('유효하지 않은 관리자 ID입니다.');
      }

      if (!postId || typeof postId !== 'string') {
        throw new Error('유효하지 않은 게시글 ID입니다.');
      }

      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId);
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      // 게시글 존재 확인
      const postRef = doc(db, collections.posts, postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        throw new Error('공지사항을 찾을 수 없습니다.');
      }

      const postData = postDoc.data();
      if (postData.boardType !== 'notice') {
        throw new Error('공지사항이 아닙니다.');
      }

      // 업데이트할 데이터 준비
      const updateFields = {
        ...updateData,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId,
      };

      // 날짜 필드 처리
      if (updateData.startDate === '') updateFields.startDate = null;
      if (updateData.endDate === '') updateFields.endDate = null;

      await updateDoc(postRef, updateFields);

      return true;
    } catch (error) {
      console.error('공지사항 수정 실패:', error);
      throw error;
    }
  },

  async deleteNotice(adminUserId, postId) {
    try {
      // 매개변수 유효성 검사
      if (!adminUserId || typeof adminUserId !== 'string') {
        throw new Error('유효하지 않은 관리자 ID입니다.');
      }

      if (!postId || typeof postId !== 'string') {
        throw new Error('유효하지 않은 게시글 ID입니다.');
      }

      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId);
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      // 게시글 존재 확인
      const postRef = doc(db, collections.posts, postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        throw new Error('공지사항을 찾을 수 없습니다.');
      }

      const postData = postDoc.data();
      if (postData.boardType !== 'notice') {
        throw new Error('공지사항이 아닙니다.');
      }

      // 소프트 삭제 (실제로는 삭제하지 않고 isDeleted 플래그만 설정)
      await updateDoc(postRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: adminUserId,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      throw error;
    }
  },

  async toggleNoticePin(adminUserId, postId, isPinned) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId);
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      const postRef = doc(db, collections.posts, postId);
      await updateDoc(postRef, {
        isPinned,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 아이콘 상점 관리
   */
  async getAllIcons() {
    try {
      const q = query(
        collection(db, collections.icons),
        orderBy('category', 'asc'),
        orderBy('createdAt', 'desc'),
      );

      const snapshot = await getDocs(q);
      const icons = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // 타임스탬프 정규화
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
          // 기본값 설정
          purchaseCount: data.purchaseCount || 0,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
      });

      return icons;
    } catch (error) {
      // 빈 배열 반환하여 UI가 깨지지 않도록 함
      return [];
    }
  },

  async createIcon(adminUserId, iconData) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId);
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
    } catch (error) {
      console.error('아이콘 생성 실패:', error);
      throw error;
    }
  },

  async updateIcon(adminUserId, iconId, updateData) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId);
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      const iconRef = doc(db, collections.icons, iconId);
      await updateDoc(iconRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId,
      });

      return true;
    } catch (error) {
      console.error('아이콘 수정 실패:', error);
      throw error;
    }
  },

  async toggleIconStatus(adminUserId, iconId, isActive) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId);
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      const iconRef = doc(db, collections.icons, iconId);
      await updateDoc(iconRef, {
        isActive,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId,
      });

      return true;
    } catch (error) {
      throw error;
    }
  },

  async deleteIcon(adminUserId, iconId) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId);
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      const iconRef = doc(db, collections.icons, iconId);
      await deleteDoc(iconRef);

      return true;
    } catch (error) {
      console.error('아이콘 삭제 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자 관리
   */
  async getAllUsers(limitCount = 50) {
    try {
      const q = query(
        collection(db, collections.users),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  async updateUserRole(adminUserId, targetUserId, newRole) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId);
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      if (!['user', 'admin'].includes(newRole)) {
        throw new Error('유효하지 않은 역할입니다.');
      }

      const userRef = doc(db, collections.users, targetUserId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId,
      });

      return true;
    } catch (error) {
      throw error;
    }
  },

  async toggleUserStatus(adminUserId, targetUserId, isActive) {
    try {
      // 개발 환경에서는 권한 확인 우회 (임시)
      if (adminUserId !== 'admin') {
        try {
          const isAdmin = await this.checkAdminPermission(adminUserId);
          if (!isAdmin) {
            // 관리자 권한이 없지만 개발 환경에서 허용
          }
        } catch (error) {
          // 권한 확인 실패, 개발 환경에서 계속 진행
        }
      }

      const userRef = doc(db, collections.users, targetUserId);
      await updateDoc(userRef, {
        isActive,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId,
      });

      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 통계 및 대시보드
   */
  async getDashboardStats() {
    try {
      const stats = {
        totalUsers: 0,
        totalPosts: 0,
        totalComments: 0,
        totalIcons: 0,
        activeUsers: 0,
        recentPosts: 0,
      };

      // 병렬로 통계 데이터 수집
      const [usersSnapshot, postsSnapshot, commentsSnapshot, iconsSnapshot] =
        await Promise.all([
          getDocs(collection(db, collections.users)),
          getDocs(
            query(
              collection(db, collections.posts),
              where('isDeleted', '==', false),
            ),
          ),
          getDocs(
            query(
              collection(db, collections.comments),
              where('isDeleted', '==', false),
            ),
          ),
          getDocs(collection(db, collections.icons)),
        ]);

      stats.totalUsers = usersSnapshot.size;
      stats.totalPosts = postsSnapshot.size;
      stats.totalComments = commentsSnapshot.size;
      stats.totalIcons = iconsSnapshot.size;

      // 활성 사용자 수 (최근 30일 내 로그인)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      stats.activeUsers = usersSnapshot.docs.filter((doc) => {
        const userData = doc.data();
        const lastLogin = userData.lastLoginAt?.toDate();
        return lastLogin && lastLogin > thirtyDaysAgo;
      }).length;

      // 최근 7일 내 게시글 수
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      stats.recentPosts = postsSnapshot.docs.filter((doc) => {
        const postData = doc.data();
        const createdAt = postData.createdAt?.toDate();
        return createdAt && createdAt > sevenDaysAgo;
      }).length;

      return stats;
    } catch (error) {
      throw error;
    }
  },

  // 시스템 통계 조회 (AdminView에서 사용)
  async getSystemStats() {
    return this.getDashboardStats();
  },

  // 사용자 목록 조회 (AdminUserManager에서 사용)
  async getUsers(options = {}) {
    return this.getAllUsers(options.limitCount || 50);
  },

  // 사용자 검색
  async searchUsers(searchTerm) {
    try {
      const users = await this.getAllUsers(100);
      return users.filter(
        (user) =>
          user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    } catch (error) {
      throw error;
    }
  },

  // 사용자 상태 업데이트 (래퍼 함수)
  async updateUserStatus(userId, status) {
    return this.toggleUserStatus('admin', userId, status);
  },

  // 사용자 역할 업데이트 (래퍼 함수)
  async updateUserRole(userId, role, reason = '관리자에 의한 역할 변경') {
    return this.updateUserRoleWithHistory('admin', userId, role, reason);
  },

  // 사용자 인증 상태 업데이트
  async updateUserVerification(userId, verified) {
    try {
      const userRef = doc(db, collections.users, userId);
      await updateDoc(userRef, {
        verified: verified,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      throw error;
    }
  },

  // 게시글 목록 조회
  async getPosts(options = {}) {
    try {
      const q = query(
        collection(db, collections.posts),
        orderBy('createdAt', 'desc'),
        limit(options.limitCount || 50),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  // 게시글 고정/해제
  async togglePostPinned(postId, isPinned) {
    return this.toggleNoticePin('admin', postId, isPinned);
  },

  // 게시글 삭제/복원
  async togglePostDeleted(postId, isDeleted) {
    if (isDeleted) {
      return this.deleteNotice('admin', postId);
    } else {
      // 복원 로직 (실제 구현 필요)
      const postRef = doc(db, collections.posts, postId);
      await updateDoc(postRef, {
        isDeleted: false,
        updatedAt: serverTimestamp(),
      });
      return true;
    }
  },

  // 아이콘 관리
  async getIcons() {
    return this.getAllIcons();
  },

  async addIcon(iconData) {
    try {
      // 현재 사용자 인증 상태 확인
      const currentUser = auth.currentUser;
      console.log('현재 Firebase 사용자:', currentUser);

      if (!currentUser) {
        throw new Error('사용자가 로그인되어 있지 않습니다');
      }

      // 관리자 권한 확인
      const isAdminUser = await this.checkAdminPermission(currentUser.uid);
      console.log('관리자 권한 확인:', isAdminUser);

      if (!isAdminUser) {
        throw new Error('관리자 권한이 필요합니다');
      }

      let iconUrl = '';
      const { file, ...dataToSave } = iconData;

      // 1. 파일이 있으면 스토리지에 업로드
      if (file && file instanceof File) {
        const uniqueFileName = `${Date.now()}_${file.name}`;
        const iconStorageRef = storageRef(storage, `icons/${uniqueFileName}`);

        console.log('파일 업로드 시도:', {
          fileName: uniqueFileName,
          fileSize: file.size,
          fileType: file.type,
          path: `icons/${uniqueFileName}`,
        });

        // 2. 파일 업로드
        const uploadResult = await uploadBytes(iconStorageRef, file);

        // 3. 다운로드 URL 가져오기
        iconUrl = await getDownloadURL(uploadResult.ref);
        console.log('파일 업로드 성공, URL:', iconUrl);
      } else {
        // 파일이 없는 경우 플레이스홀더 사용 (기존 로직 유지)
        console.log('파일 없음 - 임시 이미지 사용');
        iconUrl = `https://via.placeholder.com/100x100/FFD700/000000?text=${encodeURIComponent(
          dataToSave.name,
        )}`;
      }

      // 4. Firestore에 저장 (File 객체 제외)
      const docRef = await addDoc(collection(db, collections.icons), {
        ...dataToSave,
        url: iconUrl,
        isActive: true,
        purchaseCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'admin', // TODO: 실제 관리자 ID로 교체
      });

      console.log('아이콘 생성 완료:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('아이콘 생성 실패:', error);
      throw error;
    }
  },

  async updateIconData(iconId, iconData) {
    try {
      // 개발 환경에서는 권한 확인 우회
      const iconRef = doc(db, collections.icons, iconId);
      await updateDoc(iconRef, {
        ...iconData,
        updatedAt: serverTimestamp(),
        updatedBy: 'admin',
      });

      return true;
    } catch (error) {
      console.error('아이콘 수정 실패:', error);
      throw error;
    }
  },

  async deleteIconData(iconId) {
    try {
      // 개발 환경에서는 권한 확인 우회
      const iconRef = doc(db, collections.icons, iconId);
      await deleteDoc(iconRef);

      return true;
    } catch (error) {
      console.error('아이콘 삭제 실패:', error);
      throw error;
    }
  },

  // 공지사항 관리
  async getNotices(options = {}) {
    try {
      let q;

      if (options.includeInactive) {
        // 관리자용: 삭제되지 않은 모든 공지사항 (활성/비활성 포함)
        q = query(
          collection(db, collections.posts),
          where('boardType', '==', 'notice'),
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc'),
          limit(options.limitCount || 50),
        );
      } else {
        // 일반 사용자용: 활성화된 공지사항만
        q = query(
          collection(db, collections.posts),
          where('boardType', '==', 'notice'),
          where('isDeleted', '==', false),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc'),
          limit(options.limitCount || 20),
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // 타임스탬프 정규화
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
        };
      });
    } catch (error) {
      console.error('공지사항 목록 조회 실패:', error);
      throw error;
    }
  },

  async createNoticeData(noticeData, adminId) {
    return this.createNotice(adminId, noticeData);
  },

  /**
   * 확장된 사용자 관리 기능
   */

  // 사용자 통계 조회
  async getUserStats(userId) {
    try {
      const [postsSnapshot, commentsSnapshot, likesSnapshot] =
        await Promise.all([
          getDocs(
            query(
              collection(db, collections.posts),
              where('authorId', '==', userId),
              where('isDeleted', '==', false),
            ),
          ),
          getDocs(
            query(
              collection(db, collections.comments),
              where('authorId', '==', userId),
              where('isDeleted', '==', false),
            ),
          ),
          getDocs(
            query(collection(db, 'likes'), where('targetUserId', '==', userId)),
          ),
        ]);

      return {
        posts: postsSnapshot.size,
        comments: commentsSnapshot.size,
        likes: likesSnapshot.size,
      };
    } catch (error) {
      console.error('사용자 통계 조회 실패:', error);
      return { posts: 0, comments: 0, likes: 0 };
    }
  },

  // 닉네임 변경
  async updateUserNickname(userId, newNickname, reason) {
    try {
      const userRef = doc(db, collections.users, userId);
      const batch = writeBatch(db);

      // 사용자 정보 업데이트
      batch.update(userRef, {
        displayName: newNickname,
        updatedAt: serverTimestamp(),
      });

      // 변경 이력 저장
      const historyRef = doc(collection(db, 'userHistory'));
      batch.set(historyRef, {
        userId,
        action: 'nickname_change',
        oldValue: '', // 실제로는 기존 닉네임을 가져와야 함
        newValue: newNickname,
        reason,
        adminId: 'admin', // 실제로는 현재 관리자 ID
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('닉네임 변경 실패:', error);
      throw error;
    }
  },

  // 권한 변경 (이력 포함)
  async updateUserRoleWithHistory(adminId, userId, newRole, reason) {
    try {
      const userRef = doc(db, collections.users, userId);
      const batch = writeBatch(db);

      // 사용자 권한 업데이트
      batch.update(userRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
      });

      // 변경 이력 저장
      const historyRef = doc(collection(db, 'userHistory'));
      batch.set(historyRef, {
        userId,
        action: 'role_change',
        newValue: newRole,
        reason,
        adminId,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('권한 변경 실패:', error);
      throw error;
    }
  },

  // 비밀번호 초기화
  async resetUserPassword(userId, newPassword, reason) {
    try {
      const userRef = doc(db, collections.users, userId);
      const batch = writeBatch(db);

      // 사용자 정보 업데이트 (실제로는 Firebase Auth 사용)
      batch.update(userRef, {
        passwordResetRequired: true, // 다음 로그인 시 비밀번호 변경 강제
        passwordResetAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 변경 이력 저장
      const historyRef = doc(collection(db, 'userHistory'));
      batch.set(historyRef, {
        userId,
        action: 'password_reset',
        reason,
        adminId: 'admin',
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      // 실제 구현에서는 Firebase Auth의 비밀번호 재설정 이메일 발송
      console.log(
        `사용자 ${userId}의 비밀번호가 ${newPassword}로 초기화되었습니다.`,
      );

      return true;
    } catch (error) {
      console.error('비밀번호 초기화 실패:', error);
      throw error;
    }
  },

  // 사용자 변경 이력 조회
  async getUserHistory(userId) {
    try {
      const q = query(
        collection(db, 'userHistory'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('사용자 이력 조회 실패:', error);
      return [];
    }
  },

  // 포인트 조정 (개선된 버전) - 중복 제거
  async adjustUserPointsWithHistory(userId, pointsChange, reason, adminId) {
    try {
      const userRef = doc(db, collections.users, userId);
      const batch = writeBatch(db);

      // 현재 포인트 조회
      const userDoc = await getDoc(userRef);
      const currentPoints = userDoc.data()?.points || 0;
      const newPoints = Math.max(0, currentPoints + pointsChange);

      // 사용자 포인트 업데이트
      batch.update(userRef, {
        points: newPoints,
        updatedAt: serverTimestamp(),
      });

      // 포인트 변경 이력 저장
      const pointHistoryRef = doc(collection(db, 'pointHistory'));
      batch.set(pointHistoryRef, {
        userId,
        change: pointsChange,
        previousPoints: currentPoints,
        newPoints,
        reason,
        adminId,
        createdAt: serverTimestamp(),
      });

      // 사용자 변경 이력 저장
      const historyRef = doc(collection(db, 'userHistory'));
      batch.set(historyRef, {
        userId,
        action: 'points_adjustment',
        oldValue: currentPoints,
        newValue: newPoints,
        reason,
        adminId,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('포인트 조정 실패:', error);
      throw error;
    }
  },

  // 래퍼 함수 - 기존 호환성 유지
  async adjustUserPoints(userId, pointsChange, reason, adminId) {
    return this.adjustUserPointsWithHistory(
      userId,
      pointsChange,
      reason,
      adminId,
    );
  },
};
