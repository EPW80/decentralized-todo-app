# Decentralized Todo App

[![CI](https://github.com/EPW80/decentralized-todo-app/actions/workflows/ci.yml/badge.svg)](https://github.com/EPW80/decentralized-todo-app/actions/workflows/ci.yml)
[![CodeQL](https://github.com/EPW80/decentralized-todo-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/EPW80/decentralized-todo-app/actions/workflows/codeql.yml)

A full-stack decentralized todo application that stores tasks on-chain via an upgradeable Solidity smart contract, syncs them to a MongoDB cache through real-time event listeners, and serves them through a React/TypeScript frontend with MetaMask wallet authentication.

**Live deployment:** Frontend on [Vercel](https://vercel.com) | Backend on [Railway](https://backend-production-e1e2.up.railway.app/api/health) | Smart contract on [Sepolia](https://sepolia.etherscan.io/address/0x0F4228B43aa4b9A8F05AD058a9508039A7B8ee4d)

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/EPW80/decentralized-todo-app.git
cd decentralized-todo-app
npm install

# 2. Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and RPC URLs

# 3. Start Hardhat node (terminal 1)
cd contracts && npx hardhat node

# 4. Deploy contracts (terminal 2)
cd contracts && npx hardhat run scripts/deploy.js --network localhost

# 5. Start backend (terminal 3)
cd backend && npm start

# 6. Start frontend (terminal 4)
cd frontend && npm run dev
```

Or use the helper scripts:

```bash
./start-dev.sh   # Start all services
./stop-dev.sh    # Stop all services
```

Open http://localhost:5173 and connect your MetaMask wallet.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Frontend (React + TypeScript)               │
│  Vite · Ethers.js v6 · TailwindCSS · React Router v7        │
│  Code-split routes · Dark mode · Responsive                  │
└───────────┬──────────────────────────────────┬───────────────┘
            │ REST API (JWT)                   │ JSON-RPC
            │                                  │
┌───────────▼──────────────────┐   ┌───────────▼───────────────┐
│  Backend (Express + MongoDB) │   │  Blockchain (EVM)         │
│  TypeScript · Winston logger │   │  Solidity 0.8.22          │
│  EIP-191 wallet auth         │   │  UUPS upgradeable proxy   │
│  Real-time event sync        │   │  OpenZeppelin 5.0.1       │
│  RPC failover · Rate limit   │   │  Multi-chain configured   │
└──────────────────────────────┘   └───────────────────────────┘
```

## Project Structure

```
decentralized-todo-app/
├── contracts/                # Hardhat project
│   ├── contracts/            #   TodoListV2.sol (UUPS upgradeable)
│   ├── test/                 #   5 test suites (unit, access, fuzz, edge, upgrade)
│   ├── scripts/              #   Deployment & upgrade scripts
│   └── deployments/          #   Per-network deployment JSONs
├── backend/                  # Express API server
│   ├── src/
│   │   ├── controllers/      #   Request handlers
│   │   ├── middleware/       #   Auth, validation, error handling
│   │   ├── models/           #   MongoDB schemas (Mongoose)
│   │   ├── routes/           #   REST endpoints
│   │   ├── services/         #   blockchainService.ts (event sync, RPC failover)
│   │   └── utils/            #   Logger, helpers
│   └── test/                 #   Jest test suites
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       #   TodoList, AddTodoForm, WalletConnect, etc.
│   │   ├── contexts/         #   Web3Context, ThemeContext
│   │   ├── services/         #   API client, blockchain service
│   │   └── types/            #   TypeScript interfaces
├── .github/workflows/        # CI, Deploy, CodeQL, Dependency Check
├── package.json              # npm workspaces root
└── README.md
```

## Technology Stack

| Layer               | Technologies                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------- |
| **Smart Contracts** | Solidity 0.8.22, Hardhat, OpenZeppelin 5.0.1 (UUPS, AccessControl, Pausable, ReentrancyGuard) |
| **Backend**         | Node.js, Express, TypeScript, MongoDB/Mongoose, JWT, Winston, Jest, IPFS/Pinata               |
| **Frontend**        | React 19, TypeScript, Vite, Ethers.js v6, TailwindCSS, React Router v7, Vitest, Pinata SDK    |
| **DevOps**          | GitHub Actions (4 workflows), Vercel, Railway, npm workspaces                                 |

## Features

### Smart Contract (TodoListV2)

- UUPS upgradeable proxy pattern for zero-downtime upgrades
- Role-based access control (ADMIN, MODERATOR, UPGRADER)
- Circuit breaker (Pausable) for emergency stops
- Reentrancy protection on all state-changing functions
- Per-user rate limiting
- Soft delete with restore capability
- Due date support on tasks
- Event emission for all operations (`TaskCreated`, `TaskCompleted`, `TaskDeleted`, `TaskRestored`)

### Backend

- Wallet signature authentication (EIP-191 standard)
- JWT session tokens (7-day expiry)
- Real-time blockchain event synchronization
- Blockchain resync endpoint for missed events
- Multi-chain RPC failover with health monitoring
- IPFS CID resolution with multi-gateway fallback (Pinata, ipfs.io, dweb.link)
- Structured JSON logging with daily rotation (Winston)
- Rate limiting (100 req/15 min)
- Security headers (Helmet.js), CORS, input validation
- Off-chain MongoDB cache for fast reads (with IPFS CID indexing)

### Frontend

- MetaMask wallet connect with install detection
- Create, complete, delete, and restore todos
- IPFS-powered task descriptions — uploads to Pinata before writing CID on-chain (~79% gas savings)
- Two-phase creation UX (storing to IPFS → confirming on-chain)
- Resync button to recover missed on-chain tasks
- Filter by status (all/active/completed) with pagination
- Analytics dashboard with completion stats
- Dark mode, responsive design, glass-effect UI
- Code-split routes with lazy loading
- Network-aware theme colors per chain

## Deployments

| Network     | Chain ID | Contract Address                                                                                                                |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Sepolia** | 11155111 | [`0x0F4228B43aa4b9A8F05AD058a9508039A7B8ee4d`](https://sepolia.etherscan.io/address/0x0F4228B43aa4b9A8F05AD058a9508039A7B8ee4d) |
| Localhost   | 31337    | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`                                                                                    |

**Configured but not yet deployed:** Polygon Amoy (80002), Arbitrum Sepolia (421614), Optimism Sepolia (11155420)

**Infrastructure:**

- Frontend: Vercel (auto-deploy on push to main)
- Backend: Railway (`https://backend-production-e1e2.up.railway.app`)
- Database: MongoDB Atlas
- IPFS: Pinata (pinning and dedicated gateway)

## API Endpoints

### Authentication

| Method | Endpoint                   | Description                         |
| ------ | -------------------------- | ----------------------------------- |
| GET    | `/api/auth/nonce/:address` | Get nonce for wallet signature      |
| POST   | `/api/auth/login`          | Authenticate with EIP-191 signature |

### Todos (JWT required)

| Method | Endpoint                    | Description                                                                             |
| ------ | --------------------------- | --------------------------------------------------------------------------------------- |
| GET    | `/api/todos/:address`       | List todos (query: `includeCompleted`, `includeDeleted`, `search`, `dueFilter`, `sort`) |
| GET    | `/api/todos/:address/stats` | User statistics (total, active, completed, rate)                                        |
| GET    | `/api/todos/todo/:id`       | Get single todo                                                                         |
| GET    | `/api/todos/verify/:id`     | Verify todo against blockchain                                                          |
| POST   | `/api/todos/sync`           | Manually sync a task from blockchain                                                    |
| POST   | `/api/todos/restore`        | Restore a soft-deleted todo                                                             |

### Health

| Method | Endpoint      | Description                             |
| ------ | ------------- | --------------------------------------- |
| GET    | `/api/health` | Server, database, and blockchain status |

## Testing

```bash
# Run all tests
npm test

# Individual workspaces
cd contracts && npx hardhat test          # 195+ tests (unit, access, fuzz, edge, upgrade)
cd backend && npm test                     # Jest with coverage
cd frontend && npm test                    # Vitest + React Testing Library
```

### Contract Test Coverage

| Suite                              | Tests          | Focus                                                        |
| ---------------------------------- | -------------- | ------------------------------------------------------------ |
| `TodoListV2.test.js`               | Core CRUD      | Task creation, completion, deletion, restore, events         |
| `TodoListV2.accessControl.test.js` | RBAC           | Role grant/revoke, permission enforcement, circuit breaker   |
| `TodoListV2.upgrade.test.js`       | Upgradeability | UUPS proxy upgrade, state preservation, authorization        |
| `TodoListV2.edgeCases.test.js`     | Boundaries     | Overflow, max values, zero-address, gas limits               |
| `TodoListV2.fuzz.test.js`          | Security       | Random inputs, special chars, XSS/SQL injection, concurrency |

## CI/CD Pipeline

Four GitHub Actions workflows run automatically:

1. **CI** (every push/PR) — Lint, test contracts, test backend, test frontend, build all workspaces
2. **Deploy** (manual trigger) — Configurable environment (staging/production) and network (localhost/sepolia/mainnet)
3. **CodeQL** (push/PR + weekly) — Automated security scanning for JS/TS vulnerabilities
4. **Dependency Check** (weekly + PR) — npm audit, outdated package detection

## Configuration

### Environment Variables

**Backend** (`backend/.env`):

```bash
MONGODB_URI=mongodb://localhost:27017/decentralized-todo    # Must include database name
JWT_SECRET=your-secret-here
PORT=5000
CORS_ORIGIN=http://localhost:5173
EVENT_RECOVERY_DAYS=7    # Days of missed events to recover on restart
PINATA_JWT=your-pinata-jwt                                   # For IPFS CID resolution
PINATA_GATEWAY_URL=https://your-gateway.mypinata.cloud       # Dedicated Pinata gateway
```

**Frontend** (`frontend/.env`):

```bash
VITE_API_URL=http://localhost:5000/api
VITE_DEFAULT_CHAIN_ID=31337
VITE_SUPPORTED_CHAIN_IDS=31337,11155111,80002,421614,11155420
VITE_CONTRACT_ADDRESS_31337=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_CONTRACT_ADDRESS_11155111=0x0F4228B43aa4b9A8F05AD058a9508039A7B8ee4d
VITE_PINATA_JWT=your-pinata-jwt                              # For uploading descriptions to IPFS
VITE_PINATA_GATEWAY_URL=https://your-gateway.mypinata.cloud  # For resolving IPFS CIDs
```

## Security

### Smart Contract Security

- OpenZeppelin 5.0.1: AccessControl, Pausable, ReentrancyGuard, UUPSUpgradeable
- Fuzz testing with random inputs including XSS, SQL injection, and path traversal payloads
- Rate limiting per user address

### Backend Security

- EIP-191 wallet signature verification (no passwords)
- JWT with expiration for stateless sessions
- Helmet.js security headers, CORS, rate limiting
- Input validation via express-validator
- Sensitive data redaction in logs

### Frontend Security

- Vercel security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff)
- No private keys in client code; all signing via MetaMask

## IPFS Integration

Task descriptions are stored on IPFS instead of directly on-chain, reducing gas costs by ~79%.

**How it works:**

1. **Create task** — Frontend uploads the description JSON to Pinata, receives a CID
2. **On-chain storage** — The CID (prefixed with `ipfs://`) is stored in the smart contract instead of the full text (~46 bytes vs up to 500 bytes)
3. **Event sync** — Backend event listener detects `ipfs://` prefix, resolves the CID via gateway fallback chain, and caches the plain-text description in MongoDB
4. **Display** — Frontend reads cached descriptions from the API; IPFS resolution is transparent to the user

**Gateway fallback order:** Pinata dedicated gateway → `gateway.pinata.cloud` → `ipfs.io` → `dweb.link`

**Backward compatibility:** Existing tasks with plain-text descriptions continue to work — the `ipfs://` prefix detection ensures only CIDs are resolved.

## Troubleshooting

**Contract compilation errors (OpenZeppelin imports):**

```bash
rm -rf node_modules package-lock.json && npm install
```

**Events not appearing in frontend:**

1. Click the **Resync** button in the task list to pull tasks directly from the blockchain
2. Check backend logs for event listener status
3. Verify `EVENT_RECOVERY_DAYS` is set in backend `.env`

**MetaMask connection issues:**

- Ensure MetaMask is installed and unlocked
- Reset account nonce in MetaMask if transactions fail on localhost
- Verify you're on the correct network (Localhost 8545 or Sepolia)

**MongoDB "data not showing":**

- Ensure your `MONGODB_URI` includes the database name (e.g., `/decentralized-todo`)

## Roadmap

### Completed

- [x] TodoListV2 upgradeable smart contract with RBAC and circuit breaker
- [x] Full-stack Web3 app: React + Express + Solidity
- [x] Sepolia testnet deployment
- [x] Wallet signature authentication (EIP-191)
- [x] Real-time blockchain event sync with resync recovery
- [x] Multi-chain configuration (5 networks)
- [x] CI/CD pipeline (4 GitHub Actions workflows)
- [x] Production deployment (Vercel + Railway + MongoDB Atlas)
- [x] Comprehensive contract tests (195+ tests including fuzz)
- [x] Backend JS to TypeScript migration (index.ts, blockchainService.ts)
- [x] Analytics dashboard
- [x] Dark mode and responsive UI
- [x] IPFS integration for decentralized description storage (Pinata)

### Planned

- [ ] Deploy to additional testnets (Polygon Amoy, Arbitrum Sepolia, Optimism Sepolia)
- [ ] Task sharing and collaboration
- [ ] Token rewards for task completion
- [ ] Mobile app (React Native)

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenZeppelin](https://www.openzeppelin.com/) — Secure smart contract libraries
- [Hardhat](https://hardhat.org/) — Ethereum development environment
- [Alchemy](https://www.alchemy.com/) — RPC infrastructure
- [Pinata](https://www.pinata.cloud/) — IPFS pinning and gateway
