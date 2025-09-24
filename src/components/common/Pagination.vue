<template>
  <div v-if="totalPages > 1" class="pagination-wrapper">
    <v-pagination
      :model-value="currentPage"
      :length="totalPages"
      :total-visible="dynamicTotalVisible"
      variant="elevated"
      color="primary"
      class="my-4"
      density="compact"
      @update:model-value="handlePageChange"
    />

    <!-- 페이지 정보 표시 -->
    <div class="pagination-info text-center mt-2">
      <span class="text-caption text-medium-emphasis">
        {{ startItem }}-{{ endItem }} / {{ totalItems }}개
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useResponsive } from '@/composables/useResponsive';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  },
  totalVisible: {
    type: Number,
    default: 7,
  },
});

const emit = defineEmits(['update:currentPage', 'page-change']);

const { isMobile } = useResponsive();

// Computed
const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.itemsPerPage);
});

const dynamicTotalVisible = computed(() => {
  return isMobile.value ? 5 : props.totalVisible;
});

const startItem = computed(() => {
  return (props.currentPage - 1) * props.itemsPerPage + 1;
});

const endItem = computed(() => {
  const end = props.currentPage * props.itemsPerPage;
  return Math.min(end, props.totalItems);
});

// Methods
function handlePageChange(page) {
  emit('update:currentPage', page);
  emit('page-change', page);
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem 0;
}

.pagination-info {
  margin-top: 0.5rem;
}
</style>
