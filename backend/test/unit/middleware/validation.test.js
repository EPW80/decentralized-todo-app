const { body, validationResult } = require('express-validator');
const { handleValidationErrors } = require('../../../src/middleware/validation');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() when validation passes', async () => {
    req.body = { description: 'Valid todo description' };

    // Create validation chain
    const validationChain = [
      body('description').isString().notEmpty(),
    ];

    // Run validation
    for (const validation of validationChain) {
      await validation.run(req);
    }

    // Run handleValidationErrors middleware
    handleValidationErrors(req, res, next);

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it('should return 400 when validation fails', async () => {
    req.body = { description: '' }; // Empty description

    // Create validation chain
    const validationChain = [
      body('description').isString().notEmpty(),
    ];

    // Run validation
    for (const validation of validationChain) {
      await validation.run(req);
    }

    // Run handleValidationErrors middleware
    handleValidationErrors(req, res, next);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    }
  });

  it('should include error details in response', async () => {
    req.body = { description: 123 }; // Wrong type

    // Create validation chain
    const validationChain = [
      body('description').isString(),
    ];

    // Run validation
    for (const validation of validationChain) {
      await validation.run(req);
    }

    // Run handleValidationErrors middleware
    handleValidationErrors(req, res, next);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.any(Array),
        })
      );
    }
  });
});
