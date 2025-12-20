const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

// Network configurations with backup RPC URLs for failover
const networks = {
  localhost: {
    name: "localhost",
    chainId: 31337,
    rpcUrl: process.env.LOCALHOST_RPC || "http://127.0.0.1:8545",
    rpcBackup: process.env.LOCALHOST_RPC_BACKUP || "",
  },
  sepolia: {
    name: "sepolia",
    chainId: 11155111,
    rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC || "",
    rpcBackup: process.env.ETHEREUM_SEPOLIA_RPC_BACKUP || "",
  },
  polygonMumbai: {
    name: "polygonMumbai",
    chainId: 80001,
    rpcUrl: process.env.POLYGON_MUMBAI_RPC || "",
    rpcBackup: process.env.POLYGON_MUMBAI_RPC_BACKUP || "",
  },
  arbitrumGoerli: {
    name: "arbitrumGoerli",
    chainId: 421613,
    rpcUrl: process.env.ARBITRUM_GOERLI_RPC || "",
    rpcBackup: process.env.ARBITRUM_GOERLI_RPC_BACKUP || "",
  },
  optimismSepolia: {
    name: "optimismSepolia",
    chainId: 11155420,
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC || "",
    rpcBackup: process.env.OPTIMISM_SEPOLIA_RPC_BACKUP || "",
  },
};

// Load contract addresses from deployment files
const loadContractAddresses = () => {
  const addresses = {};
  const deploymentsDir = path.join(__dirname, "../../../contracts/deployments");

  Object.keys(networks).forEach((networkKey) => {
    const network = networks[networkKey];
    const deploymentFile = path.join(
      deploymentsDir,
      `deployment-${network.chainId}.json`
    );

    try {
      if (fs.existsSync(deploymentFile)) {
        const deploymentData = JSON.parse(
          fs.readFileSync(deploymentFile, "utf8")
        );
        // Support multiple deployment formats
        addresses[network.chainId] =
          deploymentData.proxy ||
          deploymentData.todoListAddress ||
          deploymentData.contracts?.TodoListV2?.address ||
          deploymentData.contracts?.TodoList?.address;
      } else {
        logger.warn(
          `No deployment file found for ${network.name} (chainId: ${network.chainId})`
        );
      }
    } catch (error) {
      logger.error(
        `Error loading deployment for ${network.name}:`,
        { error: error.message, stack: error.stack }
      );
    }
  });

  return addresses;
};

// Load contract ABI
const loadContractABI = () => {
  try {
    const abiPath = path.join(
      __dirname,
      "../../../contracts/artifacts/contracts/TodoListV2.sol/TodoListV2.json"
    );
    const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    return artifact.abi;
  } catch (error) {
    logger.error("Error loading contract ABI:", { error: error.message, stack: error.stack });
    throw new Error("Failed to load contract ABI");
  }
};

module.exports = {
  networks,
  contractAddresses: loadContractAddresses(),
  contractABI: loadContractABI(),
  defaultNetwork: process.env.DEFAULT_NETWORK || "localhost",
};
