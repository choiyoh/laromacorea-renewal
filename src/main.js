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
app.use(vuetify);
app.use(head);

// Register global directives
app.directive('lazy-image', vLazyImage);

// Initialize browser compatibility
initializeBrowserCompatibility();

// Initialize performance optimizations
inlineCriticalCSS();
preloadCriticalResources();
measurePerformance();
monitorMemoryUsage();

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Global error:', error, info);
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
    console.warn('Vue warning:', msg, trace);
  };
}

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
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

app.mount('#app');
