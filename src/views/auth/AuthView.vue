<template>
  <div class="auth-view">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="pa-4">
            <v-card-title class="text-center">
              <h2 class="text-h5">로그인 / 회원가입</h2>
            </v-card-title>

            <v-card-text>
              <p class="text-center text-body-2 mb-4">
                AS 로마 코리아 커뮤니티에 오신 것을 환영합니다!
              </p>

              <v-form>
                <v-text-field label="이메일" type="email" variant="outlined" class="mb-3" />

                <v-text-field label="비밀번호" type="password" variant="outlined" class="mb-4" />

                <v-btn color="primary" block size="large" class="mb-2"> 로그인 </v-btn>

                <v-btn variant="outlined" block size="large"> 회원가입 </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
// Authentication functionality will be implemented in later tasks
</script>
