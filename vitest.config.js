import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      // Once the coverage is 100%, uncomment the thresholds to enforce it
      // thresholds: {
      //   "**/**": {
      //     branches: 100,
      //     functions: 100,
      //     lines: 100,
      //     statements: 100,
      //   },
      // },
    },
  },
   resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // ensures '@' → <root>/src
    },
  },
})
