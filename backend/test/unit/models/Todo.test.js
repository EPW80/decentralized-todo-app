const Todo = require('../../../src/models/Todo');

describe('Todo Model', () => {
  describe('Instance Methods', () => {
    let mockTodo;

    beforeEach(() => {
      mockTodo = {
        _id: '507f1f77bcf86cd799439011',
        blockchainId: '1',
        chainId: 31337,
        transactionHash: '0x123',
        owner: '0x1234567890123456789012345678901234567890',
        description: 'Test todo',
        completed: false,
        blockchainCreatedAt: new Date(),
        blockchainCompletedAt: null,
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
        deleted: false,
        deletedAt: null,
        save: jest.fn().mockResolvedValue(true)
      };

      Object.setPrototypeOf(mockTodo, Todo.prototype);
    });

    describe('markAsCompleted', () => {
      it('should mark todo as completed with timestamp', async () => {
        const completedAt = new Date();

        await Todo.prototype.markAsCompleted.call(mockTodo, completedAt);

        expect(mockTodo.completed).toBe(true);
        expect(mockTodo.blockchainCompletedAt).toBe(completedAt);
        expect(mockTodo.lastSyncedAt).toBeInstanceOf(Date);
        expect(mockTodo.save).toHaveBeenCalled();
      });

      it('should update lastSyncedAt to current time', async () => {
        const before = new Date();
        await Todo.prototype.markAsCompleted.call(mockTodo, new Date());
        const after = new Date();

        expect(mockTodo.lastSyncedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(mockTodo.lastSyncedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('markAsDeleted', () => {
      it('should mark todo as deleted', async () => {
        await Todo.prototype.markAsDeleted.call(mockTodo);

        expect(mockTodo.deleted).toBe(true);
        expect(mockTodo.deletedAt).toBeInstanceOf(Date);
        expect(mockTodo.lastSyncedAt).toBeInstanceOf(Date);
        expect(mockTodo.save).toHaveBeenCalled();
      });

      it('should set deletedAt to current time', async () => {
        const before = new Date();
        await Todo.prototype.markAsDeleted.call(mockTodo);
        const after = new Date();

        expect(mockTodo.deletedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(mockTodo.deletedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('markAsRestored', () => {
      it('should restore deleted todo', async () => {
        mockTodo.deleted = true;
        mockTodo.deletedAt = new Date();
        mockTodo.syncStatus = 'synced';

        await Todo.prototype.markAsRestored.call(mockTodo);

        expect(mockTodo.deleted).toBe(false);
        expect(mockTodo.deletedAt).toBe(null);
        expect(mockTodo.syncStatus).toBe('synced');
        expect(mockTodo.lastSyncedAt).toBeInstanceOf(Date);
        expect(mockTodo.save).toHaveBeenCalled();
      });

      it('should update lastSyncedAt', async () => {
        mockTodo.deleted = true;
        const before = new Date();

        await Todo.prototype.markAsRestored.call(mockTodo);

        const after = new Date();

        expect(mockTodo.lastSyncedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(mockTodo.lastSyncedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });
  });

  describe('Static Methods', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('findByOwner', () => {
      it('should find todos by owner with default filters', () => {
        const mockFind = jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        });
        Todo.find = mockFind;

        Todo.findByOwner('0xABCDEF1234567890123456789012345678901234');

        expect(mockFind).toHaveBeenCalledWith({
          owner: '0xabcdef1234567890123456789012345678901234',
          deleted: false
        });
      });

      it('should exclude completed todos when includeCompleted is false', () => {
        const mockFind = jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        });
        Todo.find = mockFind;

        Todo.findByOwner('0x1234567890123456789012345678901234567890', false, false);

        expect(mockFind).toHaveBeenCalledWith({
          owner: '0x1234567890123456789012345678901234567890',
          completed: false,
          deleted: false
        });
      });

      it('should include deleted todos when includeDeleted is true', () => {
        const mockFind = jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        });
        Todo.find = mockFind;

        Todo.findByOwner('0x1234567890123456789012345678901234567890', true, true);

        expect(mockFind).toHaveBeenCalledWith({
          owner: '0x1234567890123456789012345678901234567890'
        });
      });

      it('should sort by blockchainCreatedAt in descending order', () => {
        const mockSort = jest.fn().mockResolvedValue([]);
        const mockFind = jest.fn().mockReturnValue({
          sort: mockSort
        });
        Todo.find = mockFind;

        Todo.findByOwner('0x1234567890123456789012345678901234567890');

        expect(mockSort).toHaveBeenCalledWith({ blockchainCreatedAt: -1 });
      });

      it('should lowercase the owner address', () => {
        const mockFind = jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        });
        Todo.find = mockFind;

        Todo.findByOwner('0xABCDEF1234567890123456789012345678901234');

        expect(mockFind).toHaveBeenCalledWith(
          expect.objectContaining({
            owner: '0xabcdef1234567890123456789012345678901234'
          })
        );
      });
    });

    describe('findByBlockchainId', () => {
      it('should find todo by chainId and blockchainId', () => {
        const mockFindOne = jest.fn().mockResolvedValue(null);
        Todo.findOne = mockFindOne;

        Todo.findByBlockchainId(31337, '123');

        expect(mockFindOne).toHaveBeenCalledWith({
          chainId: 31337,
          blockchainId: '123'
        });
      });
    });

    describe('countByOwner', () => {
      it('should count todos for owner excluding deleted', () => {
        const mockCountDocuments = jest.fn().mockResolvedValue(5);
        Todo.countDocuments = mockCountDocuments;

        Todo.countByOwner('0xABCDEF1234567890123456789012345678901234');

        expect(mockCountDocuments).toHaveBeenCalledWith({
          owner: '0xabcdef1234567890123456789012345678901234',
          deleted: false
        });
      });

      it('should lowercase the owner address', () => {
        const mockCountDocuments = jest.fn().mockResolvedValue(0);
        Todo.countDocuments = mockCountDocuments;

        Todo.countByOwner('0xABCDEF1234567890123456789012345678901234');

        expect(mockCountDocuments).toHaveBeenCalledWith(
          expect.objectContaining({
            owner: '0xabcdef1234567890123456789012345678901234'
          })
        );
      });
    });
  });

  describe('Schema Validation', () => {
    it('should have Ethereum address validator configured', () => {
      const ownerPath = Todo.schema.path('owner');
      expect(ownerPath.validators.length).toBeGreaterThan(0);
      const customValidator = ownerPath.validators.find(v =>
        v.message && v.message.toString().includes('not a valid Ethereum address')
      );
      expect(customValidator).toBeDefined();
    });

    it('should validate schema has required fields', () => {
      const schema = Todo.schema.paths;

      expect(schema.blockchainId.isRequired).toBe(true);
      expect(schema.chainId.isRequired).toBe(true);
      expect(schema.transactionHash.isRequired).toBe(true);
      expect(schema.owner.isRequired).toBe(true);
      expect(schema.description.isRequired).toBe(true);
      expect(schema.blockchainCreatedAt.isRequired).toBe(true);
    });

    it('should enforce description maxlength', () => {
      const maxLength = Todo.schema.path('description').options.maxlength;
      expect(maxLength).toBe(500);
    });

    it('should trim description', () => {
      const shouldTrim = Todo.schema.path('description').options.trim;
      expect(shouldTrim).toBe(true);
    });

    it('should have correct syncStatus enum values', () => {
      const enumValues = Todo.schema.path('syncStatus').enumValues;
      expect(enumValues).toEqual(['synced', 'pending', 'error']);
    });

    it('should set correct defaults', () => {
      const schema = Todo.schema;

      expect(schema.path('completed').options.default).toBe(false);
      expect(schema.path('syncStatus').options.default).toBe('synced');
      expect(schema.path('deleted').options.default).toBe(false);
      expect(schema.path('blockchainCompletedAt').options.default).toBe(null);
      expect(schema.path('deletedAt').options.default).toBe(null);
    });
  });

  describe('Pre-save Middleware', () => {
    it('should have pre-save middleware configured', () => {
      const preSaveHooks = Todo.schema.s.hooks._pres.get('save');
      expect(preSaveHooks).toBeDefined();
      expect(preSaveHooks.length).toBeGreaterThan(0);
    });

    it('should lowercase owner in schema definition', () => {
      const ownerPath = Todo.schema.path('owner');
      expect(ownerPath.options.lowercase).toBe(true);
    });
  });

  describe('Indexes', () => {
    it('should have compound index on owner, deleted, completed', () => {
      const indexes = Todo.schema.indexes();
      const compoundIndex = indexes.find(idx =>
        idx[0].owner === 1 && idx[0].deleted === 1 && idx[0].completed === 1
      );

      expect(compoundIndex).toBeDefined();
    });

    it('should have unique compound index on chainId and blockchainId', () => {
      const indexes = Todo.schema.indexes();
      const uniqueIndex = indexes.find(idx =>
        idx[0].chainId === 1 && idx[0].blockchainId === 1
      );

      expect(uniqueIndex).toBeDefined();
      expect(uniqueIndex[1].unique).toBe(true);
    });

    it('should have index on blockchainCreatedAt for time-based queries', () => {
      const indexes = Todo.schema.indexes();
      const timeIndex = indexes.find(idx => idx[0].blockchainCreatedAt === -1);

      expect(timeIndex).toBeDefined();
    });

    it('should have compound index on owner and blockchainCreatedAt', () => {
      const indexes = Todo.schema.indexes();
      const compoundIndex = indexes.find(idx =>
        idx[0].owner === 1 && idx[0].blockchainCreatedAt === -1
      );

      expect(compoundIndex).toBeDefined();
    });

    it('should have index on syncStatus and lastSyncedAt', () => {
      const indexes = Todo.schema.indexes();
      const syncIndex = indexes.find(idx =>
        idx[0].syncStatus === 1 && idx[0].lastSyncedAt === 1
      );

      expect(syncIndex).toBeDefined();
    });

    it('should have TTL index for error status cleanup', () => {
      const indexes = Todo.schema.indexes();
      const ttlIndex = indexes.find(idx =>
        idx[0].lastSyncedAt === 1 && idx[1].expireAfterSeconds === 86400
      );

      expect(ttlIndex).toBeDefined();
      expect(ttlIndex[1].partialFilterExpression).toEqual({ syncStatus: 'error' });
    });
  });
});
