import type { Config } from '@jest/types';
import type { InitialOptionsTsJest } from 'ts-jest'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  verbose: true,
  collectCoverage: false,
  collectCoverageFrom: [
    "./src/**/*.{ts,js}",
    "!**/src/**/*.t.{ts}",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10,
    }
  },
};
export default config;