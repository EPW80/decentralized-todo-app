const fs = require("fs");
const path = require("path");

/**
 * Updates the frontend .env file with the latest contract deployment addresses
 */
async function updateFrontendConfig() {
  console.log("Updating frontend configuration...");

  // Read deployment files
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const frontendEnvPath = path.join(__dirname, "..", "..", "frontend", ".env");

  if (!fs.existsSync(frontendEnvPath)) {
    console.error("Frontend .env file not found!");
    return;
  }

  // Read current .env file
  let envContent = fs.readFileSync(frontendEnvPath, "utf8");

  // Get all deployment files
  const deploymentFiles = fs
    .readdirSync(deploymentsDir)
    .filter((f) => f.startsWith("deployment-") && f.endsWith(".json"));

  // Update contract addresses for each network
  for (const file of deploymentFiles) {
    const deployment = JSON.parse(
      fs.readFileSync(path.join(deploymentsDir, file), "utf8")
    );
    const chainId = deployment.chainId;

    // Get contract address (handle both deployment formats)
    let contractAddress;
    if (deployment.contracts && deployment.contracts.TodoListV2) {
      // New format with contracts object
      contractAddress = deployment.contracts.TodoListV2.address;
    } else if (deployment.proxy) {
      // Old format with direct proxy address
      contractAddress = deployment.proxy;
    } else {
      console.log(`⚠️  No contract address found in ${file}, skipping...`);
      continue;
    }

    // Update the .env file
    const regex = new RegExp(
      `VITE_CONTRACT_ADDRESS_${chainId}=.*`,
      "g"
    );

    if (envContent.match(regex)) {
      envContent = envContent.replace(
        regex,
        `VITE_CONTRACT_ADDRESS_${chainId}=${contractAddress}`
      );
      console.log(`✓ Updated contract address for chain ${chainId}: ${contractAddress}`);
    } else {
      console.log(`⚠️  No entry found for chain ${chainId} in .env file`);
    }
  }

  // Write updated .env file
  fs.writeFileSync(frontendEnvPath, envContent);
  console.log("✓ Frontend .env file updated successfully!");
}

// Run if called directly
if (require.main === module) {
  updateFrontendConfig()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = updateFrontendConfig;
