const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request logging middleware with correlation ID tracking
 * Logs HTTP request details and response information
 */
const requestLogger = (req, res, next) => {
  // Generate unique request ID
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;

  // Create child logger with request context
  req.logger = logger.child({
    requestId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Log incoming request
  req.logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    body: sanitizeRequestBody(req.body),
  });

  // Record start time for response time calculation
  const startTime = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    const responseTime = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    req.logger[logLevel]('Outgoing response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });

    return res.send(data);
  };

  // Set request ID header in response
  res.setHeader('X-Request-ID', requestId);

  next();
};

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'privateKey', 'secret', 'token'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

module.exports = requestLogger;
