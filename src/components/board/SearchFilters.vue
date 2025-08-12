<template>
  <div class="search-filters">
    <!-- 검색 입력 -->
    <div class="search-input-section mb-4">
      <v-text-field
        v-model="searchQuery"
        placeholder="제목, 내용, 작성자, 태그로 검색"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        clearable
        hide-details
        @keyup.enter="handleSearch"
        @click:clear="handleClear"
      >
        <template #append-inner>
          <v-btn
            v-if="searchQuery || selectedTags.length > 0"
            icon="mdi-close"
            variant="text"
            size="small"
            @click="handleClear"
          />
        </template>
      </v-text-field>
    </div>

    <!-- 필터 옵션 -->
    <div class="filter-options">
      <v-row>
        <!-- 정렬 옵션 -->
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="sortBy"
            :items="sortOptions"
            label="정렬"
            variant="outlined"
            density="compact"
            hide-details
          >
            <template #selection="{ item }">
              <div class="d-flex align-center">
                <v-icon :icon="item.raw.icon" size="small" class="me-2" />
                {{ item.raw.title }}
              </div>
            </template>
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :icon="item.raw.icon" size="small" />
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>

        <!-- 태그 필터 -->
        <v-col cols="12" sm="6" md="8">
          <v-combobox
            v-model="selectedTags"
            :items="popularTags.map((t) => t.tag)"
            label="태그 필터"
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
            hide-details
            @update:model-value="handleTagChange"
          >
            <template #chip="{ item, props }">
              <v-chip v-bind="props" size="small" color="primary" variant="outlined">
                {{ item.raw }}
              </v-chip>
            </template>
          </v-combobox>
        </v-col>
      </v-row>
    </div>

    <!-- 인기 태그 -->
    <div v-if="popularTags.length > 0 && !isSearchActive" class="popular-tags mt-3">
      <div class="d-flex align-center mb-2">
        <v-icon icon="mdi-tag-outline" size="small" class="me-1" />
        <span class="text-caption text-medium-emphasis">인기 태그</span>
      </div>
      <div class="tag-chips">
        <v-chip
          v-for="tagInfo in popularTags.slice(0, 10)"
          :key="tagInfo.tag"
          size="small"
          variant="outlined"
          class="me-1 mb-1"
          @click="addTag(tagInfo.tag)"
        >
          {{ tagInfo.tag }}
          <span class="text-caption ms-1">({{ tagInfo.count }})</span>
        </v-chip>
      </div>
    </div>

    <!-- 검색 결과 요약 -->
    <div v-if="isSearchActive" class="search-summary mt-3">
      <v-alert type="info" variant="tonal" density="compact" class="mb-0">
        <div class="d-flex align-center justify-space-between">
          <div>
            <v-icon icon="mdi-filter-variant" size="small" class="me-2" />
            검색 조건: {{ searchSummary }}
          </div>
          <v-btn variant="text" size="small" @click="handleClear"> 초기화 </v-btn>
        </div>
      </v-alert>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
  selectedTags: {
    type: Array,
    default: () => [],
  },
  sortBy: {
    type: String,
    default: 'latest',
  },
  popularTags: {
    type: Array,
    default: () => [],
  },
  sortOptions: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:searchQuery',
  'update:selectedTags',
  'update:sortBy',
  'search',
  'clear',
  'add-tag',
])

// Computed
const searchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value),
})

const selectedTags = computed({
  get: () => props.selectedTags,
  set: (value) => emit('update:selectedTags', value),
})

const sortBy = computed({
  get: () => props.sortBy,
  set: (value) => emit('update:sortBy', value),
})

const isSearchActive = computed(() => {
  return searchQuery.value.trim() !== '' || selectedTags.value.length > 0
})

const searchSummary = computed(() => {
  const parts = []
  if (searchQuery.value.trim()) {
    parts.push(`"${searchQuery.value.trim()}"`)
  }
  if (selectedTags.value.length > 0) {
    parts.push(`태그: ${selectedTags.value.join(', ')}`)
  }
  return parts.join(' | ')
})

// Methods
function handleSearch() {
  emit('search')
}

function handleClear() {
  emit('clear')
}

function handleTagChange(tags) {
  selectedTags.value = tags
}

function addTag(tag) {
  emit('add-tag', tag)
}
</script>

<style scoped>
.search-filters {
  background-color: rgb(var(--v-theme-surface));
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.search-input-section {
  position: relative;
}

.filter-options {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-top: 1rem;
}

.popular-tags {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-top: 1rem;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.search-summary {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-top: 1rem;
}

@media (max-width: 768px) {
  .search-filters {
    padding: 1rem;
  }

  .filter-options .v-col {
    padding: 0.25rem;
  }
}
</style>
