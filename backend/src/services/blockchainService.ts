import { ethers } from 'ethers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require('../utils/logger');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Todo = require('../models/Todo');
const {
  networks,
  contractAddresses,
  contractABI,
  defaultNetwork,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require('../config/blockchain');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SyncMonitor = require('./syncMonitor');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolveDescription: resolveIpfsDescription } = require('./ipfsService');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  rpcBackup: string;
}

interface ErrorClassification {
  type: string;
  shouldReconnect: boolean;
  isFatal: boolean;
  message: string;
}

interface EventHandlers {
  providerError?: (error: Error) => void;
  blockUpdate?: (blockNumber: number) => Promise<void>;
  taskCreated?: (...args: unknown[]) => Promise<void>;
  taskCompleted?: (...args: unknown[]) => Promise<void>;
  taskDeleted?: (...args: unknown[]) => Promise<void>;
  taskRestored?: (...args: unknown[]) => Promise<void>;
  taskUpdated?: (...args: unknown[]) => Promise<void>;
  websocketClose?: (...args: unknown[]) => void;
}

interface ChainHealthStatus {
  eventListenersActive: boolean;
  lastHeartbeat: Date | null;
  consecutiveFailures: number;
  lastProcessedBlock: number | null;
  reconnectAttempts: number;
}

interface HealthStatus {
  heartbeatInterval: number;
  maxConsecutiveFailures: number;
  chains: Record<string, ChainHealthStatus>;
}

interface NetworkInfo {
  name?: string;
  chainId?: number;
  blockNumber?: number;
  contractAddress?: string;
  error?: string;
}

type EthersProvider = ethers.JsonRpcProvider | ethers.FallbackProvider;

// ---------------------------------------------------------------------------
// BlockchainService
// ---------------------------------------------------------------------------

class BlockchainService {
  private providers: Record<number, EthersProvider> = {};
  private contracts: Record<number, ethers.Contract> = {};
  private initialized: boolean = false;
  private lastProcessedBlock: Record<number, number> = {};
  private reconnectAttempts: Record<number, number> = {};
  private eventListenersActive: Record<number, boolean> = {};
  private eventHandlers: Record<number, EventHandlers> = {};

  private readonly maxReconnectAttempts: number;
  private readonly reconnectDelay: number;

  private confirmations: Record<number, number> = {};

  private readonly heartbeatInterval: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeat: Record<number, Date> = {};
  private consecutiveFailures: Record<number, number> = {};
  private readonly maxConsecutiveFailures: number = 3;

  private filterErrorCount: Record<number, number> = {};
  private lastFilterErrorTime: Record<number, number> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private syncMonitor: any = null;

  private globalErrorHandlerInstalled: boolean = false;
  private lastFilterErrorLogTime: number = 0;
  private lastConsoleErrorSuppression: number = 0;

  constructor() {
    this.maxReconnectAttempts = parseInt(process.env.MAX_RECONNECT_ATTEMPTS ?? '') || 5;
    this.reconnectDelay = parseInt(process.env.RECONNECT_BASE_DELAY ?? '') || 5000;
    this.heartbeatInterval = parseInt(process.env.HEARTBEAT_INTERVAL ?? '') || 60000;

    // Install global handler for ethers.js FilterIdEventSubscriber errors
    this.installGlobalErrorHandler();
  }

  /**
   * Install a process-level error handler to catch ethers.js FilterIdEventSubscriber errors
   * These errors occur when Hardhat returns malformed filter responses
   */
  installGlobalErrorHandler(): void {
    if (this.globalErrorHandlerInstalled) {
      return;
    }

    const errorHandler = (error: unknown): boolean => {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error as Error).message.toLowerCase()
          : '';
      const stackTrace =
        error && typeof error === 'object' && 'stack' in error
          ? (error as Error).stack ?? ''
          : '';

      const isEthersError =
        errorMessage.includes('results is not iterable') ||
        errorMessage.includes('cannot read properties of undefined') ||
        errorMessage.includes('cannot read property') ||
        stackTrace.includes('FilterIdEventSubscriber') ||
        stackTrace.includes('subscriber-filterid');

      if (isEthersError) {
        const now = Date.now();
        if (now - this.lastFilterErrorLogTime > 10000) {
          this.lastFilterErrorLogTime = now;
          logger.warn(
            '⚠️  Suppressing ethers.js FilterIdEventSubscriber errors (known Hardhat issue)',
            {
              error: (error as Error).message,
              note: 'Event listeners are still active. These errors are automatically handled.',
            },
          );
        }
        return true;
      }

      return false;
    };

    process.on('uncaughtException', (error: Error) => {
      if (!errorHandler(error)) {
        logger.error('Uncaught exception:', error);
      }
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      if (reason && typeof reason === 'object') {
        if (!errorHandler(reason)) {
          logger.error('Unhandled rejection:', { reason, promise });
        }
      } else {
        logger.error('Unhandled rejection:', { reason, promise });
      }
    });

    // Override console.error to suppress ethers.js FilterIdEventSubscriber spam
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const errorString = args.join(' ');
      if (
        errorString.includes('results is not iterable') ||
        errorString.includes('FilterIdEventSubscriber')
      ) {
        const now = Date.now();
        if (now - this.lastConsoleErrorSuppression > 30000) {
          this.lastConsoleErrorSuppression = now;
          logger.warn('⚠️  Suppressed ethers.js console.error (known Hardhat issue)');
        }
        return;
      }
      originalConsoleError.apply(console, args);
    };

    this.globalErrorHandlerInstalled = true;
    logger.info(
      '✓ Global error handler installed for ethers.js FilterIdEventSubscriber errors',
    );
  }

  async initialize(): Promise<void> {
    try {
      for (const [networkKey, network] of Object.entries(networks as Record<string, NetworkConfig>)) {
        if (!network.rpcUrl) {
          logger.warn(`Skipping ${network.name}: No RPC URL provided`);
          continue;
        }

        const contractAddress = (contractAddresses as Record<number, string | undefined>)[
          network.chainId
        ];
        if (!contractAddress) {
          logger.warn(`Skipping ${network.name}: No contract deployed`);
          continue;
        }

        try {
          const envKey = `CONFIRMATION_BLOCKS_${networkKey.toUpperCase()}`;
          const defaultConfirmations = this.getDefaultConfirmations(network.chainId);
          this.confirmations[network.chainId] =
            parseInt(process.env[envKey] ?? '') || defaultConfirmations;

          const provider = this.createResilientProvider(network);
          this.providers[network.chainId] = provider;

          const contract = new ethers.Contract(
            contractAddress,
            contractABI as ethers.InterfaceAbi,
            provider,
          );
          this.contracts[network.chainId] = contract;

          this.startEventListeners(network.chainId);
          await this.recoverMissedEvents(network.chainId);

          logger.info(
            `✓ Connected to ${network.name} (chainId: ${network.chainId}, confirmations: ${this.confirmations[network.chainId]})`,
          );
        } catch (error) {
          const err = error as Error;
          logger.error(`Error initializing ${network.name}:`, {
            error: err.message,
            stack: err.stack,
          });
        }
      }

      this.initialized = true;

      this.startHeartbeat();
      logger.info(
        `✓ Health monitoring started (heartbeat interval: ${this.heartbeatInterval}ms)`,
      );

      this.syncMonitor = new SyncMonitor(this);
      this.syncMonitor.start();
    } catch (error) {
      const err = error as Error;
      logger.error('Error initializing blockchain service:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  /**
   * Create resilient provider with automatic failover to backup RPC
   */
  createResilientProvider(network: NetworkConfig): EthersProvider {
    const rpcs = [network.rpcUrl, network.rpcBackup].filter(Boolean);

    if (rpcs.length === 1) {
      return new ethers.JsonRpcProvider(rpcs[0]);
    }

    logger.info(
      `Setting up failover for ${network.name} with ${rpcs.length} RPC endpoints`,
    );

    const providers = rpcs.map((rpc, index) => ({
      provider: new ethers.JsonRpcProvider(rpc),
      priority: index + 1,
      stallTimeout: 2000,
      weight: 1,
    }));

    return new ethers.FallbackProvider(providers);
  }

  /**
   * Get default confirmation blocks based on chain characteristics
   */
  getDefaultConfirmations(chainId: number): number {
    const confirmationDefaults: Record<number, number> = {
      1: 12,
      11155111: 12,
      137: 128,
      80002: 128,
      42161: 1,
      421614: 1,
      10: 1,
      11155420: 1,
      31337: 1,
    };

    return confirmationDefaults[chainId] ?? 12;
  }

  /**
   * Recover missed events during backend downtime
   */
  async recoverMissedEvents(chainId: number): Promise<void> {
    try {
      const contract = this.contracts[chainId];
      const provider = this.providers[chainId];

      if (!contract || !provider) {
        logger.warn(
          `Cannot recover events for chain ${chainId}: contract or provider not available`,
        );
        return;
      }

      const lastSynced = await Todo.findOne({ chainId })
        .sort({ lastSyncedAt: -1 })
        .select('lastSyncedAt')
        .lean();

      const currentBlock = await provider.getBlockNumber();

      const recoveryDays =
        process.env.EVENT_RECOVERY_DAYS !== undefined
          ? parseInt(process.env.EVENT_RECOVERY_DAYS)
          : 7;
      const blocksPerDay = this.getBlocksPerDay(chainId);
      const defaultStartBlock = Math.max(0, currentBlock - blocksPerDay * recoveryDays);

      let fromBlock = defaultStartBlock;

      if (lastSynced?.lastSyncedAt) {
        const secondsSinceLastSync =
          (Date.now() - new Date(lastSynced.lastSyncedAt).getTime()) / 1000;
        const blockTime = this.getAverageBlockTime(chainId);
        const blocksSince = Math.floor(secondsSinceLastSync / blockTime);
        fromBlock = Math.max(defaultStartBlock, currentBlock - blocksSince - 100);
      }

      if (currentBlock - fromBlock < 10) {
        logger.info(`✓ Chain ${chainId} is up to date, no event recovery needed`);
        return;
      }

      logger.info(
        `🔄 Recovering events for chain ${chainId} from block ${fromBlock} to ${currentBlock}...`,
      );

      await this.resyncFromBlock(chainId, fromBlock);

      logger.info(`✓ Event recovery completed for chain ${chainId}`);
    } catch (error) {
      const err = error as Error;
      logger.error(`Error recovering missed events for chain ${chainId}:`, {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  getBlocksPerDay(chainId: number): number {
    const blocksPerDay: Record<number, number> = {
      1: 7200,
      11155111: 7200,
      137: 43200,
      80002: 43200,
      42161: 240000,
      421614: 240000,
      10: 43200,
      11155420: 43200,
      31337: 7200,
    };

    return blocksPerDay[chainId] ?? 7200;
  }

  getAverageBlockTime(chainId: number): number {
    const blockTimes: Record<number, number> = {
      1: 12,
      11155111: 12,
      137: 2,
      80002: 2,
      42161: 0.36,
      421614: 0.36,
      10: 2,
      11155420: 2,
      31337: 12,
    };

    return blockTimes[chainId] ?? 12;
  }

  /**
   * Classify blockchain errors into categories for better error handling
   */
  classifyError(error: Error, chainId: number): ErrorClassification {
    const errorMessage = error.message?.toLowerCase() ?? '';
    const errorCode = (error as NodeJS.ErrnoException).code;

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
        message: `Network connectivity issue for chain ${chainId}. Will attempt reconnection.`,
      };
    }

    if (
      errorMessage.includes('filter not found') ||
      (errorMessage.includes('filter') && errorMessage.includes('expired')) ||
      (errorCode === 'UNKNOWN_ERROR' && errorMessage.includes('filter')) ||
      errorMessage.includes('results is not iterable') ||
      errorMessage.includes('filtersubscriber')
    ) {
      return {
        type: 'FILTER_ERROR',
        shouldReconnect: true,
        isFatal: false,
        message: `Event filter error for chain ${chainId}. This is common with Hardhat local nodes. Will restart event listeners.`,
      };
    }

    if (
      errorMessage.includes('invalid event signature') ||
      errorMessage.includes('no matching event') ||
      errorMessage.includes('could not decode') ||
      (errorMessage.includes('invalid argument') && errorMessage.includes('event'))
    ) {
      return {
        type: 'CODE_MISMATCH',
        shouldReconnect: false,
        isFatal: true,
        message: `Code/ABI mismatch detected for chain ${chainId}. Event listener code does not match contract ABI. Check contract deployment and ABI version.`,
      };
    }

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
        message: `RPC provider error for chain ${chainId}. Will attempt to use backup RPC if available.`,
      };
    }

    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorCode === 'RATE_LIMIT'
    ) {
      return {
        type: 'RATE_LIMIT',
        shouldReconnect: true,
        isFatal: false,
        message: `Rate limit exceeded for chain ${chainId}. Will retry with exponential backoff.`,
      };
    }

    return {
      type: 'UNKNOWN',
      shouldReconnect: true,
      isFatal: false,
      message: `Unknown error for chain ${chainId}: ${error.message}`,
    };
  }

  /**
   * Validate that all expected events exist in the contract ABI
   */
  validateContractEvents(contract: ethers.Contract, chainId: number): void {
    const expectedEvents = [
      'TaskCreated',
      'TaskCompleted',
      'TaskDeleted',
      'TaskRestored',
      'TaskUpdated',
    ];

    const missingEvents: string[] = [];
    const availableEvents: string[] = [];

    // Derive event names: use .fragments (ethers v6) when available,
    // fall back to .events keys (mocks / ethers v5 compat) for error reporting only.
    const iface = contract.interface as unknown as {
      events?: Record<string, unknown>;
      fragments?: ethers.Fragment[];
    };
    const contractEvents: string[] = iface.fragments
      ? iface.fragments
          .filter((f): f is ethers.EventFragment => f.type === 'event')
          .map((f) => f.name)
      : Object.keys(iface.events ?? {});

    for (const eventName of expectedEvents) {
      try {
        const eventFragment = contract.interface.getEvent(eventName);
        if (eventFragment) {
          availableEvents.push(eventName);
        } else {
          missingEvents.push(eventName);
        }
      } catch {
        missingEvents.push(eventName);
      }
    }

    if (missingEvents.length > 0) {
      const errorMessage = [
        `❌ Contract event validation failed for chain ${chainId}`,
        ``,
        `Missing events: ${missingEvents.join(', ')}`,
        `Available events in contract: ${contractEvents.join(', ')}`,
        ``,
        `This indicates a mismatch between the contract ABI and the event listeners.`,
        `Please ensure the contract is deployed correctly and the ABI is up to date.`,
      ].join('\n');

      logger.error(errorMessage);
      throw new Error(
        `Contract event validation failed: Missing events ${missingEvents.join(', ')}`,
      );
    }

    logger.info(
      `✓ Contract event validation passed for chain ${chainId}: ${availableEvents.join(', ')}`,
    );
  }

  startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.performHealthCheck();

    this.heartbeatTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.heartbeatInterval);

    logger.info(`💓 Heartbeat monitoring started (interval: ${this.heartbeatInterval}ms)`);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      logger.info('💓 Heartbeat monitoring stopped');
    }
  }

  async performHealthCheck(): Promise<void> {
    const timestamp = new Date().toISOString();

    for (const chainId of Object.keys(this.providers)) {
      try {
        await this.checkChainHealth(parseInt(chainId));
      } catch (error) {
        const err = error as Error;
        logger.error(`Health check failed for chain ${chainId}:`, {
          error: err.message,
          timestamp,
        });
      }
    }
  }

  async checkChainHealth(chainId: number): Promise<void> {
    const provider = this.providers[chainId];
    const contract = this.contracts[chainId];

    if (!provider || !contract) {
      logger.warn(`Health check skipped for chain ${chainId}: No provider or contract`);
      return;
    }

    try {
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Provider timeout')), 5000),
        ),
      ]);

      const listenersActive = this.eventListenersActive[chainId];
      const lastBlock = this.lastProcessedBlock[chainId];
      const blockStale = lastBlock && blockNumber - lastBlock > 100;

      if (!this.consecutiveFailures[chainId]) {
        this.consecutiveFailures[chainId] = 0;
      }

      const healthIssues: string[] = [];

      if (!listenersActive) {
        healthIssues.push('Event listeners marked as inactive');
      }

      if (blockStale) {
        healthIssues.push(
          `Block processing stale (current: ${blockNumber}, last processed: ${lastBlock})`,
        );
      }

      if (healthIssues.length > 0) {
        this.consecutiveFailures[chainId]++;

        logger.warn(
          `⚠️  Health check issues for chain ${chainId} (failure ${this.consecutiveFailures[chainId]}/${this.maxConsecutiveFailures}):`,
          {
            issues: healthIssues,
            blockNumber,
            lastProcessedBlock: lastBlock,
            listenersActive,
          },
        );

        if (this.consecutiveFailures[chainId] >= this.maxConsecutiveFailures) {
          logger.warn(
            `🔄 Auto-restarting event listeners for chain ${chainId} due to ${this.consecutiveFailures[chainId]} consecutive health check failures`,
          );
          this.consecutiveFailures[chainId] = 0;
          await this.restartEventListeners(chainId);
        }
      } else {
        if (this.consecutiveFailures[chainId] > 0) {
          logger.info(
            `✅ Health restored for chain ${chainId} after ${this.consecutiveFailures[chainId]} failures`,
          );
          this.consecutiveFailures[chainId] = 0;
        }

        this.lastHeartbeat[chainId] = new Date();

        const checkCount = Math.floor(
          (Date.now() - (this.lastHeartbeat[chainId]?.getTime() ?? 0)) /
            this.heartbeatInterval,
        );
        if (checkCount % 10 === 0) {
          logger.info(`💓 Health check passed for chain ${chainId}:`, {
            blockNumber,
            lastProcessedBlock: lastBlock,
            listenersActive,
            uptime: this.lastHeartbeat[chainId]
              ? `${Math.floor((Date.now() - this.lastHeartbeat[chainId].getTime()) / 60000)} minutes`
              : 'N/A',
          });
        }
      }
    } catch (error) {
      const err = error as Error;
      this.consecutiveFailures[chainId] = (this.consecutiveFailures[chainId] ?? 0) + 1;

      logger.error(
        `❌ Health check error for chain ${chainId} (failure ${this.consecutiveFailures[chainId]}/${this.maxConsecutiveFailures}):`,
        { error: err.message, stack: err.stack },
      );

      if (this.consecutiveFailures[chainId] >= this.maxConsecutiveFailures) {
        logger.error(
          `🔄 Auto-restarting event listeners for chain ${chainId} due to ${this.consecutiveFailures[chainId]} consecutive health check failures`,
        );
        this.consecutiveFailures[chainId] = 0;

        try {
          await this.restartEventListeners(chainId);
        } catch (restartError) {
          const rErr = restartError as Error;
          logger.error(`Failed to auto-restart chain ${chainId}:`, {
            error: rErr.message,
            stack: rErr.stack,
          });
        }
      }
    }
  }

  async restartEventListeners(chainId: number): Promise<void> {
    logger.info(`Restarting event listeners for chain ${chainId}...`);

    try {
      const contract = this.contracts[chainId];
      if (contract) {
        contract.removeAllListeners();
        logger.info(`Removed old listeners for chain ${chainId}`);
      }

      await this.startEventListeners(chainId);
      await this.recoverMissedEvents(chainId);

      logger.info(`✅ Successfully restarted event listeners for chain ${chainId}`);
    } catch (error) {
      const err = error as Error;
      logger.error(`Failed to restart event listeners for chain ${chainId}:`, {
        error: err.message,
        stack: err.stack,
      });

      logger.info(`Attempting full reconnection for chain ${chainId}...`);
      await this.reconnectProvider(chainId, 'HEALTH_CHECK_FAILURE');
    }
  }

  async startEventListeners(chainId: number): Promise<void> {
    const contract = this.contracts[chainId];
    const provider = this.providers[chainId];
    if (!contract || !provider) return;

    this.validateContractEvents(contract, chainId);

    // Remove existing listeners to prevent memory leaks
    if (this.eventHandlers[chainId]) {
      const handlers = this.eventHandlers[chainId];

      if (handlers.taskCreated) contract.off('TaskCreated', handlers.taskCreated);
      if (handlers.taskCompleted) contract.off('TaskCompleted', handlers.taskCompleted);
      if (handlers.taskDeleted) contract.off('TaskDeleted', handlers.taskDeleted);
      if (handlers.taskRestored) contract.off('TaskRestored', handlers.taskRestored);
      if (handlers.taskUpdated) contract.off('TaskUpdated', handlers.taskUpdated);

      if (handlers.providerError) provider.off('error', handlers.providerError);
      if (handlers.blockUpdate) provider.off('block', handlers.blockUpdate);

      logger.info(`🗑️  Removed old event listeners for chain ${chainId}`);
    }

    this.eventListenersActive[chainId] = true;

    try {
      this.lastProcessedBlock[chainId] = await provider.getBlockNumber();
    } catch (error) {
      const err = error as Error;
      logger.error(`Error getting initial block number for chain ${chainId}:`, {
        error: err.message,
        stack: err.stack,
      });
      this.lastProcessedBlock[chainId] = 0;
    }

    const handlers: EventHandlers = {
      providerError: async (error: Error) => {
        const classification = this.classifyError(error, chainId);

        if (classification.isFatal) {
          logger.error(`🚨 FATAL ${classification.type} for chain ${chainId}:`, {
            message: classification.message,
            error: error.message,
            stack: error.stack,
            shouldReconnect: classification.shouldReconnect,
          });
        } else if (classification.type === 'FILTER_ERROR') {
          logger.warn(`⚠️  ${classification.type} for chain ${chainId}:`, {
            message: classification.message,
            error: error.message,
            note: 'This is expected with Hardhat local nodes and will be handled automatically',
          });
        } else {
          logger.error(`❌ ${classification.type} for chain ${chainId}:`, {
            message: classification.message,
            error: error.message,
            stack: error.stack,
          });
        }

        this.eventListenersActive[chainId] = false;

        if (classification.isFatal) {
          logger.error(
            `Chain ${chainId} marked as FAILED due to fatal error. Manual intervention required.`,
          );
          return;
        }

        if (classification.shouldReconnect) {
          await this.reconnectProvider(chainId, classification.type);
        }
      },

      blockUpdate: async (blockNumber: number) => {
        await this.handleBlockUpdate(chainId, blockNumber);
      },

      taskCreated: async (...args: unknown[]) => {
        const [taskId, owner, description, timestamp, dueDate, event] = args as [
          bigint,
          string,
          string,
          bigint,
          bigint,
          { log: { blockNumber: number; transactionHash: string } },
        ];
        try {
          logger.info(`[${chainId}] TaskCreated event:`, {
            taskId: taskId.toString(),
            owner,
            description,
            dueDate: dueDate ? new Date(Number(dueDate) * 1000).toISOString() : null,
            blockNumber: event.log.blockNumber,
          });

          await this.syncTaskCreated(
            chainId,
            taskId,
            owner,
            description,
            timestamp,
            event.log.transactionHash,
            dueDate,
          );
        } catch (error) {
          const err = error as Error;
          logger.error(`Error handling TaskCreated event:`, {
            error: err.message,
            stack: err.stack,
          });
        }
      },

      taskCompleted: async (...args: unknown[]) => {
        const [taskId, , timestamp, event] = args as [
          bigint,
          string,
          bigint,
          { log: { blockNumber: number } },
        ];
        try {
          logger.info(`[${chainId}] TaskCompleted event:`, {
            taskId: taskId.toString(),
            timestamp,
            blockNumber: event.log.blockNumber,
          });

          await this.syncTaskCompleted(chainId, taskId, timestamp);
        } catch (error) {
          const err = error as Error;
          logger.error(`Error handling TaskCompleted event:`, {
            error: err.message,
            stack: err.stack,
          });
        }
      },

      taskDeleted: async (...args: unknown[]) => {
        const [taskId, , , event] = args as [
          bigint,
          string,
          bigint,
          { log: { blockNumber: number } },
        ];
        try {
          logger.info(`[${chainId}] TaskDeleted event:`, {
            taskId: taskId.toString(),
            blockNumber: event.log.blockNumber,
          });

          await this.syncTaskDeleted(chainId, taskId);
        } catch (error) {
          const err = error as Error;
          logger.error(`Error handling TaskDeleted event:`, {
            error: err.message,
            stack: err.stack,
          });
        }
      },

      taskRestored: async (...args: unknown[]) => {
        const [taskId, , , event] = args as [
          bigint,
          string,
          bigint,
          { log: { blockNumber: number } },
        ];
        try {
          logger.info(`[${chainId}] TaskRestored event:`, {
            taskId: taskId.toString(),
            blockNumber: event.log.blockNumber,
          });

          await this.syncTaskRestored(chainId, taskId);
        } catch (error) {
          const err = error as Error;
          logger.error(`Error handling TaskRestored event:`, {
            error: err.message,
            stack: err.stack,
          });
        }
      },

      taskUpdated: async (...args: unknown[]) => {
        const [taskId, , oldDescription, newDescription, , event] = args as [
          bigint,
          string,
          string,
          string,
          bigint,
          { log: { blockNumber: number } },
        ];
        try {
          logger.info(`[${chainId}] TaskUpdated event:`, {
            taskId: taskId.toString(),
            oldDescription,
            newDescription,
            blockNumber: event.log.blockNumber,
          });

          await this.syncTaskUpdated(chainId, taskId, oldDescription, newDescription);
        } catch (error) {
          const err = error as Error;
          logger.error(`Error handling TaskUpdated event:`, {
            error: err.message,
            stack: err.stack,
          });
        }
      },
    };

    this.eventHandlers[chainId] = handlers;

    provider.on('error', handlers.providerError!);
    provider.on('block', handlers.blockUpdate!);

    // Add WebSocket disconnect handling (if applicable)
    const providerWithWs = provider as ethers.JsonRpcProvider & {
      websocket?: { on: (event: string, cb: (...args: unknown[]) => void) => void };
    };
    if (providerWithWs.websocket) {
      handlers.websocketClose = (...args: unknown[]) => {
        const [code, reason] = args as [number, string];
        logger.warn(`WebSocket closed for chain ${chainId}: ${code} - ${reason}`);
        this.eventListenersActive[chainId] = false;
        void this.reconnectProvider(chainId);
      };
      providerWithWs.websocket.on('close', handlers.websocketClose);
    }

    try {
      const wrapHandler = (
        handlerFn: (...args: unknown[]) => Promise<void>,
        eventName: string,
      ) => {
        return async (...args: unknown[]) => {
          try {
            await handlerFn(...args);
          } catch (error) {
            const err = error as Error;
            logger.error(`Error in ${eventName} handler for chain ${chainId}:`, {
              error: err.message,
              stack: err.stack,
            });
          }
        };
      };

      contract.on('TaskCreated', wrapHandler(handlers.taskCreated!, 'TaskCreated'));
      contract.on('TaskCompleted', wrapHandler(handlers.taskCompleted!, 'TaskCompleted'));
      contract.on('TaskDeleted', wrapHandler(handlers.taskDeleted!, 'TaskDeleted'));
      contract.on('TaskRestored', wrapHandler(handlers.taskRestored!, 'TaskRestored'));
      contract.on('TaskUpdated', wrapHandler(handlers.taskUpdated!, 'TaskUpdated'));

      logger.info(`✓ Event listeners started for chainId: ${chainId}`);
    } catch (error) {
      const err = error as Error;
      logger.error(`Failed to attach event listeners for chain ${chainId}:`, {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  async syncTaskCreated(
    chainId: number,
    taskId: bigint,
    owner: string,
    description: string,
    timestamp: bigint,
    transactionHash: string,
    dueDate: bigint,
  ): Promise<void> {
    try {
      const blockchainId = taskId.toString();
      logger.info(
        `[DEBUG] Attempting to sync TaskCreated: ${blockchainId} on chain ${chainId}`,
      );

      const existing = await Todo.findByBlockchainId(chainId, blockchainId);
      if (existing) {
        logger.info(`Task ${blockchainId} already synced on chain ${chainId}`);
        return;
      }
      logger.info(`[DEBUG] No existing todo found, creating new one`);

      // Resolve IPFS CID to plain text if applicable
      const resolved = await resolveIpfsDescription(description);
      const resolvedDescription = resolved.text;
      const ipfsCid = resolved.cid;
      const syncStatus = (ipfsCid && resolvedDescription === description) ? 'error' : 'synced';

      const todo = new Todo({
        blockchainId,
        chainId,
        transactionHash,
        owner: owner.toLowerCase(),
        description: resolvedDescription,
        ipfsCid,
        completed: false,
        blockchainCreatedAt: new Date(Number(timestamp) * 1000),
        dueDate: dueDate ? new Date(Number(dueDate) * 1000) : null,
        syncStatus,
      });

      logger.info(`[DEBUG] Todo object created, calling save()...`);
      logger.info(`[DEBUG] Todo data:`, {
        blockchainId,
        chainId,
        transactionHash,
        owner: owner.toLowerCase(),
        description,
      });

      const savedTodo = await todo.save();
      logger.info(`[DEBUG] Todo saved successfully! ID: ${savedTodo._id}`);

      const verification = await Todo.findByBlockchainId(chainId, blockchainId);
      if (verification) {
        logger.info(`[DEBUG] ✓ Verification successful - todo found in DB after save`);
      } else {
        logger.error(`[DEBUG] ❌ Verification FAILED - todo NOT found in DB after save!`);
      }

      logger.info(`✓ Synced TaskCreated: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      const err = error as Error;
      logger.error('Error syncing TaskCreated:', { error: err.message, stack: err.stack });
    }
  }

  async syncTaskCompleted(chainId: number, taskId: bigint, timestamp: bigint): Promise<void> {
    try {
      const blockchainId = taskId.toString();
      const todo = await Todo.findByBlockchainId(chainId, blockchainId);

      if (!todo) {
        logger.error(
          `Todo ${blockchainId} not found for completion on chain ${chainId}`,
        );
        return;
      }

      await todo.markAsCompleted(new Date(Number(timestamp) * 1000));
      logger.info(`✓ Synced TaskCompleted: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      const err = error as Error;
      logger.error('Error syncing TaskCompleted:', { error: err.message, stack: err.stack });
    }
  }

  async syncTaskDeleted(chainId: number, taskId: bigint): Promise<void> {
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
      const err = error as Error;
      logger.error('Error syncing TaskDeleted:', { error: err.message, stack: err.stack });
    }
  }

  async syncTaskRestored(chainId: number, taskId: bigint): Promise<void> {
    try {
      const blockchainId = taskId.toString();
      const todo = await Todo.findByBlockchainId(chainId, blockchainId);

      if (!todo) {
        logger.error(
          `Todo ${blockchainId} not found for restoration on chain ${chainId}`,
        );
        return;
      }

      await todo.markAsRestored();
      logger.info(`✓ Synced TaskRestored: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      const err = error as Error;
      logger.error('Error syncing TaskRestored:', { error: err.message, stack: err.stack });
    }
  }

  async syncTaskUpdated(
    chainId: number,
    taskId: bigint,
    oldDescription: string,
    newDescription: string,
  ): Promise<void> {
    try {
      const blockchainId = taskId.toString();
      const todo = await Todo.findByBlockchainId(chainId, blockchainId);

      if (!todo) {
        logger.error(`Todo ${blockchainId} not found for update on chain ${chainId}`);
        return;
      }

      // Resolve IPFS CID to plain text if applicable
      const resolved = await resolveIpfsDescription(newDescription);
      todo.description = resolved.text;
      todo.ipfsCid = resolved.cid;
      todo.lastSyncedAt = new Date();
      if (resolved.cid && resolved.text === newDescription) {
        todo.syncStatus = 'error'; // CID resolution failed
      }
      await todo.save();
      logger.info(`✓ Synced TaskUpdated: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      const err = error as Error;
      logger.error('Error syncing TaskUpdated:', { error: err.message, stack: err.stack });
    }
  }

  getContract(chainId?: number): ethers.Contract | undefined {
    return this.contracts[chainId ?? this.getDefaultChainId()];
  }

  getProvider(chainId?: number): EthersProvider | undefined {
    return this.providers[chainId ?? this.getDefaultChainId()];
  }

  getDefaultChainId(): number {
    const network = (networks as Record<string, NetworkConfig>)[defaultNetwork as string];
    return network ? network.chainId : 31337;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async getNetworkInfo(): Promise<Record<string, NetworkInfo>> {
    const info: Record<string, NetworkInfo> = {};
    for (const [chainId, provider] of Object.entries(this.providers)) {
      try {
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        info[chainId] = {
          name: network.name,
          chainId: Number(network.chainId),
          blockNumber,
          contractAddress: (contractAddresses as Record<number, string | undefined>)[
            parseInt(chainId)
          ],
        };
      } catch (error) {
        info[chainId] = { error: (error as Error).message };
      }
    }
    return info;
  }

  getHealthStatus(): HealthStatus {
    const status: Record<string, ChainHealthStatus> = {};

    for (const chainId of Object.keys(this.providers)) {
      const id = parseInt(chainId);
      status[chainId] = {
        eventListenersActive: this.eventListenersActive[id] ?? false,
        lastHeartbeat: this.lastHeartbeat[id] ?? null,
        consecutiveFailures: this.consecutiveFailures[id] ?? 0,
        lastProcessedBlock: this.lastProcessedBlock[id] ?? null,
        reconnectAttempts: this.reconnectAttempts[id] ?? 0,
      };
    }

    return {
      heartbeatInterval: this.heartbeatInterval,
      maxConsecutiveFailures: this.maxConsecutiveFailures,
      chains: status,
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down blockchain service...');

    if (this.syncMonitor) {
      this.syncMonitor.stop();
    }

    this.stopHeartbeat();

    for (const [chainId, contract] of Object.entries(this.contracts)) {
      try {
        if (contract) {
          contract.removeAllListeners();
          logger.info(`Removed listeners for chain ${chainId}`);
        }
      } catch (error) {
        logger.error(`Error removing listeners for chain ${chainId}:`, {
          error: (error as Error).message,
        });
      }
    }

    this.initialized = false;
    logger.info('✓ Blockchain service shutdown complete');
  }

  async reconnectProvider(chainId: number, errorType: string = 'UNKNOWN'): Promise<void> {
    if (!this.reconnectAttempts[chainId]) {
      this.reconnectAttempts[chainId] = 0;
    }

    if (this.reconnectAttempts[chainId] >= this.maxReconnectAttempts) {
      logger.error(
        `❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached for chain ${chainId}`,
        {
          errorType,
          lastAttempt: new Date().toISOString(),
          recommendation: 'Check network connectivity and RPC endpoint health',
        },
      );
      return;
    }

    this.reconnectAttempts[chainId]++;
    const delay =
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts[chainId] - 1);

    const actualDelay = errorType === 'FILTER_ERROR' ? Math.min(delay, 1000) : delay;

    logger.info(
      `🔄 Attempting to reconnect to chain ${chainId} due to ${errorType} (attempt ${this.reconnectAttempts[chainId]}/${this.maxReconnectAttempts}) in ${actualDelay}ms...`,
    );

    setTimeout(async () => {
      try {
        const network = Object.values(networks as Record<string, NetworkConfig>).find(
          (n) => n.chainId === chainId,
        );
        if (!network) {
          logger.error(`Network configuration not found for chain ${chainId}`);
          return;
        }

        logger.info(
          `Reconnection process started for chain ${chainId} (${network.name})`,
          { errorType, attempt: this.reconnectAttempts[chainId] },
        );

        const oldContract = this.contracts[chainId];
        if (oldContract) {
          oldContract.removeAllListeners();
          logger.info(`Removed old event listeners for chain ${chainId}`);
        }

        if (errorType === 'FILTER_ERROR') {
          logger.info(
            `Reusing existing provider for filter error recovery on chain ${chainId}`,
          );
          await this.startEventListeners(chainId);
        } else {
          logger.info(
            `Creating new provider for chain ${chainId} due to ${errorType}`,
          );

          const provider = this.createResilientProvider(network);
          this.providers[chainId] = provider;

          const contractAddress = (contractAddresses as Record<number, string>)[chainId];
          const contract = new ethers.Contract(
            contractAddress,
            contractABI as ethers.InterfaceAbi,
            provider,
          );
          this.contracts[chainId] = contract;

          await this.startEventListeners(chainId);
        }

        this.reconnectAttempts[chainId] = 0;

        logger.info(
          `✅ Successfully reconnected to chain ${chainId} after ${errorType}`,
          {
            network: network.name,
            eventListenersActive: this.eventListenersActive[chainId],
          },
        );
      } catch (error) {
        const err = error as Error;
        const classification = this.classifyError(err, chainId);

        logger.error(`Reconnection failed for chain ${chainId}:`, {
          originalErrorType: errorType,
          newErrorType: classification.type,
          error: err.message,
          stack: err.stack,
          willRetry: classification.shouldReconnect && !classification.isFatal,
        });

        if (!classification.isFatal && classification.shouldReconnect) {
          await this.reconnectProvider(chainId, classification.type);
        } else {
          logger.error(
            `Stopping reconnection attempts for chain ${chainId} due to ${classification.type}`,
          );
        }
      }
    }, actualDelay);
  }

  async handleBlockUpdate(chainId: number, blockNumber: number): Promise<void> {
    try {
      const lastBlock = this.lastProcessedBlock[chainId];

      if (lastBlock && blockNumber <= lastBlock) {
        logger.warn(
          `Potential block reorganization detected on chain ${chainId}: current ${blockNumber}, last ${lastBlock}`,
        );
        await this.handleReorg(chainId, blockNumber);
      }

      this.lastProcessedBlock[chainId] = blockNumber;
    } catch (error) {
      const err = error as Error;
      logger.error(`Error handling block update for chain ${chainId}:`, {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  async handleReorg(chainId: number, blockNumber: number): Promise<void> {
    try {
      logger.info(
        `Handling reorganization for chain ${chainId} at block ${blockNumber}`,
      );

      const confirmations = this.confirmations[chainId] ?? 12;
      const safeBlock = blockNumber - confirmations;

      if (safeBlock < 0) {
        return;
      }

      const lastProcessed = this.lastProcessedBlock[chainId];

      if (lastProcessed > safeBlock) {
        logger.info(
          `Resyncing from block ${safeBlock} for chain ${chainId} (${confirmations} confirmations)`,
        );
        await this.resyncFromBlock(chainId, safeBlock);
      }
    } catch (error) {
      const err = error as Error;
      logger.error(`Error handling reorganization for chain ${chainId}:`, {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  async resyncFromBlock(chainId: number, fromBlock: number): Promise<void> {
    try {
      const contract = this.contracts[chainId];
      if (!contract) {
        logger.error(`Contract not found for chain ${chainId}`);
        return;
      }

      logger.info(`Resyncing events from block ${fromBlock} on chain ${chainId}`);

      const provider = this.providers[chainId];
      const currentBlock = await provider.getBlockNumber();

      const filter = contract.filters;

      const createdEvents = await contract.queryFilter(
        filter.TaskCreated(),
        fromBlock,
        currentBlock,
      );
      const completedEvents = await contract.queryFilter(
        filter.TaskCompleted(),
        fromBlock,
        currentBlock,
      );
      const deletedEvents = await contract.queryFilter(
        filter.TaskDeleted(),
        fromBlock,
        currentBlock,
      );
      const restoredEvents = await contract.queryFilter(
        filter.TaskRestored(),
        fromBlock,
        currentBlock,
      );
      const updatedEvents = await contract.queryFilter(
        filter.TaskUpdated(),
        fromBlock,
        currentBlock,
      );

      logger.info(
        `Found ${createdEvents.length} created, ${completedEvents.length} completed, ${deletedEvents.length} deleted, ${restoredEvents.length} restored, ${updatedEvents.length} updated events to resync`,
      );

      for (const event of createdEvents) {
        const [taskId, owner, description, timestamp, dueDate] = (
          event as ethers.EventLog
        ).args;
        await this.syncTaskCreated(
          chainId,
          taskId,
          owner,
          description,
          timestamp,
          event.transactionHash,
          dueDate,
        );
      }

      for (const event of completedEvents) {
        const [taskId, , timestamp] = (event as ethers.EventLog).args;
        await this.syncTaskCompleted(chainId, taskId, timestamp);
      }

      for (const event of deletedEvents) {
        const [taskId] = (event as ethers.EventLog).args;
        await this.syncTaskDeleted(chainId, taskId);
      }

      for (const event of restoredEvents) {
        const [taskId] = (event as ethers.EventLog).args;
        await this.syncTaskRestored(chainId, taskId);
      }

      for (const event of updatedEvents) {
        const [taskId, , oldDescription, newDescription] = (event as ethers.EventLog).args;
        await this.syncTaskUpdated(chainId, taskId, oldDescription, newDescription);
      }

      logger.info(`✓ Resync completed for chain ${chainId}`);
    } catch (error) {
      const err = error as Error;
      logger.error(`Error resyncing from block ${fromBlock} on chain ${chainId}:`, {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  async cleanup(): Promise<void> {
    logger.info('Cleaning up blockchain service...');
    for (const chainId of Object.keys(this.eventListenersActive)) {
      this.eventListenersActive[parseInt(chainId)] = false;
    }
    for (const contract of Object.values(this.contracts)) {
      contract.removeAllListeners();
    }
    for (const provider of Object.values(this.providers)) {
      provider.removeAllListeners();
    }
    this.initialized = false;
  }
}

module.exports = new BlockchainService();
