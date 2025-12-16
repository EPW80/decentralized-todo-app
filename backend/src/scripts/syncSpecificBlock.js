/**
 * Script to manually sync events from a specific block or block range
 * Usage: node src/scripts/syncSpecificBlock.js <chainId> <fromBlock> [toBlock]
 */

require('dotenv').config();
const blockchainService = require('../services/blockchainService');
const connectDB = require('../config/database');
const logger = require('../utils/logger');

async function syncBlock(chainId, fromBlock, toBlock = null) {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Connected to MongoDB');

    // Initialize blockchain service
    await blockchainService.initialize();
    logger.info('Blockchain service initialized');

    const actualToBlock = toBlock || fromBlock;
    logger.info(`Syncing chain ${chainId} from block ${fromBlock} to ${actualToBlock}`);

    // Get the contract and provider
    const contract = blockchainService.contracts[chainId];
    const provider = blockchainService.providers[chainId];

    if (!contract || !provider) {
      throw new Error(`Contract or provider not available for chain ${chainId}`);
    }

    // Query TaskAdded events
    logger.info('Querying TaskAdded events...');
    const addedFilter = contract.filters.TaskAdded();
    const addedEvents = await contract.queryFilter(addedFilter, fromBlock, actualToBlock);
    logger.info(`Found ${addedEvents.length} TaskAdded events`);

    for (const event of addedEvents) {
      logger.info(`Processing TaskAdded at block ${event.blockNumber}:`, {
        user: event.args.user,
        taskId: event.args.taskId?.toString(),
        description: event.args.description,
      });

      await blockchainService.handleTaskAdded(
        event.args.user,
        event.args.taskId,
        event.args.description,
        event.args.timestamp,
        chainId,
        event.blockNumber,
        event.transactionHash
      );
    }

    // Query TaskCompleted events
    logger.info('Querying TaskCompleted events...');
    const completedFilter = contract.filters.TaskCompleted();
    const completedEvents = await contract.queryFilter(completedFilter, fromBlock, actualToBlock);
    logger.info(`Found ${completedEvents.length} TaskCompleted events`);

    for (const event of completedEvents) {
      await blockchainService.handleTaskCompleted(
        event.args.user,
        event.args.taskId,
        event.args.timestamp,
        chainId,
        event.blockNumber,
        event.transactionHash
      );
    }

    logger.info('✓ Sync completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Sync failed:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Parse command line arguments
const chainId = parseInt(process.argv[2]);
const fromBlock = parseInt(process.argv[3]);
const toBlock = process.argv[4] ? parseInt(process.argv[4]) : null;

if (!chainId || !fromBlock) {
  console.error('Usage: node syncSpecificBlock.js <chainId> <fromBlock> [toBlock]');
  console.error('Example: node syncSpecificBlock.js 11155111 9851176');
  process.exit(1);
}

syncBlock(chainId, fromBlock, toBlock);
