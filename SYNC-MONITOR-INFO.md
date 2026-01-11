# Automatic Sync Monitor

## Overview
The Sync Monitor is a background service that automatically detects and fixes out-of-sync tasks between the database and blockchain.

## Why It's Needed
ethers.js has a known issue with Hardhat local nodes where `FilterIdEventSubscriber` errors cause event listeners to miss blockchain events. This means tasks can be completed on the blockchain but the database doesn't get updated.

## Solution
Instead of relying solely on real-time event listeners, the Sync Monitor periodically polls the blockchain to verify all tasks are in sync and automatically fixes any discrepancies.

## How It Works

### Check Frequency
- Default: Every **30 seconds**
- Configurable via `SYNC_CHECK_INTERVAL` environment variable (in milliseconds)

### Sync Process
1. **Query Database**: Get all non-deleted tasks for each blockchain network
2. **Query Blockchain**: For each task, fetch its current state from the smart contract
3. **Compare States**: Check if `completed` status matches between database and blockchain
4. **Auto-Sync**: If blockchain shows task as completed but database doesn't:
   - Automatically call `syncTaskCompleted()`
   - Update database to match blockchain
   - Log the sync action

### Logging
When a task is auto-synced, you'll see logs like:
```
🔄 Task 2 out of sync on chain 31337: database: {completed: false}, blockchain: {completed: true}
✓ Auto-synced TaskCompleted: 2 on chain 31337
Sync check for chain 31337: 1/1 tasks auto-synced
