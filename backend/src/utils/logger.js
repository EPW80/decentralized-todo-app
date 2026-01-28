const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

// Define custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    fillExcept: ["message", "level", "timestamp", "label"],
  }),
  winston.format.json(),
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  }),
);

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || "info";
const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

// Configure transports
const transports = [];

// Console transport (always enabled in development/test)
if (!isProduction || process.env.ENABLE_CONSOLE_LOGS === "true") {
  transports.push(
    new winston.transports.Console({
      format: isProduction ? customFormat : consoleFormat,
      level: isTest ? "error" : logLevel, // Only errors in test mode to reduce noise
    }),
  );
}

// File transports (production and development)
if (!isTest) {
  // Error log - only error level
  transports.push(
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      format: customFormat,
      maxSize: "20m",
      maxFiles: "14d", // Keep 14 days of error logs
      zippedArchive: true,
    }),
  );

  // Combined log - all levels
  transports.push(
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      format: customFormat,
      maxSize: "20m",
      maxFiles: "7d", // Keep 7 days of combined logs
      zippedArchive: true,
    }),
  );
}

// Create the logger
const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  transports,
  // Don't exit on error
  exitOnError: false,
});

// Redact sensitive information from logs
const redactSensitiveData = (obj) => {
  const sensitiveKeys = [
    "password",
    "privateKey",
    "secret",
    "token",
    "apiKey",
    "authorization",
    "jwt",
  ];

  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof redacted[key] === "object" && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
};

// Create wrapper functions with redaction
const createLogMethod = (method) => {
  return (message, meta = {}) => {
    const redactedMeta = redactSensitiveData(meta);
    logger[method](message, redactedMeta);
  };
};

// Export wrapped logger with safe methods
module.exports = {
  error: createLogMethod("error"),
  warn: createLogMethod("warn"),
  info: createLogMethod("info"),
  debug: createLogMethod("debug"),

  // Stream for Morgan HTTP logger
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },

  // Child logger with request context
  child: (metadata) => {
    const childLogger = logger.child(redactSensitiveData(metadata));
    return {
      error: (message, meta = {}) =>
        childLogger.error(message, redactSensitiveData(meta)),
      warn: (message, meta = {}) =>
        childLogger.warn(message, redactSensitiveData(meta)),
      info: (message, meta = {}) =>
        childLogger.info(message, redactSensitiveData(meta)),
      debug: (message, meta = {}) =>
        childLogger.debug(message, redactSensitiveData(meta)),
    };
  },
};
