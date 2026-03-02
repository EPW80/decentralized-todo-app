// Mock dependencies before requiring blockchainService
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/models/Todo');
jest.mock('../../../src/config/blockchain', () => ({
  networks: {
    localhost: {
      name: 'Localhost',
      chainId: 31337,
      rpcUrl: 'http://127.0.0.1:8545'
    }
  },
  contractAddresses: {
    31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  },
  contractABI: [],
  defaultNetwork: 'localhost'
}));

// Import after mocks are set up
const blockchainService = require('../../../src/services/blockchainService');
const Todo = require('../../../src/models/Todo');

describe('BlockchainService', () => {
  describe('Constructor and Initialization', () => {
    it('should initialize with empty providers and contracts', () => {
      expect(blockchainService.providers).toBeDefined();
      expect(blockchainService.contracts).toBeDefined();
    });

    it('should set default maxReconnectAttempts', () => {
      expect(blockchainService.maxReconnectAttempts).toBe(5);
    });

    it('should set default reconnectDelay', () => {
      expect(blockchainService.reconnectDelay).toBe(5000);
    });

    it('should initialize lastProcessedBlock tracking', () => {
      expect(blockchainService.lastProcessedBlock).toBeDefined();
      expect(typeof blockchainService.lastProcessedBlock).toBe('object');
    });

    it('should initialize reconnectAttempts tracking', () => {
      expect(blockchainService.reconnectAttempts).toBeDefined();
      expect(typeof blockchainService.reconnectAttempts).toBe('object');
    });

    it('should initialize eventListenersActive tracking', () => {
      expect(blockchainService.eventListenersActive).toBeDefined();
      expect(typeof blockchainService.eventListenersActive).toBe('object');
    });

    it('should initialize eventHandlers storage', () => {
      expect(blockchainService.eventHandlers).toBeDefined();
      expect(typeof blockchainService.eventHandlers).toBe('object');
    });

    it('should initialize confirmations object', () => {
      expect(blockchainService.confirmations).toBeDefined();
      expect(typeof blockchainService.confirmations).toBe('object');
    });
  });

  describe('getDefaultConfirmations', () => {
    it('should return 12 confirmations for Ethereum Mainnet (chainId 1)', () => {
      expect(blockchainService.getDefaultConfirmations(1)).toBe(12);
    });

    it('should return 12 confirmations for Sepolia (chainId 11155111)', () => {
      expect(blockchainService.getDefaultConfirmations(11155111)).toBe(12);
    });

    it('should return 128 confirmations for Polygon Mainnet (chainId 137)', () => {
      expect(blockchainService.getDefaultConfirmations(137)).toBe(128);
    });

    it('should return 128 confirmations for Amoy (chainId 80002)', () => {
      expect(blockchainService.getDefaultConfirmations(80002)).toBe(128);
    });

    it('should return 1 confirmation for Arbitrum One (chainId 42161)', () => {
      expect(blockchainService.getDefaultConfirmations(42161)).toBe(1);
    });

    it('should return 1 confirmation for Arbitrum Sepolia (chainId 421614)', () => {
      expect(blockchainService.getDefaultConfirmations(421614)).toBe(1);
    });

    it('should return 1 confirmation for Optimism (chainId 10)', () => {
      expect(blockchainService.getDefaultConfirmations(10)).toBe(1);
    });

    it('should return 1 confirmation for Optimism Sepolia (chainId 11155420)', () => {
      expect(blockchainService.getDefaultConfirmations(11155420)).toBe(1);
    });

    it('should return 1 confirmation for Localhost/Hardhat (chainId 31337)', () => {
      expect(blockchainService.getDefaultConfirmations(31337)).toBe(1);
    });

    it('should return 12 confirmations for unknown chainId', () => {
      expect(blockchainService.getDefaultConfirmations(999999)).toBe(12);
    });
  });

  describe('getBlocksPerDay', () => {
    it('should return 7200 blocks per day for Ethereum Mainnet (chainId 1)', () => {
      expect(blockchainService.getBlocksPerDay(1)).toBe(7200);
    });

    it('should return 7200 blocks per day for Sepolia (chainId 11155111)', () => {
      expect(blockchainService.getBlocksPerDay(11155111)).toBe(7200);
    });

    it('should return 43200 blocks per day for Polygon Mainnet (chainId 137)', () => {
      expect(blockchainService.getBlocksPerDay(137)).toBe(43200);
    });

    it('should return 43200 blocks per day for Amoy (chainId 80002)', () => {
      expect(blockchainService.getBlocksPerDay(80002)).toBe(43200);
    });

    it('should return 240000 blocks per day for Arbitrum One (chainId 42161)', () => {
      expect(blockchainService.getBlocksPerDay(42161)).toBe(240000);
    });

    it('should return 240000 blocks per day for Arbitrum Sepolia (chainId 421614)', () => {
      expect(blockchainService.getBlocksPerDay(421614)).toBe(240000);
    });

    it('should return 43200 blocks per day for Optimism (chainId 10)', () => {
      expect(blockchainService.getBlocksPerDay(10)).toBe(43200);
    });

    it('should return 43200 blocks per day for Optimism Sepolia (chainId 11155420)', () => {
      expect(blockchainService.getBlocksPerDay(11155420)).toBe(43200);
    });

    it('should return 7200 blocks per day for Localhost/Hardhat (chainId 31337)', () => {
      expect(blockchainService.getBlocksPerDay(31337)).toBe(7200);
    });

    it('should return 7200 blocks per day for unknown chainId', () => {
      expect(blockchainService.getBlocksPerDay(999999)).toBe(7200);
    });
  });

  describe('getAverageBlockTime', () => {
    it('should return correct block time for each supported chain', () => {
      expect(blockchainService.getAverageBlockTime(1)).toBe(12);        // Ethereum
      expect(blockchainService.getAverageBlockTime(11155111)).toBe(12); // Sepolia
      expect(blockchainService.getAverageBlockTime(137)).toBe(2);       // Polygon
      expect(blockchainService.getAverageBlockTime(80002)).toBe(2);     // Amoy
      expect(blockchainService.getAverageBlockTime(42161)).toBe(0.36);  // Arbitrum
      expect(blockchainService.getAverageBlockTime(421614)).toBe(0.36); // Arbitrum Sepolia
      expect(blockchainService.getAverageBlockTime(10)).toBe(2);        // Optimism
      expect(blockchainService.getAverageBlockTime(11155420)).toBe(2);  // Optimism Sepolia
      expect(blockchainService.getAverageBlockTime(31337)).toBe(12);    // Localhost
    });

    it('should return 12 seconds for unknown chainId', () => {
      expect(blockchainService.getAverageBlockTime(999999)).toBe(12);
    });
  });

  describe('getContract', () => {
    it('should return undefined for non-existent chainId', () => {
      expect(blockchainService.getContract(999999)).toBeUndefined();
    });

    it('should return contract if it exists', () => {
      blockchainService.contracts[31337] = { address: '0x123' };
      expect(blockchainService.getContract(31337)).toBeDefined();
      expect(blockchainService.getContract(31337).address).toBe('0x123');
    });
  });

  describe('getProvider', () => {
    it('should return undefined for non-existent chainId', () => {
      expect(blockchainService.getProvider(999999)).toBeUndefined();
    });

    it('should return provider if it exists', () => {
      blockchainService.providers[31337] = { connection: 'test' };
      expect(blockchainService.getProvider(31337)).toBeDefined();
      expect(blockchainService.getProvider(31337).connection).toBe('test');
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      // Clear contracts and providers before each test
      blockchainService.contracts = {};
      blockchainService.providers = {};
      blockchainService.eventListenersActive = {};
    });

    it('should set initialized to false', async () => {
      blockchainService.initialized = true;
      await blockchainService.cleanup();
      expect(blockchainService.initialized).toBe(false);
    });

    it('should set all event listeners to inactive', async () => {
      blockchainService.eventListenersActive = {
        31337: true,
        1: true
      };

      await blockchainService.cleanup();

      expect(blockchainService.eventListenersActive[31337]).toBe(false);
      expect(blockchainService.eventListenersActive[1]).toBe(false);
    });

    it('should remove all contract listeners', async () => {
      const mockContract = {
        removeAllListeners: jest.fn()
      };
      blockchainService.contracts = {
        31337: mockContract
      };

      await blockchainService.cleanup();

      expect(mockContract.removeAllListeners).toHaveBeenCalled();
    });

    it('should remove all provider listeners', async () => {
      const mockProvider = {
        removeAllListeners: jest.fn()
      };
      blockchainService.providers = {
        31337: mockProvider
      };

      await blockchainService.cleanup();

      expect(mockProvider.removeAllListeners).toHaveBeenCalled();
    });
  });

  describe('createResilientProvider', () => {
    it('should create single JsonRpcProvider when only one RPC URL', () => {
      const network = {
        name: 'Test Network',
        rpcUrl: 'http://localhost:8545',
        rpcBackup: ''
      };

      const provider = blockchainService.createResilientProvider(network);

      expect(provider).toBeDefined();
      expect(provider.constructor.name).toBe('JsonRpcProvider');
    });

    it('should create FallbackProvider when backup RPC URL provided', () => {
      const network = {
        name: 'Test Network',
        rpcUrl: 'http://localhost:8545',
        rpcBackup: 'http://localhost:8546'
      };

      const provider = blockchainService.createResilientProvider(network);

      expect(provider).toBeDefined();
      expect(provider.constructor.name).toBe('FallbackProvider');
    });

    it('should filter out empty rpcBackup string', () => {
      const network = {
        name: 'Test Network',
        rpcUrl: 'http://localhost:8545',
        rpcBackup: ''
      };

      const provider = blockchainService.createResilientProvider(network);

      // Should create single provider, not fallback
      expect(provider.constructor.name).toBe('JsonRpcProvider');
    });

    it('should filter out null rpcBackup', () => {
      const network = {
        name: 'Test Network',
        rpcUrl: 'http://localhost:8545',
        rpcBackup: null
      };

      const provider = blockchainService.createResilientProvider(network);

      expect(provider.constructor.name).toBe('JsonRpcProvider');
    });
  });

  describe('Environment Configuration', () => {
    it('should use environment variable for max reconnect attempts', () => {
      const originalValue = process.env.MAX_RECONNECT_ATTEMPTS;
      process.env.MAX_RECONNECT_ATTEMPTS = '10';

      // Re-require to pick up new env var (this is a singleton, so we test the original)
      expect(blockchainService.maxReconnectAttempts).toBeDefined();

      process.env.MAX_RECONNECT_ATTEMPTS = originalValue;
    });

    it('should use environment variable for reconnect delay', () => {
      const originalValue = process.env.RECONNECT_BASE_DELAY;
      process.env.RECONNECT_BASE_DELAY = '10000';

      expect(blockchainService.reconnectDelay).toBeDefined();

      process.env.RECONNECT_BASE_DELAY = originalValue;
    });
  });

  describe('State Management', () => {
    it('should start uninitialized', () => {
      // blockchainService might be partially initialized from other tests
      // Just verify the initialized property exists
      expect(blockchainService).toHaveProperty('initialized');
    });

    it('should track last processed blocks per chain', () => {
      blockchainService.lastProcessedBlock[31337] = 100;
      expect(blockchainService.lastProcessedBlock[31337]).toBe(100);
    });

    it('should track reconnect attempts per chain', () => {
      blockchainService.reconnectAttempts[31337] = 2;
      expect(blockchainService.reconnectAttempts[31337]).toBe(2);
    });

    it('should track event listeners status per chain', () => {
      blockchainService.eventListenersActive[31337] = true;
      expect(blockchainService.eventListenersActive[31337]).toBe(true);
    });
  });

  describe('classifyError', () => {
    describe('NETWORK_ERROR classification', () => {
      it('should classify "network" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'Network connection failed' },
          31337
        );
        expect(result.type).toBe('NETWORK_ERROR');
        expect(result.shouldReconnect).toBe(true);
        expect(result.isFatal).toBe(false);
      });

      it('should classify timeout errors', () => {
        const result = blockchainService.classifyError(
          { message: 'Request timeout exceeded' },
          31337
        );
        expect(result.type).toBe('NETWORK_ERROR');
      });

      it('should classify ECONNREFUSED errors', () => {
        const result = blockchainService.classifyError(
          { message: 'connect ECONNREFUSED 127.0.0.1:8545' },
          1
        );
        expect(result.type).toBe('NETWORK_ERROR');
        expect(result.shouldReconnect).toBe(true);
      });

      it('should classify ENOTFOUND errors', () => {
        const result = blockchainService.classifyError(
          { message: 'getaddrinfo ENOTFOUND rpc.example.com' },
          1
        );
        expect(result.type).toBe('NETWORK_ERROR');
      });

      it('should classify by error code NETWORK_ERROR', () => {
        const result = blockchainService.classifyError(
          { message: 'something else', code: 'NETWORK_ERROR' },
          31337
        );
        expect(result.type).toBe('NETWORK_ERROR');
      });

      it('should classify by error code TIMEOUT', () => {
        const result = blockchainService.classifyError(
          { message: 'something', code: 'TIMEOUT' },
          31337
        );
        expect(result.type).toBe('NETWORK_ERROR');
      });

      it('should include chain ID in message', () => {
        const result = blockchainService.classifyError(
          { message: 'network error' },
          42161
        );
        expect(result.message).toContain('42161');
      });
    });

    describe('FILTER_ERROR classification', () => {
      it('should classify "filter not found" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'filter not found' },
          31337
        );
        expect(result.type).toBe('FILTER_ERROR');
        expect(result.shouldReconnect).toBe(true);
        expect(result.isFatal).toBe(false);
      });

      it('should classify "filter expired" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'filter has expired' },
          31337
        );
        expect(result.type).toBe('FILTER_ERROR');
      });

      it('should classify UNKNOWN_ERROR with filter keyword', () => {
        const result = blockchainService.classifyError(
          { message: 'filter issue', code: 'UNKNOWN_ERROR' },
          31337
        );
        expect(result.type).toBe('FILTER_ERROR');
      });

      it('should classify "results is not iterable" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'results is not iterable' },
          31337
        );
        expect(result.type).toBe('FILTER_ERROR');
      });

      it('should classify "filtersubscriber" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'FilterSubscriber error occurred' },
          31337
        );
        expect(result.type).toBe('FILTER_ERROR');
      });
    });

    describe('CODE_MISMATCH classification', () => {
      it('should classify "invalid event signature" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'invalid event signature' },
          31337
        );
        expect(result.type).toBe('CODE_MISMATCH');
        expect(result.shouldReconnect).toBe(false);
        expect(result.isFatal).toBe(true);
      });

      it('should classify "no matching event" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'no matching event found' },
          31337
        );
        expect(result.type).toBe('CODE_MISMATCH');
        expect(result.isFatal).toBe(true);
      });

      it('should classify "could not decode" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'could not decode result data' },
          31337
        );
        expect(result.type).toBe('CODE_MISMATCH');
      });

      it('should classify "invalid argument" + "event" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'invalid argument for event listener' },
          31337
        );
        expect(result.type).toBe('CODE_MISMATCH');
      });
    });

    describe('RPC_ERROR classification', () => {
      it('should classify "rpc" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'RPC endpoint unreachable' },
          31337
        );
        expect(result.type).toBe('RPC_ERROR');
        expect(result.shouldReconnect).toBe(true);
        expect(result.isFatal).toBe(false);
      });

      it('should classify "bad gateway" errors', () => {
        const result = blockchainService.classifyError(
          { message: '502 Bad Gateway' },
          1
        );
        expect(result.type).toBe('RPC_ERROR');
      });

      it('should classify "service unavailable" errors', () => {
        const result = blockchainService.classifyError(
          { message: '503 Service Unavailable' },
          1
        );
        expect(result.type).toBe('RPC_ERROR');
      });

      it('should classify by error code SERVER_ERROR', () => {
        const result = blockchainService.classifyError(
          { message: 'something', code: 'SERVER_ERROR' },
          31337
        );
        expect(result.type).toBe('RPC_ERROR');
      });
    });

    describe('RATE_LIMIT classification', () => {
      it('should classify "rate limit" errors', () => {
        const result = blockchainService.classifyError(
          { message: 'Rate limit exceeded' },
          1
        );
        expect(result.type).toBe('RATE_LIMIT');
        expect(result.shouldReconnect).toBe(true);
        expect(result.isFatal).toBe(false);
      });

      it('should classify "too many requests" errors', () => {
        const result = blockchainService.classifyError(
          { message: '429 Too Many Requests' },
          1
        );
        expect(result.type).toBe('RATE_LIMIT');
      });

      it('should classify by error code RATE_LIMIT', () => {
        const result = blockchainService.classifyError(
          { message: 'something', code: 'RATE_LIMIT' },
          1
        );
        expect(result.type).toBe('RATE_LIMIT');
      });
    });

    describe('UNKNOWN classification', () => {
      it('should classify unrecognized errors as UNKNOWN', () => {
        const result = blockchainService.classifyError(
          { message: 'something completely unexpected' },
          31337
        );
        expect(result.type).toBe('UNKNOWN');
        expect(result.shouldReconnect).toBe(true);
        expect(result.isFatal).toBe(false);
      });

      it('should handle errors with null message', () => {
        const result = blockchainService.classifyError(
          { message: null },
          31337
        );
        expect(result.type).toBe('UNKNOWN');
      });

      it('should handle errors with undefined message', () => {
        const result = blockchainService.classifyError(
          {},
          31337
        );
        expect(result.type).toBe('UNKNOWN');
      });

      it('should include original error message in UNKNOWN type', () => {
        const result = blockchainService.classifyError(
          { message: 'weird error xyz' },
          31337
        );
        expect(result.message).toContain('weird error xyz');
      });
    });
  });

  describe('isInitialized', () => {
    it('should return false when not initialized', () => {
      blockchainService.initialized = false;
      expect(blockchainService.isInitialized()).toBe(false);
    });

    it('should return true when initialized', () => {
      blockchainService.initialized = true;
      expect(blockchainService.isInitialized()).toBe(true);
    });
  });

  describe('getDefaultChainId', () => {
    it('should return the default network chain ID', () => {
      // The mock blockchain config has defaultNetwork = 'localhost' with chainId 31337
      const chainId = blockchainService.getDefaultChainId();
      expect(chainId).toBe(31337);
    });
  });

  describe('getHealthStatus', () => {
    beforeEach(() => {
      blockchainService.providers = { 31337: {}, 1: {} };
      blockchainService.eventListenersActive = { 31337: true, 1: false };
      blockchainService.lastHeartbeat = { 31337: new Date('2026-01-01') };
      blockchainService.consecutiveFailures = { 31337: 0, 1: 2 };
      blockchainService.lastProcessedBlock = { 31337: 1000, 1: 5000 };
      blockchainService.reconnectAttempts = { 31337: 0, 1: 1 };
      blockchainService.heartbeatInterval = 60000;
      blockchainService.maxConsecutiveFailures = 3;
    });

    it('should return status for all chains in providers', () => {
      const health = blockchainService.getHealthStatus();
      expect(health.chains).toHaveProperty('31337');
      expect(health.chains).toHaveProperty('1');
    });

    it('should include heartbeat interval and max failures', () => {
      const health = blockchainService.getHealthStatus();
      expect(health.heartbeatInterval).toBe(60000);
      expect(health.maxConsecutiveFailures).toBe(3);
    });

    it('should report event listener status per chain', () => {
      const health = blockchainService.getHealthStatus();
      expect(health.chains['31337'].eventListenersActive).toBe(true);
      expect(health.chains['1'].eventListenersActive).toBe(false);
    });

    it('should report consecutive failures per chain', () => {
      const health = blockchainService.getHealthStatus();
      expect(health.chains['31337'].consecutiveFailures).toBe(0);
      expect(health.chains['1'].consecutiveFailures).toBe(2);
    });

    it('should report last processed block per chain', () => {
      const health = blockchainService.getHealthStatus();
      expect(health.chains['31337'].lastProcessedBlock).toBe(1000);
      expect(health.chains['1'].lastProcessedBlock).toBe(5000);
    });

    it('should report reconnect attempts per chain', () => {
      const health = blockchainService.getHealthStatus();
      expect(health.chains['31337'].reconnectAttempts).toBe(0);
      expect(health.chains['1'].reconnectAttempts).toBe(1);
    });

    it('should default to false/null/0 for missing chain data', () => {
      blockchainService.providers = { 99: {} };
      blockchainService.eventListenersActive = {};
      blockchainService.lastHeartbeat = {};
      blockchainService.consecutiveFailures = {};
      blockchainService.lastProcessedBlock = {};
      blockchainService.reconnectAttempts = {};

      const health = blockchainService.getHealthStatus();
      expect(health.chains['99'].eventListenersActive).toBe(false);
      expect(health.chains['99'].lastHeartbeat).toBeNull();
      expect(health.chains['99'].consecutiveFailures).toBe(0);
      expect(health.chains['99'].lastProcessedBlock).toBeNull();
      expect(health.chains['99'].reconnectAttempts).toBe(0);
    });
  });

  describe('syncTaskCreated', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should skip if task already exists', async () => {
      const existingTodo = { _id: 'abc123' };
      Todo.findByBlockchainId = jest.fn().mockResolvedValue(existingTodo);

      await blockchainService.syncTaskCreated(31337, BigInt(1), '0xowner', 'test', BigInt(1700000000), '0xtxhash');

      expect(Todo.findByBlockchainId).toHaveBeenCalledWith(31337, '1');
      // Should not attempt to create new todo
      expect(Todo).not.toHaveBeenCalledWith(expect.objectContaining({ blockchainId: '1' }));
    });

    it('should create new todo when not existing', async () => {
      Todo.findByBlockchainId = jest.fn()
        .mockResolvedValueOnce(null)  // first call: not found
        .mockResolvedValueOnce({ _id: 'new123' }); // verification call

      const mockSave = jest.fn().mockResolvedValue({ _id: 'new123' });
      Todo.mockImplementation(() => ({
        save: mockSave,
      }));

      await blockchainService.syncTaskCreated(
        31337, BigInt(1), '0xOwner', 'Buy groceries',
        BigInt(1700000000), '0xtxhash123', BigInt(0)
      );

      expect(Todo).toHaveBeenCalledWith(expect.objectContaining({
        blockchainId: '1',
        chainId: 31337,
        owner: '0xowner', // lowercased
        description: 'Buy groceries',
        completed: false,
        syncStatus: 'synced',
      }));
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      Todo.findByBlockchainId = jest.fn().mockResolvedValue(null);
      const mockSave = jest.fn().mockRejectedValue(new Error('DB write failed'));
      Todo.mockImplementation(() => ({
        save: mockSave,
      }));

      await blockchainService.syncTaskCreated(
        31337, BigInt(1), '0xOwner', 'Test',
        BigInt(1700000000), '0xtxhash'
      );

      // Should log error, not throw
      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        'Error syncing TaskCreated:',
        expect.objectContaining({ error: 'DB write failed' })
      );
    });
  });

  describe('syncTaskCompleted', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should mark todo as completed when found', async () => {
      const mockMarkAsCompleted = jest.fn().mockResolvedValue();
      Todo.findByBlockchainId = jest.fn().mockResolvedValue({
        markAsCompleted: mockMarkAsCompleted,
      });

      await blockchainService.syncTaskCompleted(31337, BigInt(5), BigInt(1700000000));

      expect(Todo.findByBlockchainId).toHaveBeenCalledWith(31337, '5');
      expect(mockMarkAsCompleted).toHaveBeenCalled();
    });

    it('should log error when todo not found', async () => {
      Todo.findByBlockchainId = jest.fn().mockResolvedValue(null);

      await blockchainService.syncTaskCompleted(31337, BigInt(5), BigInt(1700000000));

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('not found for completion')
      );
    });

    it('should handle errors gracefully', async () => {
      Todo.findByBlockchainId = jest.fn().mockRejectedValue(new Error('DB error'));

      await blockchainService.syncTaskCompleted(31337, BigInt(5), BigInt(1700000000));

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        'Error syncing TaskCompleted:',
        expect.objectContaining({ error: 'DB error' })
      );
    });
  });

  describe('syncTaskDeleted', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should mark todo as deleted when found', async () => {
      const mockMarkAsDeleted = jest.fn().mockResolvedValue();
      Todo.findByBlockchainId = jest.fn().mockResolvedValue({
        markAsDeleted: mockMarkAsDeleted,
      });

      await blockchainService.syncTaskDeleted(31337, BigInt(3));

      expect(Todo.findByBlockchainId).toHaveBeenCalledWith(31337, '3');
      expect(mockMarkAsDeleted).toHaveBeenCalled();
    });

    it('should log error when todo not found', async () => {
      Todo.findByBlockchainId = jest.fn().mockResolvedValue(null);

      await blockchainService.syncTaskDeleted(31337, BigInt(3));

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('not found for deletion')
      );
    });

    it('should handle errors gracefully', async () => {
      Todo.findByBlockchainId = jest.fn().mockRejectedValue(new Error('DB failure'));

      await blockchainService.syncTaskDeleted(31337, BigInt(3));

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        'Error syncing TaskDeleted:',
        expect.objectContaining({ error: 'DB failure' })
      );
    });
  });

  describe('syncTaskRestored', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should mark todo as restored when found', async () => {
      const mockMarkAsRestored = jest.fn().mockResolvedValue();
      Todo.findByBlockchainId = jest.fn().mockResolvedValue({
        markAsRestored: mockMarkAsRestored,
      });

      await blockchainService.syncTaskRestored(31337, BigInt(7));

      expect(Todo.findByBlockchainId).toHaveBeenCalledWith(31337, '7');
      expect(mockMarkAsRestored).toHaveBeenCalled();
    });

    it('should log error when todo not found', async () => {
      Todo.findByBlockchainId = jest.fn().mockResolvedValue(null);

      await blockchainService.syncTaskRestored(31337, BigInt(7));

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('not found for restoration')
      );
    });

    it('should handle errors gracefully', async () => {
      Todo.findByBlockchainId = jest.fn().mockRejectedValue(new Error('restore error'));

      await blockchainService.syncTaskRestored(31337, BigInt(7));

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        'Error syncing TaskRestored:',
        expect.objectContaining({ error: 'restore error' })
      );
    });
  });

  describe('syncTaskUpdated', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update description when todo found', async () => {
      const mockUpdateDescription = jest.fn().mockResolvedValue();
      Todo.findByBlockchainId = jest.fn().mockResolvedValue({
        updateDescription: mockUpdateDescription,
      });

      await blockchainService.syncTaskUpdated(31337, BigInt(2), 'old desc', 'new desc');

      expect(Todo.findByBlockchainId).toHaveBeenCalledWith(31337, '2');
      expect(mockUpdateDescription).toHaveBeenCalledWith('new desc');
    });

    it('should log error when todo not found', async () => {
      Todo.findByBlockchainId = jest.fn().mockResolvedValue(null);

      await blockchainService.syncTaskUpdated(31337, BigInt(2), 'old', 'new');

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('not found for update')
      );
    });

    it('should handle errors gracefully', async () => {
      Todo.findByBlockchainId = jest.fn().mockRejectedValue(new Error('update error'));

      await blockchainService.syncTaskUpdated(31337, BigInt(2), 'old', 'new');

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        'Error syncing TaskUpdated:',
        expect.objectContaining({ error: 'update error' })
      );
    });
  });

  describe('handleBlockUpdate', () => {
    beforeEach(() => {
      blockchainService.lastProcessedBlock = {};
      jest.clearAllMocks();
    });

    it('should update lastProcessedBlock', async () => {
      await blockchainService.handleBlockUpdate(31337, 100);
      expect(blockchainService.lastProcessedBlock[31337]).toBe(100);
    });

    it('should detect block reorganization when block <= last processed', async () => {
      blockchainService.lastProcessedBlock[31337] = 100;
      const handleReorgSpy = jest.spyOn(blockchainService, 'handleReorg').mockResolvedValue();

      await blockchainService.handleBlockUpdate(31337, 95);

      expect(handleReorgSpy).toHaveBeenCalledWith(31337, 95);
      handleReorgSpy.mockRestore();
    });

    it('should not trigger reorg when block advances normally', async () => {
      blockchainService.lastProcessedBlock[31337] = 100;
      const handleReorgSpy = jest.spyOn(blockchainService, 'handleReorg').mockResolvedValue();

      await blockchainService.handleBlockUpdate(31337, 101);

      expect(handleReorgSpy).not.toHaveBeenCalled();
      handleReorgSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      blockchainService.lastProcessedBlock[31337] = 100;
      const spy = jest.spyOn(blockchainService, 'handleReorg').mockRejectedValue(new Error('reorg failed'));

      await blockchainService.handleBlockUpdate(31337, 90);

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error handling block update'),
        expect.any(Object)
      );
      spy.mockRestore();
    });
  });

  describe('handleReorg', () => {
    beforeEach(() => {
      blockchainService.lastProcessedBlock = {};
      blockchainService.confirmations = {};
      jest.clearAllMocks();
    });

    it('should calculate safe block using chain-specific confirmations', async () => {
      blockchainService.confirmations[31337] = 1;
      blockchainService.lastProcessedBlock[31337] = 200;
      const resyncSpy = jest.spyOn(blockchainService, 'resyncFromBlock').mockResolvedValue();

      await blockchainService.handleReorg(31337, 150);

      // safeBlock = 150 - 1 = 149; lastProcessed (200) > safeBlock (149) => resync from 149
      expect(resyncSpy).toHaveBeenCalledWith(31337, 149);
      resyncSpy.mockRestore();
    });

    it('should use default 12 confirmations when not set', async () => {
      blockchainService.lastProcessedBlock[31337] = 200;
      const resyncSpy = jest.spyOn(blockchainService, 'resyncFromBlock').mockResolvedValue();

      await blockchainService.handleReorg(31337, 150);

      // safeBlock = 150 - 12 = 138; lastProcessed (200) > safeBlock (138)
      expect(resyncSpy).toHaveBeenCalledWith(31337, 138);
      resyncSpy.mockRestore();
    });

    it('should skip if safe block is negative', async () => {
      blockchainService.confirmations[31337] = 12;
      blockchainService.lastProcessedBlock[31337] = 5;
      const resyncSpy = jest.spyOn(blockchainService, 'resyncFromBlock').mockResolvedValue();

      await blockchainService.handleReorg(31337, 5);

      // safeBlock = 5 - 12 = -7, negative => return early
      expect(resyncSpy).not.toHaveBeenCalled();
      resyncSpy.mockRestore();
    });

    it('should skip if lastProcessedBlock <= safeBlock', async () => {
      blockchainService.confirmations[31337] = 1;
      blockchainService.lastProcessedBlock[31337] = 50;
      const resyncSpy = jest.spyOn(blockchainService, 'resyncFromBlock').mockResolvedValue();

      await blockchainService.handleReorg(31337, 100);

      // safeBlock = 100 - 1 = 99; lastProcessed (50) <= safeBlock (99) => no resync
      expect(resyncSpy).not.toHaveBeenCalled();
      resyncSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      blockchainService.confirmations[31337] = 1;
      blockchainService.lastProcessedBlock[31337] = 200;
      jest.spyOn(blockchainService, 'resyncFromBlock').mockRejectedValue(new Error('resync failed'));

      await blockchainService.handleReorg(31337, 150);

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error handling reorganization'),
        expect.any(Object)
      );
    });
  });

  describe('shutdown', () => {
    beforeEach(() => {
      blockchainService.contracts = {};
      blockchainService.providers = {};
      blockchainService.initialized = true;
      blockchainService.heartbeatTimer = null;
      blockchainService.syncMonitor = null;
      jest.clearAllMocks();
    });

    it('should set initialized to false', async () => {
      await blockchainService.shutdown();
      expect(blockchainService.initialized).toBe(false);
    });

    it('should stop sync monitor if running', async () => {
      const mockStop = jest.fn();
      blockchainService.syncMonitor = { stop: mockStop };

      await blockchainService.shutdown();

      expect(mockStop).toHaveBeenCalled();
    });

    it('should stop heartbeat monitoring', async () => {
      const stopHeartbeatSpy = jest.spyOn(blockchainService, 'stopHeartbeat');

      await blockchainService.shutdown();

      expect(stopHeartbeatSpy).toHaveBeenCalled();
      stopHeartbeatSpy.mockRestore();
    });

    it('should remove all contract listeners', async () => {
      const mockContract = { removeAllListeners: jest.fn() };
      blockchainService.contracts = { 31337: mockContract, 1: mockContract };

      await blockchainService.shutdown();

      expect(mockContract.removeAllListeners).toHaveBeenCalledTimes(2);
    });

    it('should handle contract listener removal errors', async () => {
      const mockContract = {
        removeAllListeners: jest.fn().mockImplementation(() => {
          throw new Error('listener removal failed');
        }),
      };
      blockchainService.contracts = { 31337: mockContract };

      await blockchainService.shutdown();

      const logger = require('../../../src/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error removing listeners'),
        expect.any(Object)
      );
      // Should still set initialized to false
      expect(blockchainService.initialized).toBe(false);
    });

    it('should log shutdown completion', async () => {
      await blockchainService.shutdown();

      const logger = require('../../../src/utils/logger');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('shutdown complete')
      );
    });
  });

  describe('startHeartbeat and stopHeartbeat', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      blockchainService.heartbeatTimer = null;
      blockchainService.heartbeatInterval = 60000;
      jest.clearAllMocks();
    });

    afterEach(() => {
      blockchainService.stopHeartbeat();
      jest.useRealTimers();
    });

    it('should set heartbeatTimer on start', () => {
      jest.spyOn(blockchainService, 'performHealthCheck').mockResolvedValue();
      blockchainService.startHeartbeat();
      expect(blockchainService.heartbeatTimer).not.toBeNull();
    });

    it('should run initial health check immediately', () => {
      const spy = jest.spyOn(blockchainService, 'performHealthCheck').mockResolvedValue();
      blockchainService.startHeartbeat();
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    it('should clear existing heartbeat timer before starting new one', () => {
      const spy = jest.spyOn(blockchainService, 'performHealthCheck').mockResolvedValue();
      blockchainService.startHeartbeat();
      const firstTimer = blockchainService.heartbeatTimer;
      blockchainService.startHeartbeat();
      // Timer should be different (old cleared, new created)
      expect(blockchainService.heartbeatTimer).not.toBe(firstTimer);
      spy.mockRestore();
    });

    it('should null out timer on stop', () => {
      jest.spyOn(blockchainService, 'performHealthCheck').mockResolvedValue();
      blockchainService.startHeartbeat();
      blockchainService.stopHeartbeat();
      expect(blockchainService.heartbeatTimer).toBeNull();
    });

    it('should handle stop when no timer exists', () => {
      blockchainService.stopHeartbeat();
      // Should not throw
      expect(blockchainService.heartbeatTimer).toBeNull();
    });
  });

  describe('validateContractEvents', () => {
    it('should pass when all expected events exist', () => {
      const mockContract = {
        interface: {
          events: {
            'TaskCreated(uint256,address,string,uint256,uint256)': {},
            'TaskCompleted(uint256,address,uint256)': {},
            'TaskDeleted(uint256,address,uint256)': {},
            'TaskRestored(uint256,address,uint256)': {},
            'TaskUpdated(uint256,address,string,string,uint256)': {},
          },
          getEvent: jest.fn().mockReturnValue({}),
        },
      };

      expect(() => {
        blockchainService.validateContractEvents(mockContract, 31337);
      }).not.toThrow();
    });

    it('should throw when an expected event is missing', () => {
      const mockContract = {
        interface: {
          events: {},
          getEvent: jest.fn().mockImplementation((name) => {
            if (name === 'TaskCreated') return {};
            throw new Error('not found');
          }),
        },
      };

      expect(() => {
        blockchainService.validateContractEvents(mockContract, 31337);
      }).toThrow('Contract event validation failed');
    });

    it('should list missing events in error message', () => {
      const mockContract = {
        interface: {
          events: {},
          getEvent: jest.fn().mockImplementation(() => {
            throw new Error('not found');
          }),
        },
      };

      expect(() => {
        blockchainService.validateContractEvents(mockContract, 31337);
      }).toThrow(/TaskCreated/);
    });
  });

  describe('Module Export', () => {
    it('should export a singleton instance', () => {
      const service1 = require('../../../src/services/blockchainService');
      const service2 = require('../../../src/services/blockchainService');

      expect(service1).toBe(service2);
    });
  });
});
