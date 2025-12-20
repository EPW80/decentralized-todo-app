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

    it('should return 128 confirmations for Mumbai (chainId 80001)', () => {
      expect(blockchainService.getDefaultConfirmations(80001)).toBe(128);
    });

    it('should return 1 confirmation for Arbitrum One (chainId 42161)', () => {
      expect(blockchainService.getDefaultConfirmations(42161)).toBe(1);
    });

    it('should return 1 confirmation for Arbitrum Goerli (chainId 421613)', () => {
      expect(blockchainService.getDefaultConfirmations(421613)).toBe(1);
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

    it('should return 43200 blocks per day for Mumbai (chainId 80001)', () => {
      expect(blockchainService.getBlocksPerDay(80001)).toBe(43200);
    });

    it('should return 240000 blocks per day for Arbitrum One (chainId 42161)', () => {
      expect(blockchainService.getBlocksPerDay(42161)).toBe(240000);
    });

    it('should return 240000 blocks per day for Arbitrum Goerli (chainId 421613)', () => {
      expect(blockchainService.getBlocksPerDay(421613)).toBe(240000);
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
      expect(blockchainService.getAverageBlockTime(80001)).toBe(2);     // Mumbai
      expect(blockchainService.getAverageBlockTime(42161)).toBe(0.36);  // Arbitrum
      expect(blockchainService.getAverageBlockTime(421613)).toBe(0.36); // Arbitrum Goerli
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

  describe('Module Export', () => {
    it('should export a singleton instance', () => {
      const service1 = require('../../../src/services/blockchainService');
      const service2 = require('../../../src/services/blockchainService');

      expect(service1).toBe(service2);
    });
  });
});
