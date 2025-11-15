import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider } from 'ethers';

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

  // Connect wallet
  const connect = async () => {
    if (!checkMetaMask()) return;

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const browserProvider = new BrowserProvider(window.ethereum as any);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();

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
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
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

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setWalletState((prev) => ({
          ...prev,
          address: accounts[0],
        }));
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
  }, []);

  // Auto-connect if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true' && checkMetaMask()) {
      connect();
    }
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
