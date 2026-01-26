// Re-export todo-related types from todo.ts
export type { Todo, UserStats, ApiResponse } from './todo';

// Re-export error types and utilities
export type { ErrorWithMessage, ErrorWithCode, EthereumError } from './error';
export {
  isErrorWithMessage,
  isErrorWithCode,
  isEthereumError,
  toErrorMessage,
  getErrorCode,
} from './error';

// Other application types
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
