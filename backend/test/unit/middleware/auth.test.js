const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const {
  verifyWalletSignature,
  verifyJWT,
  generateToken,
  validateAddress,
  ensureOwnership
} = require('../../../src/middleware/auth');

jest.mock('../../../src/utils/logger');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      headers: {}
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test_jwt_secret_with_at_least_32_characters_for_testing';
  });

  describe('verifyWalletSignature', () => {
    it('should verify valid wallet signature and call next', async () => {
      const wallet = ethers.Wallet.createRandom();
      const message = 'Login to Todo App - Nonce: 12345';
      const signature = await wallet.signMessage(message);

      req.body = {
        address: wallet.address,
        signature: signature,
        message: message
      };

      await verifyWalletSignature(req, res, next);

      expect(req.userAddress).toBe(wallet.address.toLowerCase());
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject when address is missing', async () => {
      req.body = {
        signature: '0x123',
        message: 'test'
      };

      await verifyWalletSignature(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required fields: address, signature, message'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when signature is missing', async () => {
      req.body = {
        address: '0x123',
        message: 'test'
      };

      await verifyWalletSignature(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required fields: address, signature, message'
      });
    });

    it('should reject when message is missing', async () => {
      req.body = {
        address: '0x123',
        signature: '0x456'
      };

      await verifyWalletSignature(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required fields: address, signature, message'
      });
    });

    it('should reject invalid signature', async () => {
      const wallet1 = ethers.Wallet.createRandom();
      const wallet2 = ethers.Wallet.createRandom();
      const message = 'Login to Todo App';
      const signature = await wallet1.signMessage(message);

      req.body = {
        address: wallet2.address,
        signature: signature,
        message: message
      };

      await verifyWalletSignature(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid signature'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle malformed signature', async () => {
      req.body = {
        address: '0x123',
        signature: 'invalid_signature',
        message: 'test'
      };

      await verifyWalletSignature(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Signature verification failed'
      });
    });

    it('should handle case-insensitive address comparison', async () => {
      const wallet = ethers.Wallet.createRandom();
      const message = 'Login to Todo App';
      const signature = await wallet.signMessage(message);

      req.body = {
        address: wallet.address.toUpperCase(),
        signature: signature,
        message: message
      };

      await verifyWalletSignature(req, res, next);

      expect(req.userAddress).toBe(wallet.address.toLowerCase());
      expect(next).toHaveBeenCalled();
    });
  });

  describe('verifyJWT', () => {
    it('should verify valid JWT token', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const token = jwt.sign({ address }, process.env.JWT_SECRET, { expiresIn: '7d' });
      req.headers.authorization = `Bearer ${token}`;

      verifyJWT(req, res, next);

      expect(req.userAddress).toBe(address.toLowerCase());
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject when no token provided', () => {
      verifyJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when authorization header is malformed', () => {
      req.headers.authorization = 'InvalidFormat';

      verifyJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided'
      });
    });

    it('should reject invalid token', () => {
      req.headers.authorization = 'Bearer invalid_token';

      verifyJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
    });

    it('should reject expired token', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const token = jwt.sign({ address }, process.env.JWT_SECRET, { expiresIn: '-1s' });
      req.headers.authorization = `Bearer ${token}`;

      verifyJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
    });

    it('should lowercase the address from token', () => {
      const address = '0xABCDEF1234567890123456789012345678901234';
      const token = jwt.sign({ address }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      verifyJWT(req, res, next);

      expect(req.userAddress).toBe(address.toLowerCase());
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const token = generateToken(address);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.address).toBe(address.toLowerCase());
    });

    it('should generate token with 7 day expiration', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const token = generateToken(address);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(7 * 24 * 60 * 60); // 7 days in seconds
    });

    it('should lowercase the address in token', () => {
      const address = '0xABCDEF1234567890123456789012345678901234';
      const token = generateToken(address);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.address).toBe(address.toLowerCase());
    });
  });

  describe('validateAddress', () => {
    it('should validate address from params', () => {
      req.params.address = '0x1234567890123456789012345678901234567890';

      validateAddress(req, res, next);

      expect(req.validatedAddress).toBe(req.params.address.toLowerCase());
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should validate address from body', () => {
      req.body.address = '0x1234567890123456789012345678901234567890';

      validateAddress(req, res, next);

      expect(req.validatedAddress).toBe(req.body.address.toLowerCase());
      expect(next).toHaveBeenCalled();
    });

    it('should validate address from query', () => {
      req.query.address = '0x1234567890123456789012345678901234567890';

      validateAddress(req, res, next);

      expect(req.validatedAddress).toBe(req.query.address.toLowerCase());
      expect(next).toHaveBeenCalled();
    });

    it('should reject when address is missing', () => {
      validateAddress(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Address is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid Ethereum address', () => {
      req.params.address = 'invalid_address';

      validateAddress(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid Ethereum address format'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject short address', () => {
      req.params.address = '0x123';

      validateAddress(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    });

    it('should accept checksummed addresses', () => {
      req.params.address = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';

      validateAddress(req, res, next);

      expect(req.validatedAddress).toBe(req.params.address.toLowerCase());
      expect(next).toHaveBeenCalled();
    });
  });

  describe('ensureOwnership', () => {
    it('should allow access when addresses match (from params)', () => {
      req.userAddress = '0x1234567890123456789012345678901234567890';
      req.params.address = '0x1234567890123456789012345678901234567890';

      ensureOwnership(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when addresses match (from body)', () => {
      req.userAddress = '0x1234567890123456789012345678901234567890';
      req.body.owner = '0x1234567890123456789012345678901234567890';

      ensureOwnership(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access with case-insensitive comparison', () => {
      req.userAddress = '0x1234567890123456789012345678901234567890';
      req.params.address = '0x1234567890123456789012345678901234567890'.toUpperCase();

      ensureOwnership(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', () => {
      req.params.address = '0x1234567890123456789012345678901234567890';

      ensureOwnership(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when addresses do not match', () => {
      req.userAddress = '0x1111111111111111111111111111111111111111';
      req.params.address = '0x2222222222222222222222222222222222222222';

      ensureOwnership(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied: You can only access your own resources'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access when no resource address specified', () => {
      req.userAddress = '0x1234567890123456789012345678901234567890';

      ensureOwnership(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
