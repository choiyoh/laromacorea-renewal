import { ref, onMounted } from 'vue';

export function useServiceWorkerUpdate() {
  const updateAvailable = ref(false);
  const registration = ref(null);

  const checkForUpdate = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          registration.value = reg;

          // Check for updates immediately
          await reg.update();

          // Listen for new service worker
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  updateAvailable.value = true;
                }
              });
            }
          });

          // Listen for controlling service worker change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        }
      } catch (error) {
        console.warn('Service worker update check failed:', error);
      }
    }
  };

  const applyUpdate = async () => {
    if (registration.value && registration.value.waiting) {
      registration.value.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  onMounted(() => {
    checkForUpdate();

    // Check for updates every 30 seconds
    setInterval(checkForUpdate, 30000);
  });

  return {
    updateAvailable,
    applyUpdate,
    checkForUpdate,
  };
}
