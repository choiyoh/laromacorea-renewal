<template>
  <div class="data-manager-container">
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-database-cog" class="mr-2" />
        데이터 관리 도구
      </v-card-title>

      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4">
          <strong>주의:</strong> 이 도구들은 데이터베이스를 직접 수정합니다.
          실행 전에 반드시 백업을 확인하세요.
        </v-alert>

        <!-- 댓글 수 동기화 -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-h6">
            <v-icon icon="mdi-comment-sync" class="mr-2" />
            댓글 수 동기화
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-3">
              모든 게시글의 댓글 수를 실제 댓글 수와 동기화합니다.
            </p>
            <v-btn
              color="primary"
              :loading="syncingComments"
              @click="syncCommentCounts"
            >
              <v-icon icon="mdi-sync" class="mr-2" />
              댓글 수 동기화 실행
            </v-btn>
            <div v-if="syncResult" class="mt-3">
              <v-alert type="success" variant="tonal">
                {{ syncResult.synced }}개 게시글의 댓글 수가 동기화되었습니다.
                (총 {{ syncResult.total }}개 중)
              </v-alert>
            </div>
          </v-card-text>
        </v-card>

        <!-- 테스트 게시글 정리 -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-h6">
            <v-icon icon="mdi-delete-sweep" class="mr-2" />
            테스트 게시글 정리
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-3">
              임시로 생성된 테스트 게시글들을 삭제합니다. (제목이나 작성자에
              '테스트', '임시', '로마팬123' 등이 포함된 게시글)
            </p>
            <v-btn
              color="error"
              :loading="cleaningPosts"
              @click="cleanupTestPosts"
            >
              <v-icon icon="mdi-delete" class="mr-2" />
              테스트 게시글 삭제
            </v-btn>
            <div v-if="cleanupResult !== null" class="mt-3">
              <v-alert type="success" variant="tonal">
                {{ cleanupResult }}개의 테스트 게시글이 삭제되었습니다.
              </v-alert>
            </div>
          </v-card-text>
        </v-card>

        <!-- 게시글 정보 수정 -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-h6">
            <v-icon icon="mdi-account-edit" class="mr-2" />
            게시글 정보 수정
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-3">
              게시글의 작성자 정보와 기본 필드들을 정리합니다. (조회수, 좋아요
              수, 댓글 수 초기화 및 작성자명 정리)
            </p>
            <v-btn
              color="warning"
              :loading="fixingPosts"
              @click="fixPostAuthorInfo"
            >
              <v-icon icon="mdi-wrench" class="mr-2" />
              게시글 정보 수정
            </v-btn>
            <div v-if="fixResult !== null" class="mt-3">
              <v-alert type="success" variant="tonal">
                {{ fixResult }}개 게시글의 정보가 수정되었습니다.
              </v-alert>
            </div>
          </v-card-text>
        </v-card>

        <!-- 전체 정리 실행 -->
        <v-card variant="outlined">
          <v-card-title class="text-h6">
            <v-icon icon="mdi-auto-fix" class="mr-2" />
            전체 데이터 정리
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-3">
              위의 모든 정리 작업을 순서대로 실행합니다.
            </p>
            <v-btn
              color="success"
              :loading="runningFullCleanup"
              @click="runFullCleanup"
            >
              <v-icon icon="mdi-magic-staff" class="mr-2" />
              전체 정리 실행
            </v-btn>
            <div v-if="fullCleanupResult" class="mt-3">
              <v-alert type="success" variant="tonal">
                <div>전체 정리 완료:</div>
                <ul class="mt-2">
                  <li>테스트 게시글 {{ fullCleanupResult.cleanup }}개 삭제</li>
                  <li>게시글 정보 {{ fullCleanupResult.fix }}개 수정</li>
                  <li>댓글 수 {{ fullCleanupResult.sync.synced }}개 동기화</li>
                </ul>
              </v-alert>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { adminService } from '@/services/database';

// State
const syncingComments = ref(false);
const cleaningPosts = ref(false);
const fixingPosts = ref(false);
const runningFullCleanup = ref(false);

const syncResult = ref(null);
const cleanupResult = ref(null);
const fixResult = ref(null);
const fullCleanupResult = ref(null);

// Methods
async function syncCommentCounts() {
  syncingComments.value = true;
  syncResult.value = null;

  try {
    const result = await adminService.syncAllPostCommentCounts();
    syncResult.value = result;
  } catch (error) {
    alert('댓글 수 동기화 중 오류가 발생했습니다.');
  } finally {
    syncingComments.value = false;
  }
}

async function cleanupTestPosts() {
  if (
    !confirm(
      '정말로 테스트 게시글들을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    )
  ) {
    return;
  }

  cleaningPosts.value = true;
  cleanupResult.value = null;

  try {
    const result = await adminService.cleanupTestPosts();
    cleanupResult.value = result;
  } catch (error) {
    alert('테스트 게시글 정리 중 오류가 발생했습니다.');
  } finally {
    cleaningPosts.value = false;
  }
}

async function fixPostAuthorInfo() {
  fixingPosts.value = true;
  fixResult.value = null;

  try {
    const result = await adminService.fixPostAuthorInfo();
    fixResult.value = result;
  } catch (error) {
    alert('게시글 정보 수정 중 오류가 발생했습니다.');
  } finally {
    fixingPosts.value = false;
  }
}

async function runFullCleanup() {
  if (
    !confirm(
      '전체 데이터 정리를 실행하시겠습니까? 이 작업은 시간이 오래 걸릴 수 있습니다.',
    )
  ) {
    return;
  }

  runningFullCleanup.value = true;
  fullCleanupResult.value = null;

  try {
    // 1. 테스트 게시글 정리
    const cleanup = await adminService.cleanupTestPosts();

    // 2. 게시글 정보 수정
    const fix = await adminService.fixPostAuthorInfo();

    // 3. 댓글 수 동기화
    const sync = await adminService.syncAllPostCommentCounts();

    fullCleanupResult.value = {
      cleanup,
      fix,
      sync,
    };
  } catch (error) {
    alert('전체 정리 중 오류가 발생했습니다.');
  } finally {
    runningFullCleanup.value = false;
  }
}
</script>

<style scoped>
.data-manager-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
