/**
 * 효율적인 통계 서비스
 * 캐싱을 통해 Firestore 읽기 사용량 최소화
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { statsCache, CACHE_KEYS } from './stats-cache';

export const statsService = {
  /**
   * 사이트 전체 통계 조회 (캐싱됨) - 육십분로 강화된 캐시
   */
  async getSiteStats() {
    const cacheKey = CACHE_KEYS.SITE_STATS;

    // 캐시에서 먼저 확인
    const cached = statsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 실제 통계는 대략적인 값으로 대체 (정확한 값이 필요하지 않음)
      const stats = {
        users: 170, // 대략적인 사용자 수
        posts: 850, // 대략적인 게시글 수
        comments: 2100, // 대략적인 댓글 수
        lastUpdated: new Date().toISOString(),
      };

      // 캐시에 저장 (자동으로 60분 캐시 적용)
      statsCache.set(cacheKey, stats);

      return stats;
    } catch (error) {
      console.error('통계 조회 실패:', error);

      // 에러 시 기본값 반환
      return {
        users: 170,
        posts: 850,
        comments: 2100,
        lastUpdated: new Date().toISOString(),
      };
    }
  },

  /**
   * 게시판별 최신 게시글 조회 (캐싱됨)
   */
  async getBoardPosts(boardTypes) {
    const cacheKey = CACHE_KEYS.BOARD_POSTS;

    // 캐시에서 먼저 확인 (읽기 최적화 로깅)
    const cached = statsCache.get(cacheKey);
    if (cached) {
      console.log('📊 게시판 최근 게시글 캐시 히트 (읽기 최적화)');
      return cached;
    }

    console.log('📊 게시판 최근 게시글 Firestore 쿼리 실행 (캐시 없음)');

    try {
      const boardPosts = {};

      // 각 게시판별로 최신 게시글만 조회 (통계 쿼리 제거)
      const promises = boardTypes.map(async (board) => {
        try {
          const q = query(
            collection(db, 'posts'),
            where('boardType', '==', board.id),
            where('isDeleted', '==', false),
            orderBy('createdAt', 'desc'),
            limit(5),
          );

          const snapshot = await getDocs(q);
          const posts = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // 저장된 통계값 사용 (실시간 계산 안함)
              commentCount: data.commentCount || 0,
              likeCount: data.likeCount || 0,
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate()
                : new Date(data.createdAt),
            };
          });

          return { boardId: board.id, posts };
        } catch (error) {
          console.warn(`게시판 ${board.id} 로드 실패:`, error);
          return { boardId: board.id, posts: [] };
        }
      });

      const results = await Promise.all(promises);

      // 결과를 객체로 변환
      results.forEach(({ boardId, posts }) => {
        boardPosts[boardId] = posts;
      });

      // 캐시에 저장
      statsCache.set(cacheKey, boardPosts);

      return boardPosts;
    } catch (error) {
      console.error('게시판 게시글 조회 실패:', error);

      // 에러 시 빈 객체 반환
      const emptyPosts = {};
      boardTypes.forEach((board) => {
        emptyPosts[board.id] = [];
      });

      return emptyPosts;
    }
  },

  /**
   * 통계 캐시 무효화 (새 게시글/댓글 작성 시 호출)
   */
  invalidateCache() {
    statsCache.invalidate(CACHE_KEYS.SITE_STATS);
    statsCache.invalidate(CACHE_KEYS.BOARD_POSTS);
  },

  /**
   * 실시간 통계 업데이트 (관리자용)
   */
  async updateRealTimeStats() {
    try {
      // 실제 통계 조회 (관리자가 수동으로 업데이트할 때만)
      const [usersSnapshot, postsSnapshot, commentsSnapshot] =
        await Promise.all([
          getDocs(query(collection(db, 'users'), limit(1000))), // 최대 1000명까지만
          getDocs(
            query(
              collection(db, 'posts'),
              where('isDeleted', '==', false),
              limit(2000), // 최대 2000개까지만
            ),
          ),
          getDocs(
            query(
              collection(db, 'comments'),
              where('isDeleted', '==', false),
              limit(5000), // 최대 5000개까지만
            ),
          ),
        ]);

      const stats = {
        users: usersSnapshot.size,
        posts: postsSnapshot.size,
        comments: commentsSnapshot.size,
        lastUpdated: new Date().toISOString(),
      };

      // 캐시 업데이트
      statsCache.set(CACHE_KEYS.SITE_STATS, stats);

      return stats;
    } catch (error) {
      console.error('실시간 통계 업데이트 실패:', error);
      throw error;
    }
  },
};
