import { ref, onMounted, onUnmounted } from 'vue';

export function useScrollDirection() {
  const isScrollingUp = ref(true);
  const isScrollingDown = ref(false);
  const lastScrollY = ref(0);
  const scrollThreshold = 3; // 스크롤 감도 조절 (더 민감하게)
  const hideThreshold = 50; // 헤더/푸터를 숨기기 시작할 스크롤 위치 (낮춤)

  let ticking = false;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // 스크롤 임계값을 넘었을 때만 상태 변경
    if (Math.abs(currentScrollY - lastScrollY.value) < scrollThreshold) {
      return;
    }

    if (currentScrollY > lastScrollY.value && currentScrollY > hideThreshold) {
      // 아래로 스크롤 중이고 임계값 이상 스크롤했을 때
      isScrollingUp.value = false;
      isScrollingDown.value = true;
    } else {
      // 위로 스크롤 중이거나 페이지 상단 근처일 때
      isScrollingUp.value = true;
      isScrollingDown.value = false;
    }

    lastScrollY.value = currentScrollY;
  };

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    // 초기 스크롤 위치 설정
    lastScrollY.value = window.scrollY;
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });

  return {
    isScrollingUp,
    isScrollingDown,
  };
}
