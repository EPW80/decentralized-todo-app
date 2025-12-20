const express = require('express');
const request = require('supertest');
const { ethers } = require('ethers');
const authRoutes = require('../../../src/routes/authRoutes');

// Mock dependencies
jest.mock('../../../src/utils/logger');

describe('Auth Routes Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  describe('GET /api/auth/nonce/:address', () => {
    it('should return a nonce for valid address', async () => {
      const address = '0x1234567890123456789012345678901234567890';

      const response = await request(app)
        .get(`/api/auth/nonce/${address}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.nonce).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.message).toContain(address);
      expect(response.body.message).toContain('Sign this message');
      expect(typeof response.body.nonce).toBe('number');
      expect(typeof response.body.timestamp).toBe('number');
    });

    it('should return unique nonces for multiple requests', async () => {
      const address = '0x1234567890123456789012345678901234567890';

      const response1 = await request(app)
        .get(`/api/auth/nonce/${address}`)
        .expect(200);

      const response2 = await request(app)
        .get(`/api/auth/nonce/${address}`)
        .expect(200);

      // Nonces should be different (with very high probability)
      expect(response1.body.nonce).not.toBe(response2.body.nonce);
    });

    it('should include timestamp in nonce response', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const beforeTimestamp = Date.now();

      const response = await request(app)
        .get(`/api/auth/nonce/${address}`)
        .expect(200);

      const afterTimestamp = Date.now();

      expect(response.body.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(response.body.timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should work with different addresses', async () => {
      const address1 = '0x1111111111111111111111111111111111111111';
      const address2 = '0x2222222222222222222222222222222222222222';

      const response1 = await request(app)
        .get(`/api/auth/nonce/${address1}`)
        .expect(200);

      const response2 = await request(app)
        .get(`/api/auth/nonce/${address2}`)
        .expect(200);

      expect(response1.body.message).toContain(address1);
      expect(response2.body.message).toContain(address2);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate with valid wallet signature and return token', async () => {
      const wallet = ethers.Wallet.createRandom();
      const message = 'Sign this message to authenticate';
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: wallet.address,
          signature: signature,
          message: message
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.address).toBe(wallet.address.toLowerCase());
      expect(typeof response.body.token).toBe('string');
    });

    it('should reject invalid signature', async () => {
      const wallet1 = ethers.Wallet.createRandom();
      const wallet2 = ethers.Wallet.createRandom();
      const message = 'Sign this message';
      const signature = await wallet1.signMessage(message);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: wallet2.address,
          signature: signature,
          message: message
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid signature');
    });

    it('should reject missing address', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          signature: '0x123',
          message: 'test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields: address, signature, message');
    });

    it('should reject missing signature', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: '0x1234567890123456789012345678901234567890',
          message: 'test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields: address, signature, message');
    });

    it('should reject missing message', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: '0x1234567890123456789012345678901234567890',
          signature: '0x123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields: address, signature, message');
    });

    it('should reject malformed signature', async () => {
      const wallet = ethers.Wallet.createRandom();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: wallet.address,
          signature: 'invalid_signature',
          message: 'test'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Signature verification failed');
    });

    it('should handle case-insensitive addresses', async () => {
      const wallet = ethers.Wallet.createRandom();
      const message = 'Sign this message';
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: wallet.address.toUpperCase(),
          signature: signature,
          message: message
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.address).toBe(wallet.address.toLowerCase());
    });

    it('should return JWT token that contains address', async () => {
      const wallet = ethers.Wallet.createRandom();
      const message = 'Sign this message';
      const signature = await wallet.signMessage(message);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: wallet.address,
          signature: signature,
          message: message
        })
        .expect(200);

      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(response.body.token);

      expect(decoded.address).toBe(wallet.address.toLowerCase());
    });
  });
});
