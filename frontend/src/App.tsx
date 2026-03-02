import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import SkipToContent from './components/SkipToContent';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { useNetworkTheme } from './hooks/useNetworkTheme';

// Code-split route components for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Analytics = lazy(() => import('./pages/Analytics'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
        <SkipToContent />
        <Header />
        <main id="main-content" tabIndex={-1}>
          <ErrorBoundary
            onError={(error, errorInfo) => {
              // Log errors in development
              if (import.meta.env.DEV) {
                console.error('Application Error:', error);
                console.error('Error Info:', errorInfo);
              }
              // In production, send to error tracking service
              // Example: Sentry.captureException(error, { extra: errorInfo });
            }}
            onReset={() => {
              // Optional: Clear error state or perform cleanup
              console.log('Error boundary reset');
            }}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="glass-effect rounded-2xl p-8">
                    <LoadingSpinner size="lg" message="Loading page..." variant="blockchain" />
                  </div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/analytics" element={<Analytics />} />
                {/* 404 Not Found - Catch all unmatched routes */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
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
