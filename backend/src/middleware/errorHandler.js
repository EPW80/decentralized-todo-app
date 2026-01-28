const logger = require("../utils/logger");

const errorHandler = (err, req, res, _next) => {
  // Log full error internally (for debugging)
  if (process.env.NODE_ENV === "development") {
    logger.error("Error:", { error: err.message, stack: err.stack });
  } else {
    // In production, log sanitized version
    logger.error("Error:", {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
    });
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

  // Blockchain/ethers errors
  if (err.code && err.code.startsWith("CALL_EXCEPTION")) {
    // Log full error internally for debugging
    logger.error("Blockchain error details:", {
      error: err.message,
      stack: err.stack,
    });

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
