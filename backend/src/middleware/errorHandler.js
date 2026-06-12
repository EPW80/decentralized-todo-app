const logger = require("../utils/logger");

const errorHandler = (err, req, res, _next) => {
  // Put details in the log message itself: hosted log viewers (Railway, etc.)
  // often surface only the message string and drop structured metadata.
  const codeTag = err.code !== undefined ? ` code=${err.code}` : "";
  logger.error(
    `Error: ${err.name || "Error"}${codeTag} ${req.method} ${req.originalUrl} - ${err.message}`,
  );
  if (process.env.NODE_ENV === "development") {
    logger.error(err.stack || "(no stack)");
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      details: errors,
    });
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: "Invalid ID format",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expired",
    });
  }

  // Blockchain/ethers errors (err.code may be a number for other error types,
  // e.g. Mongo duplicate key 11000 — guard before calling startsWith)
  if (typeof err.code === "string" && err.code.startsWith("CALL_EXCEPTION")) {
    return res.status(400).json({
      success: false,
      error: "Blockchain transaction failed",
      // Only include details in development
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
