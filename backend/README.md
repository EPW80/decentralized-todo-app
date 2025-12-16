# Backend API - Decentralized Todo App

Express.js backend with MongoDB caching and blockchain event synchronization.

## Features

- REST API for todo operations
- MongoDB caching for fast queries
- Real-time blockchain event listeners
- Multi-chain support (Ethereum, Polygon, Arbitrum, Optimism)
- Wallet signature authentication (challenge-response with EIP-191)
- Data verification against blockchain
- Structured logging with Winston
- Comprehensive test coverage with Jest
- Request correlation tracking

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
# IMPORTANT: Must include database name at the end (/decentralized-todo)
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/decentralized-todo
# MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/decentralized-todo

# JWT Secret (for optional session management)
JWT_SECRET=your_jwt_secret_at_least_32_characters

# Blockchain RPC URLs
ETHEREUM_SEPOLIA_RPC=your_sepolia_rpc_url
POLYGON_MUMBAI_RPC=your_mumbai_rpc_url
ARBITRUM_GOERLI_RPC=your_arbitrum_rpc_url
OPTIMISM_SEPOLIA_RPC=your_optimism_rpc_url
LOCALHOST_RPC=http://127.0.0.1:8545

# Backup RPC URLs (optional - for failover)
LOCALHOST_RPC_BACKUP=

# Default network
DEFAULT_NETWORK=localhost

# Confirmation blocks (chain-specific)
CONFIRMATION_BLOCKS_LOCALHOST=1
CONFIRMATION_BLOCKS_SEPOLIA=12
CONFIRMATION_BLOCKS_POLYGONMUMBAI=128
CONFIRMATION_BLOCKS_ARBITRUMGOERLI=1
CONFIRMATION_BLOCKS_OPTIMISMSEPOLIA=1

# Event Recovery Settings
# Number of days to look back when recovering missed events on startup
# Set to 0 to disable recovery (recommended for free tier RPC providers)
# Note: Alchemy free tier limits eth_getLogs to 10 block range
EVENT_RECOVERY_DAYS=0

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 3. Start MongoDB

#### Local:
```bash
mongod --dbpath /path/to/data
```

#### Atlas:
Use your MongoDB Atlas connection string in `.env`.

### 4. Deploy Smart Contracts

Ensure contracts are deployed and deployment JSON files exist in:
```
../contracts/deployments/deployment-{chainId}.json
```

### 5. Start Server

#### Development:
```bash
npm run dev
```

#### Production:
```bash
npm start
```

Server runs on `http://localhost:5000`.

## API Endpoints

### Authentication

**GET** `/api/auth/nonce/:address`

Get a nonce for wallet signature authentication.

Response:
```json
{
  "success": true,
  "nonce": "e4f2a1b9..."
}
```

**POST** `/api/auth/login`

Authenticate with wallet signature.

Request Body:
```json
{
  "address": "0x...",
  "signature": "0x..."
}
```

Response:
```json
{
  "success": true,
  "token": "jwt_token...",
  "user": {
    "address": "0x...",
    "nonce": "..."
  }
}
```

### Health Check

**GET** `/api/health`

Returns server status and blockchain connection info.

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-09T...",
  "uptime": 123.45,
  "environment": "development",
  "services": {
    "database": "connected",
    "blockchain": "connected"
  },
  "blockchain": {
    "31337": {
      "name": "localhost",
      "chainId": 31337,
      "blockNumber": 123,
      "contractAddress": "0x..."
    }
  }
}
```

### Get Todos by Address

**GET** `/api/todos/:address`

Query Parameters:
- `includeCompleted` (boolean, default: true)
- `includeDeleted` (boolean, default: false)

Response:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "blockchainId": "1",
      "chainId": 31337,
      "transactionHash": "0x...",
      "owner": "0x...",
      "description": "Buy groceries",
      "completed": false,
      "blockchainCreatedAt": "2025-11-09T...",
      "syncStatus": "synced",
      "deleted": false
    }
  ]
}
```

### Get User Statistics

**GET** `/api/todos/:address/stats`

Response:
```json
{
  "success": true,
  "data": {
    "total": 10,
    "completed": 7,
    "active": 3,
    "completionRate": "70.00"
  }
}
```

### Get Specific Todo

**GET** `/api/todos/todo/:id`

Response:
```json
{
  "success": true,
  "data": { /* todo object */ }
}
```

### Verify Todo Against Blockchain

**GET** `/api/todos/verify/:id`

Verifies cached todo data against blockchain source of truth.

Response:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "cached": {
      "description": "Buy groceries",
      "completed": false,
      "owner": "0x..."
    },
    "blockchain": {
      "description": "Buy groceries",
      "completed": false,
      "owner": "0x..."
    }
  }
}
```

### Sync Todo from Blockchain

**POST** `/api/todos/sync`

Manually sync a specific todo from blockchain to MongoDB.

Request Body:
```json
{
  "chainId": 31337,
  "blockchainId": "1"
}
```

Response:
```json
{
  "success": true,
  "message": "Todo synced from blockchain",
  "data": { /* todo object */ }
}
```

### Restore Deleted Todo

**POST** `/api/todos/restore`

Restore a soft-deleted todo (TodoListV2 feature).

Request Body:
```json
{
  "id": "mongodb_id"
}
```

Response:
```json
{
  "success": true,
  "message": "Todo restored successfully",
  "data": { /* todo object */ }
}
```

## Architecture

### Hybrid Sync System

1. **Write Operations**: Frontend → Blockchain (smart contract)
2. **Event Detection**: Backend listens for blockchain events
3. **Auto-Sync**: Events automatically update MongoDB cache
4. **Read Operations**: Frontend → Backend API (fast MongoDB queries)
5. **Verification**: Optional blockchain verification for data integrity

### Event Listeners

The backend automatically listens for:
- `TaskCreated` - Creates todo in MongoDB
- `TaskCompleted` - Updates todo completion status
- `TaskDeleted` - Marks todo as deleted

### Database Schema

```javascript
{
  blockchainId: String,      // Task ID from smart contract
  chainId: Number,           // Network chain ID
  transactionHash: String,   // Creation transaction hash
  owner: String,             // Ethereum address (lowercase)
  description: String,       // Task description
  completed: Boolean,        // Completion status
  blockchainCreatedAt: Date, // Creation timestamp from blockchain
  blockchainCompletedAt: Date, // Completion timestamp
  syncStatus: String,        // 'synced' | 'pending' | 'error'
  lastSyncedAt: Date,        // Last sync timestamp
  deleted: Boolean,          // Soft delete flag
  createdAt: Date,           // MongoDB creation time
  updatedAt: Date            // MongoDB update time
}
```

## Error Handling

All errors return:
```json
{
  "success": false,
  "error": "Error message"
}
```

Status codes:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error
- `503` - Service unavailable

## Development

### File Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── blockchain.js       # Blockchain configuration
│   │   ├── database.js         # MongoDB configuration
│   │   └── validateEnv.js      # Environment validation
│   ├── controllers/
│   │   ├── authController.js   # Authentication handlers
│   │   └── todoController.js   # Todo CRUD handlers
│   ├── middleware/
│   │   ├── auth.js             # JWT & wallet authentication
│   │   ├── errorHandler.js     # Centralized error handling
│   │   ├── requestLogger.js    # Request logging with correlation IDs
│   │   └── validation.js       # Input validation
│   ├── models/
│   │   ├── Todo.js             # Todo Mongoose schema
│   │   └── User.js             # User Mongoose schema
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   ├── healthRoutes.js     # Health check
│   │   └── todoRoutes.js       # Todo endpoints
│   ├── scripts/
│   │   └── syncSpecificBlock.js # Manual event sync utility
│   ├── services/
│   │   └── blockchainService.js # Event listeners & RPC
│   ├── utils/
│   │   └── logger.js           # Winston structured logger
│   └── index.js                # Express app entry
├── test/
│   ├── integration/
│   │   └── api/
│   │       └── health.test.js  # Health endpoint tests
│   ├── unit/
│   │   ├── middleware/
│   │   │   ├── errorHandler.test.js
│   │   │   └── validation.test.js
│   │   └── utils/
│   │       └── logger.test.js
│   └── setup.js                # Test environment config
├── logs/                       # Winston log files (gitignored)
├── .env.example
├── jest.config.js              # Jest configuration
├── package.json
└── README.md
```

### Adding New Networks

1. Add network config in `src/config/blockchain.js`:
```javascript
networkName: {
  name: 'networkName',
  chainId: 12345,
  rpcUrl: process.env.NETWORK_RPC || '',
}
```

2. Add RPC URL to `.env.example`

3. Deploy contract to network

4. Event listeners will automatically initialize

### Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Current Test Coverage:**
- Unit tests: errorHandler, validation, logger
- Integration tests: health API
- Coverage target: 70% (branches, functions, lines, statements)

**Test Environment:**
- Uses separate test database
- Mocks external dependencies
- Structured logging disabled in tests

See `backend/TESTING.md` for detailed testing documentation.

### Logging

The backend uses **Winston** for structured logging with the following features:

**Log Levels:**
- `error` - Errors and exceptions
- `warn` - Warning messages
- `info` - Informational messages (default)
- `debug` - Detailed debugging information

**Features:**
- JSON formatted logs for easy parsing
- Daily rotating file logs (7-14 day retention)
- Sensitive data redaction (passwords, private keys, tokens)
- Request correlation IDs for tracing
- Metadata support for structured context

**Log Files:**
```
logs/
├── combined-YYYY-MM-DD.log  # All logs
└── error-YYYY-MM-DD.log     # Errors only
```

**Usage:**
```javascript
const logger = require('./utils/logger');

logger.info('User logged in', { userId: '123', ip: '127.0.0.1' });
logger.error('Database error', { error: err.message, stack: err.stack });

// Child logger with persistent context
const reqLogger = logger.child({ requestId: 'abc123' });
reqLogger.info('Processing request');
```

**Request Logging:**
Every HTTP request automatically gets:
- Unique request ID (X-Request-ID header)
- Request/response timing
- Status codes
- IP address and user agent
- Sanitized request/response bodies

### Manual Event Sync

If you miss blockchain events (e.g., backend was offline), use the manual sync script:

```bash
# Sync specific block range for a chain
node src/scripts/syncSpecificBlock.js

# In the script, configure:
# - chainId (e.g., 11155111 for Sepolia)
# - fromBlock (starting block number)
# - toBlock (ending block number or 'latest')
```

**When to use:**
- Backend was offline during transactions
- EVENT_RECOVERY_DAYS=0 (recovery disabled)
- Using free tier RPC with block range limits
- Need to backfill historical data

## Deployment

### Environment Variables

Required in production:
- `MONGODB_URI` - MongoDB connection string
- `CORS_ORIGIN` - Frontend URL
- `JWT_SECRET` - Secret for JWT tokens
- RPC URLs for all supported networks

### Hosting Options

1. **Vercel** - Serverless functions
2. **Railway** - Container deployment
3. **Render** - Docker or Node.js
4. **Heroku** - Buildpack

### Health Monitoring

Monitor `/api/health` endpoint:
- Check `services.database` = "connected"
- Check `services.blockchain` = "connected"
- Verify blockchain networks are responding

## Troubleshooting

### MongoDB Connection Issues

**Database name missing in URI:**
```bash
# WRONG - defaults to 'test' database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/

# CORRECT - specifies database name
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/decentralized-todo
```

**Other issues:**
- Verify MongoDB is running (`mongosh <connection_string>`)
- Check IP whitelist (MongoDB Atlas)
- Validate connection string format
- Check logs for connection errors

### Todos Not Appearing in Frontend

**Common causes:**

1. **Event recovery disabled (EVENT_RECOVERY_DAYS=0)**
   - Backend only listens for NEW events after startup
   - Transactions before backend start won't be synced
   - Solution: Use manual sync script or keep backend running

2. **RPC provider limitations**
   - Alchemy free tier: 10 block range limit for eth_getLogs
   - Solution: Disable event recovery or upgrade RPC plan

3. **Backend offline during transaction**
   - Events are not stored if backend isn't listening
   - Solution: Run manual sync script for specific blocks

4. **Wrong database**
   - Check MONGODB_URI includes correct database name
   - Verify todos are in correct database: `use decentralized-todo` in mongosh

5. **Address case sensitivity**
   - Backend stores addresses as lowercase
   - Frontend must normalize addresses before querying

### Blockchain Event Listeners Not Working
- Check RPC URLs are accessible (`curl <RPC_URL>`)
- Verify contract addresses in deployment files
- Check contract is deployed to network
- Review logs for connection errors: `tail -f logs/combined-*.log`
- Test with localhost network first

### Missing Historical Events
- Use manual sync script: `node src/scripts/syncSpecificBlock.js`
- Configure block range in script
- Check Etherscan for transaction block numbers
- Note: Free tier RPC has block range limits

### High Memory Usage
- Reduce MongoDB connection pool size
- Implement pagination for large queries
- Add indexes to frequently queried fields
- Check for memory leaks with `node --inspect`

### CORS Errors
- Update `CORS_ORIGIN` in `.env`
- Restart server after .env changes
- Verify frontend URL matches exactly (including port)

## Performance

### Caching Strategy
- Read from MongoDB (fast)
- Verify with blockchain when needed
- Auto-sync via event listeners

### Optimization Tips
- Use MongoDB indexes (already implemented)
- Paginate large result sets
- Cache network info
- Use Redis for session storage (optional)

## Security

- Helmet.js for security headers
- Rate limiting enabled (100 req/15min)
- Input validation with express-validator
- CORS configuration
- JWT for optional sessions
- Wallet signature verification

## License

MIT
