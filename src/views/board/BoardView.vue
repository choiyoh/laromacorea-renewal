<template>
  <div class="board-view">
    <v-container>
      <v-row>
        <v-col cols="12">
          <BoardList
            :board-type="boardType"
            :board-config="boardConfig"
            @view-post="handleViewPost"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '@vueuse/head';
import { useBoardsStore } from '@/stores/boards';
import { useUserStore } from '@/stores/user';
import BoardList from '@/components/board/BoardList.vue';

const props = defineProps({
  boardType: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const boardsStore = useBoardsStore();
const userStore = useUserStore();

const boardConfig = computed(() => boardsStore.getBoardConfig(props.boardType));

// SEO 메타 태그 설정
const boardTitle = computed(() => {
  const config = boardConfig.value;
  return config ? `${config.name} - La Roma Corea` : 'La Roma Corea';
});

const boardDescription = computed(() => {
  const descriptions = {
    free: 'AS 로마 팬들의 자유로운 소통 공간',
    analysis: '경기 분석과 전술 토론',
    transfer: '이적 소식과 루머',
    fanart: '팬 아트와 창작물',
    media: '사진과 동영상 공유',
    notice: '공지사항과 중요 알림',
  };
  return descriptions[props.boardType] || 'AS 로마 팬 커뮤니티';
});

useHead({
  title: boardTitle,
  meta: [
    {
      name: 'description',
      content: boardDescription,
    },
    {
      property: 'og:title',
      content: boardTitle,
    },
    {
      property: 'og:description',
      content: boardDescription,
    },
  ],
});

// Methods
function handleViewPost(postId) {
  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!userStore.isAuthenticated) {
    router.push('/auth');
    return;
  }

  router.push({
    name: 'post',
    params: {
      boardType: props.boardType,
      postId,
    },
  });
}
</script>
