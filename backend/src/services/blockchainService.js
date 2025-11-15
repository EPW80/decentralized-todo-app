const { ethers } = require('ethers');
const Todo = require('../models/Todo');
const { networks, contractAddresses, contractABI, defaultNetwork } = require('../config/blockchain');

class BlockchainService {
  constructor() {
    this.providers = {};
    this.contracts = {};
    this.initialized = false;
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

  startEventListeners(chainId) {
    const contract = this.contracts[chainId];
    if (!contract) return;

    // Listen for TaskCreated events
    contract.on('TaskCreated', async (taskId, owner, description, timestamp, event) => {
      try {
        console.log(`[${chainId}] TaskCreated event:`, {
          taskId: taskId.toString(),
          owner,
          description,
        });

        await this.syncTaskCreated(chainId, taskId, owner, description, timestamp, event.log.transactionHash);
      } catch (error) {
        console.error(`Error handling TaskCreated event:`, error);
      }
    });

    // Listen for TaskCompleted events
    contract.on('TaskCompleted', async (taskId, timestamp, event) => {
      try {
        console.log(`[${chainId}] TaskCompleted event:`, {
          taskId: taskId.toString(),
          timestamp,
        });

        await this.syncTaskCompleted(chainId, taskId, timestamp);
      } catch (error) {
        console.error(`Error handling TaskCompleted event:`, error);
      }
    });

    // Listen for TaskDeleted events
    contract.on('TaskDeleted', async (taskId, event) => {
      try {
        console.log(`[${chainId}] TaskDeleted event:`, {
          taskId: taskId.toString(),
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

  async cleanup() {
    console.log('Cleaning up blockchain service...');
    // Remove all event listeners
    for (const contract of Object.values(this.contracts)) {
      contract.removeAllListeners();
    }
    this.initialized = false;
  }
}

module.exports = new BlockchainService();
