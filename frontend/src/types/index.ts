export interface Todo {
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

export interface Network {
  chainId: number;
  name: string;
  rpcUrl?: string;
  contractAddress?: string;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

export interface UserStats {
  total: number;
  completed: number;
  active: number;
  completionRate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
