import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { networkThemes } from '../config/networkThemes';
import { HexagonPattern } from './patterns';
import { toErrorMessage, isErrorWithCode } from '../types/error';

interface NetworkSwitcherProps {
  onClose?: () => void;
}

const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({ onClose }) => {
  const { chainId } = useWeb3();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportedNetworks = [
    { chainId: 1, hexChainId: '0x1' },
    { chainId: 11155111, hexChainId: '0xaa36a7' },
    { chainId: 137, hexChainId: '0x89' },
    { chainId: 80001, hexChainId: '0x13881' },
    { chainId: 42161, hexChainId: '0xa4b1' },
    { chainId: 421613, hexChainId: '0x66eed' },
    { chainId: 10, hexChainId: '0xa' },
    { chainId: 11155420, hexChainId: '0xaa37dc' },
    { chainId: 31337, hexChainId: '0x7a69' },
  ];

  const switchNetwork = async (targetChainId: number, hexChainId: string) => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    if (chainId === targetChainId) {
      return; // Already on this network
    }

    setSwitching(true);
    setError(null);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });

      if (onClose) {
        setTimeout(onClose, 500);
      }
    } catch (err: unknown) {
      console.error('Failed to switch network:', err);

      // If the chain hasn't been added to MetaMask
      if (isErrorWithCode(err) && err.code === 4902) {
        try {
          const theme = networkThemes[targetChainId];
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: theme.name,
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.ankr.com/eth'], // You should configure proper RPC URLs
              },
            ],
          });
        } catch (addError: unknown) {
          setError(`Failed to add network: ${toErrorMessage(addError)}`);
        }
      } else if (isErrorWithCode(err) && err.code === 4001) {
        setError('Network switch rejected');
      } else {
        setError(`Failed to switch network: ${toErrorMessage(err)}`);
      }
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-effect rounded-3xl shadow-glow max-w-2xl w-full max-h-[80vh] overflow-hidden animate-scale-in">
        {/* Background pattern */}
        <HexagonPattern opacity={0.05} size={35} className="rounded-3xl" />

        {/* Header */}
        <div className="relative z-10 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Switch Network
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Select a blockchain network to connect to
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110"
              aria-label="Close"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="relative z-10 mx-6 mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Network grid */}
        <div className="relative z-10 p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportedNetworks.map((network) => {
              const theme = networkThemes[network.chainId];
              const isActive = chainId === network.chainId;

              return (
                <button
                  key={network.chainId}
                  onClick={() => switchNetwork(network.chainId, network.hexChainId)}
                  disabled={switching || isActive}
                  className={`relative group text-left rounded-2xl p-5 transition-all duration-300 transform hover:scale-[1.02] disabled:cursor-not-allowed overflow-hidden ${
                    isActive
                      ? 'ring-4 shadow-lg'
                      : 'glass-effect hover:shadow-xl'
                  }`}
                  style={
                    isActive
                      ? {
                          background: `${theme.primaryColor}10`,
                          borderColor: theme.primaryColor,
                          boxShadow: `0 8px 24px ${theme.glowColor}`,
                        }
                      : {
                          border: `2px solid ${theme.primaryColor}20`,
                        }
                  }
                >
                  {/* Gradient accent */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ background: theme.gradient }}
                  />

                  <div className="relative z-10 flex items-center gap-4">
                    {/* Network icon */}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: theme.gradient }}
                    >
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>

                    {/* Network info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="text-lg font-bold truncate"
                          style={{ color: isActive ? theme.primaryColor : '#374151' }}
                        >
                          {theme.name}
                        </h3>
                        {isActive && (
                          <span className="flex-shrink-0">
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        Chain ID: {network.chainId}
                      </p>

                      {/* Color bar */}
                      <div className="flex gap-1 mt-3">
                        <div
                          className="flex-1 h-1.5 rounded-full"
                          style={{ background: theme.gradient }}
                        />
                        <div
                          className="w-4 h-1.5 rounded-full"
                          style={{ backgroundColor: theme.primaryColor, opacity: 0.7 }}
                        />
                        <div
                          className="w-4 h-1.5 rounded-full"
                          style={{ backgroundColor: theme.secondaryColor, opacity: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-3 right-3">
                      <span className="relative flex h-3 w-3">
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <span
                          className="relative inline-flex rounded-full h-3 w-3"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 p-6 border-t border-gray-200 bg-gray-50/50">
          <p className="text-xs text-gray-600 text-center">
            Switching networks will reload the application and fetch data from the selected blockchain
          </p>
        </div>
      </div>
    </div>
  );
};

export default NetworkSwitcher;
