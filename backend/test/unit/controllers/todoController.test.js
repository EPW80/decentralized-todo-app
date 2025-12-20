const todoController = require('../../../src/controllers/todoController');
const Todo = require('../../../src/models/Todo');
const blockchainService = require('../../../src/services/blockchainService');

// Mock dependencies
jest.mock('../../../src/models/Todo');
jest.mock('../../../src/services/blockchainService');
jest.mock('../../../src/utils/logger');

describe('Todo Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {}
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getTodosByAddress', () => {
    it('should return all todos for an address', async () => {
      req.params.address = '0x123';
      const mockTodos = [
        { _id: '1', description: 'Test 1', owner: '0x123', chainId: 31337 },
        { _id: '2', description: 'Test 2', owner: '0x123', chainId: 31337 }
      ];
      Todo.findByOwner.mockResolvedValue(mockTodos);

      await todoController.getTodosByAddress(req, res, next);

      expect(Todo.findByOwner).toHaveBeenCalledWith('0x123', true, false);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockTodos
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should include completed todos when includeCompleted is true', async () => {
      req.params.address = '0x123';
      req.query.includeCompleted = 'true';
      Todo.findByOwner.mockResolvedValue([]);

      await todoController.getTodosByAddress(req, res, next);

      expect(Todo.findByOwner).toHaveBeenCalledWith('0x123', true, false);
    });

    it('should exclude completed todos when includeCompleted is false', async () => {
      req.params.address = '0x123';
      req.query.includeCompleted = 'false';
      Todo.findByOwner.mockResolvedValue([]);

      await todoController.getTodosByAddress(req, res, next);

      expect(Todo.findByOwner).toHaveBeenCalledWith('0x123', false, false);
    });

    it('should include deleted todos when includeDeleted is true', async () => {
      req.params.address = '0x123';
      req.query.includeDeleted = 'true';
      Todo.findByOwner.mockResolvedValue([]);

      await todoController.getTodosByAddress(req, res, next);

      expect(Todo.findByOwner).toHaveBeenCalledWith('0x123', true, true);
    });

    it('should handle errors', async () => {
      req.params.address = '0x123';
      const error = new Error('Database error');
      Todo.findByOwner.mockRejectedValue(error);

      await todoController.getTodosByAddress(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTodoById', () => {
    it('should return a todo by ID', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      const mockTodo = { _id: '507f1f77bcf86cd799439011', description: 'Test' };
      Todo.findById.mockResolvedValue(mockTodo);

      await todoController.getTodoById(req, res, next);

      expect(Todo.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTodo
      });
    });

    it('should return 404 when todo not found', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      Todo.findById.mockResolvedValue(null);

      await todoController.getTodoById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Todo not found'
      });
    });

    it('should handle errors', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      const error = new Error('Database error');
      Todo.findById.mockRejectedValue(error);

      await todoController.getTodoById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('verifyTodo', () => {
    it('should verify todo against blockchain successfully', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      const mockTodo = {
        _id: '507f1f77bcf86cd799439011',
        chainId: 31337,
        blockchainId: '1',
        owner: '0x123',
        description: 'Test task',
        completed: false,
        deleted: false
      };
      const mockBlockchainTask = {
        owner: '0x123',
        description: 'Test task',
        completed: false,
        deleted: false
      };
      const mockContract = {
        getTask: jest.fn().mockResolvedValue(mockBlockchainTask)
      };

      Todo.findById.mockResolvedValue(mockTodo);
      blockchainService.getContract.mockReturnValue(mockContract);

      await todoController.verifyTodo(req, res, next);

      expect(blockchainService.getContract).toHaveBeenCalledWith(31337);
      expect(mockContract.getTask).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          isValid: true,
          cached: expect.any(Object),
          blockchain: expect.any(Object)
        })
      });
    });

    it('should detect mismatch between cached and blockchain data', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      const mockTodo = {
        chainId: 31337,
        blockchainId: '1',
        owner: '0x123',
        description: 'Test task',
        completed: false,
        deleted: false
      };
      const mockBlockchainTask = {
        owner: '0x123',
        description: 'Different description',
        completed: true,
        deleted: false
      };
      const mockContract = {
        getTask: jest.fn().mockResolvedValue(mockBlockchainTask)
      };

      Todo.findById.mockResolvedValue(mockTodo);
      blockchainService.getContract.mockReturnValue(mockContract);

      await todoController.verifyTodo(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          isValid: false
        })
      });
    });

    it('should return 404 when todo not found', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      Todo.findById.mockResolvedValue(null);

      await todoController.verifyTodo(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Todo not found'
      });
    });

    it('should return 500 when blockchain network not available', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      const mockTodo = { chainId: 31337, blockchainId: '1' };
      Todo.findById.mockResolvedValue(mockTodo);
      blockchainService.getContract.mockReturnValue(null);

      await todoController.verifyTodo(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Blockchain network not available'
      });
    });

    it('should handle blockchain errors gracefully', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      const mockTodo = {
        chainId: 31337,
        blockchainId: '1'
      };
      const mockContract = {
        getTask: jest.fn().mockRejectedValue(new Error('Task not found'))
      };

      Todo.findById.mockResolvedValue(mockTodo);
      blockchainService.getContract.mockReturnValue(mockContract);

      await todoController.verifyTodo(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          isValid: false,
          error: 'Task not found on blockchain or has been deleted'
        }
      });
    });

    it('should handle general errors', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      const error = new Error('Database error');
      Todo.findById.mockRejectedValue(error);

      await todoController.verifyTodo(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      req.params.address = '0x123';
      Todo.countByOwner.mockResolvedValue(10);
      Todo.countDocuments
        .mockResolvedValueOnce(7) // completed
        .mockResolvedValueOnce(3); // active

      await todoController.getUserStats(req, res, next);

      expect(Todo.countByOwner).toHaveBeenCalledWith('0x123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          total: 10,
          completed: 7,
          active: 3,
          completionRate: '70.00'
        }
      });
    });

    it('should handle zero todos', async () => {
      req.params.address = '0x123';
      Todo.countByOwner.mockResolvedValue(0);
      Todo.countDocuments
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await todoController.getUserStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          total: 0,
          completed: 0,
          active: 0,
          completionRate: 0
        }
      });
    });

    it('should handle errors', async () => {
      req.params.address = '0x123';
      const error = new Error('Database error');
      Todo.countByOwner.mockRejectedValue(error);

      await todoController.getUserStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('syncTodoFromBlockchain', () => {
    it('should sync a new todo from blockchain', async () => {
      req.body = { chainId: 31337, blockchainId: '1' };
      const mockTask = {
        owner: '0x123',
        description: 'Test task',
        completed: false,
        deleted: false,
        createdAt: BigInt(1700000000),
        completedAt: BigInt(0),
        deletedAt: BigInt(0)
      };
      const mockContract = {
        getTask: jest.fn().mockResolvedValue(mockTask)
      };
      const mockTodo = {
        save: jest.fn().mockResolvedValue(true)
      };

      blockchainService.getContract.mockReturnValue(mockContract);
      Todo.findByBlockchainId.mockResolvedValue(null);
      Todo.mockImplementation(() => mockTodo);

      await todoController.syncTodoFromBlockchain(req, res, next);

      expect(blockchainService.getContract).toHaveBeenCalledWith(31337);
      expect(mockContract.getTask).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo synced from blockchain',
        data: mockTodo
      });
    });

    it('should update existing todo from blockchain', async () => {
      req.body = { chainId: 31337, blockchainId: '1' };
      const mockTask = {
        owner: '0x123',
        description: 'Updated description',
        completed: true,
        deleted: false,
        createdAt: BigInt(1700000000),
        completedAt: BigInt(1700001000),
        deletedAt: BigInt(0)
      };
      const mockContract = {
        getTask: jest.fn().mockResolvedValue(mockTask)
      };
      const mockTodo = {
        description: 'Old description',
        save: jest.fn().mockResolvedValue(true)
      };

      blockchainService.getContract.mockReturnValue(mockContract);
      Todo.findByBlockchainId.mockResolvedValue(mockTodo);

      await todoController.syncTodoFromBlockchain(req, res, next);

      expect(mockTodo.description).toBe('Updated description');
      expect(mockTodo.completed).toBe(true);
      expect(mockTodo.save).toHaveBeenCalled();
    });

    it('should return 400 when chainId is missing', async () => {
      req.body = { blockchainId: '1' };

      await todoController.syncTodoFromBlockchain(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'chainId and blockchainId are required'
      });
    });

    it('should return 400 when blockchainId is missing', async () => {
      req.body = { chainId: 31337 };

      await todoController.syncTodoFromBlockchain(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'chainId and blockchainId are required'
      });
    });

    it('should return 400 when blockchain not connected', async () => {
      req.body = { chainId: 31337, blockchainId: '1' };
      blockchainService.getContract.mockReturnValue(null);

      await todoController.syncTodoFromBlockchain(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid chainId or blockchain not connected'
      });
    });

    it('should return 404 when task not found on blockchain', async () => {
      req.body = { chainId: 31337, blockchainId: '999' };
      const mockContract = {
        getTask: jest.fn().mockRejectedValue(new Error('Task does not exist'))
      };
      blockchainService.getContract.mockReturnValue(mockContract);

      await todoController.syncTodoFromBlockchain(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Task not found on blockchain'
      });
    });

    it('should handle other errors', async () => {
      req.body = { chainId: 31337, blockchainId: '1' };
      const mockContract = {
        getTask: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      blockchainService.getContract.mockReturnValue(mockContract);

      await todoController.syncTodoFromBlockchain(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('restoreTodo', () => {
    it('should restore a deleted todo', async () => {
      req.body = { id: '507f1f77bcf86cd799439011' };
      const mockTodo = {
        _id: '507f1f77bcf86cd799439011',
        deleted: true,
        markAsRestored: jest.fn().mockResolvedValue(true)
      };
      Todo.findById.mockResolvedValue(mockTodo);

      await todoController.restoreTodo(req, res, next);

      expect(Todo.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockTodo.markAsRestored).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo restored successfully',
        data: mockTodo
      });
    });

    it('should return 400 when ID is missing', async () => {
      req.body = {};

      await todoController.restoreTodo(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Todo ID is required'
      });
    });

    it('should return 404 when todo not found', async () => {
      req.body = { id: '507f1f77bcf86cd799439011' };
      Todo.findById.mockResolvedValue(null);

      await todoController.restoreTodo(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Todo not found'
      });
    });

    it('should return 400 when todo is not deleted', async () => {
      req.body = { id: '507f1f77bcf86cd799439011' };
      const mockTodo = {
        _id: '507f1f77bcf86cd799439011',
        deleted: false
      };
      Todo.findById.mockResolvedValue(mockTodo);

      await todoController.restoreTodo(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Todo is not deleted'
      });
    });

    it('should handle errors', async () => {
      req.body = { id: '507f1f77bcf86cd799439011' };
      const error = new Error('Database error');
      Todo.findById.mockRejectedValue(error);

      await todoController.restoreTodo(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
