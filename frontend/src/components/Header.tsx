import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnect from './WalletConnect';

const Header: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="glass-effect shadow-lg sticky top-0 z-50 animate-fade-in border-b border-white/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-6 lg:gap-8 min-w-0 flex-shrink">
            <Link to="/" className="flex items-center gap-3 group min-w-0">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 gradient-primary rounded-2xl blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 gradient-primary rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform truncate">
                  Decentralized Todo
                </h1>
                <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.8)]"></span>
                  Powered by Blockchain
                </p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to="/"
                className={`relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  isActive('/')
                    ? 'text-purple-600 bg-purple-50 shadow-md'
                    : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Tasks
                </span>
                {isActive('/') && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 gradient-primary rounded-full shadow-sm"></span>
                )}
              </Link>
              <Link
                to="/about"
                className={`relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  isActive('/about')
                    ? 'text-purple-600 bg-purple-50 shadow-md'
                    : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About
                </span>
                {isActive('/about') && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 gradient-primary rounded-full shadow-sm"></span>
                )}
              </Link>
            </nav>
          </div>

          {/* Wallet Connect */}
          <div className="flex-shrink-0">
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
