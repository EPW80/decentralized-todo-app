const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const todoRoutes = require('../../../src/routes/todoRoutes');
const todoController = require('../../../src/controllers/todoController');
const { validateAddress } = require('../../../src/middleware/auth');

// Mock dependencies
jest.mock('../../../src/controllers/todoController');
jest.mock('../../../src/utils/logger');

describe('Todo Routes Integration Tests', () => {
  let app;
  let token;
  const testAddress = '0x1234567890123456789012345678901234567890';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/todos', todoRoutes);

    // Generate valid JWT token for tests
    token = jwt.sign({ address: testAddress }, process.env.JWT_SECRET, { expiresIn: '1d' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/todos/:address', () => {
    it('should require JWT authentication', async () => {
      await request(app)
        .get(`/api/todos/${testAddress}`)
        .expect(401);
    });

    it('should call getTodosByAddress with valid token', async () => {
      todoController.getTodosByAddress.mockImplementation((req, res) => {
        res.json({ success: true, data: [] });
      });

      await request(app)
        .get(`/api/todos/${testAddress}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(todoController.getTodosByAddress).toHaveBeenCalled();
    });

    it('should enforce ownership - reject accessing other address', async () => {
      const otherAddress = '0x9999999999999999999999999999999999999999';

      await request(app)
        .get(`/api/todos/${otherAddress}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should accept query parameters', async () => {
      todoController.getTodosByAddress.mockImplementation((req, res) => {
        res.json({ success: true, data: [] });
      });

      await request(app)
        .get(`/api/todos/${testAddress}?includeCompleted=true&includeDeleted=false`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('GET /api/todos/:address/stats', () => {
    it('should require JWT authentication', async () => {
      await request(app)
        .get(`/api/todos/${testAddress}/stats`)
        .expect(401);
    });

    it('should call getUserStats with valid token', async () => {
      todoController.getUserStats.mockImplementation((req, res) => {
        res.json({ success: true, data: { total: 0, completed: 0, active: 0 } });
      });

      await request(app)
        .get(`/api/todos/${testAddress}/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(todoController.getUserStats).toHaveBeenCalled();
    });

    it('should enforce ownership', async () => {
      const otherAddress = '0x9999999999999999999999999999999999999999';

      await request(app)
        .get(`/api/todos/${otherAddress}/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('GET /api/todos/todo/:id', () => {
    it('should require JWT authentication', async () => {
      await request(app)
        .get('/api/todos/todo/507f1f77bcf86cd799439011')
        .expect(401);
    });

    it('should call getTodoById with valid token', async () => {
      todoController.getTodoById.mockImplementation((req, res) => {
        res.json({ success: true, data: {} });
      });

      await request(app)
        .get('/api/todos/todo/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(todoController.getTodoById).toHaveBeenCalled();
    });
  });

  describe('GET /api/todos/verify/:id', () => {
    it('should require JWT authentication', async () => {
      await request(app)
        .get('/api/todos/verify/507f1f77bcf86cd799439011')
        .expect(401);
    });

    it('should call verifyTodo with valid token', async () => {
      todoController.verifyTodo.mockImplementation((req, res) => {
        res.json({ success: true, data: { isValid: true } });
      });

      await request(app)
        .get('/api/todos/verify/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(todoController.verifyTodo).toHaveBeenCalled();
    });

    it('should apply strict rate limiting (10 requests per 15 min)', async () => {
      todoController.verifyTodo.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      // Make 11 requests
      const requests = [];
      for (let i = 0; i < 11; i++) {
        requests.push(
          request(app)
            .get('/api/todos/verify/507f1f77bcf86cd799439011')
            .set('Authorization', `Bearer ${token}`)
        );
      }

      const responses = await Promise.all(requests);

      // First 10 should succeed, 11th should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/todos/sync', () => {
    it('should require JWT authentication', async () => {
      await request(app)
        .post('/api/todos/sync')
        .send({ chainId: 31337, blockchainId: '1' })
        .expect(401);
    });

    it('should apply strict rate limiting', async () => {
      todoController.syncTodoFromBlockchain.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const requests = [];
      for (let i = 0; i < 11; i++) {
        requests.push(
          request(app)
            .post('/api/todos/sync')
            .set('Authorization', `Bearer ${token}`)
            .send({ chainId: 31337, blockchainId: `${i}` })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/todos/restore', () => {
    it('should require JWT authentication', async () => {
      await request(app)
        .post('/api/todos/restore')
        .send({ id: '507f1f77bcf86cd799439011' })
        .expect(401);
    });

    it('should apply strict rate limiting', async () => {
      todoController.restoreTodo.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const requests = [];
      for (let i = 0; i < 11; i++) {
        requests.push(
          request(app)
            .post('/api/todos/restore')
            .set('Authorization', `Bearer ${token}`)
            .send({ id: '507f1f77bcf86cd799439011' })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('optionalAuth middleware behavior', () => {
    it('should allow requests without token', async () => {
      // This route doesn't exist but would test the middleware
      // The optionalAuth middleware is tested indirectly through the routes
    });
  });
});
