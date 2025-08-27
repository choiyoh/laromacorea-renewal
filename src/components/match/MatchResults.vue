<template>
  <v-card class="match-results-card" variant="outlined">
    <v-card-title class="match-header d-flex align-center py-2 px-4">
      <v-icon icon="mdi-trophy" color="white" class="mr-3" size="28" />
      <div class="flex-grow-1">
        <div class="text-h6 font-weight-bold text-white">Recent Match</div>
      </div>
      <v-btn
        variant="text"
        size="small"
        color="white"
        class="text-white"
        @click="refreshResults"
        :loading="loading"
      >
        <v-icon icon="mdi-refresh" />
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <div class="text-caption mt-2">경기 결과를 불러오는 중...</div>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <v-icon icon="mdi-alert-circle" color="error" size="48" class="mb-2" />
        <div class="text-body-2 text-error mb-2">{{ error }}</div>
        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          @click="refreshResults"
        >
          다시 시도
        </v-btn>
      </div>

      <v-list v-else-if="results.length > 0" class="py-0">
        <template v-for="(result, index) in results" :key="result.id">
          <v-list-item class="result-item pa-4">
            <div class="d-flex align-center w-100">
              <!-- 팀 정보 및 스코어 -->
              <div class="d-flex align-center flex-grow-1">
                <!-- 홈팀 -->
                <div class="team-section">
                  <v-img
                    v-if="result.homeTeam.crest"
                    :src="result.homeTeam.crest"
                    :alt="result.homeTeam.name"
                    width="24"
                    height="24"
                    class="mr-2"
                  />
                  <v-icon v-else icon="mdi-shield" size="24" class="mr-2" />
                  <span class="text-body-2 font-weight-medium">
                    {{ result.homeTeam.shortName || result.homeTeam.name }}
                  </span>
                </div>

                <!-- 스코어 -->
                <div class="score-section mx-4">
                  <div class="d-flex align-center">
                    <span class="text-h6 font-weight-bold score-number">
                      {{ result.score?.fullTime?.home || 0 }}
                    </span>
                    <span class="mx-2 text-body-2">-</span>
                    <span class="text-h6 font-weight-bold score-number">
                      {{ result.score?.fullTime?.away || 0 }}
                    </span>
                  </div>
                </div>

                <!-- 어웨이팀 -->
                <div class="team-section">
                  <span class="text-body-2 font-weight-medium mr-2">
                    {{ result.awayTeam.shortName || result.awayTeam.name }}
                  </span>
                  <v-img
                    v-if="result.awayTeam.crest"
                    :src="result.awayTeam.crest"
                    :alt="result.awayTeam.name"
                    width="24"
                    height="24"
                  />
                  <v-icon v-else icon="mdi-shield" size="24" />
                </div>
              </div>

              <!-- 날짜 및 리그 정보 -->
              <div class="match-info text-right">
                <div class="text-body-2">
                  {{ formatResultDate(result.utcDate) }}
                </div>
                <div class="text-caption text-primary">
                  {{ result.competition?.name }}
                </div>
              </div>
            </div>
          </v-list-item>
          <v-divider v-if="index < results.length - 1" />
        </template>
      </v-list>

      <div v-else class="text-center py-8">
        <v-icon icon="mdi-calendar-blank" size="48" color="grey" class="mb-2" />
        <div class="text-body-2 text-medium-emphasis">
          최근 경기 결과가 없습니다
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { matchService } from '@/services/match';

const loading = ref(false);
const error = ref('');
const results = ref([]);

// 경기 결과 로드
const loadResults = async () => {
  loading.value = true;
  error.value = '';

  try {
    const recentResults = await matchService.getRecentResults();
    results.value = recentResults;
  } catch (err) {
    error.value = '경기 결과를 불러올 수 없습니다';
  } finally {
    loading.value = false;
  }
};

// 경기 결과 새로고침
const refreshResults = () => {
  loadResults();
};

// 날짜 포맷팅
const formatResultDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
};

onMounted(() => {
  loadResults();
});
</script>

<style scoped>
.match-results-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  background: #ffffff;
}

.match-header {
  background: linear-gradient(180deg, #fbba00 0%, #990a2c 100%);
  border-bottom: none;
  color: white;
}

.result-item {
  transition: background-color 0.2s;
}

.result-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.team-section {
  display: flex;
  align-items: center;
  min-width: 100px;
}

.score-section {
  text-align: center;
  min-width: 60px;
}

.score-number {
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.match-info {
  min-width: 80px;
}

.text-medium-emphasis {
  opacity: 0.7;
}

@media (max-width: 600px) {
  .team-section {
    min-width: 80px;
  }

  .team-section span {
    font-size: 0.8rem;
  }

  .score-section {
    min-width: 50px;
  }

  .score-number {
    font-size: 1rem !important;
  }

  .match-info {
    min-width: 60px;
    font-size: 0.8rem;
  }
}
</style>
