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
                <!-- 아이디 입력 -->
                <v-text-field
                  v-model="username"
                  label="아이디"
                  variant="outlined"
                  class="mb-3"
                  :rules="usernameRules"
                  :error-messages="usernameError"
                  :loading="checkingUsername"
                  @blur="checkUsernameAvailability"
                  required
                >
                  <template #append-inner>
                    <v-icon
                      v-if="isSignUp && username && !checkingUsername"
                      :icon="usernameAvailable ? 'mdi-check-circle' : 'mdi-close-circle'"
                      :color="usernameAvailable ? 'success' : 'error'"
                    />
                  </template>
                </v-text-field>

                <!-- 회원가입 시에만 표시되는 필드들 -->
                <template v-if="isSignUp">
                  <!-- 이메일 입력 -->
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

                  <!-- 닉네임 입력 -->
                  <v-text-field
                    v-model="displayName"
                    label="닉네임"
                    variant="outlined"
                    class="mb-3"
                    :rules="displayNameRules"
                    :loading="checkingDisplayName"
                    @blur="checkDisplayNameAvailability"
                    required
                  >
                    <template #append-inner>
                      <v-icon
                        v-if="displayName && !checkingDisplayName"
                        :icon="displayNameAvailable ? 'mdi-check-circle' : 'mdi-close-circle'"
                        :color="displayNameAvailable ? 'success' : 'error'"
                      />
                    </template>
                  </v-text-field>
                </template>

                <!-- 비밀번호 입력 -->
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

                <!-- 비밀번호 확인 (회원가입 시에만) -->
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
                <p class="text-body-2 mb-4">가입 시 사용한 이메일 주소를 입력해주세요.</p>
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
import { databaseService } from '@/services/database'

const router = useRouter()
const userStore = useUserStore()
const errorStore = useErrorStore()

// Form state
const isSignUp = ref(false)
const username = ref('')
const email = ref('')
const displayName = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Availability checking
const checkingUsername = ref(false)
const checkingDisplayName = ref(false)
const usernameAvailable = ref(null)
const displayNameAvailable = ref(null)

// Password reset
const showResetPassword = ref(false)
const resetEmail = ref('')
const resetLoading = ref(false)

// Form validation rules
const usernameRules = [
  (v) => !!v || '아이디를 입력해주세요',
  (v) => (v && v.length >= 3) || '아이디는 3자 이상이어야 합니다',
  (v) => (v && v.length <= 20) || '아이디는 20자 이하여야 합니다',
  (v) => /^[a-zA-Z0-9_]+$/.test(v) || '아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다',
  () => !isSignUp.value || usernameAvailable.value === true || '이미 사용 중인 아이디입니다',
]

const emailRules = [
  (v) => !!v || '이메일을 입력해주세요',
  (v) => /.+@.+\..+/.test(v) || '유효한 이메일을 입력해주세요',
]

const displayNameRules = [
  (v) => !!v || '닉네임을 입력해주세요',
  (v) => (v && v.length >= 2) || '닉네임은 2자 이상이어야 합니다',
  (v) => (v && v.length <= 20) || '닉네임은 20자 이하여야 합니다',
  () => !isSignUp.value || displayNameAvailable.value === true || '이미 사용 중인 닉네임입니다',
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
      username.value &&
      email.value &&
      displayName.value &&
      password.value &&
      confirmPassword.value &&
      password.value === confirmPassword.value &&
      usernameAvailable.value === true &&
      displayNameAvailable.value === true &&
      usernameRules.every((rule) => rule(username.value) === true) &&
      emailRules.every((rule) => rule(email.value) === true) &&
      displayNameRules.every((rule) => rule(displayName.value) === true) &&
      passwordRules.every((rule) => rule(password.value) === true)
    )
  } else {
    return (
      username.value &&
      password.value &&
      usernameRules.slice(0, 4).every((rule) => rule(username.value) === true) &&
      passwordRules.every((rule) => rule(password.value) === true)
    )
  }
})

const usernameError = computed(() => {
  if (errorMessage.value && errorMessage.value.includes('아이디')) {
    return errorMessage.value
  }
  return ''
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
  username.value = ''
  email.value = ''
  displayName.value = ''
  password.value = ''
  confirmPassword.value = ''
  usernameAvailable.value = null
  displayNameAvailable.value = null
}

// 아이디 중복 체크
const checkUsernameAvailability = async () => {
  if (!username.value || username.value.length < 3) {
    usernameAvailable.value = null
    return
  }

  checkingUsername.value = true
  try {
    const isAvailable = await databaseService.checkUsernameAvailability(username.value)
    usernameAvailable.value = isAvailable
  } catch (error) {
    console.error('Username availability check failed:', error)
    usernameAvailable.value = null
  } finally {
    checkingUsername.value = false
  }
}

// 닉네임 중복 체크
const checkDisplayNameAvailability = async () => {
  if (!displayName.value || displayName.value.length < 2) {
    displayNameAvailable.value = null
    return
  }

  checkingDisplayName.value = true
  try {
    const isAvailable = await databaseService.checkDisplayNameAvailability(displayName.value)
    displayNameAvailable.value = isAvailable
  } catch (error) {
    console.error('Display name availability check failed:', error)
    displayNameAvailable.value = null
  } finally {
    checkingDisplayName.value = false
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  loading.value = true
  clearMessages()

  console.log('Auth form submitted:', {
    isSignUp: isSignUp.value,
    username: username.value,
    email: email.value,
    displayName: displayName.value,
  })

  try {
    if (isSignUp.value) {
      console.log('Attempting sign up...')

      // 최종 중복 체크
      const [usernameCheck, displayNameCheck] = await Promise.all([
        databaseService.checkUsernameAvailability(username.value),
        databaseService.checkDisplayNameAvailability(displayName.value),
      ])

      if (!usernameCheck) {
        errorMessage.value = '이미 사용 중인 아이디입니다.'
        return
      }

      if (!displayNameCheck) {
        errorMessage.value = '이미 사용 중인 닉네임입니다.'
        return
      }

      // 회원가입 진행 - 아이디 기반으로 임시 이메일 생성
      const tempEmail = `${username.value}@laromacorea.temp`
      const user = await AuthService.signUp(tempEmail, password.value, displayName.value)

      // 사용자 정보에 실제 이메일과 아이디 저장
      await databaseService.updateUserProfile(user.uid, {
        username: username.value,
        email: email.value,
        displayName: displayName.value,
        tempEmail: tempEmail,
        authMethod: 'username',
      })

      console.log('Sign up successful:', user)
      successMessage.value = '회원가입이 완료되었습니다!'

      // Switch to login mode after successful signup
      setTimeout(() => {
        isSignUp.value = false
        clearForm()
        successMessage.value = ''
      }, 2000)
    } else {
      console.log('Attempting sign in with username...')

      // 아이디로 사용자 찾기
      const userInfo = await databaseService.getUserByUsername(username.value)
      if (!userInfo) {
        errorMessage.value = '존재하지 않는 아이디입니다.'
        return
      }

      // 임시 이메일로 로그인
      const user = await AuthService.signIn(userInfo.tempEmail, password.value)
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

    let errorMsg = '오류가 발생했습니다.'

    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMsg = '아이디 또는 비밀번호가 올바르지 않습니다.'
    } else if (error.code === 'auth/email-already-in-use') {
      errorMsg = '이미 사용 중인 이메일입니다.'
    } else if (error.code === 'auth/weak-password') {
      errorMsg = '비밀번호가 너무 약합니다.'
    } else if (error.message) {
      errorMsg = error.message
    }

    errorMessage.value = errorMsg
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
