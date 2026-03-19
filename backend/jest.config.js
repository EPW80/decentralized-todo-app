module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/index.js', // Exclude entry point
    '!src/scripts/**', // Exclude utility scripts
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/test/**/*.test.{js,ts}',
    '**/test/**/*.spec.{js,ts}',
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
  },
  coverageThreshold: {
    global: {
      branches: 55,
      functions: 65,
      lines: 70,
      statements: 70,
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 10000,
  verbose: true,
};
