const express = require("express");
const {
  getTodosByAddress,
  getTodoById,
  verifyTodo,
  getUserStats,
  syncTodoFromBlockchain,
  restoreTodo,
} = require("../controllers/todoController");
const { validateAddress, verifyJWT } = require("../middleware/auth");
const {
  validateSyncRequest,
  validateRestoreRequest,
  validateTodoQuery
} = require("../middleware/validation");

const rateLimit = require('express-rate-limit');

const router = express.Router();

/**
 * Optional JWT authentication middleware
 * Validates JWT if provided, but allows request to continue if not provided
 */
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    return verifyJWT(req, res, next);
  }
  next();
};

/**
 * Strict rate limiter for expensive blockchain operations
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: { success: false, error: 'Too many requests for this operation, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Get todos by address
// GET /api/todos/:address?includeCompleted=true&includeDeleted=false
router.get("/:address", validateAddress, validateTodoQuery, getTodosByAddress);

// Get user statistics
// GET /api/todos/:address/stats
router.get("/:address/stats", validateAddress, getUserStats);

// Get specific todo by MongoDB ID
// GET /api/todos/todo/:id
// Note: No auth required as this is a simple ID lookup
router.get("/todo/:id", getTodoById);

// Verify todo against blockchain (expensive operation - strict rate limit)
// GET /api/todos/verify/:id
router.get("/verify/:id", strictLimiter, verifyTodo);

// Manually sync a todo from blockchain (expensive operation - strict rate limit)
// POST /api/todos/sync
// Body: { chainId, blockchainId }
router.post("/sync", strictLimiter, optionalAuth, validateSyncRequest, syncTodoFromBlockchain);

// Restore a deleted todo (expensive operation - strict rate limit)
// POST /api/todos/restore
// Body: { id }
router.post("/restore", strictLimiter, optionalAuth, validateRestoreRequest, restoreTodo);

module.exports = router;
