// Test setup file - runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_with_at_least_32_characters_for_testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/decentralized-todo-test';
process.env.LOG_LEVEL = 'error'; // Only log errors during tests
process.env.LOCALHOST_RPC = 'http://127.0.0.1:8545';

// Global test timeout
jest.setTimeout(10000);

// Suppress console output during tests unless there's an error
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};
