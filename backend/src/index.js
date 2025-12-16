require('dotenv').config();

// Validate environment variables before starting
const validateEnv = require('./config/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const blockchainService = require('./services/blockchainService');
const authRoutes = require('./routes/authRoutes');
const todoRoutes = require('./routes/todoRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Validate environment variables at startup
 */
function validateEnvironment() {
  const insecureSecrets = [
    'your_super_secret_jwt_key_change_this_in_production',
    'secret',
    'change_me',
    'jwt_secret',
    'test'
  ];

  const secret = process.env.JWT_SECRET || '';

  if (insecureSecrets.includes(secret.toLowerCase()) || secret.length < 32) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('⚠️  SECURITY ERROR: JWT_SECRET is not set or is insecure!');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('Please set a strong JWT_SECRET in your .env file');
    logger.error('Minimum 32 characters required');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (process.env.NODE_ENV === 'production') {
      logger.error('Exiting due to security risk in production...');
      process.exit(1);
    } else {
      logger.warn('⚠️  Continuing in development mode with insecure JWT_SECRET');
    }
  }

  // Validate required environment variables
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    logger.error('Please check your .env file');
    process.exit(1);
  }

  logger.info('✓ Environment validation passed');
}

// Validate environment before initializing app
validateEnvironment();

// Middleware
app.use(helmet()); // Security headers

// Improved CORS with multiple origins support
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3000'];

// Validate CORS origins format
corsOrigins.forEach(origin => {
  if (!origin.match(/^https?:\/\/.+/)) {
    logger.warn(`⚠️  Invalid CORS origin format: "${origin}". Should start with http:// or https://`);
  }
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    if (corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`⚠️  Blocked CORS request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400 // 24 hours
}));

app.use(requestLogger); // Request logging with correlation IDs
app.use(express.json({ limit: '10kb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Prevent large payload attacks

// Rate limiting - Standard limiter for most endpoints
const standardLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for expensive blockchain operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes for expensive operations
  message: { success: false, error: 'Too many requests for this operation, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', standardLimiter);

// Export limiters for use in routes
app.locals.strictLimiter = strictLimiter;

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize application
let server;
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✓ MongoDB connected successfully');

    // Initialize blockchain service (connect to networks and start event listeners)
    await blockchainService.initialize();
    logger.info('✓ Blockchain service initialized');

    // Start server and store reference
    server = app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✓ CORS enabled for: ${corsOrigins.join(', ')}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Enhanced graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn('⚠️  Forced shutdown');
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info(`\n${signal} received, starting graceful shutdown...`);

  // Set shutdown timeout (force exit after 30 seconds)
  const shutdownTimeout = setTimeout(() => {
    logger.error('❌ Shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 30000);

  try {
    // Stop accepting new requests
    if (server) {
      server.close(() => {
        logger.info('✓ HTTP server closed');
      });
    }

    // Cleanup blockchain listeners
    logger.info('Cleaning up blockchain service...');
    await blockchainService.cleanup();

    // Close MongoDB connection
    logger.info('Closing MongoDB connection...');
    const mongoose = require('mongoose');
    await mongoose.connection.close(false);
    logger.info('✓ MongoDB connection closed');

    clearTimeout(shutdownTimeout);
    logger.info('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', { error: error.message, stack: error.stack });
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = app; // For testing
