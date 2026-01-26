module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js', // Exclude entry point
    '!src/scripts/**', // Exclude utility scripts
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js',
  ],
  coverageThreshold: {
    global: {
      branches: 39,
      functions: 48,
      lines: 44,
      statements: 44,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 10000,
  verbose: true,
};
