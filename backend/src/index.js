require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const blockchainService = require('./services/blockchainService');
const todoRoutes = require('./routes/todoRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');

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
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('⚠️  SECURITY ERROR: JWT_SECRET is not set or is insecure!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Please set a strong JWT_SECRET in your .env file');
    console.error('Minimum 32 characters required');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting due to security risk in production...');
      process.exit(1);
    } else {
      console.warn('⚠️  Continuing in development mode with insecure JWT_SECRET');
    }
  }

  // Validate required environment variables
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please check your .env file');
    process.exit(1);
  }

  console.log('✓ Environment validation passed');
}

// Validate environment before initializing app
validateEnvironment();

// Middleware
app.use(helmet()); // Security headers

// Improved CORS with multiple origins support
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Blocked CORS request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400 // 24 hours
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/todos', todoRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize application
let server;
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✓ MongoDB connected successfully');

    // Initialize blockchain service (connect to networks and start event listeners)
    await blockchainService.initialize();
    console.log('✓ Blockchain service initialized');

    // Start server and store reference
    server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ CORS enabled for: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Enhanced graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log('⚠️  Forced shutdown');
    process.exit(1);
  }

  isShuttingDown = true;
  console.log(`\n${signal} received, starting graceful shutdown...`);

  // Set shutdown timeout (force exit after 30 seconds)
  const shutdownTimeout = setTimeout(() => {
    console.error('❌ Shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 30000);

  try {
    // Stop accepting new requests
    if (server) {
      server.close(() => {
        console.log('✓ HTTP server closed');
      });
    }

    // Cleanup blockchain listeners
    console.log('Cleaning up blockchain service...');
    await blockchainService.cleanup();

    // Close MongoDB connection
    console.log('Closing MongoDB connection...');
    const mongoose = require('mongoose');
    await mongoose.connection.close(false);
    console.log('✓ MongoDB connection closed');

    clearTimeout(shutdownTimeout);
    console.log('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = app; // For testing
