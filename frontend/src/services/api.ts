import axios from 'axios';

// Type definitions
interface Todo {
  _id: string;
  blockchainId: string;
  chainId: number;
  transactionHash: string;
  owner: string;
  description: string;
  completed: boolean;
  blockchainCreatedAt: string;
  blockchainCompletedAt: string | null;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncedAt: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  total: number;
  completed: number;
  active: number;
  completionRate: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth tokens if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Health check
  async getHealth() {
    const response = await api.get('/health');
    return response.data;
  },

  // Authentication
  async getNonce(address: string) {
    const response = await api.get(`/auth/nonce/${address}`);
    return response.data;
  },

  async login(address: string, signature: string, message: string) {
    const response = await api.post('/auth/login', {
      address,
      signature,
      message,
    });
    return response.data;
  },

  // Get todos by address
  async getTodosByAddress(
    address: string,
    includeCompleted: boolean = true,
    includeDeleted: boolean = false
  ): Promise<ApiResponse<Todo[]>> {
    const response = await api.get(`/todos/${address}`, {
      params: { includeCompleted, includeDeleted },
    });
    return response.data;
  },

  // Get specific todo by ID
  async getTodoById(id: string): Promise<ApiResponse<Todo>> {
    const response = await api.get(`/todos/todo/${id}`);
    return response.data;
  },

  // Verify todo against blockchain
  async verifyTodo(id: string) {
    const response = await api.get(`/todos/verify/${id}`);
    return response.data;
  },

  // Get user statistics
  async getUserStats(address: string): Promise<ApiResponse<UserStats>> {
    const response = await api.get(`/todos/${address}/stats`);
    return response.data;
  },

  // Sync todo from blockchain
  async syncTodoFromBlockchain(chainId: number, blockchainId: string): Promise<ApiResponse<Todo>> {
    const response = await api.post('/todos/sync', {
      chainId,
      blockchainId,
    });
    return response.data;
  },
};

export default apiService;
