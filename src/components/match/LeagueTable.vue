<template>
  <v-card class="league-table-card" variant="outlined">
    <v-card-title class="match-header d-flex align-center py-2 px-4">
      <v-icon icon="mdi-format-list-numbered" color="white" class="mr-3" size="28" />
      <div class="flex-grow-1">
        <div class="text-h6 font-weight-bold text-white cinzel-font">
          Serie A
        </div>
      </div>
      <v-btn
        variant="text"
        size="small"
        color="white"
        class="text-white"
        @click="refreshStandings"
        :loading="loading"
      >
        <v-icon icon="mdi-refresh" />
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0 pb-4 table-body">
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <div class="text-caption mt-2">리그 테이블을 불러오는 중...</div>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <v-icon icon="mdi-alert-circle" color="error" size="48" class="mb-2" />
        <div class="text-body-2 text-error mb-2">{{ error }}</div>
        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          @click="refreshStandings"
        >
          다시 시도
        </v-btn>
      </div>

      <div v-else-if="standings.length > 0" class="table-wrap" ref="tableWrap">
        <table class="league-table">
          <thead>
            <tr>
              <th class="col-rank">#</th>
              <th class="col-team">Team</th>
              <th>P</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in standings"
              :key="row.teamId || row.teamName"
              :class="{ 'roma-row': row.isRoma }"
              :ref="(el) => setRomaRow(row, el)"
            >
              <td class="col-rank" :class="rankClass(row)">
                {{ row.rank ?? '-' }}
              </td>
              <td class="col-team">
                <span class="team-cell">
                  <span class="crest-wrap">
                    <img
                      v-if="row.crest"
                      :src="row.crest"
                      :alt="row.teamName"
                    />
                    <v-icon v-else icon="mdi-shield" size="16" />
                  </span>
                  <span class="team-name">{{
                    row.shortName || row.teamName
                  }}</span>
                </span>
              </td>
              <td>{{ row.played }}</td>
              <td>{{ formatGd(row.gd) }}</td>
              <td class="col-pts">{{ row.pts }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-8">
        <v-icon icon="mdi-table-off" size="48" color="grey" class="mb-2" />
        <div class="text-body-2 text-medium-emphasis">
          순위 정보가 없습니다
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue';
import { matchService } from '@/services/match';

const loading = ref(false);
const error = ref('');
const standings = ref([]);
const tableWrap = ref(null);
let romaRowEl = null;

const setRomaRow = (row, el) => {
  if (row.isRoma && el) {
    romaRowEl = el;
  }
};

const scrollRomaIntoView = async () => {
  await nextTick();
  if (romaRowEl && typeof romaRowEl.scrollIntoView === 'function') {
    romaRowEl.scrollIntoView({ block: 'center', inline: 'nearest' });
  }
};

const loadStandings = async (forceRefresh = false) => {
  loading.value = true;
  error.value = '';

  try {
    const rows = await matchService.getStandings(forceRefresh);
    standings.value = rows;
  } catch {
    error.value = '리그 테이블을 불러올 수 없습니다';
  } finally {
    loading.value = false;
  }
};

const refreshStandings = () => {
  loadStandings(true);
};

const formatGd = (gd) => {
  const value = Number(gd) || 0;
  if (value > 0) return `+${value}`;
  return String(value);
};

const rankClass = (row) => {
  if (row.isRoma) return '';
  const rank = Number(row.rank);
  if (rank >= 1 && rank <= 4) return 'rank-cl';
  if (rank >= 18) return 'rank-rel';
  return '';
};

watch(
  standings,
  () => {
    scrollRomaIntoView();
  },
  { flush: 'post' },
);

onMounted(() => {
  loadStandings();
});
</script>

<style scoped>
.league-table-card {
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

.table-body {
  min-height: 260px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-wrap {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.league-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.league-table th,
.league-table td {
  padding: 4px 6px;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  height: 28px;
  line-height: 18px;
}

.league-table thead th {
  position: sticky;
  top: 0;
  background: #f7f7f7;
  font-weight: 700;
  z-index: 1;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.col-rank {
  width: 28px;
}

.col-team {
  text-align: left !important;
}

.col-pts {
  font-weight: 700;
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 18px;
}

.crest-wrap {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.crest-wrap img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  object-position: center;
  display: block;
}

.team-name {
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 18px;
}

.roma-row {
  background: #990a2c;
  color: #fbba00;
  font-weight: 700;
}

.rank-cl {
  color: #2e7d32;
  font-weight: 700;
}

.rank-rel {
  color: #c62828;
  font-weight: 700;
}

.text-medium-emphasis {
  opacity: 0.7;
}

@media (max-width: 600px) {
  .league-table {
    font-size: 0.7rem;
  }

  .league-table th,
  .league-table td {
    padding: 4px 4px;
  }
}
</style>
