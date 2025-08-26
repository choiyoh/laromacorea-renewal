<template>
  <v-card class="match-schedule-card" variant="outlined">
    <v-card-title class="match-header d-flex align-center py-2 px-4">
      <v-icon icon="mdi-soccer" color="white" class="mr-3" size="28" />
      <div class="flex-grow-1">
        <div class="text-h6 font-weight-bold text-white">Next Match</div>
      </div>
      <div class="d-flex align-center">
        <v-btn
          variant="text"
          size="small"
          color="white"
          class="text-white"
          @click="refreshMatches"
          :loading="loading"
        >
          <v-icon icon="mdi-refresh" />
        </v-btn>
      </div>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <div class="text-caption mt-2">경기 일정을 불러오는 중...</div>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <v-icon icon="mdi-alert-circle" color="error" size="48" class="mb-2" />
        <div class="text-body-2 text-error mb-2">{{ error }}</div>
        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          @click="refreshMatches"
        >
          다시 시도
        </v-btn>
      </div>

      <div v-else-if="nextMatch" class="match-info pa-4">
        <!-- 다음 경기 정보 -->
        <div class="match-main mb-3">
          <div class="d-flex align-center justify-center">
            <!-- 홈팀 -->
            <div class="team-info text-center">
              <div class="team-logo mb-2">
                <v-img
                  v-if="nextMatch.homeTeam.crest"
                  :src="nextMatch.homeTeam.crest"
                  :alt="nextMatch.homeTeam.name"
                  width="40"
                  height="40"
                  class="team-crest"
                />
                <v-icon v-else icon="mdi-shield" size="40" color="grey" />
              </div>
              <div class="text-body-2 font-weight-bold team-name">
                {{ nextMatch.homeTeam.shortName || nextMatch.homeTeam.name }}
              </div>
            </div>

            <!-- VS 섹션 -->
            <div class="vs-section mx-6">
              <div class="text-h5 font-weight-bold text-primary mb-1">VS</div>
              <div class="text-caption text-center match-date">
                {{ formatMatchDate(nextMatch.utcDate) }}
              </div>
              <div class="text-caption text-center match-time">
                {{ formatTime(nextMatch.utcDate) }}
              </div>
            </div>

            <!-- 어웨이팀 -->
            <div class="team-info text-center">
              <div class="team-logo mb-2">
                <v-img
                  v-if="nextMatch.awayTeam.crest"
                  :src="nextMatch.awayTeam.crest"
                  :alt="nextMatch.awayTeam.name"
                  width="40"
                  height="40"
                  class="team-crest"
                />
                <v-icon v-else icon="mdi-shield" size="40" color="grey" />
              </div>
              <div class="text-body-2 font-weight-bold team-name">
                {{ nextMatch.awayTeam.shortName || nextMatch.awayTeam.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- 경기 상세 정보 -->
        <v-divider class="my-3" />
        <div class="match-details">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="detail-item">
              <v-icon
                icon="mdi-calendar"
                size="16"
                class="mr-2"
                color="primary"
              />
              <span class="text-body-2">{{
                formatFullDate(nextMatch.utcDate)
              }}</span>
            </div>
          </div>
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="detail-item">
              <v-icon
                icon="mdi-trophy"
                size="16"
                class="mr-2"
                color="primary"
              />
              <span class="text-body-2">{{
                nextMatch.competition?.name || '리그'
              }}</span>
            </div>
          </div>
          <div
            v-if="nextMatch.venue"
            class="d-flex align-center justify-space-between"
          >
            <div class="detail-item">
              <v-icon
                icon="mdi-stadium"
                size="16"
                class="mr-2"
                color="primary"
              />
              <span class="text-body-2">{{ nextMatch.venue }}</span>
            </div>
          </div>

          <!-- 경기까지 남은 시간 -->
          <div class="countdown-section mt-3 pa-2">
            <div class="text-center">
              <div class="text-caption text-medium-emphasis mb-1">경기까지</div>
              <div class="text-h6 font-weight-bold text-primary">
                {{ timeUntilMatch }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <v-icon icon="mdi-calendar-blank" size="48" color="grey" class="mb-2" />
        <div class="text-body-2 text-medium-emphasis">
          예정된 경기가 없습니다
        </div>
      </div>
    </v-card-text>

    <!-- 전체 경기 일정 모달 -->
    <v-dialog v-model="showAllMatches" max-width="600px" scrollable>
      <v-card>
        <v-card-title class="match-header d-flex align-center pa-4">
          <v-icon icon="mdi-soccer" color="white" class="mr-3" size="24" />
          <span class="text-h6 font-weight-bold text-white"
            >AS 로마 경기 일정</span
          >
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            color="white"
            size="small"
            @click="showAllMatches = false"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-0" style="max-height: 500px">
          <div v-if="loadingAll" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" />
            <div class="text-caption mt-2">전체 일정을 불러오는 중...</div>
          </div>

          <v-list v-else-if="allMatches.length > 0" class="py-0">
            <template v-for="(match, index) in allMatches" :key="match.id">
              <v-list-item class="match-list-item pa-4">
                <div class="d-flex align-center w-100">
                  <!-- 팀 정보 -->
                  <div class="d-flex align-center flex-grow-1">
                    <div class="team-section">
                      <v-img
                        v-if="match.homeTeam.crest"
                        :src="match.homeTeam.crest"
                        :alt="match.homeTeam.name"
                        width="24"
                        height="24"
                        class="mr-2"
                      />
                      <v-icon v-else icon="mdi-shield" size="24" class="mr-2" />
                      <span class="text-body-2 font-weight-medium">
                        {{ match.homeTeam.shortName || match.homeTeam.name }}
                      </span>
                    </div>

                    <div class="vs-text mx-3">
                      <span class="text-caption font-weight-bold">VS</span>
                    </div>

                    <div class="team-section">
                      <v-img
                        v-if="match.awayTeam.crest"
                        :src="match.awayTeam.crest"
                        :alt="match.awayTeam.name"
                        width="24"
                        height="24"
                        class="mr-2"
                      />
                      <v-icon v-else icon="mdi-shield" size="24" class="mr-2" />
                      <span class="text-body-2 font-weight-medium">
                        {{ match.awayTeam.shortName || match.awayTeam.name }}
                      </span>
                    </div>
                  </div>

                  <!-- 날짜/시간 정보 -->
                  <div class="match-datetime text-right">
                    <div class="text-body-2 font-weight-medium">
                      {{ formatMatchDate(match.utcDate) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatTime(match.utcDate) }}
                    </div>
                    <div class="text-caption text-primary">
                      {{ match.competition?.name }}
                    </div>
                  </div>
                </div>
              </v-list-item>
              <v-divider v-if="index < allMatches.length - 1" />
            </template>
          </v-list>

          <div v-else class="text-center py-8">
            <v-icon
              icon="mdi-calendar-blank"
              size="48"
              color="grey"
              class="mb-2"
            />
            <div class="text-body-2 text-medium-emphasis">
              예정된 경기가 없습니다
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { matchService } from '@/services/match';

const loading = ref(false);
const error = ref('');
const nextMatch = ref(null);
const showAllMatches = ref(false);
const allMatches = ref([]);
const loadingAll = ref(false);
const timeUntilMatch = ref('');
let countdownInterval = null;

// 경기 일정 로드
const loadMatches = async () => {
  loading.value = true;
  error.value = '';

  try {
    const matches = await matchService.getUpcomingMatches();
    nextMatch.value = matches.length > 0 ? matches[0] : null;
  } catch (err) {
    console.error('Failed to load matches:', err);
    error.value = '경기 일정을 불러올 수 없습니다';
  } finally {
    loading.value = false;
  }
};

// 경기 일정 새로고침
const refreshMatches = () => {
  loadMatches();
};

// 전체 경기 일정 로드
const loadAllMatches = async () => {
  loadingAll.value = true;

  try {
    const matches = await matchService.getUpcomingMatches();
    allMatches.value = matches;
  } catch (err) {
    console.error('Failed to load all matches:', err);
    allMatches.value = [];
  } finally {
    loadingAll.value = false;
  }
};

// 모달이 열릴 때 전체 일정 로드
watch(showAllMatches, (newValue) => {
  if (newValue) {
    loadAllMatches();
  }
});

// 날짜 포맷팅
const formatMatchDate = (dateString) => {
  const date = new Date(dateString);
  return date
    .toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '/')
    .replace('.', '');
};

const formatFullDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// 경기까지 남은 시간 계산 및 업데이트
const updateCountdown = () => {
  if (!nextMatch.value) {
    timeUntilMatch.value = '';
    return;
  }

  const matchDate = new Date(nextMatch.value.utcDate).getTime();
  const now = new Date().getTime();
  const diff = matchDate - now;

  if (diff <= 0) {
    timeUntilMatch.value = '경기 진행중';
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let countdownString = '';
  if (days > 0) {
    countdownString = `${days}일 ${hours}시간 ${minutes}분 남음`;
  } else if (hours > 0) {
    countdownString = `${hours}시간 ${minutes}분 남음`;
  } else if (minutes > 0) {
    countdownString = `${minutes}분 ${seconds}초 남음`;
  } else {
    countdownString = `${seconds}초 남음`;
  }
  timeUntilMatch.value = countdownString;
};

watch(nextMatch, (newMatch) => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  if (newMatch) {
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  } else {
    timeUntilMatch.value = '';
  }
});

onMounted(() => {
  loadMatches();
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<style scoped>
.match-schedule-card {
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

.match-info {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.team-info {
  min-width: 80px;
  flex: 1;
}

.team-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
}

.team-crest {
  transition: transform 0.2s ease;
}

.team-crest:hover {
  transform: scale(1.05);
}

.team-name {
  color: rgba(var(--v-theme-on-surface), 0.9);
  min-height: 20px;
}

.vs-section {
  text-align: center;
  min-width: 80px;
}

.match-date {
  color: rgba(var(--v-theme-primary), 0.8);
  font-weight: 500;
}

.match-time {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-weight: 500;
}

.detail-item {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.countdown-section {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    rgba(var(--v-theme-primary), 0.1) 100%
  );
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.text-medium-emphasis {
  opacity: 0.7;
}

@media (max-width: 600px) {
  .match-info {
    padding: 12px !important;
  }

  .team-info {
    min-width: 60px;
  }

  .team-logo {
    height: 40px;
  }

  .team-crest {
    width: 32px !important;
    height: 32px !important;
  }

  .team-name {
    font-size: 0.75rem;
  }

  .vs-section {
    margin: 0 12px !important;
    min-width: 60px;
  }

  .vs-section .text-h5 {
    font-size: 1.2rem !important;
  }

  .match-date,
  .match-time {
    font-size: 0.7rem;
  }

  .detail-item {
    font-size: 0.8rem;
  }

  .countdown-section .text-h6 {
    font-size: 1rem !important;
  }
}

.match-list-item {
  transition: background-color 0.2s;
}

.match-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.team-section {
  display: flex;
  align-items: center;
  min-width: 100px;
}

.vs-text {
  color: rgba(var(--v-theme-primary), 0.8);
}

.match-datetime {
  min-width: 80px;
}
</style>
