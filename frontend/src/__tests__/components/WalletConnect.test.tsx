import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import WalletConnect from '../../components/WalletConnect';
import { useWeb3 } from '../../contexts/Web3Context';
import { createMockUseWeb3, createMockEthereum } from '../../test/mockWeb3Provider';

// Mock the Web3Context
vi.mock('../../contexts/Web3Context', () => ({
  useWeb3: vi.fn(),
}));

// Mock blockchain service
vi.mock('../../services/blockchain', () => ({
  blockchainService: {
    isSupportedNetwork: vi.fn(() => true),
  },
}));

// Mock network theme hook
vi.mock('../../hooks/useNetworkTheme', () => ({
  useNetworkTheme: () => ({
    chainId: 1,
    name: 'Ethereum Mainnet',
    primaryColor: '#627EEA',
    secondaryColor: '#7C95F0',
    accentColor: '#4A67D8',
    gradient: 'linear-gradient(135deg, #627EEA 0%, #7C95F0 100%)',
    glowColor: 'rgba(98, 126, 234, 0.35)',
    badgeGradient: 'from-[#627EEA] to-[#7C95F0]',
  }),
}));

// Mock decorative/child components as passthroughs
vi.mock('../../components/patterns', () => ({
  HexagonPattern: () => <div data-testid="hexagon-pattern" />,
  NetworkNodes: () => <div data-testid="network-nodes" />,
}));

vi.mock('../../components/glass', () => ({
  ActiveGlow: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../components/NetworkSwitcher', () => ({
  default: () => <div data-testid="network-switcher" />,
}));

vi.mock('../../components/CopyButton', () => ({
  default: ({ text }: { text: string }) => <span data-testid="copy-button">{text}</span>,
}));

vi.mock('../../components/Tooltip', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('WalletConnect - Logout Button', () => {
  const mockUseWeb3 = vi.mocked(useWeb3);

  beforeEach(() => {
    vi.clearAllMocks();
    // MetaMask installed by default
    Object.defineProperty(window, 'ethereum', {
      value: createMockEthereum(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as { ethereum?: unknown }).ethereum;
  });

  it('renders the logout button with visible label when connected', () => {
    mockUseWeb3.mockReturnValue(createMockUseWeb3({ isConnected: true }));
    render(<WalletConnect />);

    const button = screen.getByTestId('logout-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName('Logout & disconnect wallet');
    expect(button).toHaveTextContent('Logout');

    // Label must not be hidden behind a responsive class (mobile visibility fix)
    const label = screen.getByText('Logout');
    expect(label.className).not.toContain('hidden');
  });

  it('does not render the logout button when disconnected', () => {
    mockUseWeb3.mockReturnValue(
      createMockUseWeb3({ isConnected: false, address: null, chainId: null })
    );
    render(<WalletConnect />);

    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('does not call disconnect on first click; arms confirm state instead', () => {
    const mock = createMockUseWeb3({ isConnected: true });
    mockUseWeb3.mockReturnValue(mock);
    render(<WalletConnect />);

    const button = screen.getByTestId('logout-button');
    fireEvent.click(button);

    expect(mock.disconnect).not.toHaveBeenCalled();
    expect(button).toHaveTextContent('Confirm logout?');
    expect(button).toHaveAccessibleName('Confirm logout');
  });

  it('calls disconnect exactly once on second click', () => {
    const mock = createMockUseWeb3({ isConnected: true });
    mockUseWeb3.mockReturnValue(mock);
    render(<WalletConnect />);

    const button = screen.getByTestId('logout-button');
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mock.disconnect).toHaveBeenCalledTimes(1);
  });

  it('auto-reverts the confirm state after 4 seconds without calling disconnect', () => {
    vi.useFakeTimers();
    const mock = createMockUseWeb3({ isConnected: true });
    mockUseWeb3.mockReturnValue(mock);
    render(<WalletConnect />);

    const button = screen.getByTestId('logout-button');
    fireEvent.click(button);
    expect(button).toHaveTextContent('Confirm logout?');

    act(() => {
      vi.advanceTimersByTime(4100);
    });

    expect(button).toHaveTextContent('Logout');
    expect(mock.disconnect).not.toHaveBeenCalled();
  });

  it('cancels the confirm state on blur', () => {
    const mock = createMockUseWeb3({ isConnected: true });
    mockUseWeb3.mockReturnValue(mock);
    render(<WalletConnect />);

    const button = screen.getByTestId('logout-button');
    fireEvent.click(button);
    expect(button).toHaveTextContent('Confirm logout?');

    fireEvent.blur(button);

    expect(button).toHaveTextContent('Logout');
    expect(mock.disconnect).not.toHaveBeenCalled();
  });
});
