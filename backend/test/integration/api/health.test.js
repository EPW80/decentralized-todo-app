const request = require('supertest');
const express = require('express');
const healthRoutes = require('../../../src/routes/healthRoutes');
const blockchainService = require('../../../src/services/blockchainService');

// Mock blockchain service to avoid circular JSON issues
jest.mock('../../../src/services/blockchainService', () => ({
  isInitialized: jest.fn(),
  getNetworkInfo: jest.fn(),
  getHealthStatus: jest.fn()
}));

describe('Health API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/health', healthRoutes);

    // Setup default mock responses
    blockchainService.isInitialized.mockReturnValue(false);
    blockchainService.getNetworkInfo.mockResolvedValue({});
    blockchainService.getHealthStatus.mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return uptime information', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return services status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('blockchain');
    });

    it('should include blockchain info when initialized', async () => {
      // Mock blockchain as initialized
      blockchainService.isInitialized.mockReturnValue(true);
      blockchainService.getNetworkInfo.mockResolvedValue({
        '31337': {
          name: 'localhost',
          chainId: 31337,
          blockNumber: 100,
          contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
        }
      });

      const response = await request(app).get('/api/health');

      expect(response.body).toHaveProperty('blockchain');
      expect(response.body.blockchain).toHaveProperty('31337');
    });

    it('should return 503 when services are disconnected', async () => {
      blockchainService.isInitialized.mockReturnValue(false);

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(503);
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
    });

    it('should include monitoring info when blockchain is initialized', async () => {
      blockchainService.isInitialized.mockReturnValue(true);
      blockchainService.getNetworkInfo.mockResolvedValue({
        '31337': { name: 'localhost', chainId: 31337, blockNumber: 100 }
      });
      blockchainService.getHealthStatus.mockReturnValue({
        heartbeatInterval: 60000,
        maxConsecutiveFailures: 3,
        chains: {
          '31337': {
            eventListenersActive: true,
            lastHeartbeat: Date.now(),
            consecutiveFailures: 0
          }
        }
      });

      const response = await request(app).get('/api/health/detailed');

      expect(response.body).toHaveProperty('blockchain');
      expect(response.body.blockchain).toHaveProperty('networks');
      expect(response.body.blockchain).toHaveProperty('monitoring');
      expect(response.body.blockchain.monitoring).toHaveProperty('heartbeatInterval');
    });
  });
});
