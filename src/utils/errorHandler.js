/**
 * 공통 에러 처리 유틸리티
 */

// 네트워크 에러 판별 함수
export function isNetworkError(error) {
  return (
    error.name === 'NetworkError' ||
    error.code === 'unavailable' ||
    error.code === 'deadline-exceeded' ||
    error.code === 'network-request-failed' ||
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('connection') ||
    error.message?.includes('timeout')
  );
}

// Firebase 에러 판별 함수
export function isFirebaseError(error) {
  return (
    error.code &&
    (error.code.startsWith('auth/') ||
      error.code.startsWith('firestore/') ||
      error.code === 'permission-denied' ||
      error.code === 'unavailable' ||
      error.code === 'deadline-exceeded')
  );
}

// 사용자 액션에 대한 에러만 표시하는 핸들러
export async function handleUserActionError(error, context = null) {
  // 네트워크 관련 에러이거나 Firebase 에러인 경우에만 에러 스토어에 전달
  if (isNetworkError(error) || isFirebaseError(error)) {
    const { useErrorStore } = await import('@/stores/error');
    const errorStore = useErrorStore();

    if (isFirebaseError(error)) {
      errorStore.handleFirebaseError(error, context);
    } else {
      errorStore.handleNetworkError(error, context);
    }
  }

  // 콘솔에는 모든 에러 로그
  console.error(`Error in ${context || 'unknown context'}:`, error);
}

// 백그라운드 작업 에러 (사용자에게 표시하지 않음)
export function handleBackgroundError(error, context = null) {
  // 백그라운드 작업의 에러는 콘솔에만 로그하고 사용자에게는 표시하지 않음
  console.warn(`Background error in ${context || 'unknown context'}:`, error);
}
