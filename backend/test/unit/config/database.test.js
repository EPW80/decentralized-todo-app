const mongoose = require('mongoose');
const connectDB = require('../../../src/config/database');
const logger = require('../../../src/utils/logger');

jest.mock('mongoose');
jest.mock('../../../src/utils/logger');

describe('Database Connection', () => {
  let originalEnv;
  let mockConnection;

  beforeEach(() => {
    originalEnv = { ...process.env };

    mockConnection = {
      on: jest.fn()
    };

    mongoose.connect = jest.fn().mockResolvedValue(mockConnection);
    mongoose.connection = mockConnection;

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('connectDB', () => {
    it('should connect to MongoDB with provided URI', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test-db',
        {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000
        }
      );
    });

    it('should use default URI when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/decentralized-todo',
        expect.any(Object)
      );
    });

    it('should return connection object', async () => {
      const connection = await connectDB();

      expect(connection).toBe(mockConnection);
    });

    it('should register error event handler', async () => {
      await connectDB();

      expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should register disconnected event handler', async () => {
      await connectDB();

      expect(mockConnection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    });

    it('should register reconnected event handler', async () => {
      await connectDB();

      expect(mockConnection.on).toHaveBeenCalledWith('reconnected', expect.any(Function));
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed: mongodb://user:pass@localhost:27017/db');
      mongoose.connect = jest.fn().mockRejectedValue(error);

      await expect(connectDB()).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Error connecting to MongoDB:',
        expect.objectContaining({
          error: expect.stringContaining('mongodb://*****@')
        })
      );
    });

    it('should handle connection errors without message', async () => {
      const error = { name: 'MongoError' };
      mongoose.connect = jest.fn().mockRejectedValue(error);

      await expect(connectDB()).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Error connecting to MongoDB:',
        { error: 'Connection failed' }
      );
    });

    it('should use correct connection options', async () => {
      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000
        })
      );
    });
  });

  describe('Event Handlers', () => {
    it('should log error event with sanitized message', async () => {
      await connectDB();

      const errorHandler = mockConnection.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];

      const error = new Error('Connection error: mongodb://user:pass@localhost:27017/db');
      errorHandler(error);

      expect(logger.error).toHaveBeenCalledWith(
        'MongoDB connection error:',
        expect.objectContaining({
          error: expect.stringContaining('mongodb://*****@')
        })
      );
    });

    it('should log error event without message', async () => {
      await connectDB();

      const errorHandler = mockConnection.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];

      const error = { name: 'MongoError' };
      errorHandler(error);

      expect(logger.error).toHaveBeenCalledWith(
        'MongoDB connection error:',
        { error: 'Connection error' }
      );
    });

    it('should log disconnected event', async () => {
      await connectDB();

      const disconnectHandler = mockConnection.on.mock.calls.find(
        call => call[0] === 'disconnected'
      )[1];

      disconnectHandler();

      expect(logger.warn).toHaveBeenCalledWith('MongoDB disconnected. Attempting to reconnect...');
    });

    it('should log reconnected event', async () => {
      await connectDB();

      const reconnectHandler = mockConnection.on.mock.calls.find(
        call => call[0] === 'reconnected'
      )[1];

      reconnectHandler();

      expect(logger.info).toHaveBeenCalledWith('MongoDB reconnected successfully');
    });
  });

  describe('URI Sanitization', () => {
    it('should sanitize MongoDB URI with credentials', async () => {
      const error = new Error('mongodb://user:password@cluster.mongodb.net/db');
      mongoose.connect = jest.fn().mockRejectedValue(error);

      await expect(connectDB()).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Error connecting to MongoDB:',
        expect.objectContaining({
          error: expect.not.stringContaining('password')
        })
      );
    });

    it('should sanitize MongoDB+SRV URI with credentials', async () => {
      const error = new Error('mongodb+srv://user:password@cluster.mongodb.net/db');
      mongoose.connect = jest.fn().mockRejectedValue(error);

      await expect(connectDB()).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Error connecting to MongoDB:',
        expect.objectContaining({
          error: expect.not.stringContaining('password')
        })
      );
    });

    it('should sanitize MongoDB URI without credentials', async () => {
      const error = new Error('mongodb://localhost:27017/db');
      mongoose.connect = jest.fn().mockRejectedValue(error);

      await expect(connectDB()).rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
