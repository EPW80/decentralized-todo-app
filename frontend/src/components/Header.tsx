import React, { useState, useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as FocusTrapReact from 'focus-trap-react';

interface FocusTrapProps {
  focusTrapOptions?: {
    initialFocus?: (() => HTMLElement | undefined) | false;
    allowOutsideClick?: boolean;
    escapeDeactivates?: boolean;
  };
  children?: ReactNode;
}

const FocusTrapComponent: ComponentType<FocusTrapProps> =
  (FocusTrapReact as { default?: ComponentType<FocusTrapProps> }).default ||
  (FocusTrapReact as unknown as ComponentType<FocusTrapProps>);
import WalletConnect from './WalletConnect';
import ThemeToggle from './ThemeToggle';
import { useNetworkTheme } from '../hooks/useNetworkTheme';
import { HexagonPattern, DigitalGrid } from './patterns';

const Header: React.FC = () => {
  const location = useLocation();
  const networkTheme = useNetworkTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={`
        shadow-lg sticky top-0 z-50 animate-fade-in border-b relative overflow-hidden
        transition-all duration-300
        ${
          scrolled
            ? 'glass-frosted border-white/20 backdrop-blur-3xl py-2 shadow-glow'
            : 'glass-effect border-white/30 backdrop-blur-xl py-3'
        }
      `}
    >
      {/* Background patterns */}
      <HexagonPattern opacity={scrolled ? 0.02 : 0.04} size={30} />
      <DigitalGrid opacity={scrolled ? 0.015 : 0.03} gridSize={25} />
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-300 ${
          scrolled ? 'py-2' : 'py-3'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-6 lg:gap-8 min-w-0 flex-shrink">
            <Link to="/" className="flex items-center gap-3 group min-w-0">
              <div className="relative flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-2xl blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-300"
                  style={{ background: networkTheme.gradient }}
                ></div>
                <div
                  className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                  style={{ background: networkTheme.gradient }}
                >
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 hidden sm:block">
                <h1
                  className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent group-hover:scale-105 transition-transform truncate"
                  style={{ backgroundImage: networkTheme.gradient }}
                >
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
                  isActive('/') ? 'shadow-md' : 'text-gray-700'
                }`}
                style={
                  isActive('/')
                    ? {
                        color: networkTheme.primaryColor,
                        backgroundColor: `${networkTheme.primaryColor}15`,
                      }
                    : {}
                }
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Tasks
                </span>
                {isActive('/') && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full shadow-sm"
                    style={{ background: networkTheme.gradient }}
                  ></span>
                )}
              </Link>
              <Link
                to="/analytics"
                className={`relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  isActive('/analytics') ? 'shadow-md' : 'text-gray-700'
                }`}
                style={
                  isActive('/analytics')
                    ? {
                        color: networkTheme.primaryColor,
                        backgroundColor: `${networkTheme.primaryColor}15`,
                      }
                    : {}
                }
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </span>
                {isActive('/analytics') && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full shadow-sm"
                    style={{ background: networkTheme.gradient }}
                  ></span>
                )}
              </Link>
              <Link
                to="/about"
                className={`relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  isActive('/about') ? 'shadow-md' : 'text-gray-700'
                }`}
                style={
                  isActive('/about')
                    ? {
                        color: networkTheme.primaryColor,
                        backgroundColor: `${networkTheme.primaryColor}15`,
                      }
                    : {}
                }
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About
                </span>
                {isActive('/about') && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full shadow-sm"
                    style={{ background: networkTheme.gradient }}
                  ></span>
                )}
              </Link>
            </nav>
          </div>

          {/* Mobile Menu Button and Desktop Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden lg:flex items-center gap-3">
              <ThemeToggle />
              <WalletConnect />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden glass-effect p-2.5 rounded-xl hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <FocusTrapComponent
            focusTrapOptions={{
              initialFocus: () => mobileMenuRef.current?.querySelector('a') || undefined,
              allowOutsideClick: true,
              escapeDeactivates: true,
            }}
          >
            <div
              id="mobile-menu"
              ref={mobileMenuRef}
              className="lg:hidden fixed inset-0 z-50 pt-20"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />

              {/* Menu Panel */}
              <div className="relative glass-effect border-t border-white/20 dark:border-purple-500/20 shadow-2xl animate-slide-in">
                <nav className="p-6 space-y-3" aria-label="Mobile navigation">
                  <Link
                    to="/"
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-base
                      transition-all duration-300 transform hover:scale-[1.02]
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                      ${isActive('/') ? 'shadow-md' : 'text-gray-700 dark:text-gray-300'}
                    `}
                    style={
                      isActive('/')
                        ? {
                            color: networkTheme.primaryColor,
                            backgroundColor: `${networkTheme.primaryColor}15`,
                          }
                        : {}
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Tasks
                  </Link>
                  <Link
                    to="/analytics"
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-base
                      transition-all duration-300 transform hover:scale-[1.02]
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                      ${isActive('/analytics') ? 'shadow-md' : 'text-gray-700 dark:text-gray-300'}
                    `}
                    style={
                      isActive('/analytics')
                        ? {
                            color: networkTheme.primaryColor,
                            backgroundColor: `${networkTheme.primaryColor}15`,
                          }
                        : {}
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics
                  </Link>
                  <Link
                    to="/about"
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-base
                      transition-all duration-300 transform hover:scale-[1.02]
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                      ${isActive('/about') ? 'shadow-md' : 'text-gray-700 dark:text-gray-300'}
                    `}
                    style={
                      isActive('/about')
                        ? {
                            color: networkTheme.primaryColor,
                            backgroundColor: `${networkTheme.primaryColor}15`,
                          }
                        : {}
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About
                  </Link>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-4" role="separator" />

                  {/* Mobile Actions */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Theme</span>
                      <ThemeToggle />
                    </div>
                    <div className="px-4 py-2">
                      <WalletConnect />
                    </div>
                  </div>
                </nav>
              </div>
            </div>
          </FocusTrapComponent>
        )}
      </div>
    </header>
  );
};

export default Header;
