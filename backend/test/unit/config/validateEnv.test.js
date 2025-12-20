const validateEnv = require('../../../src/config/validateEnv');
const logger = require('../../../src/utils/logger');

jest.mock('../../../src/utils/logger');

describe('Environment Validation', () => {
  let originalEnv;
  let mockExit;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Mock process.exit
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    mockExit.mockRestore();
  });

  describe('Required Variables', () => {
    it('should pass validation with all required variables', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a_very_secure_secret_key_with_more_than_32_characters';

      const result = validateEnv();

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('✅ Environment variables validated successfully');
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should fail when MONGODB_URI is missing', () => {
      process.env.JWT_SECRET = 'a_very_secure_secret_key_with_more_than_32_characters';
      delete process.env.MONGODB_URI;

      validateEnv();

      expect(logger.error).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when JWT_SECRET is missing', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      delete process.env.JWT_SECRET;

      validateEnv();

      expect(logger.error).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when both required variables are missing', () => {
      delete process.env.MONGODB_URI;
      delete process.env.JWT_SECRET;

      validateEnv();

      expect(logger.error).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('JWT_SECRET Validation', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('should fail when JWT_SECRET is less than 32 characters', () => {
      process.env.JWT_SECRET = 'short_secret';

      validateEnv();

      expect(logger.error).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should pass when JWT_SECRET is exactly 32 characters', () => {
      process.env.JWT_SECRET = '12345678901234567890123456789012';

      const result = validateEnv();

      expect(result).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should pass when JWT_SECRET is more than 32 characters', () => {
      process.env.JWT_SECRET = 'a_very_secure_secret_key_with_more_than_32_characters';

      const result = validateEnv();

      expect(result).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should fail when JWT_SECRET is a weak default value "secret"', () => {
      process.env.JWT_SECRET = 'secret';

      validateEnv();

      expect(logger.error).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when JWT_SECRET is "jwt_secret"', () => {
      process.env.JWT_SECRET = 'jwt_secret';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when JWT_SECRET is "change_me"', () => {
      process.env.JWT_SECRET = 'change_me';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when JWT_SECRET is "please_change_this"', () => {
      process.env.JWT_SECRET = 'please_change_this';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when JWT_SECRET is the default example value', () => {
      process.env.JWT_SECRET = 'your_super_secret_jwt_key_change_this_in_production';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('NODE_ENV Defaults', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a_very_secure_secret_key_with_more_than_32_characters';
    });

    it('should set NODE_ENV to production if not set', () => {
      delete process.env.NODE_ENV;

      validateEnv();

      expect(process.env.NODE_ENV).toBe('production');
      expect(logger.warn).toHaveBeenCalledWith('⚠️  NODE_ENV not set, defaulting to "production" for security');
    });

    it('should keep existing NODE_ENV value', () => {
      process.env.NODE_ENV = 'development';

      validateEnv();

      expect(process.env.NODE_ENV).toBe('development');
    });
  });

  describe('PORT Validation', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a_very_secure_secret_key_with_more_than_32_characters';
    });

    it('should pass with valid PORT', () => {
      process.env.PORT = '5000';

      const result = validateEnv();

      expect(result).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should pass when PORT is not set', () => {
      delete process.env.PORT;

      const result = validateEnv();

      expect(result).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should fail when PORT is not a number', () => {
      process.env.PORT = 'not_a_number';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when PORT is 0', () => {
      process.env.PORT = '0';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when PORT is negative', () => {
      process.env.PORT = '-1';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when PORT is greater than 65535', () => {
      process.env.PORT = '65536';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should pass with PORT 1', () => {
      process.env.PORT = '1';

      const result = validateEnv();

      expect(result).toBe(true);
    });

    it('should pass with PORT 65535', () => {
      process.env.PORT = '65535';

      const result = validateEnv();

      expect(result).toBe(true);
    });
  });

  describe('CORS_ORIGIN Validation', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a_very_secure_secret_key_with_more_than_32_characters';
    });

    it('should pass with valid http origin', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000';

      const result = validateEnv();

      expect(result).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should pass with valid https origin', () => {
      process.env.CORS_ORIGIN = 'https://example.com';

      const result = validateEnv();

      expect(result).toBe(true);
    });

    it('should pass with multiple valid origins', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000,https://example.com';

      const result = validateEnv();

      expect(result).toBe(true);
    });

    it('should pass with multiple origins with spaces', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000, https://example.com, http://test.com';

      const result = validateEnv();

      expect(result).toBe(true);
    });

    it('should fail with origin missing protocol', () => {
      process.env.CORS_ORIGIN = 'localhost:3000';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail with invalid protocol', () => {
      process.env.CORS_ORIGIN = 'ftp://localhost:3000';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should fail when one of multiple origins is invalid', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000,invalid_origin';

      validateEnv();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should pass when CORS_ORIGIN is not set', () => {
      delete process.env.CORS_ORIGIN;

      const result = validateEnv();

      expect(result).toBe(true);
      expect(mockExit).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Errors', () => {
    it('should report all validation errors at once', () => {
      delete process.env.MONGODB_URI;
      delete process.env.JWT_SECRET;
      process.env.PORT = 'invalid';
      process.env.CORS_ORIGIN = 'invalid_origin';

      validateEnv();

      expect(logger.error).toHaveBeenCalled();
      expect(logger.error.mock.calls.length).toBeGreaterThan(4); // Multiple error calls
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
