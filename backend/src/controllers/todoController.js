const Todo = require("../models/Todo");
const blockchainService = require("../services/blockchainService");

/**
 * Get all todos for a specific address with advanced filtering and sorting
 * GET /api/todos/:address
 * Query params:
 *   - includeCompleted: boolean (default: true)
 *   - includeDeleted: boolean (default: false)
 *   - search: string (searches in description)
 *   - dueFilter: 'overdue' | 'today' | 'week' | 'all'
 *   - sort: 'newest' | 'oldest' | 'dueDate' | 'alpha'
 */
const getTodosByAddress = async (req, res, next) => {
  try {
    const { address } = req.params;
    const { includeCompleted, includeDeleted, search, dueFilter, sort } =
      req.query;

    let todos;

    // If advanced filters are used, use the new method
    if (search || dueFilter || sort) {
      const filters = {
        includeCompleted: includeCompleted !== "false",
        includeDeleted: includeDeleted === "true",
        search,
        dueFilter,
        sort,
      };
      todos = await Todo.findByOwnerWithFilters(address, filters);
    } else {
      // Use original method for backward compatibility
      todos = await Todo.findByOwner(
        address,
        includeCompleted !== "false",
        includeDeleted === "true",
      );
    }

    const logger = require("../utils/logger");
    logger.info(`Found ${todos.length} todos for ${address}`, {
      includeCompleted: includeCompleted !== "false",
      includeDeleted: includeDeleted === "true",
      todos: todos.map((t) => ({
        id: t._id,
        description: t.description,
        chainId: t.chainId,
        completed: t.completed,
        deleted: t.deleted,
      })),
    });

    res.json({
      success: true,
      count: todos.length,
      data: todos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific todo by ID
 * GET /api/todos/todo/:id
 */
const getTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    res.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a todo against blockchain
 * GET /api/todos/verify/:id
 */
const verifyTodo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    // Get blockchain data
    const contract = blockchainService.getContract(todo.chainId);
    if (!contract) {
      return res.status(500).json({
        success: false,
        error: "Blockchain network not available",
      });
    }

    try {
      const blockchainTask = await contract.getTask(todo.blockchainId);

      const isValid =
        blockchainTask.owner.toLowerCase() === todo.owner &&
        blockchainTask.description === todo.description &&
        blockchainTask.completed === todo.completed &&
        blockchainTask.deleted === todo.deleted;

      res.json({
        success: true,
        data: {
          isValid,
          cached: {
            description: todo.description,
            completed: todo.completed,
            deleted: todo.deleted,
            owner: todo.owner,
          },
          blockchain: {
            description: blockchainTask.description,
            completed: blockchainTask.completed,
            deleted: blockchainTask.deleted,
            owner: blockchainTask.owner.toLowerCase(),
          },
        },
      });
    } catch (blockchainError) {
      res.json({
        success: true,
        data: {
          isValid: false,
          error: "Task not found on blockchain or has been deleted",
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get user stats
 * GET /api/todos/:address/stats
 */
const getUserStats = async (req, res, next) => {
  try {
    const { address } = req.params;

    const [total, completed, active] = await Promise.all([
      Todo.countByOwner(address),
      Todo.countDocuments({
        owner: address.toLowerCase(),
        completed: true,
        deleted: false,
      }),
      Todo.countDocuments({
        owner: address.toLowerCase(),
        completed: false,
        deleted: false,
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        completed,
        active,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync a specific todo from blockchain
 * POST /api/todos/sync
 */
const syncTodoFromBlockchain = async (req, res, next) => {
  try {
    const { chainId, blockchainId } = req.body;

    if (!chainId || !blockchainId) {
      return res.status(400).json({
        success: false,
        error: "chainId and blockchainId are required",
      });
    }

    const contract = blockchainService.getContract(chainId);
    if (!contract) {
      return res.status(400).json({
        success: false,
        error: "Invalid chainId or blockchain not connected",
      });
    }

    // Fetch task from blockchain
    const task = await contract.getTask(blockchainId);

    // Check if already exists in DB
    let todo = await Todo.findByBlockchainId(chainId, blockchainId);

    if (todo) {
      // Update existing
      todo.description = task.description;
      todo.completed = task.completed;
      todo.blockchainCompletedAt = task.completed
        ? new Date(Number(task.completedAt) * 1000)
        : null;
      todo.deleted = task.deleted;
      todo.deletedAt =
        task.deleted && task.deletedAt
          ? new Date(Number(task.deletedAt) * 1000)
          : null;
      todo.syncStatus = "synced";
      todo.lastSyncedAt = new Date();
      await todo.save();
    } else {
      // Create new
      todo = new Todo({
        blockchainId: blockchainId.toString(),
        chainId,
        transactionHash: "", // Not available from direct query
        owner: task.owner.toLowerCase(),
        description: task.description,
        completed: task.completed,
        blockchainCreatedAt: new Date(Number(task.createdAt) * 1000),
        blockchainCompletedAt: task.completed
          ? new Date(Number(task.completedAt) * 1000)
          : null,
        deleted: task.deleted,
        deletedAt:
          task.deleted && task.deletedAt
            ? new Date(Number(task.deletedAt) * 1000)
            : null,
        syncStatus: "synced",
      });
      await todo.save();
    }

    res.json({
      success: true,
      message: "Todo synced from blockchain",
      data: todo,
    });
  } catch (error) {
    if (error.message && error.message.includes("Task does not exist")) {
      return res.status(404).json({
        success: false,
        error: "Task not found on blockchain",
      });
    }
    next(error);
  }
};

/**
 * Restore a deleted todo
 * POST /api/todos/restore
 */
const restoreTodo = async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Todo ID is required",
      });
    }

    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    if (!todo.deleted) {
      return res.status(400).json({
        success: false,
        error: "Todo is not deleted",
      });
    }

    await todo.markAsRestored();

    res.json({
      success: true,
      message: "Todo restored successfully",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a todo's description
 * PUT /api/todos/:id
 */
const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Description is required",
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        error: "Description must be 500 characters or less",
      });
    }

    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    if (todo.deleted) {
      return res.status(400).json({
        success: false,
        error: "Cannot update deleted todo",
      });
    }

    // Update in database
    await todo.updateDescription(description.trim());

    res.json({
      success: true,
      message: "Todo updated successfully",
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodosByAddress,
  getTodoById,
  verifyTodo,
  getUserStats,
  syncTodoFromBlockchain,
  restoreTodo,
  updateTodo,
};
