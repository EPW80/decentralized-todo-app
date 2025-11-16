const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying TodoList contract...");

  // Get the contract factory
  const TodoList = await ethers.getContractFactory("TodoList");

  // Deploy the contract
  const todoList = await TodoList.deploy();
  await todoList.waitForDeployment();

  const contractAddress = await todoList.getAddress();
  console.log(`TodoList contract deployed to: ${contractAddress}`);

  // Get network information
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log(`Network: ${network.name} (chainId: ${chainId})`);

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentInfo = {
    address: contractAddress,
    chainId: chainId,
    network: network.name,
    deployedAt: new Date().toISOString(),
    deployer: (await ethers.getSigners())[0].address,
  };

  const deploymentPath = path.join(deploymentsDir, `${chainId}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to: ${deploymentPath}`);

  // Display contract info
  console.log("\n=== Deployment Summary ===");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log("========================\n");

  return todoList;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
