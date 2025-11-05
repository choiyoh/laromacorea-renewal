<template>
  <v-card class="match-post-template" elevation="0">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-soccer" class="me-2" />
      오늘의 경기 게시글 템플릿
    </v-card-title>

    <v-card-text>
      <!-- 경기 선택 -->
      <div class="mb-4">
        <v-select
          v-model="selectedMatch"
          :items="availableMatches"
          item-title="displayName"
          item-value="id"
          label="경기 선택"
          variant="outlined"
          @update:model-value="handleMatchSelect"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-avatar size="24" class="me-2">
                  <v-img :src="item.raw.homeTeam.logo" />
                </v-avatar>
              </template>
              <template #append>
                <v-avatar size="24" class="ms-2">
                  <v-img :src="item.raw.awayTeam.logo" />
                </v-avatar>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </div>

      <!-- 선택된 경기 정보 미리보기 -->
      <div v-if="selectedMatchData" class="mb-4">
        <MatchInfo :match-data="selectedMatchData" />
      </div>

      <!-- 게시글 제목 템플릿 -->
      <div class="mb-4">
        <v-text-field
          v-model="postTitle"
          label="게시글 제목"
          variant="outlined"
          placeholder="예: [경기 예고] AS 로마 vs 유벤투스 - 함께 응원해요!"
        />
      </div>

      <!-- 게시글 내용 템플릿 -->
      <div class="mb-4">
        <v-textarea
          v-model="postContent"
          label="게시글 내용"
          variant="outlined"
          rows="8"
          placeholder="경기에 대한 내용을 작성해주세요..."
        />
      </div>

      <!-- 템플릿 옵션 -->
      <div class="template-options mb-4">
        <v-card variant="tonal" class="pa-3">
          <div class="text-subtitle-2 mb-3">템플릿 옵션</div>

          <v-row>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="templateOptions.includeLineup"
                label="예상 라인업 포함"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="templateOptions.includeStats"
                label="팀 통계 포함"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="templateOptions.includePrediction"
                label="경기 예측 포함"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="templateOptions.enableCheering"
                label="응원 댓글 시스템 활성화"
                density="compact"
              />
            </v-col>
          </v-row>
        </v-card>
      </div>

      <!-- 미리보기 -->
      <div v-if="previewContent" class="preview-section">
        <v-divider class="mb-3" />
        <div class="text-subtitle-2 mb-3">미리보기</div>
        <v-card variant="outlined" class="pa-3">
          <div class="text-h6 mb-2">{{ postTitle }}</div>
          <div class="preview-content" v-html="previewContent"></div>
        </v-card>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn @click="$emit('cancel')">취소</v-btn>
      <v-btn
        color="primary"
        :disabled="!canCreatePost"
        @click="handleCreatePost"
      >
        게시글 작성
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import MatchInfo from './MatchInfo.vue';

const props = defineProps({
  availableMatches: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['create-post', 'cancel']);

// State
const selectedMatch = ref(null);
const selectedMatchData = ref(null);
const postTitle = ref('');
const postContent = ref('');
const templateOptions = ref({
  includeLineup: false,
  includeStats: false,
  includePrediction: false,
  enableCheering: true,
});

// Computed
const canCreatePost = computed(() => {
  return (
    selectedMatch.value && postTitle.value.trim() && postContent.value.trim()
  );
});

const previewContent = computed(() => {
  if (!postContent.value) return '';

  let content = postContent.value.replace(/\n/g, '<br>');

  // Add template sections based on options
  if (templateOptions.value.includeLineup) {
    content +=
      '<br><br><strong>🔥 예상 라인업</strong><br>곧 업데이트 예정입니다!';
  }

  if (templateOptions.value.includeStats) {
    content +=
      '<br><br><strong>📊 팀 통계</strong><br>최근 5경기 성적 및 주요 통계를 확인해보세요!';
  }

  if (templateOptions.value.includePrediction) {
    content +=
      '<br><br><strong>🎯 경기 예측</strong><br>여러분의 예측을 댓글로 남겨주세요!';
  }

  if (templateOptions.value.enableCheering) {
    content +=
      '<br><br><strong>📣 응원 메시지</strong><br>팀을 응원하는 메시지를 남겨주세요! 💪';
  }

  return content;
});

// Methods
function handleMatchSelect() {
  const match = props.availableMatches.find(
    (m) => m.id === selectedMatch.value,
  );
  if (match) {
    selectedMatchData.value = match;
    generateDefaultTitle(match);
    generateDefaultContent(match);
  }
}

function generateDefaultTitle(match) {
  const status =
    match.status === 'live'
      ? '[LIVE]'
      : match.status === 'finished'
        ? '[경기 결과]'
        : '[경기 예고]';

  postTitle.value = `${status} ${match.homeTeam.name} vs ${match.awayTeam.name} - 함께 응원해요! 🔥`;
}

function generateDefaultContent(match) {
  const isRomaHome =
    match.homeTeam.name.includes('로마') ||
    match.homeTeam.name.includes('Roma');
  const isRomaAway =
    match.awayTeam.name.includes('로마') ||
    match.awayTeam.name.includes('Roma');

  let content = `⚽ **${match.competition} ${match.round}**\n\n`;
  content += `🏟️ **경기장**: ${match.venue}\n`;
  content += `📅 **경기 일시**: ${formatMatchDateTime(match.date)}\n\n`;

  if (match.status === 'scheduled') {
    content += `오늘 우리 AS 로마의 중요한 경기가 있습니다!\n\n`;

    if (isRomaHome) {
      content += `홈에서 ${match.awayTeam.name}를 상대로 좋은 경기를 기대해봅시다! 💪\n\n`;
    } else if (isRomaAway) {
      content += `원정에서 ${match.homeTeam.name}를 상대로 승리를 위해 응원합시다! 🚀\n\n`;
    }

    content += `모든 로마니스타 여러분들의 뜨거운 응원 부탁드립니다!\n\n`;
    content += `**FORZA ROMA! 💛❤️**`;
  } else if (match.status === 'live') {
    content += `🔴 **현재 경기가 진행 중입니다!**\n\n`;
    content += `실시간으로 경기를 보며 함께 응원해요!\n\n`;
    content += `**DAJE ROMA! 🔥**`;
  } else if (match.status === 'finished') {
    content += `경기가 종료되었습니다.\n\n`;
    content += `경기 결과와 소감을 함께 나눠요!\n\n`;
    content += `**FORZA ROMA! 💛❤️**`;
  }
}

function formatMatchDateTime(date) {
  const matchDate = new Date(date);
  return matchDate.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleCreatePost() {
  const postData = {
    title: postTitle.value,
    content: previewContent.value,
    matchId: selectedMatch.value,
    matchData: selectedMatchData.value,
    templateOptions: templateOptions.value,
    boardType: 'match',
    tags: ['경기', selectedMatchData.value?.competition?.name || ''],
    isMatchPost: true,
  };

  emit('create-post', postData);
}

// Watch for available matches changes
watch(
  () => props.availableMatches,
  (newMatches) => {
    if (newMatches.length > 0 && !selectedMatch.value) {
      // Auto-select today's match if available
      const today = new Date();
      const todayMatch = newMatches.find((match) => {
        const matchDate = new Date(match.date);
        return matchDate.toDateString() === today.toDateString();
      });

      if (todayMatch) {
        selectedMatch.value = todayMatch.id;
        handleMatchSelect();
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.match-post-template {
  max-width: 800px;
  margin: 0 auto;
  background-color: rgb(var(--v-theme-surface)) !important;
}

.template-options {
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
}

.preview-section {
  margin-top: 1rem;
}

.preview-content {
  line-height: 1.6;
  word-break: break-word;
}

.preview-content :deep(strong) {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

@media (max-width: 768px) {
  .match-post-template {
    margin: 0;
  }
}
</style>
