<template>
  <div class="home">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h3 text-center mb-6">La Roma Corea</h1>
          <p class="text-center text-h6 mb-8">Forza Roma! 한국의 AS 로마 당사입니다.</p>
        </v-col>
      </v-row>

      <!-- Board Navigation -->
      <v-row>
        <v-col v-for="board in boardTypes" :key="board.id" cols="12" sm="6" md="4" lg="3">
          <v-card :to="`/board/${board.id}`" class="board-card" hover>
            <v-card-text class="text-center">
              <v-icon :icon="board.icon" size="48" color="primary" class="mb-2" />
              <div class="text-h6">{{ board.name }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBoardsStore } from '@/stores/boards'

const boardsStore = useBoardsStore()

const boardTypes = computed(() => boardsStore.boardTypes)
</script>

<style scoped>
.board-card {
  transition: transform 0.2s;
}

.board-card:hover {
  transform: translateY(-2px);
}
</style>
