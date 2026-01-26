const express = require("express");
const {
  getTodosByAddress,
  getTodoById,
  verifyTodo,
  getUserStats,
  syncTodoFromBlockchain,
  restoreTodo,
  updateTodo,
} = require("../controllers/todoController");
const {
  validateAddress,
  verifyJWT,
  ensureOwnership,
} = require("../middleware/auth");
const {
  validateSyncRequest,
  validateRestoreRequest,
  validateTodoQuery,
} = require("../middleware/validation");

const rateLimit = require("express-rate-limit");

const router = express.Router();

/**
 * Strict rate limiter for expensive blockchain operations
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    success: false,
    error: "Too many requests for this operation, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get todos by address (protected - user can only access their own todos)
// GET /api/todos/:address?includeCompleted=true&includeDeleted=false
router.get(
  "/:address",
  verifyJWT,
  ensureOwnership,
  validateAddress,
  validateTodoQuery,
  getTodosByAddress
);

// Get user statistics (protected - user can only access their own stats)
// GET /api/todos/:address/stats
router.get(
  "/:address/stats",
  verifyJWT,
  ensureOwnership,
  validateAddress,
  getUserStats
);

// Get specific todo by MongoDB ID (protected)
// GET /api/todos/todo/:id
router.get("/todo/:id", verifyJWT, getTodoById);

// Verify todo against blockchain (protected, expensive operation - strict rate limit)
// GET /api/todos/verify/:id
router.get("/verify/:id", verifyJWT, strictLimiter, verifyTodo);

// Manually sync a todo from blockchain (protected, expensive operation - strict rate limit)
// POST /api/todos/sync
// Body: { chainId, blockchainId }
router.post(
  "/sync",
  verifyJWT,
  strictLimiter,
  validateSyncRequest,
  syncTodoFromBlockchain
);

// Restore a deleted todo (protected, expensive operation - strict rate limit)
// POST /api/todos/restore
// Body: { id }
router.post(
  "/restore",
  verifyJWT,
  strictLimiter,
  validateRestoreRequest,
  restoreTodo
);

// Update a todo's description (protected)
// PUT /api/todos/:id
// Body: { description }
router.put("/:id", verifyJWT, updateTodo);

module.exports = router;
