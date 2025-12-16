const errorHandler = require('../../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should return error with stack trace in development', () => {
      const error = new Error('Test error');
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        stack: expect.any(String),
      });
    });

    it('should default to 500 status code if not specified', () => {
      const error = new Error('Internal error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterAll(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should return error without stack trace in production', () => {
      const error = new Error('Production error');
      error.statusCode = 403;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Production error',
      });
      expect(res.json).not.toHaveBeenCalledWith(
        expect.objectContaining({ stack: expect.anything() })
      );
    });

    it('should handle generic errors safely', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unexpected error',
      });
    });
  });

  describe('Error Types', () => {
    it('should handle ValidationError (400)', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        field1: { message: 'Field 1 is required' },
        field2: { message: 'Field 2 is invalid' },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        details: expect.any(Array),
      });
    });

    it('should handle UnauthorizedError (401)', () => {
      const error = new Error('Unauthorized');
      error.statusCode = 401;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle custom status codes', () => {
      const error = new Error('Custom error');
      error.statusCode = 418; // I'm a teapot

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(418);
    });
  });
});
