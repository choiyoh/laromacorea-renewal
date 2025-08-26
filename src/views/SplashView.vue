<template>
  <div class="splash-container">
    <div class="splash-content" @click="enterSite">
      <img
        src="/images/totti.jpg"
        alt="Francesco Totti"
        class="totti-image"
        @load="imageLoaded = true"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const imageLoaded = ref(false);

const enterSite = () => {
  router.push('/home');
};

// 키보드 이벤트로도 입장 가능
onMounted(() => {
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      enterSite();
    }
  };

  document.addEventListener('keydown', handleKeyPress);

  // 컴포넌트 언마운트 시 이벤트 리스너 제거
  return () => {
    document.removeEventListener('keydown', handleKeyPress);
  };
});
</script>

<style scoped>
.splash-container {
  width: 100vw;
  height: 100vh;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.splash-content:hover {
  transform: scale(1.05);
}

.totti-image {
  max-width: 80vw;
  max-height: 80vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.totti-image:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.click-hint {
  margin-top: 20px;
  font-size: 18px;
  color: #666;
  font-weight: 500;
  opacity: 0;
  animation: fadeInUp 1s ease forwards;
  animation-delay: 0.5s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 모바일 대응 */
@media (max-width: 768px) {
  .totti-image {
    max-width: 90vw;
    max-height: 70vh;
  }

  .click-hint {
    font-size: 16px;
    margin-top: 15px;
  }
}

/* 접근성을 위한 포커스 스타일 */
.splash-content:focus {
  outline: 2px solid #990a2c;
  outline-offset: 4px;
}
</style>
