import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Web3Provider, useWeb3 } from '../../contexts/Web3Context';
import * as apiService from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getNonce: vi.fn(),
    login: vi.fn(),
  },
}));

// Mock ethers module with inline class definition
vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  
  // Define mock provider class inside the factory
  const MockBrowserProvider = class {
    private ethereum: any;
    
    constructor(ethereum: unknown) {
      this.ethereum = ethereum;
    }
    
    // Delegate to window.ethereum.request so tests can control behavior
    async send(method: string, params?: any[]) {
      if (this.ethereum && this.ethereum.request) {
        return this.ethereum.request({ method, params });
      }
      throw new Error('No ethereum provider');
    }
    
    async getSigner() {
      return {
        signMessage: vi.fn().mockResolvedValue('0xmocksignature'),
        getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      };
    }
    
    async getNetwork() {
      return { chainId: BigInt(1), name: 'mainnet' };
    }
  };
  
  return {
    ...actual,
    BrowserProvider: MockBrowserProvider,
  };
});

// Test component that uses the Web3 context
const TestComponent = () => {
  const { address, chainId, isConnected, isConnecting, error, connect, disconnect } = useWeb3();

  return (
    <div>
      <div data-testid="address">{address || 'No address'}</div>
      <div data-testid="chainId">{chainId || 'No chainId'}</div>
      <div data-testid="isConnected">{String(isConnected)}</div>
      <div data-testid="isConnecting">{String(isConnecting)}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <button onClick={connect} data-testid="connect-btn">Connect</button>
      <button onClick={disconnect} data-testid="disconnect-btn">Disconnect</button>
    </div>
  );
};

describe('Web3Context', () => {
  let mockEthereum: any;
  const mockAddress = '0x1234567890123456789012345678901234567890';
  
  // Shared localStorage mock store 
  let localStorageStore: Record<string, string> = {};
  
  // Create persistent localStorage mock
  const localStorageMock = {
    getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
    removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
    clear: vi.fn(() => { localStorageStore = {}; }),
    length: 0,
    key: vi.fn(() => null),
  };

  beforeAll(() => {
    // Stub localStorage globally
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(async () => {
    // Clear mock call history but keep implementations
    vi.clearAllMocks();
    
    // Reset API mock implementations to avoid test pollution
    vi.mocked(apiService.apiService.getNonce).mockReset();
    vi.mocked(apiService.apiService.login).mockReset();

    // Reset localStorage store
    localStorageStore = {};

    // Mock window.ethereum (MetaMask)
    mockEthereum = {
      request: vi.fn(),
      send: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
      isMetaMask: true,
    };

    // Setup default ethereum responses
    mockEthereum.request.mockImplementation(({ method }: any) => {
      switch (method) {
        case 'eth_chainId':
          return Promise.resolve('0x1');
        case 'net_version':
          return Promise.resolve('1');
        case 'eth_requestAccounts':
          return Promise.resolve([mockAddress]);
        case 'personal_sign':
          return Promise.resolve('0xmocksignature');
        default:
          return Promise.resolve(null);
      }
    });

    (window as any).ethereum = mockEthereum;
  });

  afterEach(() => {
    delete (window as any).ethereum;
    // Don't restore all mocks - we want localStorage to persist
  });

  describe('Initial State', () => {
    it('should render with initial disconnected state', () => {
      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      expect(screen.getByTestId('address')).toHaveTextContent('No address');
      expect(screen.getByTestId('chainId')).toHaveTextContent('No chainId');
      expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
      expect(screen.getByTestId('isConnecting')).toHaveTextContent('false');
    });

    it('should throw error when useWeb3 is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useWeb3 must be used within a Web3Provider');

      consoleSpy.mockRestore();
    });
  });

  describe('Wallet Connection', () => {
    it('should connect wallet successfully', async () => {
      // Set up API mocks
      vi.mocked(apiService.apiService.getNonce).mockResolvedValue({
        success: true,
        message: 'Sign this message to authenticate',
      });

      vi.mocked(apiService.apiService.login).mockResolvedValue({
        success: true,
        token: 'mock-jwt-token',
        address: mockAddress,
      });

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      const connectBtn = screen.getByTestId('connect-btn');

      await act(async () => {
        await userEvent.click(connectBtn);
      });

      // Wait for connection and authentication to complete
      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      }, { timeout: 5000 });

      expect(screen.getByTestId('address')).toHaveTextContent(mockAddress);
      
      // Verify API calls were made
      expect(apiService.apiService.getNonce).toHaveBeenCalledWith(mockAddress);
      expect(apiService.apiService.login).toHaveBeenCalledWith(
        mockAddress, 
        '0xmocksignature', 
        'Sign this message to authenticate'
      );
      
      // Check localStorage was updated
      expect(localStorageStore['authToken']).toBe('mock-jwt-token');
      expect(localStorageStore['walletConnected']).toBe('true');
    });

    it('should handle MetaMask not installed', async () => {
      delete (window as any).ethereum;

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      const connectBtn = screen.getByTestId('connect-btn');

      await act(async () => {
        await userEvent.click(connectBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('MetaMask is not installed');
      });

      expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
    });

    it('should handle user rejection', async () => {
      mockEthereum.request.mockImplementation(({ method }: any) => {
        if (method === 'eth_requestAccounts') {
          return Promise.reject({
            code: 4001,
            message: 'User rejected the request',
          });
        }
        return Promise.resolve(null);
      });

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      const connectBtn = screen.getByTestId('connect-btn');

      await act(async () => {
        await userEvent.click(connectBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('rejected');
      });

      expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
    });

    // Test duplicate connection prevention
    it('should prevent duplicate connection attempts', async () => {
      // Make the connection slow
      let resolveRequest: (value: any) => void;
      mockEthereum.request.mockImplementation(({ method }: any) => {
        if (method === 'eth_requestAccounts') {
          return new Promise(resolve => {
            resolveRequest = resolve;
            // Will be resolved manually
          });
        }
        if (method === 'eth_chainId') {
          return Promise.resolve('0x1');
        }
        if (method === 'net_version') {
          return Promise.resolve('1');
        }
        if (method === 'personal_sign') {
          return Promise.resolve('0xmocksignature');
        }
        return Promise.resolve(null);
      });

      vi.mocked(apiService.apiService.getNonce).mockResolvedValue({
        success: true,
        message: 'Sign this message',
      });

      vi.mocked(apiService.apiService.login).mockResolvedValue({
        success: true,
        token: 'mock-token',
        address: mockAddress,
      });

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      const connectBtn = screen.getByTestId('connect-btn');

      // Click multiple times rapidly
      await act(async () => {
        await userEvent.click(connectBtn);
      });
      
      // Click again while first request is pending
      await act(async () => {
        await userEvent.click(connectBtn);
      });

      // Resolve the first request
      await act(async () => {
        resolveRequest!([mockAddress]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      }, { timeout: 5000 });

      // eth_requestAccounts should only be called once due to duplicate prevention
      const requestAccountsCalls = mockEthereum.request.mock.calls.filter(
        (call: any) => call[0].method === 'eth_requestAccounts'
      );
      expect(requestAccountsCalls.length).toBe(1);
    });
  });

  describe('Wallet Disconnection', () => {
    it('should disconnect wallet successfully', async () => {
      vi.mocked(apiService.apiService.getNonce).mockResolvedValue({
        success: true,
        message: 'Sign this',
      });

      vi.mocked(apiService.apiService.login).mockResolvedValue({
        success: true,
        token: 'mock-token',
        address: mockAddress,
      });

      // Set up initial localStorage state
      localStorageStore['authToken'] = 'existing-token';

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      // Connect first
      await act(async () => {
        await userEvent.click(screen.getByTestId('connect-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      }, { timeout: 5000 });

      // Then disconnect
      await act(async () => {
        await userEvent.click(screen.getByTestId('disconnect-btn'));
      });

      expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
      expect(screen.getByTestId('address')).toHaveTextContent('No address');
      expect(localStorageStore['authToken']).toBeUndefined();
      expect(localStorageStore['walletConnected']).toBeUndefined();
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      const mockMessage = 'Sign this message: 123456';
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

      vi.mocked(apiService.apiService.getNonce).mockResolvedValue({
        success: true,
        message: mockMessage,
      });

      vi.mocked(apiService.apiService.login).mockResolvedValue({
        success: true,
        token: mockToken,
        address: mockAddress,
      });

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      await act(async () => {
        await userEvent.click(screen.getByTestId('connect-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('isConnected')).toHaveTextContent('true');
      }, { timeout: 5000 });

      // Verify authentication flow
      expect(apiService.apiService.getNonce).toHaveBeenCalledWith(mockAddress);
      expect(apiService.apiService.login).toHaveBeenCalledWith(
        mockAddress,
        '0xmocksignature',
        mockMessage
      );
      expect(localStorageStore['authToken']).toBe(mockToken);
    });

    it('should handle authentication failure', async () => {
      vi.mocked(apiService.apiService.getNonce).mockRejectedValue(
        new Error('Backend is down')
      );

      render(
        <Web3Provider>
          <TestComponent />
        </Web3Provider>
      );

      await act(async () => {
        await userEvent.click(screen.getByTestId('connect-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed');
      });

      expect(screen.getByTestId('isConnected')).toHaveTextContent('false');
      // localStorage.getItem returns null in real browsers, but may return undefined in test env
      expect(localStorage.getItem('authToken')).toBeFalsy();
    });
  });
});
