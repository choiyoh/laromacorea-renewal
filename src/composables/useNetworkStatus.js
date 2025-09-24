// Network status monitoring composable
import { ref, onMounted, onUnmounted } from 'vue';
import { useErrorStore } from '@/stores/error';

export function useNetworkStatus() {
  const errorStore = useErrorStore();

  const isOnline = ref(navigator.onLine);
  const connectionType = ref(null);
  const effectiveType = ref(null);
  const downlink = ref(null);
  const rtt = ref(null);

  // Update network information
  const updateNetworkInfo = () => {
    if ('connection' in navigator) {
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      if (connection) {
        connectionType.value = connection.type;
        effectiveType.value = connection.effectiveType;
        downlink.value = connection.downlink;
        rtt.value = connection.rtt;
      }
    }
  };

  // Handle online/offline events
  const handleOnline = () => {
    isOnline.value = true;
    errorStore.setOfflineStatus(false);
    updateNetworkInfo();
  };

  const handleOffline = () => {
    isOnline.value = false;
    errorStore.setOfflineStatus(true);
  };

  // Handle connection change
  const handleConnectionChange = () => {
    updateNetworkInfo();
  };

  // Test network connectivity
  const testConnectivity = async () => {
    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Check if connection is slow
  const isSlowConnection = () => {
    if (!effectiveType.value) return false;
    return ['slow-2g', '2g'].includes(effectiveType.value);
  };

  // Get connection quality
  const getConnectionQuality = () => {
    if (!effectiveType.value) return 'unknown';

    switch (effectiveType.value) {
      case 'slow-2g':
        return 'poor';
      case '2g':
        return 'poor';
      case '3g':
        return 'good';
      case '4g':
        return 'excellent';
      default:
        return 'unknown';
    }
  };

  // Monitor network with periodic checks (disabled - only show errors on user actions)
  const startNetworkMonitoring = () => {
    // Removed automatic periodic checks to avoid unnecessary error messages
    // Network errors will only be shown when user actions fail
    return () => {}; // Return empty cleanup function
  };

  onMounted(() => {
    // Set initial network status
    errorStore.setOfflineStatus(!isOnline.value);
    updateNetworkInfo();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', handleConnectionChange);
      }
    }

    // Start monitoring
    const stopMonitoring = startNetworkMonitoring();

    // Cleanup function
    onUnmounted(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if ('connection' in navigator) {
        const connection =
          navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection;
        if (connection) {
          connection.removeEventListener('change', handleConnectionChange);
        }
      }

      stopMonitoring();
    });
  });

  return {
    isOnline,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    testConnectivity,
    isSlowConnection,
    getConnectionQuality,
    updateNetworkInfo,
  };
}
