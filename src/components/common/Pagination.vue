<template>
  <div class="pagination-wrapper text-center my-8">
    <v-btn
      :disabled="currentPage <= 1"
      @click="onPrev"
      class="mr-2"
      variant="tonal"
      prepend-icon="mdi-chevron-left"
    >
      이전
    </v-btn>

    <span class="current-page-display text-subtitle-1 font-weight-bold mx-4">
      {{ currentPage }}
    </span>

    <v-btn
      :disabled="!hasMore"
      @click="onNext"
      class="ml-2"
      variant="tonal"
      append-icon="mdi-chevron-right"
    >
      다음
    </v-btn>
  </div>
</template>

<script setup>
const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  hasMore: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['prev', 'next']);

function onPrev() {
  if (props.currentPage > 1) {
    emit('prev');
  }
}

function onNext() {
  if (props.hasMore) {
    emit('next');
  }
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.current-page-display {
  min-width: 30px; /* 페이지 번호가 바뀌어도 너비 유지 */
  display: inline-block;
  text-align: center;
}
</style>