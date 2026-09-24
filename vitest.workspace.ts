import { defineWorkspace } from 'vitest/config';

/**
 * Vitest workspace. Three projects:
 *  - unit: pure functions and validators. happy-dom env, no DB.
 *  - component: React Testing Library. happy-dom env.
 *  - integration: services + Prisma with pglite. node env.
 *  - api: Route Handlers invoked via app.request(). node env.
 */
export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      name: 'unit',
      include: ['tests/unit/**/*.test.ts'],
      environment: 'happy-dom',
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'component',
      include: ['tests/component/**/*.test.tsx'],
      environment: 'happy-dom',
      setupFiles: ['./tests/helpers/setup-component.ts'],
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'integration',
      include: ['tests/integration/**/*.test.ts'],
      environment: 'node',
      setupFiles: ['./tests/helpers/setup-integration.ts'],
      testTimeout: 30_000,
      pool: 'forks',
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'api',
      include: ['tests/api/**/*.test.ts'],
      environment: 'node',
      setupFiles: ['./tests/helpers/setup-integration.ts'],
      testTimeout: 30_000,
      pool: 'forks',
    },
  },
]);