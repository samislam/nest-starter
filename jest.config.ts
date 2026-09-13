import type { Config } from 'jest'

/**
 * The alias map is written out rather than derived from tsconfig.json.
 *
 * This config previously did `import { compilerOptions } from './tsconfig.json'`, which modern Node
 * rejects without an import attribute — and tsconfig.json is JSONC (it has comments), which plain
 * JSON parsing rejects too. Between them, jest could not parse this file at all, so NO test in the
 * project ran, including the two spec files that already existed. One literal keeps it working.
 *
 * Keep in step with `paths` in tsconfig.json (currently just `@/*`).
 */
export default {
  rootDir: 'src',
  passWithNoTests: true,
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  coverageDirectory: '../coverage',
  collectCoverageFrom: ['**/*.(t|j)s'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
} satisfies Config
