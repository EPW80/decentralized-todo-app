# TodoList V1 to V2 Migration Guide

## Table of Contents
1. [Overview](#overview)
2. [Key Differences](#key-differences)
3. [Breaking Changes](#breaking-changes)
4. [Migration Strategies](#migration-strategies)
5. [Deployment Guide](#deployment-guide)
6. [Frontend Integration Changes](#frontend-integration-changes)
7. [Testing the Migration](#testing-the-migration)
8. [Rollback Procedures](#rollback-procedures)
9. [Security Considerations](#security-considerations)

---

## Overview

TodoListV2 is a major upgrade to the TodoList contract, introducing enterprise-grade security features, upgradeability, and enhanced functionality. This guide will help you migrate from V1 to V2 safely and efficiently.

### Version Information
- **V1**: Basic todo list with simple security features
- **V2**: Enterprise-grade upgradeable contract with advanced security

### Migration Timeline
Estimated time: 2-4 hours (including testing)

---

## Key Differences

### Architecture Changes

| Feature | V1 | V2 |
|---------|----|----|
| **Upgradeability** | Not upgradeable | UUPS upgradeable pattern |
| **Access Control** | Simple Ownable | Role-Based Access Control (RBAC) |
| **Deployment** | Direct deployment | Proxy pattern deployment |
| **Dependencies** | `@openzeppelin/contracts` | `@openzeppelin/contracts-upgradeable` |

### New Features in V2

#### 1. **UUPS Upgradeability**
- Allows contract logic updates without changing address
- Preserves state across upgrades
- Requires UPGRADER_ROLE to perform upgrades

#### 2. **Role-Based Access Control**
```solidity
// V2 Roles
- DEFAULT_ADMIN_ROLE: Root administrator
- ADMIN_ROLE: Contract administration
- MODERATOR_ROLE: Content moderation (future use)
- UPGRADER_ROLE: Contract upgrades
```

#### 3. **Circuit Breaker Pattern**
- Emergency stop mechanism beyond pause
- Additional layer of security
- Requires explicit deactivation

#### 4. **Soft Delete with Restore**
```solidity
// V1: Hard delete (permanent)
deleteTask(taskId) // Task is gone forever

// V2: Soft delete (recoverable)
deleteTask(taskId)  // Task marked as deleted
restoreTask(taskId) // Task can be restored
```

#### 5. **Enhanced Task Structure**
```solidity
// V1 Task
struct Task {
    uint256 id;
    address owner;
    string description;
    bool completed;
    uint256 createdAt;
    uint256 completedAt;
}

// V2 Task (includes deleted state)
struct Task {
    uint256 id;
    address owner;
    string description;
    bool completed;
    bool deleted;        // NEW
    uint256 createdAt;
    uint256 completedAt;
    uint256 deletedAt;   // NEW
}
```

#### 6. **Pull Payment Pattern**
- Secure withdrawal mechanism
- Protection against reentrancy attacks
- Foundation for future payment features

#### 7. **Meta-Transaction Support**
- Nonce tracking for gasless transactions
-準備 for EIP-712 signatures

#### 8. **Emergency Withdrawal**
- Admin can withdraw contract funds in emergencies
- Protects pending withdrawals

#### 9. **Configurable Parameters**
```solidity
// V1: Constants
ACTION_COOLDOWN = 1 seconds (constant)
MAX_TASKS_PER_USER = 10000 (constant)

// V2: Configurable
actionCooldown (adjustable: 0 - 3600 seconds)
maxTasksPerUser (adjustable: 100 - 1,000,000)
```

---

## Breaking Changes

### 1. Constructor vs Initialize

**V1:**
```javascript
const TodoList = await ethers.getContractFactory("TodoList");
const todoList = await TodoList.deploy();
```

**V2:**
```javascript
const TodoListV2 = await ethers.getContractFactory("TodoListV2");
const proxy = await upgrades.deployProxy(
  TodoListV2,
  [initialAdmin],
  { initializer: "initialize", kind: "uups" }
);
```

### 2. Access Control Changes

**V1:**
```javascript
// Only owner
await todoList.pause();
```

**V2:**
```javascript
// Requires ADMIN_ROLE
const ADMIN_ROLE = await todoList.ADMIN_ROLE();
const hasRole = await todoList.hasRole(ADMIN_ROLE, address);
if (hasRole) {
  await todoList.pause();
}
```

### 3. Delete Behavior

**V1:** Hard delete - task completely removed
**V2:** Soft delete - task marked as deleted but can be restored

**Impact on Frontend:**
```javascript
// V1: getUserTaskDetails returns only existing tasks
const tasks = await contract.getUserTaskDetails(address);

// V2: getUserTaskDetails accepts includeDeleted parameter
const allTasks = await contract.getUserTaskDetails(address, true);
const activeTasks = await contract.getUserTaskDetails(address, false);
```

### 4. New View Functions

V2 adds new functions not present in V1:
- `isTaskDeleted(taskId)`
- `getContractStatus()` - Returns pause, circuit breaker, cooldown, max tasks
- `getPendingWithdrawal(address)`
- `getNonce(address)`
- `version()`

---

## Migration Strategies

### Strategy 1: Fresh Deployment (Recommended for New Projects)

**Pros:**
- Clean start with V2
- No data migration complexity
- Full access to all V2 features immediately

**Cons:**
- Loses historical data
- Users must switch to new contract address

**Best for:**
- Projects in early stages
- Testing/development environments
- When historical data can be archived off-chain

**Steps:**
1. Deploy TodoListV2 as a new proxy
2. Update frontend to point to new address
3. Optionally: Export V1 data for archival

### Strategy 2: Parallel Operation

**Pros:**
- Zero downtime
- Users can migrate at their own pace
- Fallback to V1 if issues arise

**Cons:**
- Maintains two contracts temporarily
- Increased complexity
- Split user base during transition

**Best for:**
- Production systems with active users
- Risk-averse deployments

**Steps:**
1. Deploy V2 alongside V1
2. Provide migration tools for users
3. Gradually deprecate V1
4. Eventually sunset V1 after full migration

### Strategy 3: Data Migration Script

**Pros:**
- Preserves all historical data
- Maintains user task IDs
- Seamless user experience

**Cons:**
- Most complex
- Higher gas costs
- Requires careful testing

**Best for:**
- Critical production data
- Compliance requirements
- When user history is essential

---

## Deployment Guide

### Prerequisites

```bash
# Install dependencies
npm install @openzeppelin/contracts-upgradeable
npm install @openzeppelin/hardhat-upgrades
```

### Step 1: Deploy V2 Proxy

Create deployment script: `scripts/deploy-v2-fresh.js`

```javascript
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying TodoListV2 with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy proxy
  const TodoListV2 = await ethers.getContractFactory("TodoListV2");
  const proxy = await upgrades.deployProxy(
    TodoListV2,
    [deployer.address], // Initial admin
    {
      initializer: "initialize",
      kind: "uups"
    }
  );

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log("TodoListV2 Proxy deployed to:", proxyAddress);
  console.log("Implementation deployed behind proxy");

  // Save deployment info
  const fs = require('fs');
  const deployment = {
    proxy: proxyAddress,
    implementation: await upgrades.erc1967.getImplementationAddress(proxyAddress),
    admin: deployer.address,
    network: network.name,
    timestamp: new Date().toISOString(),
    version: await proxy.version()
  };

  fs.writeFileSync(
    `./deployments/TodoListV2-${network.name}.json`,
    JSON.stringify(deployment, null, 2)
  );

  console.log("\nDeployment info saved to deployments/TodoListV2-" + network.name + ".json");

  // Verify initial configuration
  const status = await proxy.getContractStatus();
  console.log("\nContract Status:");
  console.log("- Paused:", status.isPaused);
  console.log("- Circuit Breaker Active:", status.isCircuitBreakerActive);
  console.log("- Cooldown:", status.currentCooldown.toString(), "seconds");
  console.log("- Max Tasks per User:", status.currentMaxTasks.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 2: Run Deployment

```bash
# Local testing
npx hardhat run scripts/deploy-v2-fresh.js --network localhost

# Testnet (Sepolia)
npx hardhat run scripts/deploy-v2-fresh.js --network sepolia

# Mainnet (when ready)
npx hardhat run scripts/deploy-v2-fresh.js --network mainnet
```

### Step 3: Grant Roles (if needed)

```javascript
// Script to set up additional admins/roles
async function setupRoles() {
  const proxy = await ethers.getContractAt("TodoListV2", PROXY_ADDRESS);

  const ADMIN_ROLE = await proxy.ADMIN_ROLE();
  const MODERATOR_ROLE = await proxy.MODERATOR_ROLE();
  const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();

  // Grant roles
  await proxy.grantRoleWithEvent(ADMIN_ROLE, ADMIN_ADDRESS);
  await proxy.grantRoleWithEvent(UPGRADER_ROLE, UPGRADER_ADDRESS);

  console.log("Roles granted successfully");
}
```

### Step 4: Verify on Etherscan

```bash
# Verify proxy
npx hardhat verify --network sepolia PROXY_ADDRESS

# Note: OpenZeppelin upgrades plugin handles verification automatically
# Use defender-admin or manual verification if needed
```

---

## Frontend Integration Changes

### 1. Update Contract ABI

Export the new ABI:

```bash
# After compilation
npx hardhat compile

# Copy ABI to frontend
cp artifacts/contracts/TodoListV2.sol/TodoListV2.json frontend/src/contracts/TodoListV2ABI.json
```

### 2. Update Contract Initialization

**Before (V1):**
```javascript
import TodoListABI from './contracts/TodoListABI.json';

const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  TodoListABI.abi,
  signer
);
```

**After (V2):**
```javascript
import TodoListV2ABI from './contracts/TodoListV2ABI.json';

const contract = new ethers.Contract(
  PROXY_ADDRESS, // Note: Use proxy address, not implementation
  TodoListV2ABI.abi,
  signer
);
```

### 3. Handle Soft Deletes

**Updated Task Display Logic:**

```javascript
// Fetch tasks with deleted flag
const fetchTasks = async () => {
  try {
    // Get all tasks including deleted
    const allTasks = await contract.getUserTaskDetails(
      address,
      true // includeDeleted = true
    );

    // Filter in frontend based on user preference
    const activeTasks = allTasks.filter(task => !task.deleted);
    const deletedTasks = allTasks.filter(task => task.deleted);

    setActiveTasks(activeTasks);
    setDeletedTasks(deletedTasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
};
```

**Add Restore Functionality:**

```javascript
const restoreTask = async (taskId) => {
  try {
    const tx = await contract.restoreTask(taskId);
    await tx.wait();
    console.log("Task restored successfully");
    await fetchTasks(); // Refresh task list
  } catch (error) {
    console.error("Error restoring task:", error);
  }
};
```

### 4. Add "Deleted Tasks" View (Optional)

```jsx
// React component example
function DeletedTasks({ deletedTasks, onRestore }) {
  return (
    <div className="deleted-tasks">
      <h3>Deleted Tasks</h3>
      {deletedTasks.map(task => (
        <div key={task.id} className="task-item deleted">
          <span>{task.description}</span>
          <button onClick={() => onRestore(task.id)}>
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 5. Handle Rate Limiting

**Add Cooldown Feedback:**

```javascript
const createTask = async (description) => {
  try {
    const tx = await contract.createTask(description);
    await tx.wait();
    console.log("Task created successfully");
  } catch (error) {
    if (error.message.includes("Rate limit")) {
      // Show user-friendly message
      setError("Please wait a moment before creating another task");

      // Optionally: Show countdown timer
      const cooldown = await contract.actionCooldown();
      startCooldownTimer(cooldown);
    } else {
      setError("Error creating task: " + error.message);
    }
  }
};
```

### 6. Check Contract Status

**Display Circuit Breaker / Pause State:**

```javascript
const checkContractStatus = async () => {
  const status = await contract.getContractStatus();

  if (status.isPaused) {
    setWarning("Contract is currently paused for maintenance");
  }

  if (status.isCircuitBreakerActive) {
    setError("Contract is in emergency mode. Operations suspended.");
  }

  return status;
};
```

### 7. Version Check

**Verify Contract Version:**

```javascript
const verifyVersion = async () => {
  const version = await contract.version();
  console.log("Contract version:", version);

  if (version !== "2.0.0") {
    console.warn("Unexpected contract version:", version);
  }
};
```

---

## Testing the Migration

### Pre-Migration Testing Checklist

- [ ] Deploy V2 to testnet (Sepolia/Mumbai)
- [ ] Create test tasks
- [ ] Complete tasks
- [ ] Delete and restore tasks
- [ ] Test role management
- [ ] Test pause/unpause
- [ ] Test circuit breaker
- [ ] Test rate limiting
- [ ] Verify events are emitted correctly
- [ ] Test frontend integration

### Migration Test Script

```javascript
const { ethers } = require("hardhat");

async function testMigration() {
  const [owner, user1, user2] = await ethers.getSigners();

  // Deploy V2
  const TodoListV2 = await ethers.getContractFactory("TodoListV2");
  const proxy = await upgrades.deployProxy(
    TodoListV2,
    [owner.address],
    { initializer: "initialize", kind: "uups" }
  );

  console.log("✓ Deployed V2");

  // Test basic functionality
  await proxy.connect(user1).createTask("Test task 1");
  console.log("✓ Created task");

  await ethers.provider.send("evm_increaseTime", [2]);
  await proxy.connect(user1).completeTask(1);
  console.log("✓ Completed task");

  await ethers.provider.send("evm_increaseTime", [2]);
  await proxy.connect(user1).deleteTask(1);
  console.log("✓ Deleted task (soft)");

  const task = await proxy.getTask(1);
  console.log("✓ Task still exists:", task.deleted === true);

  await ethers.provider.send("evm_increaseTime", [2]);
  await proxy.connect(user1).restoreTask(1);
  console.log("✓ Restored task");

  // Test access control
  const ADMIN_ROLE = await proxy.ADMIN_ROLE();
  await proxy.grantRoleWithEvent(ADMIN_ROLE, user2.address);
  console.log("✓ Granted admin role");

  await proxy.connect(user2).pause();
  console.log("✓ User2 can pause (has admin role)");

  await proxy.connect(user2).unpause();
  console.log("✓ User2 can unpause");

  // Test circuit breaker
  await proxy.activateCircuitBreaker();
  console.log("✓ Activated circuit breaker");

  try {
    await proxy.connect(user1).createTask("Should fail");
    console.log("✗ Circuit breaker didn't block operation");
  } catch (error) {
    console.log("✓ Circuit breaker blocked operation");
  }

  await proxy.deactivateCircuitBreaker();
  console.log("✓ Deactivated circuit breaker");

  console.log("\n✓ All migration tests passed!");
}

testMigration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

Run with:
```bash
npx hardhat run scripts/test-migration.js --network localhost
```

### Automated Test Suite

Run the comprehensive test suite:

```bash
# Run all V2 tests
npx hardhat test test/TodoListV2.test.js

# Run with coverage
npx hardhat coverage --testfiles "test/TodoListV2.test.js"

# Run specific test suites
npx hardhat test test/TodoListV2.test.js --grep "Access Control"
npx hardhat test test/TodoListV2.test.js --grep "Upgradeability"
```

---

## Rollback Procedures

### Emergency Rollback Plan

If critical issues arise after deployment:

#### Option 1: Upgrade to Previous Implementation (UUPS)

```javascript
// Prepare a V2.1 that reverts problematic changes
const TodoListV2Fixed = await ethers.getContractFactory("TodoListV2Fixed");
await upgrades.upgradeProxy(PROXY_ADDRESS, TodoListV2Fixed);
```

#### Option 2: Pause Contract

```javascript
// Immediate action to stop operations
const proxy = await ethers.getContractAt("TodoListV2", PROXY_ADDRESS);
await proxy.pause();
```

#### Option 3: Activate Circuit Breaker

```javascript
// More severe stop
await proxy.activateCircuitBreaker();
```

#### Option 4: Return to V1 (Parallel Strategy Only)

If running V1 and V2 in parallel:

```javascript
// Frontend switch
const CONTRACT_ADDRESS = V1_ADDRESS; // Revert to V1
```

### Monitoring Post-Migration

**Key Metrics to Monitor:**

1. **Transaction Success Rate**
   - Monitor for increased failures
   - Track gas usage changes

2. **Event Emissions**
   - Verify all events emit correctly
   - Check for missing events

3. **User Activity**
   - Task creation rate
   - Completion rate
   - Delete/restore patterns

4. **Gas Costs**
   - Compare V1 vs V2 gas usage
   - Optimize if significantly higher

5. **Error Rates**
   - Rate limiting triggers
   - Access control rejections
   - Circuit breaker activations

---

## Security Considerations

### Pre-Deployment Security Checklist

- [ ] **Audit the contract code**
  - Review all changes from V1
  - Check for vulnerabilities
  - Consider professional audit for mainnet

- [ ] **Test on testnet extensively**
  - Run for at least 1 week on testnet
  - Simulate various attack scenarios
  - Test with multiple users

- [ ] **Verify upgradeability**
  - Ensure UPGRADER_ROLE properly restricted
  - Test upgrade mechanism
  - Verify storage layout compatibility

- [ ] **Review access control**
  - Verify role assignments
  - Check role hierarchies
  - Test permission boundaries

- [ ] **Test emergency procedures**
  - Practice pause/unpause
  - Test circuit breaker
  - Verify emergency withdrawal

### Post-Deployment Security

1. **Monitor Contract Activity**
   ```javascript
   // Set up event listeners
   contract.on("CircuitBreakerActivated", (by, timestamp) => {
     alert("EMERGENCY: Circuit breaker activated!");
   });

   contract.on("RoleGranted", (role, account, sender) => {
     log("Role granted:", { role, account, sender });
   });
   ```

2. **Regular Security Reviews**
   - Weekly review of admin actions
   - Monthly security audits
   - Quarterly penetration testing

3. **Maintain Admin Key Security**
   - Use multi-sig for ADMIN_ROLE
   - Separate UPGRADER_ROLE to different wallet
   - Consider using Gnosis Safe or similar

4. **Bug Bounty Program**
   - Consider launching bug bounty
   - Reward responsible disclosure
   - Maintain rapid response capability

### Known Limitations

1. **V2 cannot read V1 data**
   - Requires separate data migration
   - No automatic state transfer

2. **Soft delete increases storage**
   - Deleted tasks still consume storage
   - Consider periodic cleanup for very old deleted tasks

3. **Rate limiting affects UX**
   - Users must wait between actions
   - Balance security vs user experience

4. **Gas costs slightly higher**
   - UUPS adds overhead
   - RBAC checks add gas cost
   - Acceptable tradeoff for security

---

## Frequently Asked Questions

### Q: Can I upgrade from V1 to V2 using the proxy pattern?

**A:** No, V1 is not upgradeable. You must deploy V2 as a new contract. You can:
1. Deploy V2 fresh (loses history)
2. Migrate data with a script (complex)
3. Run both in parallel (gradual migration)

### Q: Will user addresses and task IDs be preserved?

**A:**
- User addresses: Yes (Ethereum addresses don't change)
- Task IDs: Only if you migrate data programmatically
- Otherwise, V2 starts with fresh task IDs

### Q: What happens to V1 tasks after migration?

**A:**
- V1 contract remains on blockchain (immutable)
- Tasks are still readable from V1
- You can archive V1 data off-chain
- V1 can be "deprecated" by pausing it

### Q: How much does migration cost in gas?

**A:**
- Fresh V2 deployment: ~2-3M gas
- Per-task migration (if scripted): ~100-150k gas per task
- Recommend fresh deployment for cost efficiency

### Q: Can I revert to V1 after migrating to V2?

**A:**
- Frontend: Yes (just change contract address)
- Data: Only V1 data (V2 data stays in V2)
- Recommendation: Run parallel during transition period

### Q: How do I handle existing users?

**A:**
1. Announce migration in advance
2. Provide migration timeline
3. Offer migration assistance
4. Keep V1 readable for historical data
5. Gradually sunset V1 after full migration

---

## Additional Resources

### Documentation
- [OpenZeppelin Upgrades Plugin](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
- [UUPS Proxy Pattern](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable)
- [Access Control](https://docs.openzeppelin.com/contracts/4.x/access-control)

### Tools
- [Hardhat](https://hardhat.org/): Development environment
- [OpenZeppelin Defender](https://defender.openzeppelin.com/): Contract management
- [Tenderly](https://tenderly.co/): Monitoring and debugging

### Support
- GitHub Issues: [Your repo issues]
- Discord: [Your community Discord]
- Email: [Support email]

---

## Conclusion

Migrating from TodoList V1 to V2 brings significant security and functionality improvements. While the migration requires careful planning and testing, the benefits of upgradeability, enhanced security, and new features make it worthwhile.

**Recommended Migration Path:**
1. ✅ Deploy V2 to testnet
2. ✅ Run comprehensive tests (use provided test suite)
3. ✅ Update and test frontend integration
4. ✅ Deploy V2 to mainnet
5. ✅ Run V1 and V2 in parallel (1-2 weeks)
6. ✅ Gradually migrate users
7. ✅ Monitor and optimize
8. ✅ Sunset V1

**Questions or Issues?**
Please open an issue in the GitHub repository or contact the development team.

---

*Last Updated: 2024*
*Document Version: 1.0.0*
*Contract Version: V2.0.0*
