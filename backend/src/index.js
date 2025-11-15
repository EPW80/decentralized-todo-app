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

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/todos', todoRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize application
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✓ MongoDB connected successfully');

    // Initialize blockchain service (connect to networks and start event listeners)
    await blockchainService.initialize();
    console.log('✓ Blockchain service initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await blockchainService.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await blockchainService.cleanup();
  process.exit(0);
});

startServer();

module.exports = app; // For testing
