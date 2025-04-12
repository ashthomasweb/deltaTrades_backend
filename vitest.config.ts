import { defineConfig } from 'vitest/config'

export default defineConfig(() => {
  return defineConfig({
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
  })
})
