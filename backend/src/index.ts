import "dotenv/config";

// Validate environment variables before starting
// eslint-disable-next-line @typescript-eslint/no-var-requires
const validateEnv = require("./config/validateEnv");
validateEnv();

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import http from "http";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const connectDB = require("./config/database");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const blockchainService = require("./services/blockchainService");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const authRoutes = require("./routes/authRoutes");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const todoRoutes = require("./routes/todoRoutes");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const healthRoutes = require("./routes/healthRoutes");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const errorHandler = require("./middleware/errorHandler");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require("./utils/logger");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const requestLogger = require("./middleware/requestLogger");

const app: Application = express();
const PORT = process.env.PORT || 5000;

/**
 * Validate environment variables at startup
 */
function validateEnvironment(): void {
  const insecureSecrets = [
    "your_super_secret_jwt_key_change_this_in_production",
    "secret",
    "change_me",
    "jwt_secret",
    "test",
  ];

  const secret = process.env.JWT_SECRET || "";

  if (insecureSecrets.includes(secret.toLowerCase()) || secret.length < 32) {
    logger.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.error("⚠️  SECURITY ERROR: JWT_SECRET is not set or is insecure!");
    logger.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.error("Please set a strong JWT_SECRET in your .env file");
    logger.error("Minimum 32 characters required");
    logger.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (process.env.NODE_ENV === "production") {
      logger.error("Exiting due to security risk in production...");
      process.exit(1);
    } else {
      logger.warn(
        "⚠️  Continuing in development mode with insecure JWT_SECRET",
      );
    }
  }

  // Validate required environment variables
  const required = ["MONGODB_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    logger.error("Please check your .env file");
    process.exit(1);
  }

  logger.info("✓ Environment validation passed");
}

// Validate environment before initializing app
validateEnvironment();

// Middleware
app.use(helmet()); // Security headers

// Improved CORS with multiple origins support
const corsOriginEnv = process.env.CORS_ORIGIN || "http://localhost:3000";
const allowAllOrigins = corsOriginEnv === "*";
const corsOrigins = allowAllOrigins
  ? []
  : corsOriginEnv.split(",").map((o) => o.trim());

// Validate CORS origins format
if (!allowAllOrigins) {
  corsOrigins.forEach((origin) => {
    if (!origin.match(/^https?:\/\/.+/)) {
      logger.warn(
        `⚠️  Invalid CORS origin format: "${origin}". Should start with http:// or https://`,
      );
    }
  });
}

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowAllOrigins || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(
          `⚠️  Blocked CORS request from unauthorized origin: ${origin}`,
        );
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
);

app.use(requestLogger); // Request logging with correlation IDs
app.use(express.json({ limit: "10kb" })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // Prevent large payload attacks

// Rate limiting - Standard limiter for most endpoints
const standardLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "") || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "") || 100,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for expensive blockchain operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes for expensive operations
  message: {
    success: false,
    error: "Too many requests for this operation, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", standardLimiter);

// Export limiters for use in routes
app.locals["strictLimiter"] = strictLimiter;

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize application
let server: http.Server | undefined;

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info("✓ MongoDB connected successfully");

    // Initialize blockchain service (connect to networks and start event listeners)
    await blockchainService.initialize();
    logger.info("✓ Blockchain service initialized");

    // Start server and store reference
    server = app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`✓ CORS enabled for: ${corsOrigins.join(", ")}`);
    });
  } catch (error) {
    const err = error as Error;
    logger.error("Failed to start server:", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

// Enhanced graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn("⚠️  Forced shutdown");
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info(`\n${signal} received, starting graceful shutdown...`);

  // Set shutdown timeout (force exit after 30 seconds)
  const shutdownTimeout = setTimeout(() => {
    logger.error("❌ Shutdown timeout exceeded, forcing exit");
    process.exit(1);
  }, 30000);

  try {
    // Stop accepting new requests
    if (server) {
      server.close(() => {
        logger.info("✓ HTTP server closed");
      });
    }

    // Cleanup blockchain listeners
    logger.info("Cleaning up blockchain service...");
    await blockchainService.cleanup();

    // Close MongoDB connection
    logger.info("Closing MongoDB connection...");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mongoose = require("mongoose");
    await mongoose.connection.close(false);
    logger.info("✓ MongoDB connection closed");

    clearTimeout(shutdownTimeout);
    logger.info("✓ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    const err = error as Error;
    logger.error("❌ Error during shutdown:", {
      error: err.message,
      stack: err.stack,
    });
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();

module.exports = app; // For testing
