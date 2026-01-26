import { BrowserProvider, Contract } from 'ethers';
import TodoListABI from '../contracts/TodoListV2ABI.json';

interface TaskStruct {
  id: bigint;
  owner: string;
  description: string;
  completed: boolean;
  createdAt: bigint;
  completedAt: bigint;
}

const CONTRACT_ADDRESSES: Record<number, string> = {
  31337: import.meta.env.VITE_CONTRACT_ADDRESS_31337 || '',
  11155111: import.meta.env.VITE_CONTRACT_ADDRESS_11155111 || '',
  80001: import.meta.env.VITE_CONTRACT_ADDRESS_80001 || '',
  421613: import.meta.env.VITE_CONTRACT_ADDRESS_421613 || '',
  11155420: import.meta.env.VITE_CONTRACT_ADDRESS_11155420 || '',
};

export const blockchainService = {
  // Get contract instance
  getContract(provider: BrowserProvider, chainId: number): Contract | null {
    const address = CONTRACT_ADDRESSES[chainId];
    if (!address) {
      console.error(`No contract address configured for chainId: ${chainId}`);
      return null;
    }

    return new Contract(address, TodoListABI, provider);
  },

  // Get contract with signer (for write operations)
  async getContractWithSigner(provider: BrowserProvider, chainId: number): Promise<Contract | null> {
    const address = CONTRACT_ADDRESSES[chainId];
    if (!address) {
      console.error(`No contract address configured for chainId: ${chainId}`);
      return null;
    }

    const signer = await provider.getSigner();
    return new Contract(address, TodoListABI, signer);
  },

  // Create a new task
  async createTask(provider: BrowserProvider, chainId: number, description: string, dueDate?: Date | null) {
    const contract = await this.getContractWithSigner(provider, chainId);
    if (!contract) throw new Error('Contract not available');

    // Convert due date to Unix timestamp (0 if no due date)
    const dueDateTimestamp = dueDate ? Math.floor(dueDate.getTime() / 1000) : 0;

    const tx = await contract.createTask(description, dueDateTimestamp);
    const receipt = await tx.wait();

    // Extract taskId from event
    const event = receipt.logs.find((log: { topics: readonly string[]; data: string }) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'TaskCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = contract.interface.parseLog(event);
      return {
        taskId: parsed?.args.taskId.toString(),
        transactionHash: receipt.hash,
      };
    }

    return { transactionHash: receipt.hash };
  },

  // Complete a task
  async completeTask(provider: BrowserProvider, chainId: number, taskId: string) {
    const contract = await this.getContractWithSigner(provider, chainId);
    if (!contract) throw new Error('Contract not available');

    const tx = await contract.completeTask(taskId);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash };
  },

  // Delete a task
  async deleteTask(provider: BrowserProvider, chainId: number, taskId: string) {
    const contract = await this.getContractWithSigner(provider, chainId);
    if (!contract) throw new Error('Contract not available');

    const tx = await contract.deleteTask(taskId);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash };
  },

  // Update a task's description
  async updateTask(provider: BrowserProvider, chainId: number, taskId: string, newDescription: string) {
    const contract = await this.getContractWithSigner(provider, chainId);
    if (!contract) throw new Error('Contract not available');

    const tx = await contract.updateTask(taskId, newDescription);
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash };
  },

  // Get a specific task
  async getTask(provider: BrowserProvider, chainId: number, taskId: string) {
    const contract = this.getContract(provider, chainId);
    if (!contract) throw new Error('Contract not available');

    const task = await contract.getTask(taskId);
    return {
      id: task.id.toString(),
      owner: task.owner,
      description: task.description,
      completed: task.completed,
      createdAt: new Date(Number(task.createdAt) * 1000),
      completedAt: task.completedAt > 0 ? new Date(Number(task.completedAt) * 1000) : null,
    };
  },

  // Get user's tasks
  async getUserTasks(provider: BrowserProvider, chainId: number, userAddress: string) {
    const contract = this.getContract(provider, chainId);
    if (!contract) throw new Error('Contract not available');

    const taskIds = await contract.getUserTasks(userAddress);
    return taskIds.map((id: bigint) => id.toString());
  },

  // Get user's task details
  async getUserTaskDetails(provider: BrowserProvider, chainId: number, userAddress: string) {
    const contract = this.getContract(provider, chainId);
    if (!contract) throw new Error('Contract not available');

    const tasks = await contract.getUserTaskDetails(userAddress);
    return tasks.map((task: TaskStruct) => ({
      id: task.id.toString(),
      owner: task.owner,
      description: task.description,
      completed: task.completed,
      createdAt: new Date(Number(task.createdAt) * 1000),
      completedAt: task.completedAt > 0 ? new Date(Number(task.completedAt) * 1000) : null,
    }));
  },

  // Get task count for user
  async getTaskCount(provider: BrowserProvider, chainId: number, userAddress: string) {
    const contract = this.getContract(provider, chainId);
    if (!contract) throw new Error('Contract not available');

    const count = await contract.getTaskCount(userAddress);
    return Number(count);
  },

  // Check if network is supported
  isSupportedNetwork(chainId: number): boolean {
    return chainId in CONTRACT_ADDRESSES && CONTRACT_ADDRESSES[chainId] !== '';
  },

  // Get contract address for network
  getContractAddress(chainId: number): string | null {
    return CONTRACT_ADDRESSES[chainId] || null;
  },
};

export default blockchainService;
