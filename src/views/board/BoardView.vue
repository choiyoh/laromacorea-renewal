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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardsStore } from '@/stores/boards'
import BoardList from '@/components/board/BoardList.vue'

const props = defineProps({
  boardType: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const boardsStore = useBoardsStore()

const boardConfig = computed(() => boardsStore.getBoardConfig(props.boardType))

// Methods
function handleViewPost(postId) {
  router.push({
    name: 'post',
    params: {
      boardType: props.boardType,
      postId,
    },
  })
}
</script>
