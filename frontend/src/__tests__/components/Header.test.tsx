import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Header from '../../components/Header';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the pattern components
vi.mock('../../components/patterns', () => ({
  HexagonPattern: () => <div data-testid="hexagon-pattern" />,
  DigitalGrid: () => <div data-testid="digital-grid" />,
}));

// Mock WalletConnect and ThemeToggle
vi.mock('../../components/WalletConnect', () => ({
  default: () => <div data-testid="wallet-connect">WalletConnect</div>,
}));

vi.mock('../../components/ThemeToggle', () => ({
  default: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}));

// Mock useNetworkTheme hook
vi.mock('../../hooks/useNetworkTheme', () => ({
  useNetworkTheme: () => ({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    accentColor: '#f093fb',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glowColor: 'rgba(102, 126, 234, 0.5)',
    name: 'Ethereum',
  }),
}));

const renderHeader = (route = '/') => {
  window.history.pushState({}, 'Test page', route);

  return render(
    <BrowserRouter>
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  let scrollYSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    scrollYSpy = vi.spyOn(window, 'scrollY', 'get');
    scrollYSpy.mockReturnValue(0);
  });

  afterEach(() => {
    scrollYSpy.mockRestore();
  });

  it('renders the logo and title', () => {
    renderHeader();

    expect(screen.getByText('Decentralized Todo')).toBeInTheDocument();
    expect(screen.getByText('Powered by Blockchain')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderHeader();

    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders WalletConnect and ThemeToggle components', () => {
    renderHeader();

    expect(screen.getByTestId('wallet-connect')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('highlights active navigation item based on route', () => {
    // Render with home route
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    );

    const tasksLink = screen.getByText('Tasks').closest('a');
    expect(tasksLink).toHaveStyle({ color: '#667eea' });

    unmount();

    // Render with analytics route
    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    );

    const analyticsLink = screen.getByText('Analytics').closest('a');
    expect(analyticsLink).toHaveStyle({ color: '#667eea' });
  });

  it('applies scrolled class when scrolled past threshold', () => {
    const { container } = renderHeader();

    // Simulate scroll
    scrollYSpy.mockReturnValue(50);
    fireEvent.scroll(window);

    const header = container.querySelector('header');
    expect(header).toHaveClass('glass-frosted');
  });

  it('renders background patterns', () => {
    renderHeader();

    expect(screen.getByTestId('hexagon-pattern')).toBeInTheDocument();
    expect(screen.getByTestId('digital-grid')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderHeader();

    const navLinks = screen.getAllByRole('link');
    expect(navLinks.length).toBeGreaterThan(0);
    navLinks.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });
});
