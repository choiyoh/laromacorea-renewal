<template>
  <v-snackbar
    v-model="show"
    :timeout="3000"
    color="success"
    location="top right"
    variant="elevated"
  >
    <div class="d-flex align-center">
      <v-icon class="me-2">mdi-coin</v-icon>
      <div>
        <div class="font-weight-medium">{{ message }}</div>
        <div class="text-caption">+{{ points }}P 획득</div>
      </div>
    </div>

    <template #actions>
      <v-btn variant="text" size="small" @click="show = false"> 닫기 </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  points: {
    type: Number,
    default: 0,
  },
  reason: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:visible'])

const show = ref(false)

const message = computed(() => {
  switch (props.reason) {
    case 'post_created':
      return '게시글 작성 완료!'
    case 'comment_created':
      return '댓글 작성 완료!'
    case 'post_liked':
      return '게시글에 좋아요를 받았습니다!'
    case 'comment_liked':
      return '댓글에 좋아요를 받았습니다!'
    case 'daily_login':
      return '일일 로그인 보너스!'
    case 'admin_bonus':
      return '관리자 보너스 지급!'
    default:
      return '포인트를 획득했습니다!'
  }
})

watch(
  () => props.visible,
  (newValue) => {
    show.value = newValue
  },
)

watch(show, (newValue) => {
  if (!newValue) {
    emit('update:visible', false)
  }
})
</script>

<style scoped>
.v-snackbar {
  z-index: 9999;
}
</style>
