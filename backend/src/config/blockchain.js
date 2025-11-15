const path = require('path');
const fs = require('fs');

// Network configurations
const networks = {
  localhost: {
    name: 'localhost',
    chainId: 31337,
    rpcUrl: process.env.LOCALHOST_RPC || 'http://127.0.0.1:8545',
  },
  sepolia: {
    name: 'sepolia',
    chainId: 11155111,
    rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC || '',
  },
  polygonMumbai: {
    name: 'polygonMumbai',
    chainId: 80001,
    rpcUrl: process.env.POLYGON_MUMBAI_RPC || '',
  },
  arbitrumGoerli: {
    name: 'arbitrumGoerli',
    chainId: 421613,
    rpcUrl: process.env.ARBITRUM_GOERLI_RPC || '',
  },
  optimismSepolia: {
    name: 'optimismSepolia',
    chainId: 11155420,
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC || '',
  },
};

// Load contract addresses from deployment files
const loadContractAddresses = () => {
  const addresses = {};
  const deploymentsDir = path.join(__dirname, '../../../contracts/deployments');

  Object.keys(networks).forEach((networkKey) => {
    const network = networks[networkKey];
    const deploymentFile = path.join(deploymentsDir, `deployment-${network.chainId}.json`);

    try {
      if (fs.existsSync(deploymentFile)) {
        const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        addresses[network.chainId] = deploymentData.todoListAddress;
      } else {
        console.warn(`No deployment file found for ${network.name} (chainId: ${network.chainId})`);
      }
    } catch (error) {
      console.error(`Error loading deployment for ${network.name}:`, error.message);
    }
  });

  return addresses;
};

// Load contract ABI
const loadContractABI = () => {
  try {
    const abiPath = path.join(__dirname, '../../../contracts/artifacts/contracts/TodoList.sol/TodoList.json');
    const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    return artifact.abi;
  } catch (error) {
    console.error('Error loading contract ABI:', error.message);
    throw new Error('Failed to load contract ABI');
  }
};

module.exports = {
  networks,
  contractAddresses: loadContractAddresses(),
  contractABI: loadContractABI(),
  defaultNetwork: process.env.DEFAULT_NETWORK || 'localhost',
};
