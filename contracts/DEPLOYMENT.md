# TodoListV2 Deployment Guide

Complete guide for deploying and upgrading the TodoListV2 upgradeable smart contract with UUPS proxy pattern.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Architecture Overview](#architecture-overview)
- [Initial Deployment](#initial-deployment)
- [Upgrading the Contract](#upgrading-the-contract)
- [Role Management](#role-management)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- Node.js v18 or higher
- Hardhat installed
- Private key with sufficient ETH for deployment
- Network RPC URL (for testnets/mainnet)
- Block explorer API key (for verification)

## Installation

1. **Install dependencies:**

```bash
cd contracts
npm install
```

This will install:
- `@openzeppelin/contracts-upgradeable` - Upgradeable contract implementations
- `@openzeppelin/hardhat-upgrades` - Hardhat plugin for deploying upgradeable contracts

2. **Configure environment variables:**

Create `.env` file in the `contracts/` directory:

```env
# Private key for deployment (DO NOT COMMIT)
PRIVATE_KEY=your_private_key_here

# Network RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Block explorer API keys (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

3. **Update Hardhat config:**

Ensure `hardhat.config.js` imports the upgrades plugin:

```javascript
require("@openzeppelin/hardhat-upgrades");
```

## Architecture Overview

### UUPS Proxy Pattern

TodoListV2 uses the **Universal Upgradeable Proxy Standard (UUPS)** pattern:

```
┌─────────────────┐
│  Proxy Contract │  ← Users interact here (static address)
│  (ERC1967Proxy) │
└────────┬────────┘
         │ delegatecall
         ▼
┌─────────────────┐
│ Implementation  │  ← Logic can be upgraded
│  (TodoListV2)   │
└─────────────────┘
```

**Benefits:**
- Upgradeable logic without changing proxy address
- Lower gas costs than Transparent Proxy
- More decentralized (upgrade logic in implementation)

**Security:**
- Only accounts with `UPGRADER_ROLE` can upgrade
- Storage layout must be preserved across upgrades
- No constructor (uses `initialize()` function)

### Role-Based Access Control

TodoListV2 implements 4 distinct roles:

| Role | Permissions | Default Holder |
|------|-------------|----------------|
| `DEFAULT_ADMIN_ROLE` | Grant/revoke all roles | Deployer |
| `ADMIN_ROLE` | Pause, circuit breaker, config | Deployer |
| `MODERATOR_ROLE` | Future moderation features | Deployer |
| `UPGRADER_ROLE` | Upgrade contract | Deployer |

## Initial Deployment

### Step 1: Compile Contracts

```bash
npm run compile
```

Verify compilation succeeds without warnings.

### Step 2: Deploy to Local Network (Testing)

Start a local Hardhat node:

```bash
# Terminal 1
npm run node
```

Deploy the proxy:

```bash
# Terminal 2
npm run deploy:proxy:localhost
```

**Expected output:**
```
🚀 Starting TodoListV2 UUPS Proxy Deployment...
📝 Deploying contracts with account: 0xf39Fd...
✅ TodoListV2 Proxy deployed to: 0x9fE46...
✅ Implementation contract deployed to: 0xe7f1...
✅ ProxyAdmin deployed to: 0xDc64...
🎉 DEPLOYMENT SUCCESSFUL!
```

### Step 3: Deploy to Testnet (Sepolia)

```bash
npm run deploy:proxy:sepolia
```

**Important:** Save the proxy address from the deployment output!

### Step 4: Verify Contracts

Verify the proxy and implementation on Etherscan:

```bash
npx hardhat verify --network sepolia <PROXY_ADDRESS>
npx hardhat verify --network sepolia <IMPLEMENTATION_ADDRESS>
```

### Deployment Files

After deployment, check the `deployments/` directory:

```
contracts/deployments/
├── TodoListV2-sepolia.json       # Network-specific deployment
├── TodoListV2-sepolia-upgrades.json  # Upgrade history
└── latest.json                   # Latest deployment (any network)
```

**Example deployment file:**
```json
{
  "network": "sepolia",
  "chainId": "11155111",
  "proxy": "0x9fE46...",
  "implementation": "0xe7f1...",
  "proxyAdmin": "0xDc64...",
  "deployer": "0xf39Fd...",
  "timestamp": "2025-11-17T10:30:00.000Z",
  "version": "2.0.0"
}
```

## Upgrading the Contract

### When to Upgrade

Consider upgrading when:
- Adding new features
- Fixing bugs in logic
- Optimizing gas usage
- Enhancing security

### Pre-Upgrade Checklist

- [ ] New contract code is thoroughly tested
- [ ] Storage layout is compatible (no removed/reordered variables)
- [ ] Upgrade script is tested on local network
- [ ] Upgrader account has `UPGRADER_ROLE`
- [ ] Backup of current state taken
- [ ] Users notified of upcoming upgrade

### Step 1: Create New Implementation

Example: Create `TodoListV3.sol` with new features:

```solidity
contract TodoListV3 is TodoListV2 {
    // NEW: Storage variables must be added at the end
    mapping(uint256 => string[]) private taskTags;
    
    // NEW: Additional functionality
    function addTag(uint256 _taskId, string memory _tag) external {
        // Implementation
    }
    
    // Updated version
    function version() external pure override returns (string memory) {
        return "3.0.0";
    }
}
```

### Step 2: Test Upgrade Locally

```bash
# Terminal 1: Run local node
npm run node

# Terminal 2: Deploy initial proxy
npm run deploy:proxy:localhost

# Terminal 2: Upgrade to V3
npm run upgrade:proxy:localhost
```

### Step 3: Execute Upgrade on Testnet

```bash
npm run upgrade:proxy:sepolia
```

**Expected output:**
```
🔄 Starting TodoListV2 Upgrade Process...
📍 Current Proxy Address: 0x9fE46...
📍 Current Implementation: 0xe7f1...
✅ New Implementation Address: 0x5FbD...
🎉 UPGRADE SUCCESSFUL!
```

### Step 4: Verify Upgrade

Check that:
1. Proxy address remains the same
2. Implementation address changed
3. Version number updated
4. Existing data preserved (task count, roles, etc.)

```bash
# Using Hardhat console
npx hardhat console --network sepolia

const TodoListV3 = await ethers.getContractFactory("TodoListV3");
const todo = TodoListV3.attach("PROXY_ADDRESS");
await todo.version(); // Should return "3.0.0"
await todo.getTotalTaskCount(); // Should preserve old count
```

## Role Management

### Granting Roles

**Option 1: Using Hardhat console**

```javascript
const todo = await ethers.getContractAt("TodoListV2", "PROXY_ADDRESS");
const UPGRADER_ROLE = await todo.UPGRADER_ROLE();
await todo.grantRoleWithEvent(UPGRADER_ROLE, "NEW_UPGRADER_ADDRESS");
```

**Option 2: Using script**

Create `scripts/grant-role.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const proxyAddress = "YOUR_PROXY_ADDRESS";
  const newUpgrader = "NEW_UPGRADER_ADDRESS";
  
  const TodoListV2 = await ethers.getContractFactory("TodoListV2");
  const todo = TodoListV2.attach(proxyAddress);
  
  const UPGRADER_ROLE = await todo.UPGRADER_ROLE();
  const tx = await todo.grantRoleWithEvent(UPGRADER_ROLE, newUpgrader);
  await tx.wait();
  
  console.log("✅ UPGRADER_ROLE granted to:", newUpgrader);
}

main();
```

### Revoking Roles

```javascript
const UPGRADER_ROLE = await todo.UPGRADER_ROLE();
await todo.revokeRoleWithEvent(UPGRADER_ROLE, "ADDRESS_TO_REVOKE");
```

### Best Practice: Use Multi-Sig

For production, transfer admin roles to a multi-sig wallet (e.g., Gnosis Safe):

```javascript
const ADMIN_ROLE = await todo.ADMIN_ROLE();
const UPGRADER_ROLE = await todo.UPGRADER_ROLE();
const multiSigAddress = "GNOSIS_SAFE_ADDRESS";

// Grant roles to multi-sig
await todo.grantRoleWithEvent(ADMIN_ROLE, multiSigAddress);
await todo.grantRoleWithEvent(UPGRADER_ROLE, multiSigAddress);

// Revoke from deployer (after confirming multi-sig works)
await todo.revokeRoleWithEvent(ADMIN_ROLE, deployerAddress);
await todo.revokeRoleWithEvent(UPGRADER_ROLE, deployerAddress);
```

## Security Considerations

### Pre-Deployment Security

1. **Smart Contract Audit**
   - Engage professional auditors (OpenZeppelin, Trail of Bits, Consensys)
   - Budget: $10k-$50k+ depending on complexity
   - Timeline: 2-4 weeks

2. **Formal Verification**
   - Use tools like Certora, Manticore, or Mythril
   - Prove critical invariants hold

3. **Testing Coverage**
   ```bash
   npm run coverage
   ```
   - Aim for >95% line coverage
   - Test all edge cases and attack vectors

### Deployment Security

1. **Testnet First**
   - Deploy to Sepolia/Goerli
   - Run for 1-2 weeks
   - Test all functionality with real users

2. **Gradual Rollout**
   - Start paused or with circuit breaker active
   - Whitelist initial users
   - Gradually increase limits

3. **Monitoring**
   - Set up alerts for admin functions
   - Monitor circuit breaker events
   - Track unusual patterns (DOS attempts)

### Post-Deployment Security

1. **Bug Bounty Program**
   - Launch on Immunefi or Code4rena
   - Offer meaningful rewards ($10k+)
   - Define clear scope and rules

2. **Incident Response Plan**
   - Document pause procedures
   - Emergency contact list
   - Communication templates

3. **Upgrade Safeguards**
   - Use timelock for upgrades (24-48 hours)
   - Require multi-sig approval
   - Test upgrades on fork first

### Circuit Breaker Usage

Activate circuit breaker in emergencies:

```javascript
// Emergency stop
await todo.activateCircuitBreaker();

// Investigate and fix issue
// ...

// Resume operations
await todo.deactivateCircuitBreaker();
```

**When to use:**
- Critical vulnerability discovered
- Unusual activity detected
- Major blockchain issue (consensus bug, reorg)

### Storage Layout Safety

**CRITICAL:** Never break storage layout in upgrades!

❌ **DON'T:**
```solidity
// V1
uint256 public foo;
uint256 public bar;

// V2 - WRONG! Removed variable
uint256 public bar;
```

✅ **DO:**
```solidity
// V1
uint256 public foo;
uint256 public bar;

// V2 - Correct! Added at end
uint256 public foo;
uint256 public bar;
uint256 public baz;  // New variable
```

Use OpenZeppelin's storage gap pattern:

```solidity
contract TodoListV2 {
    // ... existing storage
    
    // Reserve space for future versions
    uint256[50] private __gap;
}
```

## Troubleshooting

### Common Issues

#### 1. "Implementation contract was already initialized"

**Cause:** Attempting to initialize an already initialized proxy.

**Solution:** Don't call `initialize()` manually; the deployment script handles it.

#### 2. "ERC1967: new implementation is not UUPS"

**Cause:** New contract doesn't inherit `UUPSUpgradeable`.

**Solution:** Ensure new contract extends the upgradeable contract:
```solidity
contract TodoListV3 is TodoListV2 { ... }
```

#### 3. "Upgrade validation failed"

**Cause:** Storage layout incompatibility.

**Solution:** Run validation manually:
```bash
npx hardhat run scripts/validate-upgrade.js
```

#### 4. "Not authorized"

**Cause:** Signer doesn't have `UPGRADER_ROLE`.

**Solution:** Grant role or use correct account:
```javascript
const hasRole = await todo.hasRole(UPGRADER_ROLE, signerAddress);
console.log("Has UPGRADER_ROLE:", hasRole);
```

#### 5. Gas estimation failed

**Cause:** Transaction would revert (e.g., paused contract, circuit breaker active).

**Solution:** Check contract status:
```javascript
const status = await todo.getContractStatus();
console.log("Paused:", status.isPaused);
console.log("Circuit Breaker:", status.isCircuitBreakerActive);
```

### Getting Help

- **OpenZeppelin Forum:** https://forum.openzeppelin.com/
- **Hardhat Discord:** https://hardhat.org/discord
- **Ethereum StackExchange:** https://ethereum.stackexchange.com/

---

## Quick Command Reference

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy proxy (local)
npm run deploy:proxy:localhost

# Deploy proxy (testnet)
npm run deploy:proxy:sepolia

# Upgrade proxy (local)
npm run upgrade:proxy:localhost

# Upgrade proxy (testnet)
npm run upgrade:proxy:sepolia

# Run local node
npm run node

# Coverage report
npm run coverage

# Verify on Etherscan
npx hardhat verify --network sepolia <ADDRESS>
```

---

## Additional Resources

- [OpenZeppelin Upgrades Plugins](https://docs.openzeppelin.com/upgrades-plugins/)
- [UUPS Proxy Pattern](https://eips.ethereum.org/EIPS/eip-1822)
- [Writing Upgradeable Contracts](https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable)
- [Access Control Guide](https://docs.openzeppelin.com/contracts/access-control)

---

**Last Updated:** November 17, 2025  
**Contract Version:** 2.0.0  
**Author:** TodoList Development Team
