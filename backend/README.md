# Backend API - Decentralized Todo App

Express.js backend with MongoDB caching and blockchain event synchronization.

## Features

- REST API for todo operations
- MongoDB caching for fast queries
- Real-time blockchain event listeners
- Multi-chain support (Ethereum, Polygon, Arbitrum, Optimism)
- Wallet signature authentication
- Data verification against blockchain

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
MONGODB_URI=mongodb://localhost:27017/decentralized-todo

# Blockchain RPC URLs
ETHEREUM_SEPOLIA_RPC=your_sepolia_rpc_url
POLYGON_MUMBAI_RPC=your_mumbai_rpc_url
ARBITRUM_GOERLI_RPC=your_arbitrum_rpc_url
OPTIMISM_SEPOLIA_RPC=your_optimism_rpc_url
LOCALHOST_RPC=http://127.0.0.1:8545

# Default network
DEFAULT_NETWORK=localhost

# CORS
CORS_ORIGIN=http://localhost:3000
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
│   │   ├── blockchain.js    # Blockchain configuration
│   │   └── database.js      # MongoDB configuration
│   ├── controllers/
│   │   └── todoController.js
│   ├── middleware/
│   │   ├── auth.js          # Wallet authentication
│   │   └── errorHandler.js
│   ├── models/
│   │   └── Todo.js          # Mongoose schema
│   ├── routes/
│   │   ├── healthRoutes.js
│   │   └── todoRoutes.js
│   ├── services/
│   │   └── blockchainService.js  # Event listeners
│   └── index.js             # Express app entry
├── test/                    # Tests (TODO)
├── .env.example
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

```bash
npm test
```

(Tests to be implemented)

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
- Verify MongoDB is running
- Check connection string format
- Test with `mongosh <connection_string>`
- Check IP whitelist (Atlas)

### Blockchain Event Listeners Not Working
- Check RPC URLs are accessible
- Verify contract addresses in deployment files
- Check contract is deployed to network
- Look for errors in console logs

### High Memory Usage
- Reduce MongoDB connection pool size
- Implement pagination for large queries
- Add indexes to frequently queried fields

### CORS Errors
- Update `CORS_ORIGIN` in `.env`
- Restart server after .env changes

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
