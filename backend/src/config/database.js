const mongoose = require("mongoose");
const logger = require("../utils/logger");

/**
 * Sanitize MongoDB connection string for logging
 * Removes credentials and sensitive connection details
 */
const sanitizeMongoURI = (uri) => {
  if (!uri) return '[NO URI]';
  return uri.replace(/mongodb(\+srv)?:\/\/([^@]+@)?([^/]+)/g, 'mongodb://*****@$3');
};

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/decentralized-todo";

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);

    mongoose.connection.on("error", (err) => {
      const sanitizedError = err.message ? sanitizeMongoURI(err.message) : 'Connection error';
      logger.error("MongoDB connection error:", { error: sanitizedError });
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected successfully");
    });

    return mongoose.connection;
  } catch (error) {
    const sanitizedError = error.message ? sanitizeMongoURI(error.message) : 'Connection failed';
    logger.error("Error connecting to MongoDB:", { error: sanitizedError });
    throw new Error('Database connection failed');
  }
};

module.exports = connectDB;
