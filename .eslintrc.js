module.exports = {
  root: true,
  extends: [
    '@react-native',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {

    // SOLID principles
    'max-lines-per-function': [
      'error', 
      { 
        max: 50 
      }
    ],
    'max-params': [
      'error', 
      { max: 3 

      }
    ],
    
    // DRY principle
    'no-duplicate-imports': 'error',
    
    // KISS principle
    'complexity': [
      'error',
      { 
        max: 10 
      }
    ],
    'max-depth': [
      'error',
      { 
        max: 4 
      }
    ],

    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    'react-native/no-inline-styles': 'warn',
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'error',
    
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
  },
  env: {
    'jest': true,
  },
};
