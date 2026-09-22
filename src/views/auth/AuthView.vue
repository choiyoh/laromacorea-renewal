<template>
  <div class="auth-view">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="pa-4">
            <v-card-title class="text-center">
              <h1 class="text-h5">{{ isSignUp ? '회원가입' : '로그인' }}</h1>
            </v-card-title>

            <v-card-text>
              <p class="text-center text-body-2 mb-4">
                AS 로마 코리아 커뮤니티에 오신 것을 환영합니다!
              </p>

              <v-form ref="form" @submit.prevent="handleSubmit">
                <!-- 아이디 입력 -->
                <v-text-field
                  v-model="username"
                  :label="isSignUp ? '아이디' : '아이디 또는 이메일'"
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
                      :icon="
                        usernameAvailable
                          ? 'mdi-check-circle'
                          : 'mdi-close-circle'
                      "
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
                    :loading="checkingEmail"
                    @blur="checkEmailAvailability"
                    required
                  >
                    <template #append-inner>
                      <v-icon
                        v-if="email && !checkingEmail"
                        :icon="
                          emailAvailable
                            ? 'mdi-check-circle'
                            : 'mdi-close-circle'
                        "
                        :color="emailAvailable ? 'success' : 'error'"
                      />
                    </template>
                  </v-text-field>

                  <!-- 닉네임 입력 -->
                  <v-text-field
                    v-model="displayName"
                    label="닉네임"
                    variant="outlined"
                    class="mb-3"
                    :rules="displayNameRules"
                    :error-messages="displayNameError"
                    :loading="checkingDisplayName"
                    @blur="checkDisplayNameAvailability"
                    required
                  >
                    <template #append-inner>
                      <v-icon
                        v-if="displayName && !checkingDisplayName"
                        :icon="
                          displayNameAvailable
                            ? 'mdi-check-circle'
                            : 'mdi-close-circle'
                        "
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

                <v-alert
                  v-if="errorMessage"
                  type="error"
                  class="mb-4"
                  :text="errorMessage"
                />

                <v-alert
                  v-if="successMessage"
                  type="success"
                  class="mb-4"
                  :text="successMessage"
                />

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
                <p class="text-body-2 mb-4">
                  가입 시 사용한 이메일 주소를 입력해주세요.
                </p>
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
                <v-btn
                  color="primary"
                  @click="handlePasswordReset"
                  :loading="resetLoading"
                >
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { AuthService } from '@/services/auth';
import { useUserStore } from '@/stores/user';
import { useErrorStore } from '@/stores/error';

const router = useRouter();
const userStore = useUserStore();
const errorStore = useErrorStore();

// Form state
const isSignUp = ref(false);
const username = ref('');
const email = ref('');
const displayName = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Availability checking
const checkingUsername = ref(false);
const checkingEmail = ref(false);
const checkingDisplayName = ref(false);
const usernameAvailable = ref(null);
const emailAvailable = ref(null);
const displayNameAvailable = ref(null);

// Password reset
const showResetPassword = ref(false);
const resetEmail = ref('');
const resetLoading = ref(false);

// Form validation rules
const usernameRules = [
  (v) => !!v || '아이디를 입력해주세요',
  (v) => (v && v.length >= 3) || '아이디는 3자 이상이어야 합니다',
  (v) => {
    // 로그인 시에는 이메일도 허용 (기존 계정 호환성)
    if (!isSignUp.value) {
      return (v && v.length <= 50) || '아이디/이메일은 50자 이하여야 합니다';
    }
    // 회원가입 시에는 20자 제한
    return (v && v.length <= 20) || '아이디는 20자 이하여야 합니다';
  },
  (v) => {
    // 로그인 시에는 이메일 형식도 허용
    if (!isSignUp.value) {
      return /^[a-zA-Z0-9_@.]+$/.test(v) || '아이디 또는 이메일을 입력해주세요';
    }
    // 회원가입 시에는 아이디 형식만 허용
    return (
      /^[a-zA-Z0-9_]+$/.test(v) ||
      '아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다'
    );
  },
  () => {
    // 로그인 모드이거나, 회원가입 모드에서 중복 체크가 완료되지 않았거나 사용 가능한 경우만 통과
    if (!isSignUp.value) return true;
    if (usernameAvailable.value === null) return true; // 아직 체크하지 않음
    return usernameAvailable.value === true;
  },
];

const emailRules = [
  (v) => !!v || '이메일을 입력해주세요',
  (v) => /.+@.+\..+/.test(v) || '유효한 이메일을 입력해주세요',
  () => {
    // 로그인 모드이거나, 회원가입 모드에서 중복 체크가 완료되지 않았거나 사용 가능한 경우만 통과
    if (!isSignUp.value) return true;
    if (emailAvailable.value === null) return true; // 아직 체크하지 않음
    return emailAvailable.value === true;
  },
];

const displayNameRules = [
  (v) => !!v || '닉네임을 입력해주세요',
  (v) => (v && v.length >= 2) || '닉네임은 2자 이상이어야 합니다',
  (v) => (v && v.length <= 20) || '닉네임은 20자 이하여야 합니다',
  () => {
    // 로그인 모드이거나, 회원가입 모드에서 중복 체크가 완료되지 않았거나 사용 가능한 경우만 통과
    if (!isSignUp.value) return true;
    if (displayNameAvailable.value === null) return true; // 아직 체크하지 않음
    return displayNameAvailable.value === true;
  },
];

const passwordRules = [
  (v) => !!v || '비밀번호를 입력해주세요',
  (v) => (v && v.length >= 6) || '비밀번호는 6자 이상이어야 합니다',
];

const confirmPasswordRules = [
  (v) => !!v || '비밀번호 확인을 입력해주세요',
  (v) => v === password.value || '비밀번호가 일치하지 않습니다',
];

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
      // 중복 체크: null(미체크) 또는 true(사용가능)인 경우만 허용
      (usernameAvailable.value === null || usernameAvailable.value === true) &&
      (emailAvailable.value === null || emailAvailable.value === true) &&
      (displayNameAvailable.value === null ||
        displayNameAvailable.value === true) &&
      usernameRules.every((rule) => rule(username.value) === true) &&
      emailRules.every((rule) => rule(email.value) === true) &&
      displayNameRules.every((rule) => rule(displayName.value) === true) &&
      passwordRules.every((rule) => rule(password.value) === true)
    );
  } else {
    return (
      username.value &&
      password.value &&
      usernameRules
        .slice(0, 4)
        .every((rule) => rule(username.value) === true) &&
      passwordRules.every((rule) => rule(password.value) === true)
    );
  }
});

const usernameError = computed(() => {
  if (errorMessage.value && errorMessage.value.includes('아이디')) {
    return errorMessage.value;
  }
  // 회원가입 모드에서 중복 체크 결과에 따른 에러 메시지
  if (isSignUp.value && usernameAvailable.value === false) {
    return '이미 사용 중인 아이디입니다';
  }
  return '';
});

const emailError = computed(() => {
  if (errorMessage.value && errorMessage.value.includes('이메일')) {
    return errorMessage.value;
  }
  // 회원가입 모드에서 중복 체크 결과에 따른 에러 메시지
  if (isSignUp.value && emailAvailable.value === false) {
    return '이미 사용 중인 이메일입니다';
  }
  return '';
});

const displayNameError = computed(() => {
  if (errorMessage.value && errorMessage.value.includes('닉네임')) {
    return errorMessage.value;
  }
  // 회원가입 모드에서 중복 체크 결과에 따른 에러 메시지
  if (isSignUp.value && displayNameAvailable.value === false) {
    return '이미 사용 중인 닉네임입니다';
  }
  return '';
});

const passwordError = computed(() => {
  if (errorMessage.value && errorMessage.value.includes('비밀번호')) {
    return errorMessage.value;
  }
  return '';
});

// Methods
const toggleMode = () => {
  isSignUp.value = !isSignUp.value;
  clearMessages();
  clearForm();
};

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const clearForm = () => {
  username.value = '';
  email.value = '';
  displayName.value = '';
  password.value = '';
  confirmPassword.value = '';
  usernameAvailable.value = null;
  emailAvailable.value = null;
  displayNameAvailable.value = null;
};

// 아이디 중복 체크
const checkUsernameAvailability = async () => {
  if (!username.value || username.value.length < 3) {
    usernameAvailable.value = null;
    return;
  }

  checkingUsername.value = true;
  try {
    const isAvailable = await AuthService.checkUsernameAvailability(
      username.value,
    );
    usernameAvailable.value = isAvailable;
  } catch (error) {
    usernameAvailable.value = null;
  } finally {
    checkingUsername.value = false;
  }
};

// 이메일 중복 체크
const checkEmailAvailability = async () => {
  if (!email.value || !/.+@.+\..+/.test(email.value)) {
    emailAvailable.value = null;
    return;
  }

  checkingEmail.value = true;
  try {
    const isAvailable = await AuthService.checkEmailAvailability(email.value);
    emailAvailable.value = isAvailable;
  } catch (error) {
    emailAvailable.value = null;
  } finally {
    checkingEmail.value = false;
  }
};

// 닉네임 중복 체크
const checkDisplayNameAvailability = async () => {
  if (!displayName.value || displayName.value.length < 2) {
    displayNameAvailable.value = null;
    return;
  }

  checkingDisplayName.value = true;
  try {
    const isAvailable = await AuthService.checkDisplayNameAvailability(
      displayName.value,
    );
    displayNameAvailable.value = isAvailable;
  } catch (error) {
    displayNameAvailable.value = null;
  } finally {
    checkingDisplayName.value = false;
  }
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  clearMessages();

  try {
    if (isSignUp.value) {
      // 최종 중복 체크
      const [usernameCheck, emailCheck, displayNameCheck] = await Promise.all([
        AuthService.checkUsernameAvailability(username.value),
        AuthService.checkEmailAvailability(email.value),
        AuthService.checkDisplayNameAvailability(displayName.value),
      ]);

      if (!usernameCheck) {
        errorMessage.value = '이미 사용 중인 아이디입니다.';
        return;
      }

      if (!emailCheck) {
        errorMessage.value = '이미 사용 중인 이메일입니다.';
        return;
      }

      if (!displayNameCheck) {
        errorMessage.value = '이미 사용 중인 닉네임입니다.';
        return;
      }

      // 회원가입 진행 - 아이디 기반으로 임시 이메일 생성
      const tempEmail = `${username.value}@laromacorea.temp`;
      const user = await AuthService.signUp(
        tempEmail,
        password.value,
        displayName.value,
        username.value,
        email.value,
      );

      successMessage.value = '회원가입이 완료되었습니다!';

      // Switch to login mode after successful signup
      setTimeout(() => {
        isSignUp.value = false;
        clearForm();
        successMessage.value = '';
      }, 2000);
    } else {
      // AuthService에서 아이디/이메일 자동 판별하여 로그인
      const user = await AuthService.signIn(username.value, password.value);

      // Wait for user store to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      successMessage.value = '로그인되었습니다!';

      // Redirect to home page
      setTimeout(() => {
        router.push('/home');
      }, 1000);
    }
  } catch (error) {
    let errorMsg = '오류가 발생했습니다.';

    // 제재된 계정 메시지를 우선적으로 처리
    if (error.message === '운영자에 의해 제재된 멤버입니다') {
      errorMsg = error.message;
    } else if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password'
    ) {
      errorMsg = '아이디 또는 비밀번호가 올바르지 않습니다.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMsg = '이미 사용 중인 이메일입니다.';
    } else if (error.code === 'auth/weak-password') {
      errorMsg = '비밀번호가 너무 약합니다.';
    } else if (error.message) {
      errorMsg = error.message;
    }

    errorMessage.value = errorMsg;
    // 로그인/회원가입 에러는 화면에서만 표시하고 전역 에러로는 추가하지 않음
  } finally {
    loading.value = false;
  }
};

const handlePasswordReset = async () => {
  if (!resetEmail.value) {
    errorMessage.value = '이메일을 입력해주세요';
    return;
  }

  resetLoading.value = true;
  clearMessages();

  try {
    await AuthService.resetPassword(resetEmail.value);
    successMessage.value = '비밀번호 재설정 이메일이 발송되었습니다.';
    showResetPassword.value = false;
    resetEmail.value = '';
  } catch (error) {
    errorMessage.value =
      error.message || '비밀번호 재설정 중 오류가 발생했습니다.';
  } finally {
    resetLoading.value = false;
  }
};
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
