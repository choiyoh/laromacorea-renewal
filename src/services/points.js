/**
 * Points Service
 * 포인트 시스템 관리를 위한 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// 포인트 지급 규칙
export const POINT_RULES = {
  POST_CREATED: 10, // 게시글 작성
  COMMENT_CREATED: 5, // 댓글 작성
  POST_LIKED: 1, // 게시글 좋아요 받음
  COMMENT_LIKED: 1, // 댓글 좋아요 받음
  DAILY_LOGIN: 2, // 일일 로그인 보너스
  ADMIN_BONUS: 0, // 관리자 지급 (가변)
};

// 포인트 변동 사유
export const POINT_REASONS = {
  POST_CREATED: 'post_created',
  COMMENT_CREATED: 'comment_created',
  POST_LIKED: 'post_liked',
  COMMENT_LIKED: 'comment_liked',
  ICON_PURCHASE: 'icon_purchase',
  DAILY_LOGIN: 'daily_login',
  ADMIN_BONUS: 'admin_bonus',
  ADMIN_PENALTY: 'admin_penalty',
  ADMIN_ADJUSTMENT: 'admin_adjustment',
};

export const pointsService = {
  /**
   * 사용자에게 포인트 지급
   * @param {string} userId - 사용자 ID
   * @param {number} points - 지급할 포인트 (양수)
   * @param {string} reason - 지급 사유
   * @param {string} relatedId - 관련 문서 ID (선택사항)
   * @param {string} adminId - 관리자 ID (관리자 지급시)
   */
  async awardPoints(userId, points, reason, relatedId = null, adminId = null) {
    if (points <= 0) {
      throw new Error('포인트는 양수여야 합니다.');
    }

    const batch = writeBatch(db);

    try {
      // 사용자 포인트 증가
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        points: increment(points),
        lastPointsUpdate: serverTimestamp(),
      });

      // 포인트 내역 추가
      const historyRef = doc(collection(db, 'points_history'));
      batch.set(historyRef, {
        userId,
        type: 'earned',
        amount: points,
        reason,
        relatedId,
        adminId,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      return true;
    } catch (error) {
      throw new Error('포인트 지급에 실패했습니다.');
    }
  },

  /**
   * 사용자 포인트 차감
   * @param {string} userId - 사용자 ID
   * @param {number} points - 차감할 포인트 (양수)
   * @param {string} reason - 차감 사유
   * @param {string} relatedId - 관련 문서 ID (선택사항)
   */
  async deductPoints(userId, points, reason, relatedId = null) {
    if (points <= 0) {
      throw new Error('포인트는 양수여야 합니다.');
    }

    // 사용자 현재 포인트 확인
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const currentPoints = userDoc.data().points || 0;
    if (currentPoints < points) {
      throw new Error('포인트가 부족합니다.');
    }

    const batch = writeBatch(db);

    try {
      // 사용자 포인트 차감
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        points: increment(-points),
        lastPointsUpdate: serverTimestamp(),
      });

      // 포인트 내역 추가
      const historyRef = doc(collection(db, 'points_history'));
      batch.set(historyRef, {
        userId,
        type: 'spent',
        amount: -points,
        reason,
        relatedId,
        adminId: null,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      return true;
    } catch (error) {
      throw new Error('포인트 차감에 실패했습니다.');
    }
  },

  /**
   * 관리자 포인트 조정
   * @param {string} userId - 대상 사용자 ID
   * @param {number} points - 조정할 포인트 (양수: 지급, 음수: 차감)
   * @param {string} adminId - 관리자 ID
   * @param {string} note - 조정 사유 메모
   */
  async adminAdjustPoints(userId, points, adminId, note = '') {
    if (points === 0) {
      throw new Error('조정할 포인트가 0입니다.');
    }

    // 포인트 차감시 잔액 확인
    if (points < 0) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const currentPoints = userDoc.data().points || 0;
      if (currentPoints < Math.abs(points)) {
        throw new Error('사용자의 포인트가 부족합니다.');
      }
    }

    const batch = writeBatch(db);

    try {
      // 사용자 포인트 조정
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        points: increment(points),
        lastPointsUpdate: serverTimestamp(),
      });

      // 포인트 내역 추가
      const historyRef = doc(collection(db, 'points_history'));
      batch.set(historyRef, {
        userId,
        type: 'admin_adjustment',
        amount: points,
        reason:
          points > 0 ? POINT_REASONS.ADMIN_BONUS : POINT_REASONS.ADMIN_PENALTY,
        note,
        adminId,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      return true;
    } catch (error) {
      throw new Error('포인트 조정에 실패했습니다.');
    }
  },

  /**
   * 사용자 포인트 내역 조회
   * @param {string} userId - 사용자 ID
   * @param {number} limitCount - 조회할 개수 (기본 50개)
   */
  async getPointsHistory(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, 'points_history'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      throw new Error('포인트 내역을 불러올 수 없습니다.');
    }
  },

  /**
   * 전체 포인트 내역 조회 (관리자용)
   * @param {number} limitCount - 조회할 개수 (기본 100개)
   */
  async getAllPointsHistory(limitCount = 100) {
    try {
      const q = query(
        collection(db, 'points_history'),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      throw new Error('포인트 내역을 불러올 수 없습니다.');
    }
  },

  /**
   * 사용자 현재 포인트 조회
   * @param {string} userId - 사용자 ID
   */
  async getUserPoints(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      return userDoc.data().points || 0;
    } catch (error) {
      throw new Error('포인트 정보를 불러올 수 없습니다.');
    }
  },

  /**
   * 포인트 통계 조회 (관리자용)
   */
  async getPointsStatistics() {
    try {
      // 전체 포인트 내역 조회
      const historySnapshot = await getDocs(collection(db, 'points_history'));
      const history = historySnapshot.docs.map((doc) => doc.data());

      // 통계 계산
      const totalEarned = history
        .filter((h) => h.type === 'earned')
        .reduce((sum, h) => sum + h.amount, 0);

      const totalSpent = history
        .filter((h) => h.type === 'spent')
        .reduce((sum, h) => sum + Math.abs(h.amount), 0);

      const totalAdjustments = history
        .filter((h) => h.type === 'admin_adjustment')
        .reduce((sum, h) => sum + h.amount, 0);

      // 사유별 통계
      const reasonStats = {};
      history.forEach((h) => {
        if (!reasonStats[h.reason]) {
          reasonStats[h.reason] = { count: 0, total: 0 };
        }
        reasonStats[h.reason].count++;
        reasonStats[h.reason].total += h.amount;
      });

      return {
        totalEarned,
        totalSpent,
        totalAdjustments,
        netPoints: totalEarned - totalSpent + totalAdjustments,
        reasonStats,
        totalTransactions: history.length,
      };
    } catch (error) {
      throw new Error('포인트 통계를 불러올 수 없습니다.');
    }
  },

  /**
   * 포인트 지급 규칙에 따른 자동 포인트 지급
   * @param {string} userId - 사용자 ID
   * @param {string} action - 액션 타입
   * @param {string} relatedId - 관련 문서 ID
   */
  async autoAwardPoints(userId, action, relatedId = null) {
    const pointsToAward = POINT_RULES[action];
    if (!pointsToAward || pointsToAward <= 0) {
      return false;
    }

    const reason = POINT_REASONS[action];
    if (!reason) {
      return false;
    }

    try {
      await this.awardPoints(userId, pointsToAward, reason, relatedId);
      return true;
    } catch (error) {
      return false;
    }
  },
};
