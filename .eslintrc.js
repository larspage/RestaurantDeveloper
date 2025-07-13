module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended'
  ],
  plugins: ['@typescript-eslint', 'jest'],
  overrides: [
    {
      // Configure special rules for test files
      files: ['**/*.test.ts', '**/*.test.tsx', '**/tests/**/*', '**/__tests__/**/*'],
      env: {
        jest: true,
        node: true
      },
      rules: {
        // Disable rules that commonly cause issues in test files
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'react/display-name': 'off',
        'no-console': 'off',
        'react-hooks/exhaustive-deps': 'off'
      }
    }
  ],
  rules: {
    // Base rules for all files - being more lenient during development
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off', // Temporarily disabled
    'no-console': 'off', // Temporarily disabled
    '@typescript-eslint/no-explicit-any': 'off', // Temporarily disabled
    'react-hooks/exhaustive-deps': 'off', // Temporarily disabled
    'react/no-unescaped-entities': 'off', // Temporarily disabled
    '@next/next/no-img-element': 'off', // Temporarily disabled
    '@next/next/no-html-link-for-pages': 'warn' // Only warning for <a> tags
  }
} 