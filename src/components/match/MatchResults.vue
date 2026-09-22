<template>
  <v-card class="match-results-card" variant="outlined">
    <v-card-title class="match-header d-flex align-center py-2 px-4">
      <v-icon icon="mdi-trophy" color="white" class="mr-3" size="28" />
      <div class="flex-grow-1">
        <div class="text-h6 font-weight-bold text-white cinzel-font">
          Recent Match
        </div>
      </div>
      <v-btn
        variant="text"
        size="small"
        color="white"
        class="text-white touch-friendly"
        aria-label="경기 결과 새로고침"
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

      <v-list v-else-if="results.length > 0" class="py-0 result-list">
        <template v-for="(result, index) in results" :key="result.id">
          <v-list-item class="result-item px-3">
            <div class="result-row">
              <span class="crest-wrap">
                <img
                  v-if="result.homeTeam.crest"
                  :src="result.homeTeam.crest"
                  :alt="result.homeTeam.name"
                />
                <v-icon v-else icon="mdi-shield" size="18" />
              </span>
              <span class="team-name home-name">
                {{ result.homeTeam.shortName || result.homeTeam.name }}
              </span>
              <span class="score-section" :class="resultClass(result)">
                {{ result.score?.fullTime?.home ?? 0 }}-{{
                  result.score?.fullTime?.away ?? 0
                }}
              </span>
              <span class="team-name away-name">
                {{ result.awayTeam.shortName || result.awayTeam.name }}
              </span>
              <span class="crest-wrap">
                <img
                  v-if="result.awayTeam.crest"
                  :src="result.awayTeam.crest"
                  :alt="result.awayTeam.name"
                />
                <v-icon v-else icon="mdi-shield" size="18" />
              </span>
              <span class="league-label">{{ result.leagueShort }}</span>
              <span class="match-date">{{
                formatResultDate(result.utcDate)
              }}</span>
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

const loadResults = async (forceRefresh = false) => {
  loading.value = true;
  error.value = '';

  try {
    const recentResults = await matchService.getRecentResults(forceRefresh);
    results.value = recentResults.map((match) => ({
      ...match,
      leagueShort: formatLeagueName(match.competition?.name),
    }));
  } catch {
    error.value = '경기 결과를 불러올 수 없습니다';
  } finally {
    loading.value = false;
  }
};

const refreshResults = () => {
  loadResults(true);
};

function formatResultDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

function formatLeagueName(name) {
  if (!name) return '';
  const value = String(name);
  if (/uefa\s*champions\s*league|champions\s*league|\bucl\b/i.test(value)) {
    return 'UCL';
  }
  if (/uefa\s*europa\s*conference|conference\s*league|\buecl\b/i.test(value)) {
    return 'UECL';
  }
  if (/uefa\s*europa\s*league|europa\s*league|\buel\b/i.test(value)) {
    return 'UEL';
  }
  if (/coppa\s*italia/i.test(value)) {
    return 'CI';
  }
  if (/serie\s*a/i.test(value)) {
    return 'SerieA';
  }
  return value;
}

const computeResult = (result) => {
  if (result.result) return result.result;
  const home = result.score?.fullTime?.home ?? 0;
  const away = result.score?.fullTime?.away ?? 0;
  if (home === away) return 'D';
  const homeName = `${result.homeTeam?.name || ''} ${result.homeTeam?.shortName || ''}`.toLowerCase();
  const homeIsRoma =
    result.homeTeam?.id === '22033fe3-0a71-435a-9762-749984ea439c' ||
    homeName.includes('roma');
  const romaWon = homeIsRoma ? home > away : away > home;
  return romaWon ? 'W' : 'L';
};

const resultClass = (result) => {
  const outcome = computeResult(result);
  if (outcome === 'W') return 'score-win';
  if (outcome === 'L') return 'score-loss';
  return 'score-draw';
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

.cinzel-font {
  font-family: 'Cinzel', serif !important;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.match-header {
  background: linear-gradient(180deg, #fbba00 0%, #990a2c 100%);
  border-bottom: none;
  color: white;
}

.result-list {
  min-height: 260px;
}

.result-item {
  min-height: 52px;
  height: 52px;
  padding-inline: 12px !important;
}

.result-item :deep(.v-list-item__content) {
  display: flex;
  align-items: center;
  overflow: visible;
  padding: 0;
}

.result-row {
  display: grid;
  grid-template-columns: 7% 18% 12% 18% 7% 16% 22%;
  align-items: center;
  width: 100%;
  height: 20px;
}

.crest-wrap {
  width: 20px;
  height: 20px;
  justify-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.crest-wrap img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  object-position: center;
  display: block;
}

.team-name {
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.home-name {
  text-align: left;
}

.away-name {
  text-align: right;
}

.score-section {
  text-align: center;
  font-weight: 700;
  font-size: 0.9rem;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
}

.league-label {
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 20px;
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  min-width: 0;
}

.match-date {
  font-size: 0.75rem;
  line-height: 20px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
  min-width: 0;
}

.score-win {
  color: #990a2c;
}

.score-draw {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.score-loss {
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.text-medium-emphasis {
  opacity: 0.7;
}

@media (max-width: 600px) {
  .result-row {
    grid-template-columns: 8% 16% 12% 16% 8% 16% 24%;
  }

  .team-name {
    font-size: 0.75rem;
  }

  .score-section {
    font-size: 0.85rem;
  }

  .league-label,
  .match-date {
    font-size: 0.7rem;
  }
}
</style>
