// Mock dependencies before requiring SyncMonitor
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/models/Todo');

const logger = require('../../../src/utils/logger');
const Todo = require('../../../src/models/Todo');
const SyncMonitor = require('../../../src/services/syncMonitor');

describe('SyncMonitor', () => {
  let syncMonitor;
  let mockBlockchainService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    mockBlockchainService = {
      contracts: {
        31337: {
          getTask: jest.fn(),
        },
        1: {
          getTask: jest.fn(),
        },
      },
      syncTaskCompleted: jest.fn(),
    };

    syncMonitor = new SyncMonitor(mockBlockchainService);
  });

  afterEach(() => {
    syncMonitor.stop();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default check interval of 30000ms', () => {
      expect(syncMonitor.checkInterval).toBe(30000);
    });

    it('should use SYNC_CHECK_INTERVAL env var when set', () => {
      const original = process.env.SYNC_CHECK_INTERVAL;
      process.env.SYNC_CHECK_INTERVAL = '60000';

      const monitor = new SyncMonitor(mockBlockchainService);
      expect(monitor.checkInterval).toBe(60000);

      process.env.SYNC_CHECK_INTERVAL = original;
    });

    it('should store the blockchain service reference', () => {
      expect(syncMonitor.blockchainService).toBe(mockBlockchainService);
    });

    it('should initialize timer as null', () => {
      expect(syncMonitor.timer).toBeNull();
    });

    it('should initialize isRunning as false', () => {
      expect(syncMonitor.isRunning).toBe(false);
    });
  });

  describe('start', () => {
    it('should set isRunning to true', () => {
      syncMonitor.start();
      expect(syncMonitor.isRunning).toBe(true);
    });

    it('should create a timer', () => {
      syncMonitor.start();
      expect(syncMonitor.timer).not.toBeNull();
    });

    it('should log start message with interval', () => {
      syncMonitor.start();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Sync monitor started')
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('30000ms')
      );
    });

    it('should not start again if already running', () => {
      syncMonitor.start();
      const firstTimer = syncMonitor.timer;

      syncMonitor.start();
      // Timer should remain the same (not overwritten)
      expect(syncMonitor.timer).toBe(firstTimer);
      expect(logger.warn).toHaveBeenCalledWith('Sync monitor already running');
    });

    it('should call checkSync on each interval tick', () => {
      const checkSyncSpy = jest.spyOn(syncMonitor, 'checkSync').mockResolvedValue();

      syncMonitor.start();

      // No call initially (only setInterval, no immediate call)
      expect(checkSyncSpy).not.toHaveBeenCalled();

      // Advance one interval
      jest.advanceTimersByTime(30000);
      expect(checkSyncSpy).toHaveBeenCalledTimes(1);

      // Advance another interval
      jest.advanceTimersByTime(30000);
      expect(checkSyncSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('stop', () => {
    it('should set isRunning to false', () => {
      syncMonitor.start();
      syncMonitor.stop();
      expect(syncMonitor.isRunning).toBe(false);
    });

    it('should clear the timer', () => {
      syncMonitor.start();
      syncMonitor.stop();
      expect(syncMonitor.timer).toBeNull();
    });

    it('should log stop message', () => {
      syncMonitor.start();
      syncMonitor.stop();
      expect(logger.info).toHaveBeenCalledWith('Sync monitor stopped');
    });

    it('should handle stop when never started', () => {
      syncMonitor.stop();
      expect(syncMonitor.isRunning).toBe(false);
      expect(syncMonitor.timer).toBeNull();
    });

    it('should stop the interval from firing', () => {
      const checkSyncSpy = jest.spyOn(syncMonitor, 'checkSync').mockResolvedValue();

      syncMonitor.start();
      syncMonitor.stop();

      jest.advanceTimersByTime(60000);
      expect(checkSyncSpy).not.toHaveBeenCalled();
    });
  });

  describe('checkSync', () => {
    it('should iterate over all chains in contracts', async () => {
      const checkChainSyncSpy = jest.spyOn(syncMonitor, 'checkChainSync').mockResolvedValue();

      await syncMonitor.checkSync();

      expect(checkChainSyncSpy).toHaveBeenCalledWith(31337);
      expect(checkChainSyncSpy).toHaveBeenCalledWith(1);
      expect(checkChainSyncSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully and log them', async () => {
      jest.spyOn(syncMonitor, 'checkChainSync').mockRejectedValue(new Error('Sync failed'));

      await syncMonitor.checkSync();

      expect(logger.error).toHaveBeenCalledWith(
        'Error in sync monitor:',
        expect.objectContaining({
          error: 'Sync failed',
        })
      );
    });

    it('should work with empty contracts object', async () => {
      mockBlockchainService.contracts = {};
      const checkChainSyncSpy = jest.spyOn(syncMonitor, 'checkChainSync').mockResolvedValue();

      await syncMonitor.checkSync();

      expect(checkChainSyncSpy).not.toHaveBeenCalled();
    });
  });

  describe('checkChainSync', () => {
    const chainId = 31337;

    beforeEach(() => {
      // Set up Todo.find mock chain
      Todo.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });
    });

    it('should return early if contract does not exist for chainId', async () => {
      await syncMonitor.checkChainSync(99999);
      expect(Todo.find).not.toHaveBeenCalled();
    });

    it('should query database for non-deleted tasks on the chain', async () => {
      await syncMonitor.checkChainSync(chainId);

      expect(Todo.find).toHaveBeenCalledWith({ chainId, deleted: false });
    });

    it('should check each task against blockchain state', async () => {
      const dbTasks = [
        { blockchainId: '1', completed: false },
        { blockchainId: '2', completed: true },
      ];

      Todo.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(dbTasks),
        }),
      });

      mockBlockchainService.contracts[chainId].getTask
        .mockResolvedValueOnce({ completed: false }) // task 1 in sync
        .mockResolvedValueOnce({ completed: true });  // task 2 in sync

      await syncMonitor.checkChainSync(chainId);

      expect(mockBlockchainService.contracts[chainId].getTask).toHaveBeenCalledWith('1');
      expect(mockBlockchainService.contracts[chainId].getTask).toHaveBeenCalledWith('2');
    });

    it('should auto-sync task when blockchain says completed but DB says not', async () => {
      const dbTasks = [
        { blockchainId: '1', completed: false },
      ];

      Todo.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(dbTasks),
        }),
      });

      const completedAt = BigInt(1700000000);
      mockBlockchainService.contracts[chainId].getTask.mockResolvedValue({
        completed: true,
        completedAt,
      });

      await syncMonitor.checkChainSync(chainId);

      expect(mockBlockchainService.syncTaskCompleted).toHaveBeenCalledWith(
        chainId,
        BigInt('1'),
        completedAt,
      );
    });

    it('should log warning for out-of-sync tasks', async () => {
      const dbTasks = [
        { blockchainId: '5', completed: false },
      ];

      Todo.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(dbTasks),
        }),
      });

      mockBlockchainService.contracts[chainId].getTask.mockResolvedValue({
        completed: true,
        completedAt: BigInt(1700000000),
      });

      await syncMonitor.checkChainSync(chainId);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('out of sync'),
        expect.objectContaining({
          database: { completed: false },
          blockchain: { completed: true },
        })
      );
    });

    it('should log sync results when out-of-sync tasks found', async () => {
      const dbTasks = [
        { blockchainId: '1', completed: false },
      ];

      Todo.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(dbTasks),
        }),
      });

      mockBlockchainService.contracts[chainId].getTask.mockResolvedValue({
        completed: true,
        completedAt: BigInt(1700000000),
      });

      await syncMonitor.checkChainSync(chainId);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('auto-synced')
      );
    });

    it('should not sync when both DB and blockchain agree', async () => {
      const dbTasks = [
        { blockchainId: '1', completed: true },
      ];

      Todo.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(dbTasks),
        }),
      });

      mockBlockchainService.contracts[chainId].getTask.mockResolvedValue({
        completed: true,
      });

      await syncMonitor.checkChainSync(chainId);

      expect(mockBlockchainService.syncTaskCompleted).not.toHaveBeenCalled();
    });

    it('should not call syncTaskCompleted when blockchain is not completed but DB is', async () => {
      const dbTasks = [
        { blockchainId: '1', completed: true },
      ];

      Todo.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(dbTasks),
        }),
      });

      mockBlockchainService.contracts[chainId].getTask.mockResolvedValue({
        completed: false,
      });

      await syncMonitor.checkChainSync(chainId);

      // Out of sync detected but in the other direction — no auto-sync for this case
      expect(mockBlockchainService.syncTaskCompleted).not.toHaveBeenCalled();
    });

    it('should skip tasks that throw "Task not found" error', async () => {
      const dbTasks = [
        { blockchainId: '1', completed: false },
      ];

      Todo.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(dbTasks),
        }),
      });

      mockBlockchainService.contracts[chainId].getTask.mockRejectedValue(
        new Error('Task not found')
      );

      await syncMonitor.checkChainSync(chainId);

      // Should not log as debug for "Task not found" errors
      expect(logger.debug).not.toHaveBeenCalled();
      expect(mockBlockchainService.syncTaskCompleted).not.toHaveBeenCalled();
    });

    it('should log debug when task check fails with non-"Task not found" error', async () => {
      const dbTasks = [
        { blockchainId: '1', completed: false },
      ];

      Todo.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(dbTasks),
        }),
      });

      mockBlockchainService.contracts[chainId].getTask.mockRejectedValue(
        new Error('Connection timeout')
      );

      await syncMonitor.checkChainSync(chainId);

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Could not check task 1'),
        'Connection timeout'
      );
    });

    it('should handle database query errors gracefully', async () => {
      Todo.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('DB connection lost')),
        }),
      });

      await syncMonitor.checkChainSync(chainId);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error checking sync'),
        expect.objectContaining({
          error: 'DB connection lost',
        })
      );
    });

    it('should handle multiple tasks with mixed sync states', async () => {
      const dbTasks = [
        { blockchainId: '1', completed: false },
        { blockchainId: '2', completed: true },
        { blockchainId: '3', completed: false },
      ];

      Todo.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(dbTasks),
        }),
      });

      mockBlockchainService.contracts[chainId].getTask
        .mockResolvedValueOnce({ completed: true, completedAt: BigInt(1700000000) })  // task 1: out of sync
        .mockResolvedValueOnce({ completed: true })   // task 2: in sync
        .mockResolvedValueOnce({ completed: false });  // task 3: in sync

      await syncMonitor.checkChainSync(chainId);

      // Only task 1 should be synced
      expect(mockBlockchainService.syncTaskCompleted).toHaveBeenCalledTimes(1);
      expect(mockBlockchainService.syncTaskCompleted).toHaveBeenCalledWith(
        chainId,
        BigInt('1'),
        BigInt(1700000000),
      );
    });
  });
});
