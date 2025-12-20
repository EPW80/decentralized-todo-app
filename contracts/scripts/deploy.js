const hre = require("hardhat");
const { upgrades } = require("hardhat");
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

  // Deploy TodoListV2 contract with proxy
  console.log("\nDeploying TodoListV2 contract with UUPS proxy...");
  const TodoListV2 = await hre.ethers.getContractFactory("TodoListV2");
  const todoList = await upgrades.deployProxy(TodoListV2, [deployer.address], {
    kind: "uups",
    initializer: "initialize",
  });

  await todoList.waitForDeployment();
  const todoListAddress = await todoList.getAddress();

  console.log(`TodoListV2 proxy deployed to: ${todoListAddress}`);

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      TodoListV2: {
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
  console.log(`TodoListV2 Contract: ${todoListAddress}`);
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
