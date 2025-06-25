module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-native" +
      "|@react-native" +
      "|@react-navigation" +
      "|react-native-gesture-handler" +
      "|react-redux" +
      "|@reduxjs/toolkit" +
      "|react-native-push-notification" +
      "|@react-native-async-storage" +
      "|react-native-mmkv" +
      "|@react-native-community" +
      "|react-native-netinfo" +
      ")/)",
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^react-native-push-notification$': '<rootDir>/src/__mocks__/react-native-push-notification.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__mocks__/@react-native-async-storage-async-storage.js',
    '^react-native-mmkv$': '<rootDir>/src/__mocks__/react-native-mmkv.js',
    '^@react-native-community/netinfo$': '<rootDir>/src/__mocks__/@react-native-community-netinfo.js',
  },
  testEnvironment: 'node',
};