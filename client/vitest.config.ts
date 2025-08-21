import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    test: {
      environment: 'happy-dom',
      setupFiles: ['./tests/setup.ts'],
      globals: true,
      env,
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'tests/',
          '**/*.d.ts',
          'vite.config.ts',
          'vitest.config.ts'
        ],
        threshold: {
          global: {
            branches: 75,
            functions: 75,
            lines: 75,
            statements: 75
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      }
    }
  }
})