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
} from 'firebase/firestore'
import { db } from './firebase'
import { collections } from './database'

export class AdminService {
  /**
   * 관리자 권한 확인
   */
  static async checkAdminPermission(userId) {
    try {
      const userDoc = await getDoc(doc(db, collections.users, userId))
      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다.')
      }

      const userData = userDoc.data()
      return userData.role === 'admin'
    } catch (error) {
      console.error('관리자 권한 확인 실패:', error)
      throw error
    }
  }

  /**
   * Notice 게시판 관리
   */
  static async createNotice(adminUserId, noticeData) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId)
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      const docRef = await addDoc(collection(db, collections.posts), {
        ...noticeData,
        boardType: 'notice',
        isPinned: true, // 공지사항은 기본적으로 상단 고정
        isDeleted: false,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error('공지사항 작성 실패:', error)
      throw error
    }
  }

  static async updateNotice(adminUserId, postId, updateData) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId)
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      const postRef = doc(db, collections.posts, postId)
      await updateDoc(postRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      })

      return true
    } catch (error) {
      console.error('공지사항 수정 실패:', error)
      throw error
    }
  }

  static async deleteNotice(adminUserId, postId) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId)
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      const postRef = doc(db, collections.posts, postId)
      await updateDoc(postRef, {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      })

      return true
    } catch (error) {
      console.error('공지사항 삭제 실패:', error)
      throw error
    }
  }

  static async toggleNoticePin(adminUserId, postId, isPinned) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId)
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      const postRef = doc(db, collections.posts, postId)
      await updateDoc(postRef, {
        isPinned,
        updatedAt: serverTimestamp(),
      })

      return true
    } catch (error) {
      console.error('공지사항 고정 설정 실패:', error)
      throw error
    }
  }

  /**
   * 아이콘 상점 관리
   */
  static async getAllIcons() {
    try {
      const q = query(
        collection(db, collections.icons),
        orderBy('category', 'asc'),
        orderBy('createdAt', 'desc'),
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('아이콘 목록 조회 실패:', error)
      throw error
    }
  }

  static async createIcon(adminUserId, iconData) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId)
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      const docRef = await addDoc(collection(db, collections.icons), {
        ...iconData,
        isActive: true,
        purchaseCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminUserId,
      })

      return docRef.id
    } catch (error) {
      console.error('아이콘 생성 실패:', error)
      throw error
    }
  }

  static async updateIcon(adminUserId, iconId, updateData) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId)
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      const iconRef = doc(db, collections.icons, iconId)
      await updateDoc(iconRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId,
      })

      return true
    } catch (error) {
      console.error('아이콘 수정 실패:', error)
      throw error
    }
  }

  static async toggleIconStatus(adminUserId, iconId, isActive) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId)
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      const iconRef = doc(db, collections.icons, iconId)
      await updateDoc(iconRef, {
        isActive,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId,
      })

      return true
    } catch (error) {
      console.error('아이콘 상태 변경 실패:', error)
      throw error
    }
  }

  static async deleteIcon(adminUserId, iconId) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId)
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      const iconRef = doc(db, collections.icons, iconId)
      await deleteDoc(iconRef)

      return true
    } catch (error) {
      console.error('아이콘 삭제 실패:', error)
      throw error
    }
  }

  /**
   * 사용자 관리
   */
  static async getAllUsers(limitCount = 50) {
    try {
      const q = query(
        collection(db, collections.users),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
      throw error
    }
  }

  static async updateUserRole(adminUserId, targetUserId, newRole) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId)
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      if (!['user', 'admin'].includes(newRole)) {
        throw new Error('유효하지 않은 역할입니다.')
      }

      const userRef = doc(db, collections.users, targetUserId)
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId,
      })

      return true
    } catch (error) {
      console.error('사용자 역할 변경 실패:', error)
      throw error
    }
  }

  static async toggleUserStatus(adminUserId, targetUserId, isActive) {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.checkAdminPermission(adminUserId)
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      const userRef = doc(db, collections.users, targetUserId)
      await updateDoc(userRef, {
        isActive,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId,
      })

      return true
    } catch (error) {
      console.error('사용자 상태 변경 실패:', error)
      throw error
    }
  }

  /**
   * 통계 및 대시보드
   */
  static async getDashboardStats() {
    try {
      const stats = {
        totalUsers: 0,
        totalPosts: 0,
        totalComments: 0,
        totalIcons: 0,
        activeUsers: 0,
        recentPosts: 0,
      }

      // 병렬로 통계 데이터 수집
      const [usersSnapshot, postsSnapshot, commentsSnapshot, iconsSnapshot] = await Promise.all([
        getDocs(collection(db, collections.users)),
        getDocs(query(collection(db, collections.posts), where('isDeleted', '==', false))),
        getDocs(query(collection(db, collections.comments), where('isDeleted', '==', false))),
        getDocs(collection(db, collections.icons)),
      ])

      stats.totalUsers = usersSnapshot.size
      stats.totalPosts = postsSnapshot.size
      stats.totalComments = commentsSnapshot.size
      stats.totalIcons = iconsSnapshot.size

      // 활성 사용자 수 (최근 30일 내 로그인)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      stats.activeUsers = usersSnapshot.docs.filter((doc) => {
        const userData = doc.data()
        const lastLogin = userData.lastLoginAt?.toDate()
        return lastLogin && lastLogin > thirtyDaysAgo
      }).length

      // 최근 7일 내 게시글 수
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      stats.recentPosts = postsSnapshot.docs.filter((doc) => {
        const postData = doc.data()
        const createdAt = postData.createdAt?.toDate()
        return createdAt && createdAt > sevenDaysAgo
      }).length

      return stats
    } catch (error) {
      console.error('대시보드 통계 조회 실패:', error)
      throw error
    }
  }
}
