<template>
  <div class="auth-view">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="pa-4">
            <v-card-title class="text-center">
              <h2 class="text-h5">{{ isSignUp ? '회원가입' : '로그인' }}</h2>
            </v-card-title>

            <v-card-text>
              <p class="text-center text-body-2 mb-4">
                AS 로마 코리아 커뮤니티에 오신 것을 환영합니다!
              </p>

              <v-form ref="form" @submit.prevent="handleSubmit">
                <v-text-field
                  v-model="email"
                  label="이메일"
                  type="email"
                  variant="outlined"
                  class="mb-3"
                  :rules="emailRules"
                  :error-messages="emailError"
                  required
                />

                <v-text-field
                  v-if="isSignUp"
                  v-model="displayName"
                  label="닉네임"
                  variant="outlined"
                  class="mb-3"
                  :rules="displayNameRules"
                  required
                />

                <v-text-field
                  v-model="password"
                  label="비밀번호"
                  type="password"
                  variant="outlined"
                  class="mb-3"
                  :rules="passwordRules"
                  :error-messages="passwordError"
                  required
                />

                <v-text-field
                  v-if="isSignUp"
                  v-model="confirmPassword"
                  label="비밀번호 확인"
                  type="password"
                  variant="outlined"
                  class="mb-4"
                  :rules="confirmPasswordRules"
                  required
                />

                <v-alert v-if="errorMessage" type="error" class="mb-4" :text="errorMessage" />

                <v-alert v-if="successMessage" type="success" class="mb-4" :text="successMessage" />

                <v-btn
                  type="submit"
                  color="primary"
                  block
                  size="large"
                  class="mb-2"
                  :loading="loading"
                  :disabled="!isFormValid"
                >
                  {{ isSignUp ? '회원가입' : '로그인' }}
                </v-btn>

                <v-btn
                  variant="outlined"
                  block
                  size="large"
                  class="mb-2"
                  @click="toggleMode"
                  :disabled="loading"
                >
                  {{ isSignUp ? '로그인으로 전환' : '회원가입으로 전환' }}
                </v-btn>

                <v-btn
                  v-if="!isSignUp"
                  variant="text"
                  block
                  size="small"
                  @click="showResetPassword = true"
                  :disabled="loading"
                >
                  비밀번호를 잊으셨나요?
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Password Reset Dialog -->
          <v-dialog v-model="showResetPassword" max-width="400">
            <v-card>
              <v-card-title>비밀번호 재설정</v-card-title>
              <v-card-text>
                <v-text-field
                  v-model="resetEmail"
                  label="이메일"
                  type="email"
                  variant="outlined"
                  :rules="emailRules"
                />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn @click="showResetPassword = false">취소</v-btn>
                <v-btn color="primary" @click="handlePasswordReset" :loading="resetLoading">
                  재설정 이메일 발송
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '@/services/auth'
import { useUserStore } from '@/stores/user'
import { useErrorStore } from '@/stores/error'

const router = useRouter()
const userStore = useUserStore()
const errorStore = useErrorStore()

// Form state
const isSignUp = ref(false)
const email = ref('')
const displayName = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Password reset
const showResetPassword = ref(false)
const resetEmail = ref('')
const resetLoading = ref(false)

// Form validation rules
const emailRules = [
  (v) => !!v || '이메일을 입력해주세요',
  (v) => /.+@.+\..+/.test(v) || '유효한 이메일을 입력해주세요',
]

const displayNameRules = [
  (v) => !!v || '닉네임을 입력해주세요',
  (v) => (v && v.length >= 2) || '닉네임은 2자 이상이어야 합니다',
  (v) => (v && v.length <= 20) || '닉네임은 20자 이하여야 합니다',
]

const passwordRules = [
  (v) => !!v || '비밀번호를 입력해주세요',
  (v) => (v && v.length >= 6) || '비밀번호는 6자 이상이어야 합니다',
]

const confirmPasswordRules = [
  (v) => !!v || '비밀번호 확인을 입력해주세요',
  (v) => v === password.value || '비밀번호가 일치하지 않습니다',
]

// Computed properties
const isFormValid = computed(() => {
  if (isSignUp.value) {
    return (
      email.value &&
      displayName.value &&
      password.value &&
      confirmPassword.value &&
      password.value === confirmPassword.value &&
      emailRules.every((rule) => rule(email.value) === true) &&
      displayNameRules.every((rule) => rule(displayName.value) === true) &&
      passwordRules.every((rule) => rule(password.value) === true)
    )
  } else {
    return (
      email.value &&
      password.value &&
      emailRules.every((rule) => rule(email.value) === true) &&
      passwordRules.every((rule) => rule(password.value) === true)
    )
  }
})

const emailError = computed(() => {
  if (errorMessage.value && errorMessage.value.includes('이메일')) {
    return errorMessage.value
  }
  return ''
})

const passwordError = computed(() => {
  if (errorMessage.value && errorMessage.value.includes('비밀번호')) {
    return errorMessage.value
  }
  return ''
})

// Methods
const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  clearMessages()
  clearForm()
}

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const clearForm = () => {
  email.value = ''
  displayName.value = ''
  password.value = ''
  confirmPassword.value = ''
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  loading.value = true
  clearMessages()

  console.log('Auth form submitted:', {
    isSignUp: isSignUp.value,
    email: email.value,
    displayName: displayName.value,
  })

  try {
    if (isSignUp.value) {
      console.log('Attempting sign up...')
      const user = await AuthService.signUp(email.value, password.value, displayName.value)
      console.log('Sign up successful:', user)

      successMessage.value = '회원가입이 완료되었습니다! 이메일 인증을 확인해주세요.'

      // Switch to login mode after successful signup
      setTimeout(() => {
        isSignUp.value = false
        clearForm()
        successMessage.value = ''
      }, 3000)
    } else {
      console.log('Attempting sign in...')
      const user = await AuthService.signIn(email.value, password.value)
      console.log('Sign in successful:', user)

      // Wait for user store to update
      await new Promise((resolve) => setTimeout(resolve, 500))

      successMessage.value = '로그인되었습니다!'

      // Redirect to home page
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }
  } catch (error) {
    console.error('Auth error details:', {
      code: error.code,
      message: error.message,
      originalError: error.originalError || error,
    })

    errorMessage.value = error.message || '오류가 발생했습니다.'
    errorStore.addError(error, 'AUTH_ERROR', isSignUp.value ? 'Sign Up' : 'Sign In')
  } finally {
    loading.value = false
  }
}

const handlePasswordReset = async () => {
  if (!resetEmail.value) {
    errorMessage.value = '이메일을 입력해주세요'
    return
  }

  resetLoading.value = true
  clearMessages()

  try {
    await AuthService.resetPassword(resetEmail.value)
    successMessage.value = '비밀번호 재설정 이메일이 발송되었습니다.'
    showResetPassword.value = false
    resetEmail.value = ''
  } catch (error) {
    console.error('Password reset error:', error)
    errorMessage.value = error.message || '비밀번호 재설정 중 오류가 발생했습니다.'
  } finally {
    resetLoading.value = false
  }
}
</script>

<style scoped>
.auth-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #990a2c 0%, #fbba00 100%);
}

.v-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95) !important;
}
</style>
