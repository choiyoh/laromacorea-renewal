<template>
  <v-container class="admin-view">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2">mdi-shield-account</v-icon>
            관리자 패널
          </v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-4">
              AS 로마 한국 팬 커뮤니티 관리자 전용 페이지입니다.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-tabs v-model="activeTab" color="primary">
          <v-tab value="dashboard">대시보드</v-tab>
          <v-tab value="notices">공지사항</v-tab>
          <v-tab value="icons">아이콘 상점</v-tab>
          <v-tab value="points">포인트 관리</v-tab>
          <v-tab value="users">사용자 관리</v-tab>
          <v-tab value="data">데이터 관리</v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab" class="mt-4">
          <!-- 대시보드 탭 -->
          <v-tabs-window-item value="dashboard">
            <AdminDashboard @change-tab="activeTab = $event" />
          </v-tabs-window-item>

          <!-- 공지사항 관리 탭 -->
          <v-tabs-window-item value="notices">
            <AdminNoticeManager />
          </v-tabs-window-item>

          <!-- 아이콘 상점 관리 탭 -->
          <v-tabs-window-item value="icons">
            <AdminIconManager />
          </v-tabs-window-item>

          <!-- 포인트 관리 탭 -->
          <v-tabs-window-item value="points">
            <AdminPointsManager />
          </v-tabs-window-item>

          <!-- 사용자 관리 탭 -->
          <v-tabs-window-item value="users">
            <AdminUserManager @user-updated="handleUserUpdated" />
          </v-tabs-window-item>

          <!-- 데이터 관리 탭 -->
          <v-tabs-window-item value="data">
            <AdminDataManager />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import AdminDashboard from '@/components/admin/AdminDashboard.vue';
import AdminNoticeManager from '@/components/admin/AdminNoticeManager.vue';
import AdminIconManager from '@/components/admin/AdminIconManager.vue';
import AdminPointsManager from '@/components/admin/AdminPointsManager.vue';
import AdminUserManager from '@/components/admin/AdminUserManager.vue';
import AdminDataManager from '@/components/admin/AdminDataManager.vue';

// 활성 탭
const activeTab = ref('dashboard');

// 사용자 업데이트 핸들러
const handleUserUpdated = () => {
  // 사용자 정보가 업데이트되었습니다.
};
</script>

<style scoped>
.admin-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
