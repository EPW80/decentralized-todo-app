import React from 'react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen relative py-12">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-scale-in">
          <div className="inline-flex items-center gap-3 glass-effect px-6 py-3 rounded-full shadow-glow-sm mb-6">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-gray-700">Powered by Blockchain Technology</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            About This Project
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            A fully decentralized task management application combining blockchain permanence with modern performance
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6 animate-slide-in">
          {/* What is this */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-glow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">What is this?</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              A fully decentralized task management application that stores todos on the Ethereum blockchain while maintaining fast performance through MongoDB caching. Every task you create is immutably stored on-chain, ensuring true ownership and data permanence.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card group hover:scale-105">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-gray-800">Wallet Authentication</h3>
              </div>
              <p className="text-gray-600 text-sm">No passwords needed. Your wallet is your identity.</p>
            </div>

            <div className="card group hover:scale-105">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-gray-800">Lightning Fast</h3>
              </div>
              <p className="text-gray-600 text-sm">Hybrid architecture ensures instant UI updates.</p>
            </div>

            <div className="card group hover:scale-105">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-gray-800">Multi-Chain</h3>
              </div>
              <p className="text-gray-600 text-sm">Deploy on Ethereum, Polygon, Arbitrum, and more.</p>
            </div>

            <div className="card group hover:scale-105">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-gray-800">Verifiable</h3>
              </div>
              <p className="text-gray-600 text-sm">All data is transparent and verifiable on-chain.</p>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center shadow-glow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Technology Stack</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
                <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  Smart Contracts
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Solidity 0.8.20
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Hardhat
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    OpenZeppelin
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">🔧</span>
                  Backend
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Node.js & Express
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    MongoDB & Mongoose
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    ethers.js v6
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  Frontend
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    React & TypeScript
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Vite
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    TailwindCSS
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">⛓️</span>
                  Blockchain
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    Ethereum Sepolia
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    Polygon Mumbai
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    Arbitrum Goerli
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 gradient-success rounded-xl flex items-center justify-center shadow-glow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">How It Works</h2>
            </div>
            <div className="space-y-4">
              {[
                { step: 1, text: 'Connect your MetaMask wallet to authenticate', icon: '🔐' },
                { step: 2, text: 'Create a task - it\'s written to the blockchain', icon: '📝' },
                { step: 3, text: 'Backend event listeners detect the transaction', icon: '👂' },
                { step: 4, text: 'Task is cached in MongoDB for fast queries', icon: '⚡' },
                { step: 5, text: 'Complete or delete tasks with blockchain transactions', icon: '✅' },
                { step: 6, text: 'All changes are synchronized automatically', icon: '🔄' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                  <div className="flex-shrink-0 w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {item.step}
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-gray-700 font-medium">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="glass-effect-dark rounded-2xl p-8 text-center border-2 border-purple-200">
            <p className="text-gray-600 leading-relaxed">
              Built as a demonstration of <span className="font-bold text-purple-600">hybrid blockchain architecture</span> combining on-chain permanence with off-chain performance optimization.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-600">System operational and ready for tasks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
