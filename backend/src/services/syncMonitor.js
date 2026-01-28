const logger = require("../utils/logger");
const Todo = require("../models/Todo");

class SyncMonitor {
  constructor(blockchainService) {
    this.blockchainService = blockchainService;
    this.checkInterval = parseInt(process.env.SYNC_CHECK_INTERVAL) || 30000; // 30 seconds default
    this.timer = null;
    this.isRunning = false;
  }

  /**
   * Start the sync monitor
   */
  start() {
    if (this.isRunning) {
      logger.warn("Sync monitor already running");
      return;
    }

    this.isRunning = true;
    this.timer = setInterval(() => this.checkSync(), this.checkInterval);
    logger.info(
      `✓ Sync monitor started (checking every ${this.checkInterval}ms)`,
    );
  }

  /**
   * Stop the sync monitor
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    logger.info("Sync monitor stopped");
  }

  /**
   * Check if database is in sync with blockchain
   * Fixes any out-of-sync tasks automatically
   */
  async checkSync() {
    try {
      const chains = Object.keys(this.blockchainService.contracts);

      for (const chainId of chains) {
        await this.checkChainSync(parseInt(chainId));
      }
    } catch (error) {
      logger.error("Error in sync monitor:", {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Check sync for a specific chain
   */
  async checkChainSync(chainId) {
    const contract = this.blockchainService.contracts[chainId];
    if (!contract) return;

    try {
      // Get all tasks from database for this chain
      const dbTasks = await Todo.find({ chainId, deleted: false })
        .select("blockchainId completed")
        .lean();

      let syncedCount = 0;
      let outOfSyncCount = 0;

      // Check each task against blockchain
      for (const dbTask of dbTasks) {
        try {
          // Get task state from blockchain
          const blockchainTask = await contract.getTask(dbTask.blockchainId);

          // Check if completed status matches
          if (blockchainTask.completed !== dbTask.completed) {
            outOfSyncCount++;
            logger.warn(
              `🔄 Task ${dbTask.blockchainId} out of sync on chain ${chainId}:`,
              {
                database: { completed: dbTask.completed },
                blockchain: { completed: blockchainTask.completed },
              },
            );

            // Sync the task
            if (blockchainTask.completed && !dbTask.completed) {
              // Task was completed on blockchain but not in database
              await this.blockchainService.syncTaskCompleted(
                chainId,
                BigInt(dbTask.blockchainId),
                blockchainTask.completedAt,
              );
              syncedCount++;
              logger.info(
                `✓ Auto-synced TaskCompleted: ${dbTask.blockchainId} on chain ${chainId}`,
              );
            }
          }
        } catch (error) {
          // Task might be deleted or not exist on blockchain - skip
          if (!error.message.includes("Task not found")) {
            logger.debug(
              `Could not check task ${dbTask.blockchainId}:`,
              error.message,
            );
          }
        }
      }

      if (outOfSyncCount > 0) {
        logger.info(
          `Sync check for chain ${chainId}: ${syncedCount}/${outOfSyncCount} tasks auto-synced`,
        );
      }
    } catch (error) {
      logger.error(`Error checking sync for chain ${chainId}:`, {
        error: error.message,
        stack: error.stack,
      });
    }
  }
}

module.exports = SyncMonitor;
