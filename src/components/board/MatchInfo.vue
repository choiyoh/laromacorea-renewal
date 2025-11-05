<template>
  <v-card class="match-info" variant="outlined">
    <v-card-text class="pa-4">
      <!-- 경기 헤더 -->
      <div class="match-header mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <v-chip
            :color="getMatchStatusColor(matchData.status)"
            size="small"
            variant="flat"
          >
            {{ getMatchStatusText(matchData.status) }}
          </v-chip>
          <div class="text-caption text-grey">
            {{ formatMatchDate(matchData.date) }}
          </div>
        </div>

        <div class="text-subtitle-2 text-grey mb-2">
          {{ matchData.competition.name }} - {{ matchData.round }}
        </div>
      </div>

      <!-- 팀 정보 및 스코어 -->
      <div class="match-teams">
        <v-row align="center" no-gutters>
          <!-- 홈팀 -->
          <v-col cols="4" class="text-center">
            <div class="team-info">
              <v-avatar size="48" class="mb-2">
                <v-img
                  :src="matchData.homeTeam.logo"
                  :alt="matchData.homeTeam.name"
                />
              </v-avatar>
              <div class="text-subtitle-2 font-weight-bold">
                {{ matchData.homeTeam.name }}
              </div>
            </div>
          </v-col>

          <!-- 스코어 -->
          <v-col cols="4" class="text-center">
            <div class="match-score">
              <div
                v-if="
                  matchData.status === 'finished' || matchData.status === 'live'
                "
                class="score-display"
              >
                <span class="text-h4 font-weight-bold">
                  {{ matchData.score.home }} - {{ matchData.score.away }}
                </span>
                <div v-if="matchData.status === 'live'" class="live-indicator">
                  <v-chip color="error" size="x-small" variant="flat">
                    <v-icon icon="mdi-circle" size="8" class="me-1" />
                    LIVE
                  </v-chip>
                </div>
              </div>
              <div v-else class="match-time">
                <div class="text-h6">{{ formatMatchTime(matchData.date) }}</div>
                <div class="text-caption text-grey">{{ matchData.venue }}</div>
              </div>
            </div>
          </v-col>

          <!-- 원정팀 -->
          <v-col cols="4" class="text-center">
            <div class="team-info">
              <v-avatar size="48" class="mb-2">
                <v-img
                  :src="matchData.awayTeam.logo"
                  :alt="matchData.awayTeam.name"
                />
              </v-avatar>
              <div class="text-subtitle-2 font-weight-bold">
                {{ matchData.awayTeam.name }}
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- 경기 상세 정보 -->
      <div v-if="showDetails" class="match-details mt-4">
        <v-divider class="mb-3" />

        <!-- 경기장 정보 -->
        <div class="detail-row mb-2">
          <v-icon icon="mdi-stadium" size="16" class="me-2" />
          <span class="text-body-2">{{ matchData.venue }}</span>
        </div>

        <!-- 심판 정보 -->
        <div v-if="matchData.referee" class="detail-row mb-2">
          <v-icon icon="mdi-whistle" size="16" class="me-2" />
          <span class="text-body-2">{{ matchData.referee }}</span>
        </div>

        <!-- 날씨 정보 -->
        <div v-if="matchData.weather" class="detail-row mb-2">
          <v-icon icon="mdi-weather-partly-cloudy" size="16" class="me-2" />
          <span class="text-body-2">{{ matchData.weather }}</span>
        </div>

        <!-- 득점자 정보 -->
        <div
          v-if="matchData.scorers && matchData.scorers.length > 0"
          class="scorers-info mt-3"
        >
          <div class="text-subtitle-2 font-weight-bold mb-2">득점자</div>
          <div
            v-for="scorer in matchData.scorers"
            :key="scorer.id"
            class="scorer-item mb-1"
          >
            <v-chip size="small" variant="outlined" class="me-2">
              {{ scorer.minute }}'
            </v-chip>
            <span class="text-body-2">{{ scorer.player }}</span>
            <v-icon
              v-if="scorer.type === 'penalty'"
              icon="mdi-soccer"
              size="16"
              class="ml-1"
            />
            <v-icon
              v-if="scorer.type === 'own_goal'"
              icon="mdi-close-circle"
              size="16"
              class="ml-1"
            />
          </div>
        </div>
      </div>

      <!-- 토글 버튼 -->
      <div class="text-center mt-3">
        <v-btn variant="text" size="small" @click="showDetails = !showDetails">
          {{ showDetails ? '간단히 보기' : '자세히 보기' }}
          <v-icon :icon="showDetails ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  matchData: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      date: new Date(),
      competition: '',
      round: '',
      status: 'scheduled', // scheduled, live, finished, postponed
      homeTeam: {
        name: '',
        logo: '',
      },
      awayTeam: {
        name: '',
        logo: '',
      },
      score: {
        home: 0,
        away: 0,
      },
      venue: '',
      referee: '',
      weather: '',
      scorers: [],
    }),
  },
});

// State
const showDetails = ref(false);

// Methods
function getMatchStatusColor(status) {
  switch (status) {
    case 'live':
      return 'error';
    case 'finished':
      return 'success';
    case 'postponed':
      return 'warning';
    default:
      return 'primary';
  }
}

function getMatchStatusText(status) {
  switch (status) {
    case 'live':
      return '경기중';
    case 'finished':
      return '경기종료';
    case 'postponed':
      return '연기';
    case 'scheduled':
    default:
      return '예정';
  }
}

function formatMatchDate(date) {
  const matchDate = new Date(date);
  return matchDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatMatchTime(date) {
  const matchDate = new Date(date);
  return matchDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped>
.match-info {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    rgba(var(--v-theme-surface), 1) 100%
  );
}

.match-teams {
  padding: 1rem 0;
}

.team-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.match-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-display {
  position: relative;
}

.live-indicator {
  position: absolute;
  top: -8px;
  right: -20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.match-details {
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
  padding: 1rem;
}

.detail-row {
  display: flex;
  align-items: center;
}

.scorers-info {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-radius: 8px;
  padding: 0.75rem;
}

.scorer-item {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .match-teams {
    padding: 0.5rem 0;
  }

  .team-info .v-avatar {
    width: 36px !important;
    height: 36px !important;
  }

  .score-display .text-h4 {
    font-size: 1.5rem !important;
  }
}
</style>
