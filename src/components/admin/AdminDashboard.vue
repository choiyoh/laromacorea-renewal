<template>
  <div>
    <!-- 통계 카드 -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="40" color="primary" class="mb-2"
              >mdi-account-group</v-icon
            >
            <div class="text-h4 font-weight-bold">
              {{ stats.totalUsers.toLocaleString() }}
            </div>
            <div class="text-body-2 text-grey">총 사용자</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="40" color="success" class="mb-2"
              >mdi-file-document</v-icon
            >
            <div class="text-h4 font-weight-bold">
              {{ stats.totalPosts.toLocaleString() }}
            </div>
            <div class="text-body-2 text-grey">총 게시글</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="40" color="info" class="mb-2">mdi-comment</v-icon>
            <div class="text-h4 font-weight-bold">
              {{ stats.totalComments.toLocaleString() }}
            </div>
            <div class="text-body-2 text-grey">총 댓글</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="40" color="warning" class="mb-2">mdi-emoticon</v-icon>
            <div class="text-h4 font-weight-bold">
              {{ stats.totalIcons.toLocaleString() }}
            </div>
            <div class="text-body-2 text-grey">총 아이콘</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 활동 통계 -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2">mdi-chart-line</v-icon>
            활동 통계
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h5 text-success">
                    {{ stats.activeUsers.toLocaleString() }}
                  </div>
                  <div class="text-caption">활성 사용자 (30일)</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h5 text-primary">
                    {{ stats.recentPosts.toLocaleString() }}
                  </div>
                  <div class="text-caption">최근 게시글 (7일)</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2">mdi-refresh</v-icon>
            통계 새로고침
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-3">마지막 업데이트: {{ lastUpdated }}</p>
            <v-btn
              color="primary"
              :loading="loading"
              @click="loadStats"
              block
              class="mb-2"
            >
              <v-icon start>mdi-refresh</v-icon>
              캐시된 통계 새로고침
            </v-btn>
            <v-btn
              color="warning"
              :loading="loading"
              @click="updateRealTimeStats"
              block
            >
              <v-icon start>mdi-database-refresh</v-icon>
              실시간 통계 업데이트
            </v-btn>
            <p class="text-caption mt-2 text-medium-emphasis">
              * 실시간 업데이트는 Firestore 읽기 사용량이 증가합니다
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 빠른 작업 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2">mdi-lightning-bolt</v-icon>
            빠른 작업
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-btn
                  color="primary"
                  variant="outlined"
                  block
                  @click="$emit('change-tab', 'notices')"
                >
                  <v-icon start>mdi-bullhorn</v-icon>
                  공지사항 작성
                </v-btn>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn
                  color="success"
                  variant="outlined"
                  block
                  @click="$emit('change-tab', 'icons')"
                >
                  <v-icon start>mdi-emoticon</v-icon>
                  아이콘 추가
                </v-btn>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn
                  color="warning"
                  variant="outlined"
                  block
                  @click="$emit('change-tab', 'points')"
                >
                  <v-icon start>mdi-coin</v-icon>
                  포인트 관리
                </v-btn>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn
                  color="info"
                  variant="outlined"
                  block
                  @click="$emit('change-tab', 'users')"
                >
                  <v-icon start>mdi-account-cog</v-icon>
                  사용자 관리
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 스낵바 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { adminService } from '@/services/admin';
import { statsService } from '@/services/stats';

// 이벤트 정의
const emit = defineEmits(['change-tab']);

// 상태
const loading = ref(false);
const lastUpdated = ref('');

// 통계 데이터
const stats = reactive({
  totalUsers: 0,
  totalPosts: 0,
  totalComments: 0,
  totalIcons: 0,
  activeUsers: 0,
  recentPosts: 0,
});

// 스낵바
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
});

// 통계 로드 (캐싱된 데이터 사용)
const loadStats = async () => {
  loading.value = true;
  try {
    const dashboardStats = await adminService.getDashboardStats();

    Object.assign(stats, dashboardStats);

    lastUpdated.value = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    showSnackbar('통계가 업데이트되었습니다.', 'success');
  } catch (_error) {
    console.error('통계 로드 실패:', _error);
    showSnackbar('통계를 불러올 수 없습니다.', 'error');
  } finally {
    loading.value = false;
  }
};

// 실시간 통계 업데이트 (Firestore에서 직접 조회)
const updateRealTimeStats = async () => {
  loading.value = true;
  try {
    const realTimeStats = await statsService.updateRealTimeStats();

    // 관리자 대시보드 통계도 업데이트
    stats.totalUsers = realTimeStats.users;
    stats.totalPosts = realTimeStats.posts;
    stats.totalComments = realTimeStats.comments;

    lastUpdated.value = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    showSnackbar('실시간 통계가 업데이트되었습니다.', 'success');
  } catch (error) {
    console.error('실시간 통계 업데이트 실패:', error);
    showSnackbar('실시간 통계 업데이트에 실패했습니다.', 'error');
  } finally {
    loading.value = false;
  }
};

// 유틸리티 함수
const showSnackbar = (message, color = 'success') => {
  snackbar.message = message;
  snackbar.color = color;
  snackbar.show = true;
};

// 컴포넌트 마운트 시 통계 로드하지 않음 - 관리자가 수동으로만 업데이트하도록 변경
// onMounted(() => {
//   loadStats();
// });
</script>

<style scoped>
.v-card {
  height: 100%;
}
</style>
