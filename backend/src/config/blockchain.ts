import path from "path";
import fs from "fs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require("../utils/logger");

interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  rpcBackup: string;
}

// Network configurations with backup RPC URLs for failover
const networks: Record<string, NetworkConfig> = {
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
  polygonAmoy: {
    name: "polygonAmoy",
    chainId: 80002,
    rpcUrl: process.env.POLYGON_AMOY_RPC || "",
    rpcBackup: process.env.POLYGON_AMOY_RPC_BACKUP || "",
  },
  arbitrumSepolia: {
    name: "arbitrumSepolia",
    chainId: 421614,
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC || "",
    rpcBackup: process.env.ARBITRUM_SEPOLIA_RPC_BACKUP || "",
  },
  optimismSepolia: {
    name: "optimismSepolia",
    chainId: 11155420,
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC || "",
    rpcBackup: process.env.OPTIMISM_SEPOLIA_RPC_BACKUP || "",
  },
};

interface DeploymentData {
  proxy?: string;
  todoListAddress?: string;
  contracts?: {
    TodoListV2?: { address: string };
    TodoList?: { address: string };
  };
}

// Load contract addresses from deployment files
const loadContractAddresses = (): Record<number, string | undefined> => {
  const addresses: Record<number, string | undefined> = {};
  const deploymentsDir = path.join(__dirname, "../../../contracts/deployments");

  Object.keys(networks).forEach((networkKey) => {
    const network = networks[networkKey];
    const deploymentFile = path.join(
      deploymentsDir,
      `deployment-${network.chainId}.json`,
    );

    try {
      if (fs.existsSync(deploymentFile)) {
        const deploymentData: DeploymentData = JSON.parse(
          fs.readFileSync(deploymentFile, "utf8"),
        );
        // Support multiple deployment formats
        addresses[network.chainId] =
          deploymentData.proxy ||
          deploymentData.todoListAddress ||
          deploymentData.contracts?.TodoListV2?.address ||
          deploymentData.contracts?.TodoList?.address;
      } else {
        logger.warn(
          `No deployment file found for ${network.name} (chainId: ${network.chainId})`,
        );
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error loading deployment for ${network.name}:`, {
        error: err.message,
        stack: err.stack,
      });
    }
  });

  return addresses;
};

// Load contract ABI
const loadContractABI = (): unknown[] => {
  try {
    const abiPath = path.join(
      __dirname,
      "../../../contracts/artifacts/contracts/TodoListV2.sol/TodoListV2.json",
    );
    const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    return artifact.abi;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Error loading contract ABI:", {
      error: err.message,
      stack: err.stack,
    });
    throw new Error("Failed to load contract ABI");
  }
};

module.exports = {
  networks,
  contractAddresses: loadContractAddresses(),
  contractABI: loadContractABI(),
  defaultNetwork: process.env.DEFAULT_NETWORK || "localhost",
};
