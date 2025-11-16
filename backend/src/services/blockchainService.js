const { ethers } = require('ethers');
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
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
    this.confirmations = 12; // Number of blocks to wait before considering a block final
  }

  async initialize() {
    try {
      // Initialize providers and contracts for each network
      for (const [networkKey, network] of Object.entries(networks)) {
        if (!network.rpcUrl) {
          console.warn(`Skipping ${network.name}: No RPC URL provided`);
          continue;
        }

        const contractAddress = contractAddresses[network.chainId];
        if (!contractAddress) {
          console.warn(`Skipping ${network.name}: No contract deployed`);
          continue;
        }

        try {
          // Create provider
          const provider = new ethers.JsonRpcProvider(network.rpcUrl);
          this.providers[network.chainId] = provider;

          // Create contract instance
          const contract = new ethers.Contract(contractAddress, contractABI, provider);
          this.contracts[network.chainId] = contract;

          // Start event listeners
          this.startEventListeners(network.chainId);

          console.log(`✓ Connected to ${network.name} (chainId: ${network.chainId})`);
        } catch (error) {
          console.error(`Error initializing ${network.name}:`, error.message);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
      throw error;
    }
  }

  async startEventListeners(chainId) {
    const contract = this.contracts[chainId];
    const provider = this.providers[chainId];
    if (!contract || !provider) return;

    // Mark event listeners as active
    this.eventListenersActive[chainId] = true;

    // Initialize last processed block
    try {
      this.lastProcessedBlock[chainId] = await provider.getBlockNumber();
    } catch (error) {
      console.error(`Error getting initial block number for chain ${chainId}:`, error);
      this.lastProcessedBlock[chainId] = 0;
    }

    // Add provider error handling and reconnection logic
    provider.on('error', async (error) => {
      console.error(`Provider error for chain ${chainId}:`, error.message);
      this.eventListenersActive[chainId] = false;
      await this.reconnectProvider(chainId);
    });

    // Add WebSocket disconnect handling
    if (provider.websocket) {
      provider.websocket.on('close', async (code, reason) => {
        console.warn(`WebSocket closed for chain ${chainId}: ${code} - ${reason}`);
        this.eventListenersActive[chainId] = false;
        await this.reconnectProvider(chainId);
      });
    }

    // Monitor blocks for reorganization detection
    provider.on('block', async (blockNumber) => {
      await this.handleBlockUpdate(chainId, blockNumber);
    });

    // Listen for TaskCreated events
    contract.on('TaskCreated', async (taskId, owner, description, timestamp, event) => {
      try {
        console.log(`[${chainId}] TaskCreated event:`, {
          taskId: taskId.toString(),
          owner,
          description,
          blockNumber: event.log.blockNumber,
        });

        await this.syncTaskCreated(chainId, taskId, owner, description, timestamp, event.log.transactionHash);
      } catch (error) {
        console.error(`Error handling TaskCreated event:`, error);
      }
    });

    // Listen for TaskCompleted events
    contract.on('TaskCompleted', async (taskId, owner, timestamp, event) => {
      try {
        console.log(`[${chainId}] TaskCompleted event:`, {
          taskId: taskId.toString(),
          timestamp,
          blockNumber: event.log.blockNumber,
        });

        await this.syncTaskCompleted(chainId, taskId, timestamp);
      } catch (error) {
        console.error(`Error handling TaskCompleted event:`, error);
      }
    });

    // Listen for TaskDeleted events
    contract.on('TaskDeleted', async (taskId, owner, timestamp, event) => {
      try {
        console.log(`[${chainId}] TaskDeleted event:`, {
          taskId: taskId.toString(),
          blockNumber: event.log.blockNumber,
        });

        await this.syncTaskDeleted(chainId, taskId);
      } catch (error) {
        console.error(`Error handling TaskDeleted event:`, error);
      }
    });

    console.log(`✓ Event listeners started for chainId: ${chainId}`);
  }

  async syncTaskCreated(chainId, taskId, owner, description, timestamp, transactionHash) {
    try {
      const blockchainId = taskId.toString();

      // Check if task already exists
      const existing = await Todo.findByBlockchainId(chainId, blockchainId);
      if (existing) {
        console.log(`Task ${blockchainId} already synced on chain ${chainId}`);
        return;
      }

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

      await todo.save();
      console.log(`✓ Synced TaskCreated: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      console.error('Error syncing TaskCreated:', error);
    }
  }

  async syncTaskCompleted(chainId, taskId, timestamp) {
    try {
      const blockchainId = taskId.toString();
      const todo = await Todo.findByBlockchainId(chainId, blockchainId);

      if (!todo) {
        console.error(`Todo ${blockchainId} not found for completion on chain ${chainId}`);
        return;
      }

      await todo.markAsCompleted(new Date(Number(timestamp) * 1000));
      console.log(`✓ Synced TaskCompleted: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      console.error('Error syncing TaskCompleted:', error);
    }
  }

  async syncTaskDeleted(chainId, taskId) {
    try {
      const blockchainId = taskId.toString();
      const todo = await Todo.findByBlockchainId(chainId, blockchainId);

      if (!todo) {
        console.error(`Todo ${blockchainId} not found for deletion on chain ${chainId}`);
        return;
      }

      await todo.markAsDeleted();
      console.log(`✓ Synced TaskDeleted: ${blockchainId} on chain ${chainId}`);
    } catch (error) {
      console.error('Error syncing TaskDeleted:', error);
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
   * Reconnect provider with exponential backoff
   */
  async reconnectProvider(chainId) {
    if (!this.reconnectAttempts[chainId]) {
      this.reconnectAttempts[chainId] = 0;
    }

    if (this.reconnectAttempts[chainId] >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for chain ${chainId}`);
      return;
    }

    this.reconnectAttempts[chainId]++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts[chainId] - 1);

    console.log(
      `Attempting to reconnect to chain ${chainId} (attempt ${this.reconnectAttempts[chainId]}/${this.maxReconnectAttempts}) in ${delay}ms...`
    );

    setTimeout(async () => {
      try {
        // Find the network configuration
        const network = Object.values(networks).find((n) => n.chainId === chainId);
        if (!network) {
          console.error(`Network configuration not found for chain ${chainId}`);
          return;
        }

        // Remove old listeners
        const oldContract = this.contracts[chainId];
        if (oldContract) {
          oldContract.removeAllListeners();
        }

        // Create new provider
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);
        this.providers[chainId] = provider;

        // Recreate contract instance
        const contractAddress = contractAddresses[chainId];
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        this.contracts[chainId] = contract;

        // Restart event listeners
        await this.startEventListeners(chainId);

        // Reset reconnection attempts on success
        this.reconnectAttempts[chainId] = 0;

        console.log(`✓ Successfully reconnected to chain ${chainId}`);
      } catch (error) {
        console.error(`Failed to reconnect to chain ${chainId}:`, error.message);
        await this.reconnectProvider(chainId);
      }
    }, delay);
  }

  /**
   * Handle block updates and detect reorganizations
   */
  async handleBlockUpdate(chainId, blockNumber) {
    try {
      const lastBlock = this.lastProcessedBlock[chainId];

      // Check for block reorganization
      if (lastBlock && blockNumber <= lastBlock) {
        console.warn(
          `Potential block reorganization detected on chain ${chainId}: current ${blockNumber}, last ${lastBlock}`
        );
        await this.handleReorg(chainId, blockNumber);
      }

      // Update last processed block
      this.lastProcessedBlock[chainId] = blockNumber;
    } catch (error) {
      console.error(`Error handling block update for chain ${chainId}:`, error);
    }
  }

  /**
   * Handle blockchain reorganization
   */
  async handleReorg(chainId, blockNumber) {
    try {
      console.log(`Handling reorganization for chain ${chainId} at block ${blockNumber}`);

      // Calculate safe block (block with enough confirmations)
      const safeBlock = blockNumber - this.confirmations;

      if (safeBlock < 0) {
        // Too early, not enough blocks for confirmations
        return;
      }

      const lastProcessed = this.lastProcessedBlock[chainId];

      // If our last processed block is beyond the safe block, we need to resync
      if (lastProcessed > safeBlock) {
        console.log(`Resyncing from block ${safeBlock} for chain ${chainId}`);
        await this.resyncFromBlock(chainId, safeBlock);
      }
    } catch (error) {
      console.error(`Error handling reorganization for chain ${chainId}:`, error);
    }
  }

  /**
   * Resync events from a specific block
   */
  async resyncFromBlock(chainId, fromBlock) {
    try {
      const contract = this.contracts[chainId];
      if (!contract) {
        console.error(`Contract not found for chain ${chainId}`);
        return;
      }

      console.log(`Resyncing events from block ${fromBlock} on chain ${chainId}`);

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

      console.log(
        `Found ${createdEvents.length} created, ${completedEvents.length} completed, ${deletedEvents.length} deleted events to resync`
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

      console.log(`✓ Resync completed for chain ${chainId}`);
    } catch (error) {
      console.error(`Error resyncing from block ${fromBlock} on chain ${chainId}:`, error);
    }
  }

  async cleanup() {
    console.log('Cleaning up blockchain service...');
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
