# Decentralized Todo App - Setup Guide

Complete setup instructions for running the full-stack decentralized todo application.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or MongoDB Atlas)
- MetaMask browser extension
- Testnet ETH for deployments (optional)

## Quick Start

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Or install individually
cd contracts && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables

#### Contracts (.env)
```bash
cd contracts
cp .env.example .env
# Edit .env and add your private key and RPC URLs
```

Required for contract deployment:
- `PRIVATE_KEY`: Your MetaMask private key (Account Details -> Export Private Key)
- `SEPOLIA_RPC_URL`: Alchemy/Infura Sepolia RPC URL
- `POLYGON_MUMBAI_RPC_URL`: Polygon Mumbai RPC URL
- `ARBITRUM_GOERLI_RPC_URL`: Arbitrum Goerli RPC URL
- `OPTIMISM_SEPOLIA_RPC_URL`: Optimism Sepolia RPC URL
- API keys for block explorer verification

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Update:
- `MONGODB_URI`: Your MongoDB connection string
- `CORS_ORIGIN`: Frontend URL (http://localhost:5173 for development)
- RPC URLs for blockchain connections

#### Frontend (.env)
```bash
cd frontend
cp .env.example .env
```

The default values should work for local development.

### 3. Start Local Blockchain (Terminal 1)

```bash
cd contracts
npm run node
```

This starts a local Hardhat network on `http://localhost:8545`.

### 4. Deploy Smart Contracts (Terminal 2)

#### Deploy to local network:
```bash
cd contracts
npm run deploy:localhost
```

Contract address will be saved to `contracts/deployments/deployment-31337.json`.

#### Deploy to testnets (requires testnet ETH):
```bash
npm run deploy:sepolia
npm run deploy:mumbai
npm run deploy:arbitrum
npm run deploy:optimism
```

### 5. Start MongoDB

#### Option A: Local MongoDB
```bash
mongod --dbpath /path/to/data
```

#### Option B: MongoDB Atlas
- Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
- Get connection string and update `backend/.env`

### 6. Start Backend API (Terminal 3)

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:5000`.

### 7. Start Frontend (Terminal 4)

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 8. Connect MetaMask

1. Open MetaMask and add localhost network:
   - Network Name: Localhost
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency: ETH

2. Import a test account using private key from Hardhat node output

3. Visit `http://localhost:5173` and click "Connect Wallet"

## Testing

### Test Smart Contracts
```bash
cd contracts
npm test
```

71 comprehensive tests covering all contract functionality.

### Test Backend (TODO)
```bash
cd backend
npm test
```

### Test Frontend (TODO)
```bash
cd frontend
npm test
```

## Deployment

### Deploy Frontend to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy frontend:
```bash
cd frontend
vercel
```

3. Add environment variables in Vercel dashboard:
   - `VITE_API_URL`: Your backend API URL
   - `VITE_CONTRACT_ADDRESS_*`: Contract addresses for each network

### Deploy Backend

Options:
- **Vercel**: Serverless functions
- **Railway**: Container deployment
- **Render**: Docker or Node.js
- **Heroku**: Buildpack deployment

Update `CORS_ORIGIN` in backend `.env` to match your frontend URL.

## Architecture

```
┌─────────────┐
│   Frontend  │ (React + TypeScript + TailwindCSS)
│   (Vercel)  │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       v              v
┌────────────┐  ┌──────────────┐
│   Backend  │  │  Blockchain  │
│ (Express)  │  │  (Ethereum)  │
└──────┬─────┘  └──────┬───────┘
       │               │
       v               │
┌────────────┐        │
│  MongoDB   │◄───────┘
│  (Cache)   │ (Event Listeners)
└────────────┘
```

## Troubleshooting

### Contract deployment fails
- Ensure you have testnet ETH
- Check RPC URLs are correct
- Verify private key format (64 hex characters, no '0x' prefix)

### Backend can't connect to MongoDB
- Check MongoDB is running: `mongosh`
- Verify connection string in `.env`
- Check firewall settings for MongoDB Atlas

### Frontend can't connect to wallet
- Install MetaMask extension
- Add localhost network to MetaMask
- Import test account with balance

### Blockchain events not syncing
- Ensure backend is running
- Check RPC URLs in backend `.env`
- Verify contract is deployed and address is correct
- Check backend console for event listener logs

## Development Scripts

### Root
```bash
npm run dev           # Start all services
npm run build         # Build all packages
npm test              # Run all tests
npm run lint          # Lint all packages
```

### Contracts
```bash
npm run compile       # Compile contracts
npm test              # Run tests
npm run node          # Start local node
npm run deploy:*      # Deploy to network
```

### Backend
```bash
npm start             # Production start
npm run dev           # Development with nodemon
npm test              # Run tests
```

### Frontend
```bash
npm run dev           # Development server
npm run build         # Production build
npm run preview       # Preview production build
```

## Network Information

### Supported Networks

| Network | Chain ID | Type | Faucet |
|---------|----------|------|--------|
| Localhost | 31337 | Local | N/A |
| Sepolia | 11155111 | Testnet | [sepoliafaucet.com](https://sepoliafaucet.com) |
| Polygon Mumbai | 80001 | Testnet | [faucet.polygon.technology](https://faucet.polygon.technology) |
| Arbitrum Goerli | 421613 | Testnet | [bridge.arbitrum.io](https://bridge.arbitrum.io) |
| Optimism Sepolia | 11155420 | Testnet | [optimism.io/faucet](https://optimism.io/faucet) |

## Contract Addresses

After deployment, addresses are saved in:
```
contracts/deployments/deployment-{chainId}.json
```

## API Endpoints

Base URL: `http://localhost:5000/api`

### Health
- `GET /health` - Health check and network status

### Todos
- `GET /todos/:address` - Get todos for address
- `GET /todos/:address/stats` - Get user statistics
- `GET /todos/todo/:id` - Get specific todo
- `GET /todos/verify/:id` - Verify todo against blockchain
- `POST /todos/sync` - Manual sync from blockchain

## Security Notes

- Never commit `.env` files
- Never share private keys
- Use testnet only for development
- Audit contracts before mainnet deployment
- Implement rate limiting for production
- Use environment-specific API keys

## Support

For issues or questions:
1. Check this guide
2. Review console logs
3. Check contract tests pass
4. Verify environment variables
5. Check network connectivity

## License

MIT
