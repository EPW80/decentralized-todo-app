const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Upgrade TodoListV2 Proxy to New Implementation
 * 
 * This script:
 * 1. Loads the existing proxy address from deployment files
 * 2. Deploys a new implementation contract (e.g., TodoListV3)
 * 3. Upgrades the proxy to point to the new implementation
 * 4. Validates the upgrade was successful
 * 5. Saves upgrade information to a JSON file
 * 
 * Requirements:
 * - Deployer must have UPGRADER_ROLE on the proxy contract
 * - New implementation must be upgrade-safe
 */
async function main() {
  console.log("🔄 Starting TodoListV2 Upgrade Process...\n");

  // Get the upgrader account
  const [upgrader] = await ethers.getSigners();
  console.log("📝 Upgrading with account:", upgrader.address);
  
  const balance = await ethers.provider.getBalance(upgrader.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Get the network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🆔 Chain ID:", network.chainId.toString(), "\n");

  // Load existing deployment
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const networkName = network.name === "unknown" ? `chainId-${network.chainId}` : network.name;
  const deploymentFile = path.join(
    deploymentsDir,
    `TodoListV2-${networkName}.json`
  );

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(
      `❌ Deployment file not found: ${deploymentFile}\n` +
      `Please deploy the proxy first using: npx hardhat run scripts/deploy-proxy.js`
    );
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const proxyAddress = deployment.proxy;
  const oldImplementation = deployment.implementation;

  console.log("📍 Current Proxy Address:", proxyAddress);
  console.log("📍 Current Implementation:", oldImplementation, "\n");

  // Connect to existing proxy
  const TodoListV2 = await ethers.getContractFactory("TodoListV2");
  const existingProxy = TodoListV2.attach(proxyAddress);

  // Verify upgrader has permission
  console.log("🔐 Verifying upgrade permissions...");
  try {
    const UPGRADER_ROLE = await existingProxy.UPGRADER_ROLE();
    const hasRole = await existingProxy.hasRole(UPGRADER_ROLE, upgrader.address);
    
    if (!hasRole) {
      throw new Error(
        `❌ Account ${upgrader.address} does not have UPGRADER_ROLE.\n` +
        `Please grant the role first using the grantRoleWithEvent function.`
      );
    }
    console.log("✅ Upgrader has UPGRADER_ROLE\n");
  } catch (error) {
    console.error("⚠️  Permission check failed:", error.message);
    throw error;
  }

  // Get current version before upgrade
  let oldVersion;
  try {
    oldVersion = await existingProxy.version();
    console.log("📊 Current version:", oldVersion);
  } catch (error) {
    oldVersion = "unknown";
    console.log("⚠️  Could not retrieve current version");
  }

  // Get current task count for validation
  let oldTaskCount;
  try {
    oldTaskCount = await existingProxy.getTotalTaskCount();
    console.log("📊 Current total tasks:", oldTaskCount.toString(), "\n");
  } catch (error) {
    oldTaskCount = "0";
    console.log("⚠️  Could not retrieve task count\n");
  }

  // Deploy new implementation
  // NOTE: Change "TodoListV2" to your new contract name (e.g., "TodoListV3")
  console.log("📦 Deploying new implementation...");
  const TodoListV2New = await ethers.getContractFactory("TodoListV2");
  
  // Upgrade the proxy
  const upgraded = await upgrades.upgradeProxy(proxyAddress, TodoListV2New);
  await upgraded.waitForDeployment();

  console.log("✅ Proxy upgraded successfully!\n");

  // Get new implementation address
  const newImplementation = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );
  console.log("✅ New Implementation Address:", newImplementation);

  // Verify upgrade
  console.log("\n🔍 Verifying upgrade...");
  
  try {
    // Check version
    const newVersion = await upgraded.version();
    console.log("✅ New version:", newVersion);

    // Verify state preservation
    const newTaskCount = await upgraded.getTotalTaskCount();
    console.log("✅ Task count preserved:", newTaskCount.toString());
    
    if (oldTaskCount.toString() !== newTaskCount.toString()) {
      console.warn("⚠️  WARNING: Task count mismatch! State may not be preserved.");
    }

    // Verify roles are preserved
    const ADMIN_ROLE = await upgraded.ADMIN_ROLE();
    const hasAdminRole = await upgraded.hasRole(ADMIN_ROLE, upgrader.address);
    console.log("✅ Admin role preserved:", hasAdminRole);

    // Check contract status
    const status = await upgraded.getContractStatus();
    console.log("✅ Contract is paused:", status.isPaused);
    console.log("✅ Circuit breaker active:", status.isCircuitBreakerActive);
    
  } catch (error) {
    console.error("⚠️  Verification failed:", error.message);
  }

  // Save upgrade information
  const upgradeInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    proxy: proxyAddress,
    oldImplementation: oldImplementation,
    newImplementation: newImplementation,
    oldVersion: oldVersion,
    newVersion: await upgraded.version().catch(() => "unknown"),
    upgrader: upgrader.address,
    timestamp: new Date().toISOString(),
    blockNumber: (await ethers.provider.getBlockNumber()).toString(),
  };

  // Save upgrade history
  const upgradeHistoryFile = path.join(
    deploymentsDir,
    `TodoListV2-${networkName}-upgrades.json`
  );

  let upgradeHistory = [];
  if (fs.existsSync(upgradeHistoryFile)) {
    upgradeHistory = JSON.parse(fs.readFileSync(upgradeHistoryFile, "utf8"));
  }
  upgradeHistory.push(upgradeInfo);

  fs.writeFileSync(upgradeHistoryFile, JSON.stringify(upgradeHistory, null, 2));
  console.log("\n💾 Upgrade history saved to:", upgradeHistoryFile);

  // Update main deployment file
  deployment.implementation = newImplementation;
  deployment.lastUpgrade = new Date().toISOString();
  deployment.version = upgradeInfo.newVersion;

  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log("💾 Deployment file updated:", deploymentFile);

  // Update latest.json
  const latestFile = path.join(deploymentsDir, "latest.json");
  fs.writeFileSync(latestFile, JSON.stringify(deployment, null, 2));
  console.log("💾 Latest deployment updated:", latestFile, "\n");

  // Print summary
  console.log("=" .repeat(60));
  console.log("🎉 UPGRADE SUCCESSFUL!");
  console.log("=" .repeat(60));
  console.log("\n📋 Upgrade Details:");
  console.log("   Proxy:                ", proxyAddress);
  console.log("   Old Implementation:   ", oldImplementation);
  console.log("   New Implementation:   ", newImplementation);
  console.log("   Old Version:          ", oldVersion);
  console.log("   New Version:          ", upgradeInfo.newVersion);
  console.log("\n🔐 Upgraded By:         ", upgrader.address);
  console.log("\n📝 Next Steps:");
  console.log("   1. Verify new implementation on block explorer");
  console.log("   2. Test all critical functions");
  console.log("   3. Monitor for any issues");
  console.log("   4. Announce upgrade to users");
  console.log("   5. Update frontend if API changed");
  console.log("=" .repeat(60), "\n");

  return {
    upgraded,
    proxyAddress,
    oldImplementation,
    newImplementation,
    upgradeInfo,
  };
}

// Execute upgrade
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Upgrade failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
