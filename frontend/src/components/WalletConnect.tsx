import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { blockchainService } from '../services/blockchain';
import { useNetworkTheme } from '../hooks/useNetworkTheme';
import { HexagonPattern, NetworkNodes } from './patterns';
import NetworkSwitcher from './NetworkSwitcher';
import { ActiveGlow } from './glass';
import CopyButton from './CopyButton';
import Tooltip from './Tooltip';

const WalletConnect: React.FC = () => {
  const { address, chainId, isConnecting, isConnected, error, connect, disconnect } = useWeb3();
  const [showError, setShowError] = useState(false);
  const [showNetworkSwitcher, setShowNetworkSwitcher] = useState(false);
  const networkTheme = useNetworkTheme();

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getNetworkName = (id: number) => {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      31337: 'Localhost',
      11155111: 'Sepolia',
      80001: 'Polygon Mumbai',
      421613: 'Arbitrum Goerli',
      11155420: 'Optimism Sepolia',
    };
    return networks[id] || `Chain ${id}`;
  };

  const isSupported = chainId ? blockchainService.isSupportedNetwork(chainId) : false;

  return (
    <>
      {/* Network Switcher Modal */}
      {showNetworkSwitcher && (
        <NetworkSwitcher onClose={() => setShowNetworkSwitcher(false)} />
      )}

      {/* Error Modal Overlay */}
      {error && showError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowError(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative glass-effect border-2 border-red-400 rounded-3xl shadow-glow max-w-md w-full animate-scale-in overflow-hidden">
            {/* Background patterns */}
            <HexagonPattern opacity={0.05} size={35} className="rounded-3xl" color="#ef4444" />
            <NetworkNodes nodeCount={8} animated={true} color="#ef4444" className="rounded-3xl" />
            <div className="p-8 relative z-10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Connection Error</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{error}</p>
                </div>

                <button
                  onClick={() => setShowError(false)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110"
                  aria-label="Close"
                  title="Close"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setShowError(false)}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {!isConnected ? (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="group relative text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transform"
            style={{
              background: isConnected ? networkTheme.gradient : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: isConnected ? `0 10px 40px ${networkTheme.glowColor}` : undefined,
            }}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 40 40" fill="none">
                <path d="M32.8 5.2L20 14.4l2.4-5.6 10.4-3.6z" fill="#E17726" stroke="#E17726" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.2 5.2l12.4 9.6-2-5.6L7.2 5.2zM28 28.8l-3.2 4.8 6.8 1.6 2-6.4-5.6-.8zM6.4 29.6l2 6.4 6.8-1.6-3.2-4.8h-5.6z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.8 17.6l-1.6 2.8 6.8.4v-7.2l-5.2 4zM25.2 17.6l-5.2-4.4v7.2l6.8-.4-1.6-2.4zM15.2 33.6l4-2-3.6-2.8-.4 4.8zM20.8 31.6l4 2-.4-4.8-3.6 2.8z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24.8 33.6l-4-2 .4 2.8v1.2l3.6-2zM15.2 33.6l3.6 2v-1.2l.4-2.8-4 2z" fill="#D5BFB2" stroke="#D5BFB2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.8 26l-3.6-1.2 2.4-1.2 1.2 2.4zM21.2 26l1.2-2.4 2.4 1.2-3.6 1.2z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.2 33.6l.4-4.8-4 .4 3.6 4.4zM24.4 28.8l.4 4.8 3.6-4.4-4-.4zM26.8 20.4l-6.8.4.8 3.2 1.2-2.4 2.4 1.2 2.4-2.4zM15.2 22.8l2.4-1.2 1.2 2.4.8-3.2-6.8-.4 2.4 2.4z" fill="#CC6228" stroke="#CC6228" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.2 20.4l2.4 4.8-.4-2.4-2-2.4zM24.4 22.8l-.4 2.4 2.4-4.8-2 2.4zM19.2 20.8l-.8 3.2.8 4.4.4-5.2-.4-2.4zM20.8 20.8l-.4 2.4.4 5.2.8-4.4-.8-3.2z" fill="#E27525" stroke="#E27525" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21.2 26l-.8 4.4.8.4 3.6-2.8.4-2.4-3.6.4zM15.2 25.6l.4 2.4 3.6 2.8.8-.4-.8-4.4-3.6-.4z" fill="#F5841F" stroke="#F5841F" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21.2 35.6v-1.2l-.4-.4h-1.6l-.4.4v1.2l-3.6-2 1.2 1.2 2.8 2h1.6l2.8-2 1.2-1.2-3.6 2z" fill="#C0AC9D" stroke="#C0AC9D" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.8 31.6l-.8-.4h-1.6l-.8.4-.4 2.8.4-.4h1.6l.4.4-.4-2.8z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M33.6 15.2l1.2-5.6-2-5.6-10.4 7.6 4 3.2 5.6 1.6 1.2-1.6-.8-.4.8-.8-.8-.4.8-.8-.4-.4zM5.2 9.6l1.2 5.6-.4.4.8.8-.8.4.8.8-.8.4 1.2 1.6 5.6-1.6 4-3.2-10.4-7.6-2 5.6z" fill="#763E1A" stroke="#763E1A" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M32 18.4l-5.6-1.6 1.6 2.4-2.4 4.8 3.2-.4h4.8l-1.6-5.2zM14.4 16.8l-5.6 1.6-1.6 5.2h4.8l3.2.4-2.4-4.8 1.6-2.4zM20.8 20.8l.4-6.4 1.6-4.4h-6.4l1.6 4.4.4 6.4.4 2.4v5.2h1.6v-5.2l.4-2.4z" fill="#F5841F" stroke="#F5841F" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm">{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </div>
            {isConnecting && (
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
            )}
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5 animate-slide-in">
            {/* Enhanced Network Badge with Switcher */}
            <button
              onClick={() => setShowNetworkSwitcher(true)}
              className="group relative px-4 py-2.5 rounded-xl shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden"
              style={{
                background: networkTheme.gradient,
                boxShadow: `0 4px 16px ${networkTheme.glowColor}`,
              }}
            >
              {/* Animated shimmer effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                  animation: 'shimmer 2s infinite',
                }}
              />

              <div className="relative z-10 flex items-center gap-2.5">
                {/* Status indicator */}
                <div className="relative flex items-center justify-center">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: '#ffffff',
                      boxShadow: '0 0 8px rgba(255, 255, 255, 0.9)',
                    }}
                  />
                  <span
                    className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: '#ffffff' }}
                  />
                </div>

                {/* Network name */}
                <span className="text-white font-bold text-sm">
                  {chainId && getNetworkName(chainId)}
                </span>

                {/* Network icon */}
                <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>

                {/* Switch icon */}
                <svg className="w-4 h-4 text-white/70 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>

              {/* Unsupported network warning */}
              {!isSupported && chainId && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>

            {/* Address Display with Copy and Hover Preview */}
            <ActiveGlow
              active={isConnected && isSupported}
              intensity="normal"
              color="custom"
              customColor={networkTheme.glowColor}
              pulse={false}
            >
              <Tooltip content={address || ''} position="bottom" delay={200}>
                <div className="glass-effect px-4 py-2.5 rounded-xl shadow-sm transition-all duration-300 group hover:scale-[1.02]">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200"
                      style={{ background: networkTheme.gradient }}
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>

                    <CopyButton
                      text={address || ''}
                      displayText={address ? formatAddress(address) : undefined}
                      variant="both"
                      className="text-sm"
                    />
                  </div>
                </div>
              </Tooltip>
            </ActiveGlow>

            {/* Disconnect Button */}
            <button
              onClick={disconnect}
              className="glass-effect hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 text-gray-700 hover:text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-glow transition-all duration-300 group transform hover:scale-[1.02] active:scale-[0.98]"
              title="Disconnect Wallet"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden md:inline text-sm">Disconnect</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default WalletConnect;
