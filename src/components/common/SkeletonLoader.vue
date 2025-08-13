<template>
  <div class="skeleton-loader" :class="{ 'skeleton-loader--dark': isDark }">
    <!-- Post List Skeleton -->
    <template v-if="type === 'post-list'">
      <div v-for="n in count" :key="n" class="skeleton-post-item">
        <div class="skeleton-post-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-post-meta">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--subtitle"></div>
          </div>
        </div>
        <div class="skeleton-post-content">
          <div class="skeleton-line skeleton-line--full"></div>
          <div class="skeleton-line skeleton-line--medium"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
        <div class="skeleton-post-footer">
          <div class="skeleton-chip"></div>
          <div class="skeleton-chip"></div>
          <div class="skeleton-chip"></div>
        </div>
      </div>
    </template>

    <!-- Post Detail Skeleton -->
    <template v-else-if="type === 'post-detail'">
      <div class="skeleton-post-detail">
        <div class="skeleton-post-header">
          <div class="skeleton-line skeleton-line--title-large"></div>
          <div class="skeleton-post-meta mt-3">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-post-meta-text">
              <div class="skeleton-line skeleton-line--subtitle"></div>
              <div class="skeleton-line skeleton-line--caption"></div>
            </div>
          </div>
        </div>
        <div class="skeleton-post-content mt-6">
          <div class="skeleton-line skeleton-line--full"></div>
          <div class="skeleton-line skeleton-line--full"></div>
          <div class="skeleton-line skeleton-line--medium"></div>
          <div class="skeleton-line skeleton-line--full"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
      </div>
    </template>

    <!-- Comment List Skeleton -->
    <template v-else-if="type === 'comment-list'">
      <div v-for="n in count" :key="n" class="skeleton-comment-item">
        <div class="skeleton-comment-header">
          <div class="skeleton-avatar skeleton-avatar--small"></div>
          <div class="skeleton-comment-meta">
            <div class="skeleton-line skeleton-line--subtitle"></div>
            <div class="skeleton-line skeleton-line--caption"></div>
          </div>
        </div>
        <div class="skeleton-comment-content">
          <div class="skeleton-line skeleton-line--full"></div>
          <div class="skeleton-line skeleton-line--medium"></div>
        </div>
      </div>
    </template>

    <!-- Icon Grid Skeleton -->
    <template v-else-if="type === 'icon-grid'">
      <div class="skeleton-icon-grid">
        <div v-for="n in count" :key="n" class="skeleton-icon-item">
          <div class="skeleton-icon-image"></div>
          <div class="skeleton-line skeleton-line--center"></div>
          <div class="skeleton-chip skeleton-chip--small"></div>
        </div>
      </div>
    </template>

    <!-- Card List Skeleton -->
    <template v-else-if="type === 'card-list'">
      <div class="skeleton-card-grid">
        <div v-for="n in count" :key="n" class="skeleton-card-item">
          <div class="skeleton-card-image"></div>
          <div class="skeleton-card-content">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--subtitle"></div>
            <div class="skeleton-line skeleton-line--medium"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Generic Lines Skeleton -->
    <template v-else>
      <div
        v-for="n in count"
        :key="n"
        class="skeleton-line"
        :class="`skeleton-line--${type}`"
      ></div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  type: {
    type: String,
    default: 'full',
    validator: (value) =>
      [
        'post-list',
        'post-detail',
        'comment-list',
        'icon-grid',
        'card-list',
        'full',
        'medium',
        'short',
        'title',
        'subtitle',
        'caption',
      ].includes(value),
  },
  count: {
    type: Number,
    default: 3,
  },
})

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
</script>

<style scoped>
.skeleton-loader {
  width: 100%;
}

/* Base skeleton animation */
@keyframes skeleton-loading {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton-line,
.skeleton-avatar,
.skeleton-chip,
.skeleton-icon-image,
.skeleton-card-image {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-loader--dark .skeleton-line,
.skeleton-loader--dark .skeleton-avatar,
.skeleton-loader--dark .skeleton-chip,
.skeleton-loader--dark .skeleton-icon-image,
.skeleton-loader--dark .skeleton-card-image {
  background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
  background-size: 200px 100%;
}

/* Line variations */
.skeleton-line {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-line--full {
  width: 100%;
}

.skeleton-line--medium {
  width: 75%;
}

.skeleton-line--short {
  width: 50%;
}

.skeleton-line--title {
  height: 20px;
  width: 60%;
}

.skeleton-line--title-large {
  height: 28px;
  width: 80%;
}

.skeleton-line--subtitle {
  height: 16px;
  width: 40%;
}

.skeleton-line--caption {
  height: 12px;
  width: 30%;
}

.skeleton-line--center {
  margin: 0 auto;
  width: 60%;
}

/* Avatar */
.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-avatar--small {
  width: 32px;
  height: 32px;
}

/* Chip */
.skeleton-chip {
  height: 24px;
  width: 60px;
  border-radius: 12px;
  display: inline-block;
  margin-right: 8px;
}

.skeleton-chip--small {
  height: 20px;
  width: 50px;
  border-radius: 10px;
}

/* Post List */
.skeleton-post-item {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  margin-bottom: 8px;
}

.skeleton-post-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.skeleton-post-meta {
  margin-left: 12px;
  flex: 1;
}

.skeleton-post-meta-text {
  margin-left: 12px;
  flex: 1;
}

.skeleton-post-content {
  margin-bottom: 12px;
}

.skeleton-post-footer {
  display: flex;
  align-items: center;
}

/* Post Detail */
.skeleton-post-detail {
  padding: 24px;
}

/* Comment List */
.skeleton-comment-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.skeleton-comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.skeleton-comment-meta {
  margin-left: 8px;
  flex: 1;
}

/* Icon Grid */
.skeleton-icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.skeleton-icon-item {
  text-align: center;
  padding: 16px;
}

.skeleton-icon-image {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  margin: 0 auto 12px;
}

/* Card Grid */
.skeleton-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.skeleton-card-item {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.skeleton-card-image {
  width: 100%;
  height: 160px;
  border-radius: 0;
}

.skeleton-card-content {
  padding: 16px;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .skeleton-post-item {
    padding: 12px;
  }

  .skeleton-post-detail {
    padding: 16px;
  }

  .skeleton-icon-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }

  .skeleton-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
