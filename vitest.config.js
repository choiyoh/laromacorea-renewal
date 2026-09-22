import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      css: true,
      globals: true,
      server: {
        deps: {
          // Vuetify ships .css imports from its ESM entrypoints; without inlining
          // Node tries to load them directly and every spec fails to collect with
          // "Unknown file extension .css".
          inline: ['vuetify'],
        },
      },
      setupFiles: ['src/__tests__/setup.js'],
    },
  }),
)
