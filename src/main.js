import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@vueuse/head';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

// Responsive design styles
import './styles/responsive.scss';

// Performance optimization styles
import './styles/performance.scss';

// Browser compatibility
import { initializeBrowserCompatibility } from './utils/browserUtils';

// Performance optimization
import {
  preloadCriticalResources,
  measurePerformance,
  monitorMemoryUsage,
  inlineCriticalCSS,
} from './utils/performance';

// Lazy loading utilities
import { vLazyImage } from './composables/useLazyImage';

import App from './App.vue';
import router from './router';
import { useUserStore } from './stores/user';
import { useErrorStore } from './stores/error';
import { firebaseConfig } from './services/firebase';
import VueGtag from 'vue-gtag-next';

// Create Vuetify instance with AS Roma theme colors
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#990a2c', // AS Roma Red
          secondary: '#fbba00', // AS Roma Yellow
          accent: '#1976D2',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        },
      },
      dark: {
        colors: {
          primary: '#990a2c', // AS Roma Red
          secondary: '#fbba00', // AS Roma Yellow
          accent: '#1976D2',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        },
      },
    },
  },
});

const app = createApp(App);
const pinia = createPinia();
const head = createHead();

app.use(pinia);
app.use(router);

// Add Google Analytics
app.use(VueGtag, {
  property: {
    id: firebaseConfig.measurementId
  },
  router
});

app.use(vuetify);
app.use(head);

// Register global directives
app.directive('lazy-image', vLazyImage);

// Initialize browser compatibility
// initializeBrowserCompatibility();

// Initialize performance optimizations
inlineCriticalCSS();
preloadCriticalResources();
measurePerformance();
monitorMemoryUsage();

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  const errorStore = useErrorStore();
  errorStore.addError(
    error,
    errorStore.ERROR_TYPES.UNKNOWN,
    `Vue Error: ${info}`,
  );
};

// Global warning handler (development only)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, instance, trace) => {
    // Vue warning handler for development
  };
}

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const errorStore = useErrorStore();
  errorStore.addError(
    event.reason,
    errorStore.ERROR_TYPES.UNKNOWN,
    'Unhandled Promise',
  );
  event.preventDefault(); // Prevent default browser error handling
});

// Initialize authentication after app is created
const userStore = useUserStore();
userStore.initializeAuth();

// Load admin tools in development mode
if (import.meta.env.DEV) {
  import('./utils/adminTools.js');
}

// PWA 설정
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // 새 버전 사용 가능
              navigator.serviceWorker.controller.postMessage({
                type: 'SW_UPDATE_AVAILABLE',
                updateSW: () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                },
              });
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

app.mount('#app');
