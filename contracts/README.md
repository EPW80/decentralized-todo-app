# Smart Contracts

This directory contains the Solidity smart contracts for the Decentralized Todo App.

## Structure

```
contracts/
├── contracts/          # Solidity smart contracts
├── scripts/           # Deployment and interaction scripts
├── test/             # Contract tests
├── hardhat.config.js # Hardhat configuration
└── package.json      # Dependencies
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

## Development

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm test
```

### Start Local Node
```bash
npm run node
```

### Deploy Contracts

**Local deployment:**
```bash
npm run deploy:localhost
```

**Sepolia testnet:**
```bash
npm run deploy:sepolia
```

**Mainnet:**
```bash
npm run deploy:mainnet
```

## Smart Contract Overview

### TodoList.sol

The main smart contract managing todo items on-chain.

**Features:**
- Create todos
- Toggle todo completion status
- Delete todos
- Todo ownership verification
- Event emissions for all actions

**Data Structure:**
```solidity
struct Todo {
    uint256 id;
    string content;
    bool completed;
    address owner;
    uint256 timestamp;
}
```

**Functions:**
- `createTodo(string memory _content)` - Create a new todo
- `toggleTodo(uint256 _id)` - Toggle completion status
- `deleteTodo(uint256 _id)` - Delete a todo
- `getTodo(uint256 _id)` - Get todo details
- `getUserTodos()` - Get all todos for current user

**Events:**
- `TodoCreated(uint256 id, address owner, string content)`
- `TodoToggled(uint256 id, bool completed)`
- `TodoDeleted(uint256 id)`

## Testing

Tests are written using Hardhat's testing framework with Chai assertions.

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage
```

## Deployment

Deployment scripts are located in the `scripts/` directory.

After deployment, contract addresses will be saved to `deployments.json`.

## Network Configuration

Configured networks:
- **Hardhat** - Local development network (chainId: 31337)
- **Localhost** - Hardhat node (chainId: 31337)
- **Sepolia** - Ethereum testnet (chainId: 11155111)
- **Mainnet** - Ethereum mainnet (chainId: 1)

## Security

- Contracts use OpenZeppelin libraries for security
- Owner-only modifications enforced
- Input validation on all functions
- Reentrancy protection where applicable

## Gas Optimization

- Optimizer enabled with 200 runs
- Efficient data structures
- Minimal storage operations

## Verification

To verify contracts on Etherscan:
```bash
npm run verify -- --network sepolia <CONTRACT_ADDRESS>
```

## License

MIT
