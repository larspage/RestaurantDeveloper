require('dotenv').config({ path: './backend/.env' });

module.exports = {
  // Stop running tests after `n` failures
  bail: 1,

  // A path to a module which exports an async function that is triggered once before all test suites
  globalSetup: '<rootDir>/tests/globalSetup.js',

  projects: [
    // Frontend (Next.js) Project
    {
      displayName: 'frontend',
      ...require('next/jest')({ dir: './' })({
        setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
        testEnvironment: 'jest-environment-jsdom',
        testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
        moduleNameMapper: {
          '^@/components/(.*)$': '<rootDir>/src/components/$1',
          '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
          '^@/services/(.*)$': '<rootDir>/src/services/$1',
          '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
          '^@/context/(.*)$': '<rootDir>/src/context/$1',
        },
        transform: {
          '^.+\\\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
        },
        transformIgnorePatterns: [
          '/node_modules/',
          '^.+\\\\.module\\\\.(css|sass|scss)$',
        ],
      }),
    },
    // Backend (Node.js) Project
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js'],
    },
  ],
}; 