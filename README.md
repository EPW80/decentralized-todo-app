# Decentralized Todo App

A full-stack decentralized todo application combining blockchain technology with traditional web architecture. This project demonstrates the integration of smart contracts with a modern web application stack.

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
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Ethers.js** - Web3 interaction
- **React Router** - Routing
- **Axios** - HTTP client
- **Material-UI / TailwindCSS** - UI components

## Features

### Blockchain Features
- Create todos on-chain
- Mark todos as complete/incomplete
- Delete todos
- Todo ownership verification
- Event emission for todo actions

### Backend Features
- User registration and authentication
- RESTful API for todo operations
- Off-chain data storage for scalability
- Sync with blockchain events
- User profile management

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
   npm run dev:contracts
   ```

2. **Deploy smart contracts**
   ```bash
   npm run deploy:contracts
   ```

3. **Start backend server**
   ```bash
   npm run dev:backend
   ```

4. **Start frontend application**
   ```bash
   npm run dev:frontend
   ```

Or run backend and frontend together:
```bash
npm run dev
```

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

The `TodoList.sol` contract provides:
- Todo struct with id, content, completed status, and owner
- Mapping of user addresses to their todos
- Functions: createTodo, toggleComplete, deleteTodo
- Events: TodoCreated, TodoCompleted, TodoDeleted
- Owner-only modifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Todos
- `GET /api/todos` - Get all user todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

## Configuration

### Contracts Configuration
See `contracts/README.md` for deployment networks and contract addresses.

### Backend Configuration
See `backend/README.md` for environment variables and database setup.

### Frontend Configuration
See `frontend/README.md` for build configuration and deployment.

## Security Considerations

- Smart contracts use OpenZeppelin's security patterns
- JWT tokens for API authentication
- Owner-only todo modifications on-chain
- Input validation on all layers
- CORS configuration
- Environment variable protection

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

- [ ] Multi-chain support (Polygon, BSC)
- [ ] IPFS integration for decentralized storage
- [ ] Task sharing and collaboration features
- [ ] Advanced filtering and search
- [ ] Mobile application (React Native)
- [ ] Todo categories and tags
- [ ] Recurring tasks
- [ ] Token rewards for task completion

## Support

For questions and support, please open an issue in the GitHub repository.
