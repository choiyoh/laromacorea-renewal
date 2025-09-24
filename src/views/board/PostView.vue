<template>
  <div class="post-view mt-6">
    <v-container>
      <v-row>
        <v-col cols="12">
          <!-- 게시글 상세 컴포넌트 -->
          <PostDetail
            :post-id="postId"
            @edit-post="handleEditPost"
            @delete-post="handleDeletePost"
            @navigate-to-post="handleNavigateToPost"
            @go-to-list="goToList"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import PostDetail from '@/components/board/PostDetail.vue';

const props = defineProps({
  boardType: {
    type: String,
    required: true,
  },
  postId: {
    type: String,
    required: true,
  },
});

const router = useRouter();

// Board name mapping
const boardNames = {
  notice: '공지사항',
  squad: '스쿼드',
  match: '경기',
  calcio: 'Calcio',
  free: '자유게시판',
  special: '특별게시판',
  media: '미디어',
};

function getBoardName(boardType) {
  return boardNames[boardType] || boardType;
}

function goToList() {
  router.push(`/board/${props.boardType}`);
}

function handleEditPost() {
  // Navigate to edit page
  router.push(`/board/${props.boardType}/post/${props.postId}/edit`);
}

function handleDeletePost(postId) {
  // Navigate back to board list after deletion
  router.push(`/board/${props.boardType}`);
}

function handleNavigateToPost(postId) {
  // Navigate to the selected post
  router.push(`/board/${props.boardType}/post/${postId}`);
}
</script>

<style scoped>
.post-view {
  max-width: 100%;
}
</style>

<style lang="scss">
iframe {
  &.ql-video {
    min-width: 600px;
    min-height: 320px;
  }
}

@media (max-width: 768px) {
  iframe {
    &.ql-video {
      min-width: 100%;
      min-height: auto;
    }
  }
}
</style>
