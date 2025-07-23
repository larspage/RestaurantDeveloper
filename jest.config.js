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
      preset: 'ts-jest',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
        '^@/services/(.*)$': '<rootDir>/src/services/$1',
        '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@/context/(.*)$': '<rootDir>/src/context/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
        '^.+\\.(js|jsx)$': ['babel-jest', { 
          presets: [
            'next/babel',
            ['@babel/preset-env', { targets: { node: 'current' } }],
            ['@babel/preset-react', { runtime: 'automatic' }]
          ]
        }],
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(react-dnd|react-dnd-html5-backend|dnd-core|@react-dnd))',
        '^.+\\.module\\.(css|sass|scss)$',
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
      globals: {
        'ts-jest': {
          tsconfig: {
            jsx: 'react-jsx',
          },
        },
      },
    },
    // Backend (Node.js) Project
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js'],
      maxWorkers: 1, // Run tests serially to avoid database conflicts
    },
  ],
}; 