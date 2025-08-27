// 관리자 도구 - 브라우저 콘솔에서 실행 가능한 함수들
import { adminService } from '@/services/database';

// 전역 객체에 관리자 도구 추가
if (typeof window !== 'undefined') {
  window.adminTools = {
    // 댓글 수 동기화
    async syncCommentCounts() {
      console.log('🔄 댓글 수 동기화를 시작합니다...');
      try {
        const result = await adminService.syncAllPostCommentCounts();
        console.log(
          `✅ 완료: ${result.synced}개 게시글의 댓글 수가 동기화되었습니다. (총 ${result.total}개 중)`,
        );
        return result;
      } catch (error) {
        console.error('❌ 댓글 수 동기화 실패:', error);
        throw error;
      }
    },

    // 테스트 게시글 정리
    async cleanupTestPosts() {
      console.log('🧹 테스트 게시글 정리를 시작합니다...');
      try {
        const result = await adminService.cleanupTestPosts();
        console.log(`✅ 완료: ${result}개의 테스트 게시글이 삭제되었습니다.`);
        return result;
      } catch (error) {
        console.error('❌ 테스트 게시글 정리 실패:', error);
        throw error;
      }
    },

    // 게시글 정보 수정
    async fixPostAuthorInfo() {
      console.log('🔧 게시글 정보 수정을 시작합니다...');
      try {
        const result = await adminService.fixPostAuthorInfo();
        console.log(`✅ 완료: ${result}개 게시글의 정보가 수정되었습니다.`);
        return result;
      } catch (error) {
        console.error('❌ 게시글 정보 수정 실패:', error);
        throw error;
      }
    },

    // 전체 정리 실행
    async runFullCleanup() {
      console.log('🚀 전체 데이터 정리를 시작합니다...');
      try {
        console.log('1️⃣ 테스트 게시글 정리 중...');
        const cleanup = await adminService.cleanupTestPosts();
        console.log(`   ✅ ${cleanup}개 테스트 게시글 삭제 완료`);

        console.log('2️⃣ 게시글 정보 수정 중...');
        const fix = await adminService.fixPostAuthorInfo();
        console.log(`   ✅ ${fix}개 게시글 정보 수정 완료`);

        console.log('3️⃣ 댓글 수 동기화 중...');
        const sync = await adminService.syncAllPostCommentCounts();
        console.log(`   ✅ ${sync.synced}개 게시글 댓글 수 동기화 완료`);

        const result = { cleanup, fix, sync };
        console.log('🎉 전체 정리 완료!', result);
        return result;
      } catch (error) {
        console.error('❌ 전체 정리 실패:', error);
        throw error;
      }
    },

    // 도움말
    help() {
      console.log(`
🛠️  관리자 도구 사용법:

1. 댓글 수 동기화:
   adminTools.syncCommentCounts()

2. 테스트 게시글 정리:
   adminTools.cleanupTestPosts()

3. 게시글 정보 수정:
   adminTools.fixPostAuthorInfo()

4. 전체 정리 실행:
   adminTools.runFullCleanup()

5. 도움말 보기:
   adminTools.help()

⚠️  주의: 이 도구들은 데이터베이스를 직접 수정합니다.
   실행 전에 반드시 백업을 확인하세요.
      `);
    },
  };
}

export default {
  syncCommentCounts: () => adminService.syncAllPostCommentCounts(),
  cleanupTestPosts: () => adminService.cleanupTestPosts(),
  fixPostAuthorInfo: () => adminService.fixPostAuthorInfo(),
  runFullCleanup: async () => {
    const cleanup = await adminService.cleanupTestPosts();
    const fix = await adminService.fixPostAuthorInfo();
    const sync = await adminService.syncAllPostCommentCounts();
    return { cleanup, fix, sync };
  },
};
