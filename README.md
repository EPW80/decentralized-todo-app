# Decentralized Todo App

A full-stack decentralized todo application combining blockchain technology with traditional web architecture. This project demonstrates the integration of smart contracts with a modern web application stack.

## Quick Start

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd decentralized-todo-app
npm install --workspaces

# 2. Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
# IMPORTANT: Ensure MONGODB_URI includes database name

# 3. Start Hardhat node (terminal 1)
cd contracts
npx hardhat node

# 4. Deploy contracts (terminal 2)
cd contracts
npx hardhat run scripts/deploy.js --network localhost

# 5. Start backend (terminal 3)
cd backend
npm start

# 6. Start frontend (terminal 4)
cd frontend
npm run dev
```

Open http://localhost:5173 and connect your MetaMask wallet!

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  - React + TypeScript                                        │
│  - Ethers.js for Web3 interaction                           │
│  - Material-UI/TailwindCSS for styling                      │
│  - State management (Context API/Redux)                     │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ REST API                   │ Web3 RPC
             │                            │
┌────────────▼────────────────┐  ┌────────▼──────────────────┐
│   Backend (Express + MongoDB)│  │  Blockchain (Ethereum)    │
│  - Node.js + Express         │  │  - Hardhat                │
│  - MongoDB for off-chain data│  │  - Solidity Smart Contract│
│  - User authentication       │  │  - On-chain todo storage  │
│  - API endpoints             │  │  - Event emission         │
└──────────────────────────────┘  └───────────────────────────┘
```

## Project Structure

```
decentralized-todo-app/
├── contracts/              # Smart contract development
│   ├── contracts/          # Solidity smart contracts
│   ├── scripts/            # Deployment scripts
│   ├── test/              # Contract tests
│   └── hardhat.config.js  # Hardhat configuration
│
├── backend/               # Express server
│   ├── src/
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Custom middleware
│   │   └── utils/         # Helper functions
│   └── server.js          # Entry point
│
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # Context providers
│   │   ├── services/      # API & Web3 services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
│
├── .gitignore
├── package.json           # Monorepo configuration
└── README.md
```

## Technology Stack

### Smart Contracts
- **Solidity** - Smart contract programming language
- **Hardhat** - Ethereum development environment
- **OpenZeppelin** - Secure smart contract library
- **Ethers.js** - Ethereum library for contract interaction

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database (local or MongoDB Atlas)
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication with wallet signatures (EIP-191)
- **Winston** - Structured logging with daily rotation
- **Jest** - Testing framework with coverage reporting

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Ethers.js** - Web3 interaction
- **React Router** - Routing
- **Axios** - HTTP client
- **Material-UI / TailwindCSS** - UI components

## Features

### Blockchain Features
- Create todos on-chain with TodoListV2 contract
- Mark todos as complete/incomplete
- Soft delete todos (with restore capability)
- Todo ownership verification
- Event emission for todo actions
- Circuit breaker pattern for emergency pause
- Access control with OpenZeppelin
- Comprehensive security features

### Backend Features
- Wallet signature authentication (EIP-191)
- RESTful API for todo operations
- Off-chain MongoDB caching for scalability
- Real-time blockchain event synchronization
- Multi-chain support (Ethereum Sepolia, localhost)
- Structured logging with Winston
- Manual event sync for missed transactions
- Todo verification against blockchain
- Test coverage with Jest

### Frontend Features
- Wallet connection (MetaMask)
- Create, read, update, delete todos
- Filter todos by status
- Responsive design
- Real-time blockchain updates

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)
- MetaMask browser extension

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/decentralized-todo-app.git
   cd decentralized-todo-app
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup environment variables**

   Create `.env` files in each workspace:
   - `contracts/.env` - Blockchain configuration
   - `backend/.env` - Server and database configuration
   - `frontend/.env` - API and contract addresses

### Development

1. **Start local Hardhat node**
   ```bash
   cd contracts
   npx hardhat node
   ```

2. **Deploy smart contracts** (in a new terminal)
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Start backend server**
   ```bash
   cd backend
   npm start
   ```

4. **Start frontend application**
   ```bash
   cd frontend
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Hardhat node: http://127.0.0.1:8545

### Testing

```bash
# Test all workspaces
npm test

# Test specific workspace
npm run test:contracts
npm run test:backend
npm run test:frontend
```

### Building for Production

```bash
npm run build
```

## Smart Contract Architecture

The **TodoListV2** contract (upgradeable) provides:

**Core Features:**
- Task struct: id, description, completed, deleted, timestamps, owner
- Per-user task management with mapping
- Soft delete with restore functionality
- Comprehensive event emission

**Functions:**
- `addTask(description)` - Create new todo
- `completeTask(taskId)` - Mark as complete
- `deleteTask(taskId)` - Soft delete (restorable)
- `restoreTask(taskId)` - Restore deleted task
- `getTask(taskId)` - Retrieve task details
- `getTasksByUser(user)` - Get all user tasks

**Security Features:**
- OpenZeppelin Pausable (circuit breaker)
- ReentrancyGuard for protection
- Ownable for access control
- Owner-only modifications enforced
- Input validation

**Events:**
- `TaskAdded` - New task created
- `TaskCompleted` - Task marked complete
- `TaskDeleted` - Task soft deleted
- `TaskRestored` - Deleted task restored

**Deployments:**
- Localhost (Hardhat): 0x5FbDB2315678afecb367f032d93F642f64180aa3
- Ethereum Sepolia: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

## API Endpoints

### Authentication
- `GET /api/auth/nonce/:address` - Get nonce for wallet signature
- `POST /api/auth/login` - Authenticate with wallet signature

### Health & Status
- `GET /api/health` - Server and blockchain status

### Todos
- `GET /api/todos/:address` - Get all todos for address
  - Query params: `includeCompleted`, `includeDeleted`
- `GET /api/todos/:address/stats` - Get user statistics
- `GET /api/todos/todo/:id` - Get specific todo
- `GET /api/todos/verify/:id` - Verify todo against blockchain
- `POST /api/todos/sync` - Manually sync todo from blockchain
- `POST /api/todos/restore` - Restore deleted todo

For detailed API documentation, see [backend/README.md](backend/README.md).

## Configuration

### Contracts Configuration
See `contracts/README.md` for deployment networks and contract addresses.

### Backend Configuration
See `backend/README.md` for environment variables and database setup.

**Important MongoDB Setup:**
Your MongoDB URI must include the database name:
```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/decentralized-todo

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/decentralized-todo
```

Without the database name, MongoDB defaults to the 'test' database, causing data visibility issues.

### Frontend Configuration
See `frontend/README.md` for build configuration and deployment.

## Important Notes

### Event Synchronization
The backend listens for blockchain events in real-time. However:

1. **Event Recovery Limitations:**
   - `EVENT_RECOVERY_DAYS=0` (recommended for free tier RPC)
   - Alchemy free tier limits eth_getLogs to 10 block range
   - Backend only captures events while running

2. **Missed Events:**
   - If backend is offline during a transaction, use the manual sync script
   - Location: `backend/src/scripts/syncSpecificBlock.js`
   - Configure chainId, fromBlock, and toBlock for your transaction

3. **Best Practices:**
   - Keep backend running continuously for production
   - Use paid RPC tier for event recovery
   - Monitor backend health with `/api/health` endpoint

### Logging
- All logs are in JSON format with timestamps
- Location: `backend/logs/`
- Sensitive data (passwords, keys) is automatically redacted
- Each request gets a unique correlation ID for tracing

### Testing
- Backend has Jest test suite with 70% coverage target
- Run tests before deployment: `npm test`
- See `backend/TESTING.md` for details

## Security Considerations

### Smart Contract Security
- OpenZeppelin Pausable (circuit breaker pattern)
- ReentrancyGuard for reentrancy protection
- Ownable for access control
- Owner-only todo modifications enforced
- Input validation (non-empty descriptions)
- Comprehensive security testing

### Backend Security
- Wallet signature authentication (EIP-191 standard)
- JWT tokens for optional session management
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS configuration
- Input validation with express-validator
- Sensitive data redaction in logs
- Environment variable protection

### Best Practices
- Never commit `.env` files
- Use strong JWT secrets (32+ characters)
- Keep RPC URLs private
- Regularly update dependencies
- Monitor logs for suspicious activity
- Test on testnet before mainnet deployment

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat for excellent development tools
- The Ethereum community

## Roadmap

### Completed ✅
- [x] TodoListV2 with security features
- [x] Soft delete with restore functionality
- [x] Wallet signature authentication
- [x] Structured logging with Winston
- [x] Test infrastructure with Jest
- [x] Multi-chain support (Sepolia, localhost)
- [x] Event synchronization with blockchain

### In Progress 🚧
- [ ] Increase test coverage to 70%
- [ ] Data visualization dashboard
- [ ] Transaction analytics

### Planned 📋
- [ ] Additional chain support (Polygon, Arbitrum, Optimism)
- [ ] IPFS integration for decentralized storage
- [ ] Task sharing and collaboration features
- [ ] Advanced filtering and search
- [ ] Mobile application (React Native)
- [ ] Todo categories and tags
- [ ] Recurring tasks
- [ ] Token rewards for task completion
- [ ] Monitoring with Prometheus/Grafana
- [ ] Error tracking with Sentry

## Documentation

- **[Backend API Documentation](backend/README.md)** - Comprehensive backend guide
  - API endpoints and responses
  - Environment configuration
  - Logging system
  - Testing guide
  - Troubleshooting

- **[Backend Testing Guide](backend/TESTING.md)** - Testing infrastructure
  - Test coverage details
  - Running tests
  - Writing new tests

- **[Phase 3 Progress](PHASE3_PROGRESS.md)** - Implementation progress
  - Logging implementation
  - Test coverage status
  - Completed features

- **[Security Implementation](SECURITY_IMPLEMENTATION.md)** - Security features
  - TodoListV2 security features
  - Authentication system
  - Best practices

- **[Deployment Guide](DEPLOYMENT_COMPLETE.md)** - Deployment information
  - Contract deployments
  - Network configurations

## Support

For questions and support, please open an issue in the GitHub repository.
