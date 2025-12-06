const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors from express-validator
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}

/**
 * Validation middleware for sync endpoint
 */
const validateSyncRequest = [
  body('chainId')
    .isInt({ min: 1 })
    .withMessage('chainId must be a valid positive integer')
    .toInt(),
  body('blockchainId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('blockchainId is required and must be a string'),
  handleValidationErrors
];

/**
 * Validation middleware for restore endpoint
 */
const validateRestoreRequest = [
  body('id')
    .isMongoId()
    .withMessage('id must be a valid MongoDB ObjectId'),
  handleValidationErrors
];

/**
 * Validation middleware for address parameter
 */
const validateAddressParam = [
  param('address')
    .isString()
    .trim()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('address must be a valid Ethereum address'),
  handleValidationErrors
];

/**
 * Validation middleware for query parameters
 */
const validateTodoQuery = [
  query('includeCompleted')
    .optional()
    .isBoolean()
    .withMessage('includeCompleted must be a boolean'),
  query('includeDeleted')
    .optional()
    .isBoolean()
    .withMessage('includeDeleted must be a boolean'),
  handleValidationErrors
];

module.exports = {
  validateSyncRequest,
  validateRestoreRequest,
  validateAddressParam,
  validateTodoQuery,
  handleValidationErrors
};
