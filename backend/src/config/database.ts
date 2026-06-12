import mongoose from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require("../utils/logger");

/**
 * Sanitize MongoDB connection string for logging
 * Removes credentials and sensitive connection details
 */
const sanitizeMongoURI = (uri: string): string => {
  if (!uri) return "[NO URI]";
  return uri.replace(
    /mongodb(\+srv)?:\/\/([^@]+@)?([^/]+)/g,
    "mongodb://*****@$3",
  );
};

const connectDB = async (): Promise<mongoose.Connection> => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/decentralized-todo";

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);

    mongoose.connection.on("error", (err: Error) => {
      const sanitizedError = err.message
        ? sanitizeMongoURI(err.message)
        : "Connection error";
      logger.error("MongoDB connection error:", { error: sanitizedError });
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected successfully");
    });

    return mongoose.connection;
  } catch (error: unknown) {
    const err = error as Error & { code?: string | number };
    const sanitizedError = err.message
      ? sanitizeMongoURI(err.message)
      : "Connection failed";
    // Include name/code in the message itself: hosted log viewers (Railway, etc.)
    // often surface only the message string and drop structured metadata.
    const code = err.code !== undefined ? ` code=${err.code}` : "";
    logger.error(
      `Error connecting to MongoDB: ${err.name || "Error"}${code} - ${sanitizedError}`,
    );
    throw new Error("Database connection failed");
  }
};

module.exports = connectDB;
