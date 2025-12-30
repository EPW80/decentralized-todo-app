const { ethers } = require('ethers');
const logger = require('../utils/logger');
const Todo = require('../models/Todo');
const { networks, contractAddresses, contractABI, defaultNetwork } = require('../config/blockchain');

class BlockchainService {
  constructor() {
    this.providers = {};
    this.contracts = {};
    this.initialized = false;
    this.lastProcessedBlock = {};
    this.reconnectAttempts = {};
    this.eventListenersActive = {};
    this.eventHandlers = {}; // Store handler references to prevent memory leaks

    // Configurable parameters from environment
    this.maxReconnectAttempts = parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 5;
    this.reconnectDelay = parseInt(process.env.RECONNECT_BASE_DELAY) || 5000; // 5 seconds

    // Chain-specific confirmations (will be set per chain)
    this.confirmations = {};

    // Health monitoring
    this.heartbeatInterval = parseInt(process.env.HEARTBEAT_INTERVAL) || 60000; // 1 minute default
    this.heartbeatTimer = null;
    this.lastHeartbeat = {}; // Track last successful heartbeat per chain
    this.consecutiveFailures = {}; // Track consecutive health check failures
    this.maxConsecutiveFailures = 3; // Restart after 3 consecutive failures

    // Track ethers.js filter errors
    this.filterErrorCount = {};
    this.lastFilterErrorTime = {};

    // Install global handler for ethers.js FilterIdEventSubscriber errors
    this.installGlobalErrorHandler();
  }

  /**
   * Install a process-level error handler to catch ethers.js FilterIdEventSubscriber errors
   * These errors occur when Hardhat returns malformed filter responses
   */
  installGlobalErrorHandler() {
    // Check if we've already installed the handler
    if (this.globalErrorHandlerInstalled) {
      return;
    }

    const errorHandler = (error) => {
      // Only handle "results is not iterable" errors from FilterIdEventSubscriber
      if (error && error.message && error.message.includes('results is not iterable')) {
        const stackTrace = error.stack || '';
        if (stackTrace.includes('FilterIdEventSubscriber')) {
          logger.warn('⚠️  Caught ethers.js FilterIdEventSubscriber error:', {
            error: error.message,
            note: 'This is a known issue with Hardhat local nodes. Event listeners will be restarted.'
          });

          // Track error frequency per chain
          for (const chainId of Object.keys(this.providers)) {
            if (!this.filterErrorCount[chainId]) {
              this.filterErrorCount[chainId] = 0;
            }

            // Increment error count
            this.filterErrorCount[chainId]++;

            // Check if we should restart (throttle to once per 10 seconds)
            const now = Date.now();
            const lastError = this.lastFilterErrorTime[chainId] || 0;
            if (now - lastError > 10000) {
              this.lastFilterErrorTime[chainId] = now;

              logger.warn(`🔄 Restarting event listeners for chain ${chainId} due to FilterIdEventSubscriber errors (${this.filterErrorCount[chainId]} total)`);

              // Restart event listeners asynchronously
              this.restartEventListeners(chainId).catch(err => {
                logger.error(`Failed to restart event listeners for chain ${chainId}:`, err);
              });
            }
          }

          // Mark as handled (don't crash the process)
          return true;
        }
      }

      // Not our error, let other handlers deal with it
      return false;
    };

    // Use uncaughtException for synchronous errors
    process.on('uncaughtException', (error) => {
      if (!errorHandler(error)) {
        // Re-throw if not handled by us
        logger.error('Uncaught exception:', error);
        // Don't exit the process for non-critical errors
      }
    });

    // Use unhandledRejection for promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      if (reason && typeof reason === 'object') {
        if (!errorHandler(reason)) {
          logger.error('Unhandled rejection:', { reason, promise });
        }
      } else {
        logger.error('Unhandled rejection:', { reason, promise });
      }
    });

    this.globalErrorHandlerInstalled = true;
    logger.info('✓ Global error handler installed for ethers.js FilterIdEventSubscriber errors');
  }

  async initialize() {
    try {
      // Initialize providers and contracts for each network
      for (const [networkKey, network] of Object.entries(networks)) {
        if (!network.rpcUrl) {
          logger.warn(`Skipping ${network.name}: No RPC URL provided`);
          continue;
        }

        const contractAddress = contractAddresses[network.chainId];
        if (!contractAddress) {
          logger.warn(`Skipping ${network.name}: No contract deployed`);
          continue;
        }

        try {
          // Set chain-specific confirmations from environment or defaults
          const envKey = `CONFIRMATION_BLOCKS_${networkKey.toUpperCase()}`;
          const defaultConfirmations = this.getDefaultConfirmations(network.chainId);
          this.confirmations[network.chainId] = parseInt(process.env[envKey]) || defaultConfirmations;

          // Create resilient provider with failover support
          const provider = this.createResilientProvider(network);
          this.providers[network.chainId] = provider;

          // Create contract instance
          const contract = new ethers.Contract(contractAddress, contractABI, provider);
          this.contracts[network.chainId] = contract;

          // Start event listeners
          this.startEventListeners(network.chainId);

          // Recover any missed events during downtime
          await this.recoverMissedEvents(network.chainId);

          logger.info(`✓ Connected to ${network.name} (chainId: ${network.chainId}, confirmations: ${this.confirmations[network.chainId]})`);
        } catch (error) {
          logger.error(`Error initializing ${network.name}:`, { error: error.message, stack: error.stack });
        }
      }

      this.initialized = true;

      // Start health monitoring heartbeat
      this.startHeartbeat();
      logger.info(`✓ Health monitoring started (heartbeat interval: ${this.heartbeatInterval}ms)`);
    } catch (error) {
      logger.error('Error initializing blockchain service:', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Create resilient provider with automatic failover to backup RPC
   * Uses FallbackProvider if backup URL is available, otherwise single provider
   */
  createResilientProvider(network) {
    const rpcs = [
      network.rpcUrl,
      network.rpcBackup
    ].filter(Boolean); // Remove empty strings

    // If only one RPC URL, use simple provider
    if (rpcs.length === 1) {
      return new ethers.JsonRpcProvider(rpcs[0]);
    }

    // Use FallbackProvider for automatic failover
    logger.info(`Setting up failover for ${network.name} with ${rpcs.length} RPC endpoints`);

    const providers = rpcs.map((rpc, index) => ({
      provider: new ethers.JsonRpcProvider(rpc),
      priority: index + 1,      // Lower priority = preferred (1 is highest)
      stallTimeout: 2000,        // 2 seconds before trying next provider
      weight: 1                  // Equal weight for load balancing
    }));

    return new ethers.FallbackProvider(providers);
  }

  /**
   * Get default confirmation blocks based on chain characteristics
   */
  getDefaultConfirmations(chainId) {
    const confirmationDefaults = {
      1: 12,        // Ethereum Mainnet - 12 blocks (~3 minutes)
      11155111: 12, // Sepolia - 12 blocks
      137: 128,     // Polygon Mainnet - 128 blocks (~5 minutes)
      80001: 128,   // Mumbai - 128 blocks
      42161: 1,     // Arbitrum One - 1 block (fast finality)
      421613: 1,    // Arbitrum Goerli - 1 block
      10: 1,        // Optimism - 1 block (fast finality)
      11155420: 1,  // Optimism Sepolia - 1 block
      31337: 1      // Localhost/Hardhat - 1 block
    };

    return confirmationDefaults[chainId] || 12; // Default to 12 if unknown
  }

  /**
   * Recover missed events during backend downtime
   * Queries blockchain for events since last successful sync
   */
  async recoverMissedEvents(chainId) {
    try {
      const contract = this.contracts[chainId];
      const provider = this.providers[chainId];

      if (!contract || !provider) {
        logger.warn(`Cannot recover events for chain ${chainId}: contract or provider not available`);
        return;
      }

      // Find the last synced todo for this chain
      const lastSynced = await Todo.findOne({ chainId })
        .sort({ lastSyncedAt: -1 })
        .select('lastSyncedAt')
        .lean();

      // Get current block number
      const currentBlock = await provider.getBlockNumber();

      // Calculate recovery window
      const recoveryDays = process.env.EVENT_RECOVERY_DAYS !== undefined ? parseInt(process.env.EVENT_RECOVERY_DAYS) : 7;
      const blocksPerDay = this.getBlocksPerDay(chainId);
      const defaultStartBlock = Math.max(0, currentBlock - (blocksPerDay * recoveryDays));

      let fromBlock = defaultStartBlock;

      // If we have a last sync timestamp, calculate approximate block
      if (lastSynced?.lastSyncedAt) {
        const secondsSinceLastSync = (Date.now() - new Date(lastSynced.lastSyncedAt).getTime()) / 1000;
        const blockTime = this.getAverageBlockTime(chainId);
        const blocksSince = Math.floor(secondsSinceLastSync / blockTime);
        fromBlock = Math.max(defaultStartBlock, currentBlock - blocksSince - 100); // Add 100 block buffer
      }

      // Don't sync if we're already up to date (within 10 blocks)
      if (currentBlock - fromBlock < 10) {
        logger.info(`✓ Chain ${chainId} is up to date, no event recovery needed`);
        return;
      }

      logger.info(`🔄 Recovering events for chain ${chainId} from block ${fromBlock} to ${currentBlock}...`);

      // Use existing resync functionality
      await this.resyncFromBlock(chainId, fromBlock);

      logger.info(`✓ Event recovery completed for chain ${chainId}`);
    } catch (error) {
      logger.error(`Error recovering missed events for chain ${chainId}:`, { error: error.message, stack: error.stack });
      // Don't throw - continue initialization even if recovery fails
    }
  }

  /**
   * Get average blocks per day for a chain
   */
  getBlocksPerDay(chainId) {
    const blocksPerDay = {
      1: 7200,       // Ethereum Mainnet - 12s blocks
      11155111: 7200, // Sepolia - 12s blocks
      137: 43200,    // Polygon Mainnet - 2s blocks
      80001: 43200,  // Mumbai - 2s blocks
      42161: 240000, // Arbitrum One - 0.36s blocks
      421613: 240000, // Arbitrum Goerli - 0.36s blocks
      10: 43200,     // Optimism - 2s blocks
      11155420: 43200, // Optimism Sepolia - 2s blocks
      31337: 7200    // Localhost/Hardhat - assume 12s
    };

    return blocksPerDay[chainId] || 7200; // Default to Ethereum timing
  }

  /**
   * Get average block time in seconds for a chain
   */
  getAverageBlockTime(chainId) {
    const blockTimes = {
      1: 12,         // Ethereum Mainnet
      11155111: 12,  // Sepolia
      137: 2,        // Polygon Mainnet
      80001: 2,      // Mumbai
      42161: 0.36,   // Arbitrum One
      421613: 0.36,  // Arbitrum Goerli
      10: 2,         // Optimism
      11155420: 2,   // Optimism Sepolia
      31337: 12      // Localhost/Hardhat
    };

    return blockTimes[chainId] || 12; // Default to 12 seconds
  }

  /**
   * Classify blockchain errors into categories for better error handling
   * @returns {Object} { type: string, shouldReconnect: boolean, isFatal: boolean }
   */
  classifyError(error, chainId) {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code;

    // Network connectivity issues
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('enotfound') ||
      errorCode === 'NETWORK_ERROR' ||
      errorCode === 'TIMEOUT'
    ) {
      return {
        type: 'NETWORK_ERROR',
        shouldReconnect: true,
        isFatal: false,
        message: `Network connectivity issue for chain ${chainId}. Will attempt reconnection.`
      };
    }

    // Event filter failures (common with ethers.js + Hardhat)
    if (
      errorMessage.includes('filter not found') ||
      errorMessage.includes('filter') && errorMessage.includes('expired') ||
      errorCode === 'UNKNOWN_ERROR' && errorMessage.includes('filter') ||
      errorMessage.includes('results is not iterable') ||
      errorMessage.includes('filtersubscriber')
    ) {
      return {
        type: 'FILTER_ERROR',
        shouldReconnect: true,
        isFatal: false,
        message: `Event filter error for chain ${chainId}. This is common with Hardhat local nodes. Will restart event listeners.`
      };
    }

    // Code/ABI mismatch errors
    if (
      errorMessage.includes('invalid event signature') ||
      errorMessage.includes('no matching event') ||
      errorMessage.includes('could not decode') ||
      errorMessage.includes('invalid argument') && errorMessage.includes('event')
    ) {
      return {
        type: 'CODE_MISMATCH',
        shouldReconnect: false,
        isFatal: true,
        message: `Code/ABI mismatch detected for chain ${chainId}. Event listener code does not match contract ABI. Check contract deployment and ABI version.`
      };
    }

    // RPC/Provider errors
    if (
      errorMessage.includes('rpc') ||
      errorMessage.includes('bad gateway') ||
      errorMessage.includes('service unavailable') ||
      errorCode === 'SERVER_ERROR'
    ) {
      return {
        type: 'RPC_ERROR',
        shouldReconnect: true,
        isFatal: false,
        message: `RPC provider error for chain ${chainId}. Will attempt to use backup RPC if available.`
      };
    }

    // Rate limiting
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorCode === 'RATE_LIMIT'
    ) {
      return {
        type: 'RATE_LIMIT',
        shouldReconnect: true,
        isFatal: false,
        message: `Rate limit exceeded for chain ${chainId}. Will retry with exponential backoff.`
      };
    }

    // Generic/unknown error
    return {
      type: 'UNKNOWN',
      shouldReconnect: true,
      isFatal: false,
      message: `Unknown error for chain ${chainId}: ${error.message}`
    };
  }

  /**
   * Validate that all expected events exist in the contract ABI
   * Fails fast if any event is missing to prevent runtime errors
   */
  validateContractEvents(contract, chainId) {
    const expectedEvents = [
      'TaskCreated',
      'TaskCompleted',
      'TaskDeleted',
      'TaskRestored'
    ];

    const missingEvents = [];
    const availableEvents = [];

    // Get all events from the contract interface
    const contractEvents = Object.keys(contract.interface.events || {});

    // Check each expected event
    for (const eventName of expectedEvents) {
      try {
        // Try to get the event fragment from the contract interface
        const eventFragment = contract.interface.getEvent(eventName);
        if (eventFragment) {
          availableEvents.push(eventName);
        } else {
          missingEvents.push(eventName);
        }
      } catch (error) {
        // Event not found in contract ABI
        missingEvents.push(eventName);
      }
    }

    // If any events are missing, fail fast with detailed error
    if (missingEvents.length > 0) {
      const errorMessage = [
        `❌ Contract event validation failed for chain ${chainId}`,
        ``,
        `Missing events: ${missingEvents.join(', ')}`,
        `Available events in contract: ${contractEvents.join(', ')}`,
        ``,
        `This indicates a mismatch between the contract ABI and the event listeners.`,
        `Please ensure the contract is deployed correctly and the ABI is up to date.`
      ].join('\n');

      logger.error(errorMessage);
      throw new Error(`Contract event validation failed: Missing events ${missingEvents.join(', ')}`);
    }

    logger.info(`✓ Contract event validation passed for chain ${chainId}: ${availableEvents.join(', ')}`);
  }

  /**
   * Start periodic health monitoring heartbeat
   */
  startHeartbeat() {
    // Clear any existing heartbeat timer
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Run initial health check
    this.performHealthCheck();

    // Set up periodic health checks
    this.heartbeatTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.heartbeatInterval);

    logger.info(`💓 Heartbeat monitoring started (interval: ${this.heartbeatInterval}ms)`);
  }

  /**
   * Stop heartbeat monitoring
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      logger.info('💓 Heartbeat monitoring stopped');
    }
  }

  /**
   * Perform health check on all active chains
   */
  async performHealthCheck() {
    const timestamp = new Date().toISOString();

    for (const chainId of Object.keys(this.providers)) {
      try {
        await this.checkChainHealth(parseInt(chainId));
      } catch (error) {
        logger.error(`Health check failed for chain ${chainId}:`, {
          error: error.message,
          timestamp
        });
      }
    }
  }

  /**
   * Check health of a specific chain and auto-restart if needed
   */
  async checkChainHealth(chainId) {
    const provider = this.providers[chainId];
    const contract = this.contracts[chainId];

    if (!provider || !contract) {
      logger.warn(`Health check skipped for chain ${chainId}: No provider or contract`);
      return;
    }

    try {
      // Test 1: Check if provider is responsive
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Provider timeout')), 5000)
        )
      ]);

      // Test 2: Check if event listeners are marked as active
      const listenersActive = this.eventListenersActive[chainId];

      // Test 3: Check if we're still processing blocks (compare with last processed block)
      const lastBlock = this.lastProcessedBlock[chainId];
      const blockStale = lastBlock && (blockNumber - lastBlock) > 100; // More than 100 blocks behind

      // Initialize consecutive failures counter
      if (!this.consecutiveFailures[chainId]) {
        this.consecutiveFailures[chainId] = 0;
      }

      // Determine health status
      let healthIssues = [];

      if (!listenersActive) {
        healthIssues.push('Event listeners marked as inactive');
      }

      if (blockStale) {
        healthIssues.push(`Block processing stale (current: ${blockNumber}, last processed: ${lastBlock})`);
      }

      // If there are health issues, increment failure counter
      if (healthIssues.length > 0) {
        this.consecutiveFailures[chainId]++;

        logger.warn(`⚠️  Health check issues for chain ${chainId} (failure ${this.consecutiveFailures[chainId]}/${this.maxConsecutiveFailures}):`, {
          issues: healthIssues,
          blockNumber,
          lastProcessedBlock: lastBlock,
          listenersActive
        });

        // Auto-restart if consecutive failures exceed threshold
        if (this.consecutiveFailures[chainId] >= this.maxConsecutiveFailures) {
          logger.warn(`🔄 Auto-restarting event listeners for chain ${chainId} due to ${this.consecutiveFailures[chainId]} consecutive health check failures`);

          // Reset failure counter before restart
          this.consecutiveFailures[chainId] = 0;

          // Restart event listeners
          await this.restartEventListeners(chainId);
        }
      } else {
        // Health check passed - reset consecutive failures
        if (this.consecutiveFailures[chainId] > 0) {
          logger.info(`✅ Health restored for chain ${chainId} after ${this.consecutiveFailures[chainId]} failures`);
          this.consecutiveFailures[chainId] = 0;
        }

        // Update last successful heartbeat
        this.lastHeartbeat[chainId] = new Date();

        // Periodic health status log (every 10 checks, roughly 10 minutes with default settings)
        const checkCount = Math.floor((Date.now() - (this.lastHeartbeat[chainId]?.getTime() || 0)) / this.heartbeatInterval);
        if (checkCount % 10 === 0) {
          logger.info(`💓 Health check passed for chain ${chainId}:`, {
            blockNumber,
            lastProcessedBlock: lastBlock,
            listenersActive,
            uptime: this.lastHeartbeat[chainId] ? `${Math.floor((Date.now() - this.lastHeartbeat[chainId].getTime()) / 60000)} minutes` : 'N/A'
          });
        }
      }
    } catch (error) {
      this.consecutiveFailures[chainId]++;

      logger.error(`❌ Health check error for chain ${chainId} (failure ${this.consecutiveFailures[chainId]}/${this.maxConsecutiveFailures}):`, {
        error: error.message,
        stack: error.stack
      });

      // Auto-restart if consecutive failures exceed threshold
      if (this.consecutiveFailures[chainId] >= this.maxConsecutiveFailures) {
        logger.error(`🔄 Auto-restarting event listeners for chain ${chainId} due to ${this.consecutiveFailures[chainId]} consecutive health check failures`);

        // Reset failure counter
        this.consecutiveFailures[chainId] = 0;

        // Attempt to restart
        try {
          await this.restartEventListeners(chainId);
        } catch (restartError) {
          logger.error(`Failed to auto-restart chain ${chainId}:`, {
            error: restartError.message,
            stack: restartError.stack
          });
        }
      }
    }
  }

  /**
   * Restart event listeners for a chain without full reconnection
   */
  async restartEventListeners(chainId) {
    logger.info(`Restarting event listeners for chain ${chainId}...`);

    try {
      // Remove old listeners
      const contract = this.contracts[chainId];
      if (contract) {
        contract.removeAllListeners();
        logger.info(`Removed old listeners for chain ${chainId}`);
      }

      // Restart event listeners
      await this.startEventListeners(chainId);

      // Recover any missed events
      await this.recoverMissedEvents(chainId);

      logger.info(`✅ Successfully restarted event listeners for chain ${chainId}`);
    } catch (error) {
      logger.error(`Failed to restart event listeners for chain ${chainId}:`, {
        error: error.message,
        stack: error.stack
      });

      // If restart fails, try full reconnection
      logger.info(`Attempting full reconnection for chain ${chainId}...`);
      await this.reconnectProvider(chainId, 'HEALTH_CHECK_FAILURE');
    }
  }

  async startEventListeners(chainId) {
    const contract = this.contracts[chainId];
    const provider = this.providers[chainId];
    if (!contract || !provider) return;

    // Validate event names match contract ABI
    this.validateContractEvents(contract, chainId);

    // Remove existing listeners to prevent memory leaks
    if (this.eventHandlers[chainId]) {
      const handlers = this.eventHandlers[chainId];

      // Remove contract event handlers
      if (handlers.taskCreated) contract.off('TaskCreated', handlers.taskCreated);
      if (handlers.taskCompleted) contract.off('TaskCompleted', handlers.taskCompleted);
      if (handlers.taskDeleted) contract.off('TaskDeleted', handlers.taskDeleted);
      if (handlers.taskRestored) contract.off('TaskRestored', handlers.taskRestored);

      // Remove provider handlers
      if (handlers.providerError) provider.off('error', handlers.providerError);
      if (handlers.blockUpdate) provider.off('block', handlers.blockUpdate);

      logger.info(`🗑️  Removed old event listeners for chain ${chainId}`);
    }

    // Mark event listeners as active
    this.eventListenersActive[chainId] = true;

    // Initialize last processed block
    try {
      this.lastProcessedBlock[chainId] = await provider.getBlockNumber();
    } catch (error) {
      logger.error(`Error getting initial block number for chain ${chainId}:`, { error: error.message, stack: error.stack });
      this.lastProcessedBlock[chainId] = 0;
    }

    // Create named handler functions (prevents memory leaks)
    const handlers = {
      // Provider error handler
      providerError: async (error) => {
        // Classify the error to determine appropriate response
        const classification = this.classifyError(error, chainId);

        // Log with appropriate severity based on error type
        if (classification.isFatal) {
          logger.error(`🚨 FATAL ${classification.type} for chain ${chainId}:`, {
            message: classification.message,
            error: error.message,
            stack: error.stack,
            shouldReconnect: classification.shouldReconnect
          });
        } else if (classification.type === 'FILTER_ERROR') {
          logger.warn(`⚠️  ${classification.type} for chain ${chainId}:`, {
            message: classification.message,
            error: error.message,
            note: 'This is expected with Hardhat local nodes and will be handled automatically'
          });
        } else {
          logger.error(`❌ ${classification.type} for chain ${chainId}:`, {
            message: classification.message,
            error: error.message,
            stack: error.stack
          });
        }

        // Mark event listeners as inactive
        this.eventListenersActive[chainId] = false;

        // Handle based on error type
        if (classification.isFatal) {
          logger.error(`Chain ${chainId} marked as FAILED due to fatal error. Manual intervention required.`);
          // Don't attempt reconnection for fatal errors
          return;
        }

        if (classification.shouldReconnect) {
          await this.reconnectProvider(chainId, classification.type);
        }
      },

      // Block update handler
      blockUpdate: async (blockNumber) => {
        await this.handleBlockUpdate(chainId, blockNumber);
      },

      // TaskCreated event handler
      taskCreated: async (taskId, owner, description, timestamp, event) => {
        try {
          logger.info(`[${chainId}] TaskCreated event:`, {
            taskId: taskId.toString(),
            owner,
            description,
            blockNumber: event.log.blockNumber,
          });

          await this.syncTaskCreated(chainId, taskId, owner, description, timestamp, event.log.transactionHash);
        } catch (error) {
          logger.error(`Error handling TaskCreated event:`, { error: error.message, stack: error.stack });
        }
      },

      // TaskCompleted event handler
      taskCompleted: async (taskId, owner, timestamp, event) => {
        try {
          logger.info(`[${chainId}] TaskCompleted event:`, {
            taskId: taskId.toString(),
            timestamp,
            blockNumber: event.log.blockNumber,
          });

          await this.syncTaskCompleted(chainId, taskId, timestamp);
        } catch (error) {
          logger.error(`Error handling TaskCompleted event:`, { error: error.message, stack: error.stack });
        }
      },

      // TaskDeleted event handler
      taskDeleted: async (taskId, owner, timestamp, event) => {
        try {
          logger.info(`[${chainId}] TaskDeleted event:`, {
            taskId: taskId.toString(),
            blockNumber: event.log.blockNumber,
          });

          await this.syncTaskDeleted(chainId, taskId);
        } catch (error) {
          logger.error(`Error handling TaskDeleted event:`, { error: error.message, stack: error.stack });
        }
      },

      // TaskRestored event handler
      taskRestored: async (taskId, owner, timestamp, event) => {
        try {
          logger.info(`[${chainId}] TaskRestored event:`, {
            taskId: taskId.toString(),
            blockNumber: event.log.blockNumber,
          });

          await this.syncTaskRestored(chainId, taskId);
        } catch (error) {
          logger.error(`Error handling TaskRestored event:`, { error: error.message, stack: error.stack });
        }
      }
    };

    // Store handler references for cleanup
    this.eventHandlers[chainId] = handlers;

    // Attach provider handlers
    provider.on('error', handlers.providerError);
    provider.on('block', handlers.blockUpdate);

    // Add WebSocket disconnect handling (if applicable)
    if (provider.websocket) {
      handlers.websocketClose = async (code, reason) => {
        logger.warn(`WebSocket closed for chain ${chainId}: ${code} - ${reason}`);
        this.eventListenersActive[chainId] = false;
        await this.reconnectProvider(chainId);
      };
      provider.websocket.on('close', handlers.websocketClose);
    }

    // Attach contract event handlers
    // Note: Contracts don't support 'error' events - only providers do
    // Error handling is done via the global error handler and provider error handler
    contract.on('TaskCreated', handlers.taskCreated);
    contract.on('TaskCompleted', handlers.taskCompleted);
    contract.on('TaskDeleted', handlers.taskDeleted);
    contract.on('TaskRestored', handlers.taskRestored);

    logger.info(`✓ Event listeners started for chainId: ${chainId}`);
  }

  async syncTaskCreated(chainId, taskId, owner, description, timestamp, transactionHash) {
    try {
      const blockchainId = taskId.toString();
      logger.info(`[DEBUG] Attempting to sync TaskCreated: ${blockchainId} on chain ${chainId}`);

      // Check if task already exists
      const existing = await Todo.findByBlockchainId(chainId, blockchainId);
      if (existing) {
        logger.info(`Task ${blockchainId} already synced on chain ${chainId}`);
        return;
      }
      logger.info(`[DEBUG] No existing todo found, creating new one`);

      // Create new todo in MongoDB
      const todo = new Todo({
        blockchainId,
        chainId,
        transactionHash,
        owner: owner.toLowerCase(),
        description,
        completed: false,
        blockchainCreatedAt: new Date(Number(timestamp) * 1000),
        syncStatus: 'synced',
      });

      logger.info(`[DEBUG] Todo object created, calling save()...`);
      logger.info(`[DEBUG] Todo data:`, { blockchainId, chainId, transactionHash, owner: owner.toLowerCase(), description });

      const savedTodo = await todo.save();
      logger.info(`[DEBUG] Todo saved successfully! ID: ${savedTodo._id}`);

      // Verify it was actually saved
      const verification = await Todo.findByBlockchainId(chainId, blockchainId);
      if (verification) {
        logger.info(`[DEBUG] ✓ Verification successful - todo found in DB after save`);
      } else {
        logger.error(`[DEBUG] ❌ Verification FAILED - todo NOT found in DB after save!`);
      }

      logger.info(`✓ Synced TaskCreated: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      logger.error('Error syncing TaskCreated:', { error: error.message, stack: error.stack });
    }
  }

  async syncTaskCompleted(chainId, taskId, timestamp) {
    try {
      const blockchainId = taskId.toString();
      const todo = await Todo.findByBlockchainId(chainId, blockchainId);

      if (!todo) {
        logger.error(`Todo ${blockchainId} not found for completion on chain ${chainId}`);
        return;
      }

      await todo.markAsCompleted(new Date(Number(timestamp) * 1000));
      logger.info(`✓ Synced TaskCompleted: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      logger.error('Error syncing TaskCompleted:', { error: error.message, stack: error.stack });
    }
  }

  async syncTaskDeleted(chainId, taskId) {
    try {
      const blockchainId = taskId.toString();
      const todo = await Todo.findByBlockchainId(chainId, blockchainId);

      if (!todo) {
        logger.error(`Todo ${blockchainId} not found for deletion on chain ${chainId}`);
        return;
      }

      await todo.markAsDeleted();
      logger.info(`✓ Synced TaskDeleted: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      logger.error('Error syncing TaskDeleted:', { error: error.message, stack: error.stack });
    }
  }

  async syncTaskRestored(chainId, taskId) {
    try {
      const blockchainId = taskId.toString();
      const todo = await Todo.findByBlockchainId(chainId, blockchainId);

      if (!todo) {
        logger.error(`Todo ${blockchainId} not found for restoration on chain ${chainId}`);
        return;
      }

      await todo.markAsRestored();
      logger.info(`✓ Synced TaskRestored: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      logger.error('Error syncing TaskRestored:', { error: error.message, stack: error.stack });
    }
  }

  getContract(chainId) {
    return this.contracts[chainId || this.getDefaultChainId()];
  }

  getProvider(chainId) {
    return this.providers[chainId || this.getDefaultChainId()];
  }

  getDefaultChainId() {
    const network = networks[defaultNetwork];
    return network ? network.chainId : 31337; // fallback to localhost
  }

  isInitialized() {
    return this.initialized;
  }

  async getNetworkInfo() {
    const info = {};
    for (const [chainId, provider] of Object.entries(this.providers)) {
      try {
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        info[chainId] = {
          name: network.name,
          chainId: Number(network.chainId),
          blockNumber,
          contractAddress: contractAddresses[chainId],
        };
      } catch (error) {
        info[chainId] = { error: error.message };
      }
    }
    return info;
  }

  /**
   * Get health status for all chains
   */
  getHealthStatus() {
    const status = {};

    for (const chainId of Object.keys(this.providers)) {
      const id = parseInt(chainId);
      status[chainId] = {
        eventListenersActive: this.eventListenersActive[id] || false,
        lastHeartbeat: this.lastHeartbeat[id] || null,
        consecutiveFailures: this.consecutiveFailures[id] || 0,
        lastProcessedBlock: this.lastProcessedBlock[id] || null,
        reconnectAttempts: this.reconnectAttempts[id] || 0
      };
    }

    return {
      heartbeatInterval: this.heartbeatInterval,
      maxConsecutiveFailures: this.maxConsecutiveFailures,
      chains: status
    };
  }

  /**
   * Graceful shutdown - stop heartbeat and cleanup
   */
  async shutdown() {
    logger.info('Shutting down blockchain service...');

    // Stop heartbeat monitoring
    this.stopHeartbeat();

    // Remove all event listeners
    for (const [chainId, contract] of Object.entries(this.contracts)) {
      try {
        if (contract) {
          contract.removeAllListeners();
          logger.info(`Removed listeners for chain ${chainId}`);
        }
      } catch (error) {
        logger.error(`Error removing listeners for chain ${chainId}:`, { error: error.message });
      }
    }

    this.initialized = false;
    logger.info('✓ Blockchain service shutdown complete');
  }

  /**
   * Reconnect provider with exponential backoff
   * @param {number} chainId - The chain ID to reconnect
   * @param {string} errorType - The type of error that triggered reconnection (for better logging)
   */
  async reconnectProvider(chainId, errorType = 'UNKNOWN') {
    if (!this.reconnectAttempts[chainId]) {
      this.reconnectAttempts[chainId] = 0;
    }

    if (this.reconnectAttempts[chainId] >= this.maxReconnectAttempts) {
      logger.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached for chain ${chainId}`, {
        errorType,
        lastAttempt: new Date().toISOString(),
        recommendation: 'Check network connectivity and RPC endpoint health'
      });
      return;
    }

    this.reconnectAttempts[chainId]++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts[chainId] - 1);

    // Special handling for filter errors - use minimal delay
    const actualDelay = errorType === 'FILTER_ERROR' ? Math.min(delay, 1000) : delay;

    logger.info(
      `🔄 Attempting to reconnect to chain ${chainId} due to ${errorType} (attempt ${this.reconnectAttempts[chainId]}/${this.maxReconnectAttempts}) in ${actualDelay}ms...`
    );

    setTimeout(async () => {
      try {
        // Find the network configuration
        const network = Object.values(networks).find((n) => n.chainId === chainId);
        if (!network) {
          logger.error(`Network configuration not found for chain ${chainId}`);
          return;
        }

        logger.info(`Reconnection process started for chain ${chainId} (${network.name})`, {
          errorType,
          attempt: this.reconnectAttempts[chainId]
        });

        // Remove old listeners to prevent memory leaks
        const oldContract = this.contracts[chainId];
        if (oldContract) {
          oldContract.removeAllListeners();
          logger.info(`Removed old event listeners for chain ${chainId}`);
        }

        // For filter errors, we can reuse the existing provider
        // For network errors, create a new provider
        if (errorType === 'FILTER_ERROR') {
          logger.info(`Reusing existing provider for filter error recovery on chain ${chainId}`);
          // Just restart event listeners with existing provider
          await this.startEventListeners(chainId);
        } else {
          logger.info(`Creating new provider for chain ${chainId} due to ${errorType}`);

          // Create new resilient provider with failover support
          const provider = this.createResilientProvider(network);
          this.providers[chainId] = provider;

          // Recreate contract instance
          const contractAddress = contractAddresses[chainId];
          const contract = new ethers.Contract(contractAddress, contractABI, provider);
          this.contracts[chainId] = contract;

          // Restart event listeners
          await this.startEventListeners(chainId);
        }

        // Reset reconnection attempts on success
        this.reconnectAttempts[chainId] = 0;

        logger.info(`✅ Successfully reconnected to chain ${chainId} after ${errorType}`, {
          network: network.name,
          eventListenersActive: this.eventListenersActive[chainId]
        });
      } catch (error) {
        // Classify the new error
        const classification = this.classifyError(error, chainId);

        logger.error(`Reconnection failed for chain ${chainId}:`, {
          originalErrorType: errorType,
          newErrorType: classification.type,
          error: error.message,
          stack: error.stack,
          willRetry: classification.shouldReconnect && !classification.isFatal
        });

        // Only retry if the error is not fatal
        if (!classification.isFatal && classification.shouldReconnect) {
          await this.reconnectProvider(chainId, classification.type);
        } else {
          logger.error(`Stopping reconnection attempts for chain ${chainId} due to ${classification.type}`);
        }
      }
    }, actualDelay);
  }

  /**
   * Handle block updates and detect reorganizations
   */
  async handleBlockUpdate(chainId, blockNumber) {
    try {
      const lastBlock = this.lastProcessedBlock[chainId];

      // Check for block reorganization
      if (lastBlock && blockNumber <= lastBlock) {
        logger.warn(
          `Potential block reorganization detected on chain ${chainId}: current ${blockNumber}, last ${lastBlock}`
        );
        await this.handleReorg(chainId, blockNumber);
      }

      // Update last processed block
      this.lastProcessedBlock[chainId] = blockNumber;
    } catch (error) {
      logger.error(`Error handling block update for chain ${chainId}:`, { error: error.message, stack: error.stack });
    }
  }

  /**
   * Handle blockchain reorganization
   */
  async handleReorg(chainId, blockNumber) {
    try {
      logger.info(`Handling reorganization for chain ${chainId} at block ${blockNumber}`);

      // Calculate safe block (block with enough confirmations) - now chain-specific
      const confirmations = this.confirmations[chainId] || 12;
      const safeBlock = blockNumber - confirmations;

      if (safeBlock < 0) {
        // Too early, not enough blocks for confirmations
        return;
      }

      const lastProcessed = this.lastProcessedBlock[chainId];

      // If our last processed block is beyond the safe block, we need to resync
      if (lastProcessed > safeBlock) {
        logger.info(`Resyncing from block ${safeBlock} for chain ${chainId} (${confirmations} confirmations)`);
        await this.resyncFromBlock(chainId, safeBlock);
      }
    } catch (error) {
      logger.error(`Error handling reorganization for chain ${chainId}:`, { error: error.message, stack: error.stack });
    }
  }

  /**
   * Resync events from a specific block
   */
  async resyncFromBlock(chainId, fromBlock) {
    try {
      const contract = this.contracts[chainId];
      if (!contract) {
        logger.error(`Contract not found for chain ${chainId}`);
        return;
      }

      logger.info(`Resyncing events from block ${fromBlock} on chain ${chainId}`);

      // Get current block
      const provider = this.providers[chainId];
      const currentBlock = await provider.getBlockNumber();

      // Query past events from the safe block to current
      const filter = contract.filters;

      // Get TaskCreated events
      const createdEvents = await contract.queryFilter(filter.TaskCreated(), fromBlock, currentBlock);

      // Get TaskCompleted events
      const completedEvents = await contract.queryFilter(filter.TaskCompleted(), fromBlock, currentBlock);

      // Get TaskDeleted events
      const deletedEvents = await contract.queryFilter(filter.TaskDeleted(), fromBlock, currentBlock);

      // Get TaskRestored events
      const restoredEvents = await contract.queryFilter(filter.TaskRestored(), fromBlock, currentBlock);

      logger.info(
        `Found ${createdEvents.length} created, ${completedEvents.length} completed, ${deletedEvents.length} deleted, ${restoredEvents.length} restored events to resync`
      );

      // Process events in order
      for (const event of createdEvents) {
        const [taskId, owner, description, timestamp] = event.args;
        await this.syncTaskCreated(chainId, taskId, owner, description, timestamp, event.transactionHash);
      }

      for (const event of completedEvents) {
        const [taskId, owner, timestamp] = event.args;
        await this.syncTaskCompleted(chainId, taskId, timestamp);
      }

      for (const event of deletedEvents) {
        const [taskId] = event.args;
        await this.syncTaskDeleted(chainId, taskId);
      }

      for (const event of restoredEvents) {
        const [taskId] = event.args;
        await this.syncTaskRestored(chainId, taskId);
      }

      logger.info(`✓ Resync completed for chain ${chainId}`);
    } catch (error) {
      logger.error(`Error resyncing from block ${fromBlock} on chain ${chainId}:`, { error: error.message, stack: error.stack });
    }
  }

  async cleanup() {
    logger.info('Cleaning up blockchain service...');
    // Mark all event listeners as inactive
    for (const chainId of Object.keys(this.eventListenersActive)) {
      this.eventListenersActive[chainId] = false;
    }
    // Remove all event listeners
    for (const contract of Object.values(this.contracts)) {
      contract.removeAllListeners();
    }
    // Remove provider listeners
    for (const provider of Object.values(this.providers)) {
      provider.removeAllListeners();
    }
    this.initialized = false;
  }
}

module.exports = new BlockchainService();
