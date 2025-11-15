const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");

  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  console.log(`Deploying to network: ${network.name} (chainId: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy TodoList contract
  console.log("\nDeploying TodoList contract...");
  const TodoList = await hre.ethers.getContractFactory("TodoList");
  const todoList = await TodoList.deploy();

  await todoList.waitForDeployment();
  const todoListAddress = await todoList.getAddress();

  console.log(`TodoList contract deployed to: ${todoListAddress}`);

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      TodoList: {
        address: todoListAddress,
        blockNumber: todoList.deploymentTransaction()?.blockNumber || "N/A",
        timestamp: new Date().toISOString(),
      },
    },
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(
    deploymentsDir,
    `deployment-${network.chainId}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\nDeployment info saved to: ${deploymentFile}`);

  // Display summary
  console.log("\n====== Deployment Summary ======");
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`TodoList Contract: ${todoListAddress}`);
  console.log("================================\n");

  // If not on localhost/hardhat, remind about verification
  if (network.chainId !== 31337n) {
    console.log("To verify the contract on Etherscan, run:");
    console.log(
      `npx hardhat verify --network ${network.name} ${todoListAddress}`
    );
  }

  return {
    todoList: todoListAddress,
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
