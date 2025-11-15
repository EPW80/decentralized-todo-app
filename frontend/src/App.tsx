import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen relative">
          {/* Background decoration */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '3s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" style={{ animationDelay: '6s' }}></div>
          </div>

          <div className="relative z-10">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
