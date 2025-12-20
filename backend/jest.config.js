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
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 10000,
  verbose: true,
};
