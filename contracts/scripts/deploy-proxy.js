const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy TodoListV2 with UUPS Proxy Pattern
 * 
 * This script:
 * 1. Deploys the TodoListV2 implementation contract
 * 2. Deploys a UUPS proxy pointing to the implementation
 * 3. Initializes the proxy with the admin address
 * 4. Saves deployment addresses to a JSON file
 * 5. Verifies the deployment
 */
async function main() {
  console.log("🚀 Starting TodoListV2 UUPS Proxy Deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Get the balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Get the network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🆔 Chain ID:", network.chainId.toString(), "\n");

  // Deploy TodoListV2 with UUPS proxy
  console.log("📦 Deploying TodoListV2 implementation...");
  const TodoListV2 = await ethers.getContractFactory("TodoListV2");
  
  // Deploy with UUPS proxy pattern
  // The initialize function will be called automatically with the deployer as admin
  const todoList = await upgrades.deployProxy(
    TodoListV2,
    [deployer.address], // initialAdmin parameter
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await todoList.waitForDeployment();
  const proxyAddress = await todoList.getAddress();
  
  console.log("✅ TodoListV2 Proxy deployed to:", proxyAddress);

  // Get the implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );
  console.log("✅ Implementation contract deployed to:", implementationAddress);

  // Get the admin address
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
  console.log("✅ ProxyAdmin deployed to:", adminAddress, "\n");

  // Verify initialization
  console.log("🔍 Verifying deployment...");
  
  try {
    const version = await todoList.version();
    console.log("✅ Contract version:", version);

    const hasAdminRole = await todoList.hasRole(
      await todoList.ADMIN_ROLE(),
      deployer.address
    );
    console.log("✅ Deployer has ADMIN_ROLE:", hasAdminRole);

    const hasUpgraderRole = await todoList.hasRole(
      await todoList.UPGRADER_ROLE(),
      deployer.address
    );
    console.log("✅ Deployer has UPGRADER_ROLE:", hasUpgraderRole);

    const status = await todoList.getContractStatus();
    console.log("✅ Contract is paused:", status.isPaused);
    console.log("✅ Circuit breaker active:", status.isCircuitBreakerActive);
    console.log("✅ Action cooldown:", status.currentCooldown.toString(), "seconds");
    console.log("✅ Max tasks per user:", status.currentMaxTasks.toString(), "\n");
  } catch (error) {
    console.error("⚠️  Verification failed:", error.message, "\n");
  }

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    proxy: proxyAddress,
    implementation: implementationAddress,
    proxyAdmin: adminAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    blockNumber: (await ethers.provider.getBlockNumber()).toString(),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save to network-specific file
  const networkName = network.name === "unknown" ? `chainId-${network.chainId}` : network.name;
  const deploymentFile = path.join(
    deploymentsDir,
    `TodoListV2-${networkName}.json`
  );

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile, "\n");

  // Save to latest.json for easy reference
  const latestFile = path.join(deploymentsDir, "latest.json");
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Latest deployment saved to:", latestFile, "\n");

  // Print summary
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=" .repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   Proxy:          ", proxyAddress);
  console.log("   Implementation: ", implementationAddress);
  console.log("   ProxyAdmin:     ", adminAddress);
  console.log("\n🔐 Admin Account:  ", deployer.address);
  console.log("\n📝 Next Steps:");
  console.log("   1. Verify contracts on block explorer");
  console.log("   2. Test contract functionality");
  console.log("   3. Transfer admin roles to multisig (if applicable)");
  console.log("   4. Update frontend configuration with proxy address");
  console.log("=" .repeat(60), "\n");

  // Return the contract instance for testing
  return {
    todoList,
    proxyAddress,
    implementationAddress,
    adminAddress,
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
