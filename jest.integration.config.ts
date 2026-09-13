import type { Config } from 'jest'

/**
 * Integration test runner — specs named `*.int-spec.ts` that hit the REAL `app_test` Postgres.
 * Kept separate from the default `jest` run (which is fast + DB-free): the default `testRegex`
 * (`*.spec.ts`) does not match `*.int-spec.ts`, and this config matches only those.
 *
 * Run with: `pnpm run test:int` (needs a local Postgres + the `app_test` database provisioned).
 *
 * `maxWorkers: 1` — the specs share one database, so they must run serially or they'd truncate each
 * other's rows mid-test.
 */
export default {
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.int-spec\\.ts$',
  testTimeout: 30_000,
  maxWorkers: 1,
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
} satisfies Config
