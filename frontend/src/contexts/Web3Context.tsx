import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { BrowserProvider } from 'ethers';
import { apiService } from '../services/api';

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
        console.log('✓ Authenticated successfully');
      } else {
        throw new Error('Failed to get authentication token');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  };

  // Connect wallet
  const connect = async () => {
    if (!checkMetaMask()) return;

    // Prevent duplicate connection attempts
    if (isConnectingRef.current || walletState.isConnected) {
      console.log('Connection already in progress or already connected');
      return;
    }

    isConnectingRef.current = true;
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const browserProvider = new BrowserProvider(window.ethereum as any);
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
    } catch (error: any) {
      console.error('Error connecting wallet:', error);

      // Handle MetaMask-specific errors gracefully
      let errorMessage = error.message || 'Failed to connect wallet';

      // If MetaMask is already processing a request, don't show error to user
      if (error.code === 'UNKNOWN_ERROR' && error.error?.code === -32002) {
        console.log('MetaMask is already processing a connection request, ignoring duplicate call');
        errorMessage = ''; // Don't show error for duplicate requests
      } else if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        errorMessage = 'Connection request was rejected';
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
    if (!provider) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // If network doesn't exist, we could add it here
      console.error('Error switching network:', error);
      setWalletState((prev) => ({
        ...prev,
        error: `Failed to switch network: ${error.message}`,
      }));
    }
  };

  // Handle account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
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
          } catch (error: any) {
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

    const handleChainChanged = (chainIdHex: string) => {
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
