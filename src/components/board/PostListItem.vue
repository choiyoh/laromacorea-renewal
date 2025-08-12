<template>
  <v-card
    class="post-list-item mb-2"
    :class="{ 'pinned-post': isPinned }"
    variant="outlined"
    hover
    @click="$emit('click')"
  >
    <v-card-text class="pa-3">
      <div class="d-flex align-start">
        <!-- 게시글 정보 -->
        <div class="flex-grow-1">
          <!-- 제목 및 태그 -->
          <div class="d-flex align-center mb-1">
            <v-chip v-if="isPinned" size="small" color="error" variant="flat" class="me-2">
              공지
            </v-chip>
            <h3
              class="post-title text-subtitle-1 font-weight-medium"
              :class="{ 'text-primary': isPinned }"
            >
              {{ post.title }}
            </h3>
            <v-chip
              v-if="post.commentCount > 0"
              size="small"
              color="primary"
              variant="outlined"
              class="ms-2"
            >
              {{ post.commentCount }}
            </v-chip>
          </div>

          <!-- 태그 -->
          <div v-if="post.tags && post.tags.length > 0" class="post-tags mb-2">
            <v-chip
              v-for="tag in post.tags.slice(0, 3)"
              :key="tag"
              size="x-small"
              variant="outlined"
              color="primary"
              class="me-1"
            >
              {{ tag }}
            </v-chip>
            <span v-if="post.tags.length > 3" class="text-caption text-grey">
              +{{ post.tags.length - 3 }}개
            </span>
          </div>

          <!-- Match 정보 (Match 게시판용) -->
          <div v-if="showMatchInfo && post.matchData" class="match-summary mb-2">
            <v-card variant="tonal" class="pa-2">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-avatar size="20" class="me-2">
                    <v-img :src="post.matchData.homeTeam.logo" />
                  </v-avatar>
                  <span class="text-caption font-weight-medium">{{
                    post.matchData.homeTeam.name
                  }}</span>

                  <div class="mx-2">
                    <span
                      v-if="
                        post.matchData.status === 'finished' || post.matchData.status === 'live'
                      "
                      class="text-caption font-weight-bold"
                    >
                      {{ post.matchData.score.home }} - {{ post.matchData.score.away }}
                    </span>
                    <span v-else class="text-caption">vs</span>
                  </div>

                  <span class="text-caption font-weight-medium">{{
                    post.matchData.awayTeam.name
                  }}</span>
                  <v-avatar size="20" class="ms-2">
                    <v-img :src="post.matchData.awayTeam.logo" />
                  </v-avatar>
                </div>

                <v-chip
                  :color="getMatchStatusColor(post.matchData.status)"
                  size="x-small"
                  variant="flat"
                >
                  {{ getMatchStatusText(post.matchData.status) }}
                </v-chip>
              </div>
            </v-card>
          </div>

          <!-- 게시글 미리보기 -->
          <p
            v-if="post.content && !isMobile"
            class="post-preview text-body-2 text-grey-darken-1 mb-2"
          >
            {{ getPreviewText(post.content) }}
          </p>

          <!-- 메타 정보 -->
          <div class="post-meta d-flex align-center text-caption text-grey">
            <!-- 작성자 -->
            <div class="d-flex align-center me-3">
              <v-avatar v-if="post.authorIcon" size="16" class="me-1">
                <v-img :src="post.authorIcon" />
              </v-avatar>
              <span>{{ post.authorName }}</span>
            </div>

            <!-- 작성일 -->
            <div class="me-3">
              <v-icon icon="mdi-clock-outline" size="12" class="me-1" />
              {{ formatDate(post.createdAt) }}
            </div>

            <!-- 조회수 -->
            <div class="me-3">
              <v-icon icon="mdi-eye-outline" size="12" class="me-1" />
              {{ post.viewCount || 0 }}
            </div>

            <!-- 추천수 -->
            <div v-if="post.likeCount > 0" class="me-3">
              <v-icon icon="mdi-thumb-up-outline" size="12" class="me-1" />
              {{ post.likeCount }}
            </div>
          </div>
        </div>

        <!-- 썸네일 (미디어가 있는 경우) -->
        <div v-if="post.mediaUrls && post.mediaUrls.length > 0" class="post-thumbnail ms-3">
          <v-img :src="post.mediaUrls[0]" width="60" height="60" cover class="rounded" />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  showMatchInfo: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

// Composables
const { mobile } = useDisplay()

// Computed
const isMobile = computed(() => mobile.value)

// Methods
function getPreviewText(content) {
  if (!content) return ''

  // Remove HTML tags and get first 100 characters
  const plainText = content.replace(/<[^>]*>/g, '')
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
}

function formatDate(timestamp) {
  if (!timestamp) return ''

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    return `${diffInMinutes}분 전`
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}시간 전`
  } else if (diffInHours < 24 * 7) {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
}

function getMatchStatusColor(status) {
  switch (status) {
    case 'live':
      return 'error'
    case 'finished':
      return 'success'
    case 'postponed':
      return 'warning'
    default:
      return 'primary'
  }
}

function getMatchStatusText(status) {
  switch (status) {
    case 'live':
      return 'LIVE'
    case 'finished':
      return '종료'
    case 'postponed':
      return '연기'
    case 'scheduled':
    default:
      return '예정'
  }
}
</script>

<style scoped>
.post-list-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.post-list-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.pinned-post {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.post-title {
  line-height: 1.3;
  cursor: pointer;
}

.post-preview {
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  font-size: 0.75rem;
}

.post-thumbnail {
  flex-shrink: 0;
}

.match-summary {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-radius: 8px;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .post-list-item .v-card-text {
    padding: 12px;
  }

  .post-meta {
    flex-wrap: wrap;
    gap: 8px;
  }

  .post-meta > div {
    margin-right: 0 !important;
  }
}
</style>
