<template>
  <v-container class="not-found-view" fill-height>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <h1 class="text-h3 font-weight-bold mb-2">404</h1>
        <p class="text-body-1 text-medium-emphasis mb-6">
          요청하신 페이지를 찾을 수 없습니다.
        </p>
        <v-btn color="primary" to="/home">홈으로 이동</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useHead } from '@vueuse/head';

useHead({
  title: '페이지를 찾을 수 없습니다 | AS 로마 코리아 | La Roma Corea',
  meta: [
    {
      name: 'description',
      content: '요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.',
    },
  ],
});
</script>
