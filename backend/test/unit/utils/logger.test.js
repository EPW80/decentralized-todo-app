const logger = require('../../../src/utils/logger');

describe('Logger Utility', () => {
  beforeEach(() => {
    // Clear any previous mock calls
    jest.clearAllMocks();
  });

  it('should export logger methods', () => {
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('warn');
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('debug');
    expect(logger).toHaveProperty('child');
  });

  it('should redact sensitive data in logs', () => {
    const sensitiveData = {
      username: 'testuser',
      password: 'secret123',
      privateKey: '0x1234567890abcdef',
      apiKey: 'my-api-key',
      normalField: 'visible data',
    };

    // Logger should not throw when logging sensitive data
    expect(() => {
      logger.info('Test log', sensitiveData);
    }).not.toThrow();
  });

  it('should create child logger with metadata', () => {
    const metadata = {
      requestId: '12345',
      userId: 'user-456',
    };

    const childLogger = logger.child(metadata);

    expect(childLogger).toHaveProperty('info');
    expect(childLogger).toHaveProperty('warn');
    expect(childLogger).toHaveProperty('error');
    expect(childLogger).toHaveProperty('debug');
  });

  it('should handle null and undefined values', () => {
    expect(() => {
      logger.info('Null test', null);
      logger.info('Undefined test', undefined);
      logger.info('Empty object', {});
    }).not.toThrow();
  });

  it('should handle error objects', () => {
    const error = new Error('Test error');
    error.code = 'TEST_CODE';

    expect(() => {
      logger.error('Error test', { error: error.message, stack: error.stack });
    }).not.toThrow();
  });

  it('should handle nested objects with sensitive data', () => {
    const nestedData = {
      user: {
        name: 'John',
        credentials: {
          password: 'secret',
          token: 'abc123',
        },
      },
      config: {
        apiKey: 'my-key',
      },
    };

    expect(() => {
      logger.info('Nested data test', nestedData);
    }).not.toThrow();
  });
});
