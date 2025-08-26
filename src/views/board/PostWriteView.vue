<template>
  <div class="post-write-view">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" lg="10" xl="8">
          <!-- 브레드크럼 -->
          <v-breadcrumbs :items="breadcrumbs" class="pa-0 mb-4" />

          <!-- 게시글 작성 에디터 -->
          <PostEditor
            :board-type="boardType"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import PostEditor from '@/components/board/PostEditor.vue';

const props = defineProps({
  boardType: {
    type: String,
    required: true,
  },
});

const router = useRouter();

// Board configuration
const boardConfig = {
  notice: { name: '공지사항', icon: 'mdi-bullhorn' },
  squad: { name: '스쿼드', icon: 'mdi-account-group' },
  match: { name: '경기', icon: 'mdi-soccer' },
  calcio: { name: 'Calcio', icon: 'mdi-newspaper' },
  free: { name: '자유게시판', icon: 'mdi-forum' },
  special: { name: '스페셜', icon: 'mdi-star' },
  media: { name: '미디어', icon: 'mdi-play-circle' },
};

// Computed
const breadcrumbs = computed(() => [
  {
    title: '홈',
    disabled: false,
    to: '/',
  },
  {
    title: boardConfig[props.boardType]?.name || props.boardType,
    disabled: false,
    to: `/board/${props.boardType}`,
  },
  {
    title: '글쓰기',
    disabled: true,
  },
]);

// Methods
function handleSubmit() {
  // 게시글 작성 완료 후 게시판으로 이동
  router.push(`/board/${props.boardType}`);
}

function handleCancel() {
  // 취소 시 게시판으로 이동
  router.push(`/board/${props.boardType}`);
}
</script>

<style scoped>
.post-write-view {
  min-height: calc(100vh - 64px);
  background-color: rgb(var(--v-theme-background));
}

@media (max-width: 768px) {
  .post-write-view {
    min-height: calc(100vh - 56px);
  }
}
</style>
