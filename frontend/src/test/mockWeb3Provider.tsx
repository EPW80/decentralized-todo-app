import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { BrowserProvider } from 'ethers';
import { vi } from 'vitest';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

interface Web3ContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  provider: BrowserProvider | null;
}

const MockWeb3Context = createContext<Web3ContextType | undefined>(undefined);

export const useMockWeb3 = () => {
  const context = useContext(MockWeb3Context);
  if (!context) {
    throw new Error('useMockWeb3 must be used within a MockWeb3Provider');
  }
  return context;
};

interface MockWeb3ProviderProps {
  children: ReactNode;
  value?: Partial<Web3ContextType>;
}

export const MockWeb3Provider: React.FC<MockWeb3ProviderProps> = ({
  children,
  value = {}
}) => {
  const defaultValue: Web3ContextType = {
    address: '0x1234567890123456789012345678901234567890',
    chainId: 1,
    isConnecting: false,
    isConnected: true,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    switchNetwork: vi.fn(),
    provider: null,
    ...value,
  };

  return (
    <MockWeb3Context.Provider value={defaultValue}>
      {children}
    </MockWeb3Context.Provider>
  );
};

// Mock the useWeb3 hook for tests
export const createMockUseWeb3 = (overrides: Partial<Web3ContextType> = {}) => ({
  address: '0x1234567890123456789012345678901234567890',
  chainId: 1,
  isConnecting: false,
  isConnected: true,
  error: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  switchNetwork: vi.fn(),
  provider: null,
  ...overrides,
});

// Create a mock ethereum provider for window.ethereum
export const createMockEthereum = (overrides: Record<string, unknown> = {}) => ({
  request: vi.fn().mockImplementation(({ method }: { method: string }) => {
    switch (method) {
      case 'eth_chainId':
        return Promise.resolve('0x1');
      case 'eth_requestAccounts':
        return Promise.resolve(['0x1234567890123456789012345678901234567890']);
      case 'net_version':
        return Promise.resolve('1');
      default:
        return Promise.resolve(null);
    }
  }),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
  ...overrides,
});

// Create a mock BrowserProvider for ethers.js
export const createMockBrowserProvider = (overrides: Record<string, unknown> = {}) => ({
  send: vi.fn().mockImplementation((method: string) => {
    if (method === 'eth_requestAccounts') {
      return Promise.resolve(['0x1234567890123456789012345678901234567890']);
    }
    return Promise.resolve(null);
  }),
  getNetwork: vi.fn().mockResolvedValue({ chainId: 1n, name: 'mainnet' }),
  getSigner: vi.fn().mockResolvedValue({
    signMessage: vi.fn().mockResolvedValue('0xmocksignature'),
    getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
  }),
  getFeeData: vi.fn().mockResolvedValue({
    gasPrice: BigInt(30000000000), // 30 Gwei
    maxFeePerGas: BigInt(35000000000),
    maxPriorityFeePerGas: BigInt(2000000000),
  }),
  getBlockNumber: vi.fn().mockResolvedValue(1000),
  getBlock: vi.fn().mockImplementation((blockNumber: number) =>
    Promise.resolve({
      number: blockNumber,
      timestamp: Date.now() / 1000 - (1000 - blockNumber) * 12,
      transactions: ['0x123', '0x456'],
    })
  ),
  on: vi.fn(),
  off: vi.fn(),
  ...overrides,
});
