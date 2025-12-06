import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Analytics from './pages/Analytics';
import { useNetworkTheme } from './hooks/useNetworkTheme';

const AppContent: React.FC = () => {
  const networkTheme = useNetworkTheme();

  return (
    <div className="min-h-screen relative">
      {/* Background decoration with network-specific colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float dark:mix-blend-screen dark:opacity-30"
          style={{ backgroundColor: networkTheme.primaryColor }}
        ></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float dark:mix-blend-screen dark:opacity-30"
          style={{ backgroundColor: networkTheme.secondaryColor, animationDelay: '3s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float dark:mix-blend-screen dark:opacity-25"
          style={{ backgroundColor: networkTheme.accentColor, animationDelay: '6s' }}
        ></div>
      </div>

      <div className="relative z-10">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <Router>
          <AppContent />
        </Router>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
