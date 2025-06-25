import js from '@eslint/js';
import reactNative from '@react-native/eslint-config';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import reactNativePlugin from 'eslint-plugin-react-native';
import eslintComments from 'eslint-plugin-eslint-comments';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jestPlugin from 'eslint-plugin-jest';

function cleanGlobals(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => key.trim() === key)
  );
}

export default [
  // Ignore coverage output
  {
    ignores: [
      'coverage/**/*',
      'coverage/lcov-report/**/*',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...cleanGlobals(globals.node),
        ...cleanGlobals(globals.browser),
        ...cleanGlobals(globals.jest),
        ...cleanGlobals(reactNative.globals),
      },
    },
    plugins: {
      'eslint-comments': eslintComments,
      'react-native': reactNativePlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jest': jestPlugin,
      '@typescript-eslint': tseslint,
    },
    settings: reactNative.settings,
    rules: {
      ...reactNative.rules,
      // SOLID principles
      'max-lines-per-function': ['error', { max: 400 }],
      'max-params': ['error', { max: 5 }],
      // DRY principle
      'no-duplicate-imports': 'error',
      // KISS principle
      'complexity': ['error', { max: 20 }],
      'max-depth': ['error', { max: 4 }],
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'react-native/no-unused-styles': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
    },
  },
  // Node.js config files override
  {
    files: [
      '*.config.js',
      'metro.config.js',
      '.prettierrc.js',
      '.eslintrc.js',
      'babel.config.js',
      'jest.config.js',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        ...cleanGlobals(globals.node),
        module: 'writable',
        require: 'writable',
        __dirname: 'writable',
        __filename: 'writable',
      },
    },
  },
  // Jest/test/mocks override
  {
    files: [
      '**/*.test.js',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.js',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      'jest.setup.js',
      'src/__mocks__/**/*.js',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...cleanGlobals(globals.jest),
        ...cleanGlobals(globals.node),
      },
    },
  },
]; 