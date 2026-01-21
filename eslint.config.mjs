import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      noInlineConfig: true,
    },
    rules: {
      'no-console': 'error',
      'no-debugger': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'require-await': 'error',
      'react/no-unescaped-entities': 'off',
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
    },
  },
  {
    files: ['**/*.js', 'scripts/**/*.js', 'jest.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'func-style': 'off', // Allow function declarations in scripts
    },
  },
  {
    files: [
      'scripts/**/*.ts',
      '__tests__/**/*.ts',
      '__tests__/**/*.tsx',
      'app/api/cron/run-reshape-tests/**/*.ts',
    ],
    rules: {
      'func-style': 'off', // Allow function declarations in TypeScript scripts
      'no-console': 'off', // Allow console in test files and scripts
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'temp/**', 'lib/consoleLogger.ts', 'lib/errorLogger.ts']),
]);

export default eslintConfig;
