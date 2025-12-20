const requestLogger = require('../../../src/middleware/requestLogger');
const logger = require('../../../src/utils/logger');

jest.mock('../../../src/utils/logger');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
}));

describe('Request Logger Middleware', () => {
  let req, res, next;
  let mockChildLogger;

  beforeEach(() => {
    mockChildLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    logger.child = jest.fn(() => mockChildLogger);

    req = {
      headers: {
        'user-agent': 'Test User Agent'
      },
      method: 'GET',
      url: '/api/test',
      path: '/api/test',
      query: {},
      body: {},
      ip: '127.0.0.1'
    };

    res = {
      send: jest.fn(function(data) {
        return res;
      }),
      setHeader: jest.fn(),
      statusCode: 200
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('Request ID Management', () => {
    it('should generate a new request ID if not provided', () => {
      requestLogger(req, res, next);

      expect(req.requestId).toBe('test-uuid-1234');
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'test-uuid-1234');
    });

    it('should use existing request ID from headers', () => {
      req.headers['x-request-id'] = 'existing-request-id';

      requestLogger(req, res, next);

      expect(req.requestId).toBe('existing-request-id');
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-request-id');
    });
  });

  describe('Child Logger Creation', () => {
    it('should create child logger with request context', () => {
      requestLogger(req, res, next);

      expect(logger.child).toHaveBeenCalledWith({
        requestId: 'test-uuid-1234',
        ip: '127.0.0.1',
        userAgent: 'Test User Agent'
      });
      expect(req.logger).toBe(mockChildLogger);
    });
  });

  describe('Request Logging', () => {
    it('should log incoming request with details', () => {
      req.query = { page: '1', limit: '10' };
      req.body = { name: 'Test' };

      requestLogger(req, res, next);

      expect(mockChildLogger.info).toHaveBeenCalledWith('Incoming request', {
        method: 'GET',
        url: '/api/test',
        path: '/api/test',
        query: { page: '1', limit: '10' },
        body: { name: 'Test' }
      });
    });

    it('should sanitize sensitive fields in request body', () => {
      req.body = {
        username: 'testuser',
        password: 'secret123',
        privateKey: '0xabcdef',
        secret: 'my-secret',
        token: 'bearer-token'
      };

      requestLogger(req, res, next);

      expect(mockChildLogger.info).toHaveBeenCalledWith('Incoming request', {
        method: 'GET',
        url: '/api/test',
        path: '/api/test',
        query: {},
        body: {
          username: 'testuser',
          password: '[REDACTED]',
          privateKey: '[REDACTED]',
          secret: '[REDACTED]',
          token: '[REDACTED]'
        }
      });
    });

    it('should handle non-object request body', () => {
      req.body = null;

      requestLogger(req, res, next);

      expect(mockChildLogger.info).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
        body: null
      }));
    });

    it('should handle string request body', () => {
      req.body = 'plain text';

      requestLogger(req, res, next);

      expect(mockChildLogger.info).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
        body: 'plain text'
      }));
    });
  });

  describe('Response Logging', () => {
    it('should log successful response with timing', () => {
      requestLogger(req, res, next);

      // Simulate response
      res.send('response data');

      expect(mockChildLogger.info).toHaveBeenCalledWith('Outgoing response', {
        method: 'GET',
        url: '/api/test',
        statusCode: 200,
        responseTime: expect.stringMatching(/^\d+ms$/)
      });
    });

    it('should log error response with warn level', () => {
      res.statusCode = 404;
      requestLogger(req, res, next);

      res.send({ error: 'Not found' });

      expect(mockChildLogger.warn).toHaveBeenCalledWith('Outgoing response', {
        method: 'GET',
        url: '/api/test',
        statusCode: 404,
        responseTime: expect.stringMatching(/^\d+ms$/)
      });
    });

    it('should use warn level for 400 status codes', () => {
      res.statusCode = 400;
      requestLogger(req, res, next);

      res.send({ error: 'Bad request' });

      expect(mockChildLogger.warn).toHaveBeenCalled();
    });

    it('should use warn level for 500 status codes', () => {
      res.statusCode = 500;
      requestLogger(req, res, next);

      res.send({ error: 'Internal error' });

      expect(mockChildLogger.warn).toHaveBeenCalled();
    });

    it('should use info level for 200 status codes', () => {
      res.statusCode = 200;
      requestLogger(req, res, next);

      res.send({ success: true });

      expect(mockChildLogger.info).toHaveBeenCalledTimes(2); // incoming + outgoing
    });

    it('should use info level for 201 status codes', () => {
      res.statusCode = 201;
      requestLogger(req, res, next);

      res.send({ success: true });

      expect(mockChildLogger.info).toHaveBeenCalledTimes(2);
    });

    it('should use info level for 304 status codes', () => {
      res.statusCode = 304;
      requestLogger(req, res, next);

      res.send('');

      expect(mockChildLogger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('Response Time Calculation', () => {
    it('should calculate response time', (done) => {
      requestLogger(req, res, next);

      setTimeout(() => {
        res.send('data');

        const responseLogCall = mockChildLogger.info.mock.calls.find(
          call => call[0] === 'Outgoing response'
        );
        const responseTime = parseInt(responseLogCall[1].responseTime);

        expect(responseTime).toBeGreaterThan(10);
        expect(responseTime).toBeLessThan(100);
        done();
      }, 15);
    });
  });

  describe('Middleware Flow', () => {
    it('should call next() to continue middleware chain', () => {
      requestLogger(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow response to be sent after middleware', () => {
      requestLogger(req, res, next);

      const result = res.send('test data');

      expect(res.send).toHaveBeenCalledWith('test data');
      expect(result).toBe(res);
    });
  });

  describe('Request Body Sanitization', () => {
    it('should only redact specified sensitive fields', () => {
      req.body = {
        username: 'testuser',
        password: 'secret',
        email: 'test@example.com',
        apiKey: 'should-not-be-redacted'
      };

      requestLogger(req, res, next);

      const logCall = mockChildLogger.info.mock.calls[0];
      expect(logCall[1].body).toEqual({
        username: 'testuser',
        password: '[REDACTED]',
        email: 'test@example.com',
        apiKey: 'should-not-be-redacted'
      });
    });

    it('should not modify original request body', () => {
      req.body = {
        username: 'testuser',
        password: 'secret'
      };

      requestLogger(req, res, next);

      expect(req.body.password).toBe('secret'); // Original should not be modified
    });
  });
});
