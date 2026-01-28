import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { BrowserProvider } from 'ethers';
import { apiService } from '../services/api';
import { isErrorWithCode, toErrorMessage } from '../types/error';

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

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const isConnectingRef = useRef(false);

  // Check if MetaMask is installed
  const checkMetaMask = () => {
    if (typeof window.ethereum === 'undefined') {
      setWalletState((prev) => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to use this app.',
      }));
      return false;
    }
    return true;
  };

  // Authenticate with backend
  const authenticate = async (address: string, browserProvider: BrowserProvider) => {
    try {
      // Get nonce from backend
      const nonceResponse = await apiService.getNonce(address);
      const { message } = nonceResponse;

      // Sign the message with wallet
      const signer = await browserProvider.getSigner();
      const signature = await signer.signMessage(message);

      // Send signature to backend to get JWT token
      const loginResponse = await apiService.login(address, signature, message);

      if (loginResponse.success && loginResponse.token) {
        // Store token in localStorage
        localStorage.setItem('authToken', loginResponse.token);
      } else {
        throw new Error('Failed to get authentication token');
      }
    } catch (error: unknown) {
      console.error('Authentication error:', error);
      throw new Error(`Authentication failed: ${toErrorMessage(error)}`);
    }
  };

  // Connect wallet
  const connect = async () => {
    if (!checkMetaMask()) return;

    // Prevent duplicate connection attempts - check both ref and state
    if (isConnectingRef.current) {
      console.debug('Connection already in progress (ref), skipping duplicate request');
      return;
    }
    
    if (walletState.isConnecting) {
      console.debug('Connection already in progress (state), skipping duplicate request');
      return;
    }
    
    if (walletState.isConnected) {
      console.debug('Already connected, skipping connection request');
      return;
    }

    isConnectingRef.current = true;
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const browserProvider = new BrowserProvider(window.ethereum!);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();

      // Authenticate with backend to get JWT token
      await authenticate(accounts[0], browserProvider);

      setProvider(browserProvider);
      setWalletState({
        address: accounts[0],
        chainId: Number(network.chainId),
        isConnecting: false,
        isConnected: true,
        error: null,
      });

      // Store connection state
      localStorage.setItem('walletConnected', 'true');
    } catch (error: unknown) {
      // Handle MetaMask-specific errors gracefully
      let errorMessage = toErrorMessage(error);
      let shouldLog = true;

      // Check for "already processing" error (-32002) in various possible locations
      const isAlreadyProcessingError = (err: unknown): boolean => {
        if (!err || typeof err !== 'object') return false;
        
        // Direct code check
        if ('code' in err && err.code === -32002) return true;
        
        // Nested error check (ethers.js wrapping)
        if ('error' in err && typeof err.error === 'object' && err.error !== null) {
          if ('code' in err.error && err.error.code === -32002) return true;
        }
        
        // Check in info object (newer ethers.js versions)
        if ('info' in err && typeof err.info === 'object' && err.info !== null) {
          const info = err.info as Record<string, unknown>;
          if ('error' in info && typeof info.error === 'object' && info.error !== null) {
            if ('code' in (info.error as object) && (info.error as { code?: number }).code === -32002) return true;
          }
        }
        
        // Check message for the error text as fallback
        if ('message' in err && typeof err.message === 'string') {
          if (err.message.includes('Already processing eth_requestAccounts')) return true;
        }
        
        return false;
      };

      if (isAlreadyProcessingError(error)) {
        // Don't show error for duplicate requests - silently ignore
        errorMessage = '';
        shouldLog = false;
      } else if (isErrorWithCode(error)) {
        if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
          errorMessage = 'Connection request was rejected';
        }
      }

      // Only log errors that are unexpected
      if (shouldLog) {
        console.error('Error connecting wallet:', error);
      }

      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMessage || null,
      }));
    } finally {
      isConnectingRef.current = false;
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setWalletState({
      address: null,
      chainId: null,
      isConnecting: false,
      isConnected: false,
      error: null,
    });
    setProvider(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('authToken');
  };

  // Switch network
  const switchNetwork = async (chainId: number) => {
    if (!provider || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: unknown) {
      // If network doesn't exist, we could add it here
      console.error('Error switching network:', error);
      setWalletState((prev) => ({
        ...prev,
        error: `Failed to switch network: ${toErrorMessage(error)}`,
      }));
    }
  };

  // Handle account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else {
        // Re-authenticate with new account
        if (provider) {
          try {
            await authenticate(accounts[0], provider);
            setWalletState((prev) => ({
              ...prev,
              address: accounts[0],
            }));
          } catch (error: unknown) {
            console.error('Re-authentication failed:', error);
            setWalletState((prev) => ({
              ...prev,
              error: 'Failed to authenticate with new account',
            }));
          }
        } else {
          setWalletState((prev) => ({
            ...prev,
            address: accounts[0],
          }));
        }
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainIdHex = args[0] as string;
      const newChainId = parseInt(chainIdHex, 16);
      setWalletState((prev) => ({
        ...prev,
        chainId: newChainId,
      }));
    };

    const handleDisconnect = () => {
      disconnect();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
      window.ethereum?.removeListener('disconnect', handleDisconnect);
    };
  }, [provider]);

  // Auto-connect if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true' && checkMetaMask() && !walletState.isConnected && !isConnectingRef.current) {
      // Add a small delay to let the UI stabilize and avoid race conditions
      const timeoutId = setTimeout(() => {
        if (!isConnectingRef.current && !walletState.isConnected) {
          connect();
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: Web3ContextType = {
    ...walletState,
    connect,
    disconnect,
    switchNetwork,
    provider,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
