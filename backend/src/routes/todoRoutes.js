const express = require("express");
const {
  getTodosByAddress,
  getTodoById,
  verifyTodo,
  getUserStats,
  syncTodoFromBlockchain,
  restoreTodo,
} = require("../controllers/todoController");
const { validateAddress } = require("../middleware/auth");

const router = express.Router();

// Get todos by address
// GET /api/todos/:address?includeCompleted=true&includeDeleted=false
router.get("/:address", validateAddress, getTodosByAddress);

// Get user statistics
// GET /api/todos/:address/stats
router.get("/:address/stats", validateAddress, getUserStats);

// Get specific todo by MongoDB ID
// GET /api/todos/todo/:id
router.get("/todo/:id", getTodoById);

// Verify todo against blockchain
// GET /api/todos/verify/:id
router.get("/verify/:id", verifyTodo);

// Manually sync a todo from blockchain
// POST /api/todos/sync
// Body: { chainId, blockchainId }
router.post("/sync", syncTodoFromBlockchain);

// Restore a deleted todo
// POST /api/todos/restore
// Body: { id }
router.post("/restore", restoreTodo);

module.exports = router;
