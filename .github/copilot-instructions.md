# Copilot Instructions - Decentralized Todo App

## Project Overview

Full-stack decentralized todo application with blockchain integration. The app maintains dual-state: on-chain (smart contracts) and off-chain (MongoDB), with the backend acting as a synchronization bridge that listens to blockchain events and caches data for performance.

**Architecture**: React (TypeScript) → Express + MongoDB ↔ Ethereum Smart Contracts (Solidity)

## Critical Architecture Patterns

### 1. Dual-State Synchronization Pattern

The backend maintains MongoDB as a **cache mirror** of blockchain state:

- **Source of Truth**: Smart contract on-chain data
- **Cache**: MongoDB todos with `chainId`, `blockchainId`, `transactionHash`
- **Sync**: `blockchainService.js` listens to contract events and updates MongoDB
- Event recovery on startup handles missed events during downtime (controlled by `EVENT_RECOVERY_DAYS`)

**Key files**: [backend/src/services/blockchainService.js](../backend/src/services/blockchainService.js), [backend/src/models/Todo.js](../backend/src/models/Todo.js)

### 2. Smart Contract Migration: V1 → V2 (UUPS Upgradeable)

Project recently migrated from TodoList V1 to TodoListV2:

- **V2 uses UUPS proxy pattern** (OpenZeppelin upgradeable contracts)
- **Event name changes**: `TaskAdded` → `TaskCreated`, added `TaskRestored`
- **Soft deletes**: Tasks have `deleted` flag and `deletedAt` timestamp (can be restored)
- **RBAC**: Four roles (DEFAULT_ADMIN, ADMIN_ROLE, MODERATOR_ROLE, UPGRADER_ROLE)

**When modifying contracts**: Check [MIGRATION_CHECKLIST.md](../MIGRATION_CHECKLIST.md) and [contracts/MIGRATION_V1_TO_V2.md](../contracts/MIGRATION_V1_TO_V2.md) for event mapping updates required in backend service.

### 3. Multi-Chain Support with Failover

Backend supports multiple chains (localhost, Sepolia, Mumbai, Arbitrum, Optimism):

- Chain-specific confirmation blocks via `CONFIRMATION_BLOCKS_{NETWORK}` env vars
- RPC failover with `ethers.FallbackProvider` if backup RPC URL provided
- Contract addresses loaded from `contracts/deployments/deployment-{chainId}.json`

**Configuration**: [backend/src/config/blockchain.js](../backend/src/config/blockchain.js)

## Development Workflows

### Monorepo Structure (npm workspaces)

```bash
npm install:all              # Install all workspace dependencies
npm run dev                  # Start backend + frontend concurrently
npm run dev:contracts        # Start Hardhat node
npm test                     # Run all tests (contracts + backend + frontend)
```

### Environment Setup Order

1. **Contracts**: Start Hardhat node → Deploy contracts → Copy deployment JSON
2. **Backend**: Set `.env` (MongoDB URI **must include database name**: `/decentralized-todo`), JWT_SECRET (32+ chars), RPC URLs
3. **Frontend**: Auto-detects deployed contracts from deployment JSON files

**Critical**: `JWT_SECRET` validation enforces 32+ character minimum. Production will exit on weak secrets, dev mode only warns.

### Testing Strategy

- **Contracts**: 184 passing tests (100% coverage) - includes upgrade tests, RBAC, fuzz testing
- **Backend**: 61% coverage, 249 tests - Jest with unit + integration tests
  - Run with `npm test` in backend folder
  - Coverage report in `backend/coverage/`
- **Frontend**: Not yet implemented (noted in [claude.md](../claude.md) Phase 3.5)

## Key Conventions

### 1. Blockchain Event Handling

Event handlers in `blockchainService.js` follow pattern:

```javascript
const eventHandlers = {
  taskCreated: async (taskId, owner, description, timestamp, event) => {
    await this.syncTaskCreated(chainId, taskId, owner, description, timestamp, event.log.transactionHash);
  }
};
```

**Memory leak prevention**: Named handlers are stored in `this.eventHandlers` to enable proper cleanup on reconnection.

### 2. MongoDB Schema Design

All blockchain-synced models use compound indexes:

```javascript
todoSchema.index({ chainId: 1, blockchainId: 1 }, { unique: true });
todoSchema.index({ owner: 1, deleted: 1, completed: 1 });
```

**Address validation**: Owner addresses must match `/^0x[a-fA-F0-9]{40}$/` and are stored lowercase.

### 3. Logging with Winston

Structured JSON logging with sensitive data redaction:

- Request correlation IDs via `requestLogger` middleware
- Redacts: `password`, `token`, `secret`, `privateKey`
- Daily rotating files (7-14 day retention) in `backend/logs/`

**Usage**: `logger.info('message', { metadata })`

### 4. Smart Contract Deployment

**UUPS Proxy deployment** (not direct deployment):

```bash
cd contracts
npm run deploy:proxy:localhost    # Initial deployment
npm run upgrade:proxy:localhost   # Upgrade existing proxy
```

Deployment creates JSON in `contracts/deployments/` with proxy address and ABI.

## Integration Points

### Contract → Backend Event Flow

1. User calls contract function (e.g., `createTask`)
2. Contract emits event (e.g., `TaskCreated`)
3. Backend `blockchainService` listens, waits for confirmations
4. Syncs to MongoDB via `syncTaskCreated()`
5. Frontend queries backend REST API for instant reads

### Frontend → Contract Interaction

Frontend uses ethers.js directly for writes (no backend proxy):

```typescript
// Example from frontend/src/services/blockchain.ts
const tx = await contract.createTask(description);
await tx.wait(); // Wait for confirmation
```

Backend detects event and updates cache independently.

## Common Gotchas

1. **Contract address mismatch**: Backend loads from `deployments/deployment-{chainId}.json` - ensure contracts deployed before starting backend
2. **Event recovery on free RPC tiers**: Alchemy free tier limits `eth_getLogs` to 10 block range - set `EVENT_RECOVERY_DAYS=0` to disable recovery
3. **MongoDB URI**: Must include database name at end (e.g., `/decentralized-todo`), a common source of connection failures
4. **CORS**: Backend restricts origins via `CORS_ORIGIN` env var - update for frontend URL changes
5. **TodoListV2 initialization**: UUPS contracts use `initialize()` not constructors - called automatically during proxy deployment

## Documentation Files

- [README.md](../README.md) - Quick start and architecture
- [claude.md](../claude.md) - Phase completion status and roadmap
- [MIGRATION_CHECKLIST.md](../MIGRATION_CHECKLIST.md) - Contract migration procedures
- [backend/TESTING.md](../backend/TESTING.md) - Testing procedures and validation
- [contracts/DEPLOYMENT.md](../contracts/DEPLOYMENT.md) - UUPS deployment guide
- [contracts/MIGRATION_V1_TO_V2.md](../contracts/MIGRATION_V1_TO_V2.md) - V1→V2 changes

## Quick Reference

**Start full stack**:
```bash
# Terminal 1: Hardhat node
cd contracts && npx hardhat node

# Terminal 2: Deploy contracts
cd contracts && npm run deploy:localhost

# Terminal 3: Backend
cd backend && npm start

# Terminal 4: Frontend
cd frontend && npm run dev
```

**Run all tests**:
```bash
npm test  # From root (runs all workspaces)
```

**Check logs**:
```bash
tail -f backend/logs/application-*.log
```
