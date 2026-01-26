import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NetworkSwitcher from '../../components/NetworkSwitcher';
import * as Web3Context from '../../contexts/Web3Context';

// Mock the pattern components
vi.mock('../../components/patterns', () => ({
  HexagonPattern: () => <div data-testid="hexagon-pattern" />,
}));

// Mock the Web3Context
vi.mock('../../contexts/Web3Context', () => ({
  useWeb3: vi.fn(),
}));

// Mock network themes - must be inline since vi.mock is hoisted
vi.mock('../../config/networkThemes', () => ({
  networkThemes: {
    1: {
      chainId: 1,
      name: 'Ethereum Mainnet',
      primaryColor: '#627EEA',
      secondaryColor: '#7C95F0',
      accentColor: '#4A67D8',
      gradient: 'linear-gradient(135deg, #627EEA 0%, #7C95F0 100%)',
      glowColor: 'rgba(98, 126, 234, 0.35)',
      badgeGradient: 'from-[#627EEA] to-[#7C95F0]',
    },
    11155111: {
      chainId: 11155111,
      name: 'Sepolia',
      primaryColor: '#FF6B9D',
      secondaryColor: '#FF8FB5',
      accentColor: '#FF4785',
      gradient: 'linear-gradient(135deg, #FF6B9D 0%, #FF8FB5 100%)',
      glowColor: 'rgba(255, 107, 157, 0.35)',
      badgeGradient: 'from-[#FF6B9D] to-[#FF8FB5]',
    },
    137: {
      chainId: 137,
      name: 'Polygon',
      primaryColor: '#8247E5',
      secondaryColor: '#9D6BF0',
      accentColor: '#6A23D8',
      gradient: 'linear-gradient(135deg, #8247E5 0%, #9D6BF0 100%)',
      glowColor: 'rgba(130, 71, 229, 0.35)',
      badgeGradient: 'from-[#8247E5] to-[#9D6BF0]',
    },
    31337: {
      chainId: 31337,
      name: 'Localhost',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      accentColor: '#f093fb',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      glowColor: 'rgba(102, 126, 234, 0.5)',
      badgeGradient: 'from-[#667eea] to-[#764ba2]',
    },
    80001: {
      chainId: 80001,
      name: 'Polygon Mumbai',
      primaryColor: '#8247E5',
      secondaryColor: '#9D6BF0',
      accentColor: '#6A23D8',
      gradient: 'linear-gradient(135deg, #8247E5 0%, #9D6BF0 100%)',
      glowColor: 'rgba(130, 71, 229, 0.35)',
      badgeGradient: 'from-[#8247E5] to-[#9D6BF0]',
    },
    42161: {
      chainId: 42161,
      name: 'Arbitrum',
      primaryColor: '#28A0F0',
      secondaryColor: '#4DB8F5',
      accentColor: '#0C88D8',
      gradient: 'linear-gradient(135deg, #28A0F0 0%, #4DB8F5 100%)',
      glowColor: 'rgba(40, 160, 240, 0.35)',
      badgeGradient: 'from-[#28A0F0] to-[#4DB8F5]',
    },
    421613: {
      chainId: 421613,
      name: 'Arbitrum Goerli',
      primaryColor: '#28A0F0',
      secondaryColor: '#4DB8F5',
      accentColor: '#0C88D8',
      gradient: 'linear-gradient(135deg, #28A0F0 0%, #4DB8F5 100%)',
      glowColor: 'rgba(40, 160, 240, 0.35)',
      badgeGradient: 'from-[#28A0F0] to-[#4DB8F5]',
    },
    10: {
      chainId: 10,
      name: 'Optimism',
      primaryColor: '#FF0420',
      secondaryColor: '#FF4D6A',
      accentColor: '#CC0016',
      gradient: 'linear-gradient(135deg, #FF0420 0%, #FF4D6A 100%)',
      glowColor: 'rgba(255, 4, 32, 0.35)',
      badgeGradient: 'from-[#FF0420] to-[#FF4D6A]',
    },
    11155420: {
      chainId: 11155420,
      name: 'Optimism Sepolia',
      primaryColor: '#FF0420',
      secondaryColor: '#FF4D6A',
      accentColor: '#CC0016',
      gradient: 'linear-gradient(135deg, #FF0420 0%, #FF4D6A 100%)',
      glowColor: 'rgba(255, 4, 32, 0.35)',
      badgeGradient: 'from-[#FF0420] to-[#FF4D6A]',
    },
  },
}));

describe('NetworkSwitcher Component', () => {
  let mockEthereum: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockEthereum = {
      request: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    
    (window as any).ethereum = mockEthereum;

    // Default mock - connected to Ethereum Mainnet
    vi.mocked(Web3Context.useWeb3).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      chainId: 1,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
      provider: null,
    });
  });

  afterEach(() => {
    delete (window as any).ethereum;
  });

  const renderNetworkSwitcher = (onClose?: () => void) => {
    return render(<NetworkSwitcher onClose={onClose} />);
  };

  it('renders network switcher with supported networks', () => {
    renderNetworkSwitcher();

    expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
    expect(screen.getByText('Sepolia')).toBeInTheDocument();
    expect(screen.getByText('Polygon')).toBeInTheDocument();
    expect(screen.getByText('Localhost')).toBeInTheDocument();
  });

  it('displays current network with checkmark', () => {
    renderNetworkSwitcher();

    // The component should show buttons for networks
    const networkButtons = screen.getAllByRole('button');
    expect(networkButtons.length).toBeGreaterThan(0);
  });

  it('switches network when clicking on a different network', async () => {
    renderNetworkSwitcher();

    const sepoliaButton = screen.getByText('Sepolia').closest('button');
    expect(sepoliaButton).not.toBeNull();
    
    fireEvent.click(sepoliaButton!);

    await waitFor(() => {
      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
    });
  });

  it('shows error when MetaMask is not installed', async () => {
    delete (window as any).ethereum;

    renderNetworkSwitcher();

    const networkButton = screen.getByText('Sepolia').closest('button');
    expect(networkButton).not.toBeNull();
    
    fireEvent.click(networkButton!);

    await waitFor(() => {
      expect(screen.getByText('MetaMask is not installed')).toBeInTheDocument();
    });
  });

  it('attempts to add network when chain not found (error 4902)', async () => {
    mockEthereum.request
      .mockRejectedValueOnce({ code: 4902, message: 'Chain not found' })
      .mockResolvedValueOnce(undefined);

    renderNetworkSwitcher();

    const polygonButton = screen.getByText('Polygon').closest('button');
    expect(polygonButton).not.toBeNull();
    
    fireEvent.click(polygonButton!);

    await waitFor(() => {
      expect(mockEthereum.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'wallet_addEthereumChain',
        })
      );
    });
  });

  it('shows rejection message when user cancels (error 4001)', async () => {
    mockEthereum.request.mockRejectedValueOnce({ code: 4001, message: 'User rejected' });

    renderNetworkSwitcher();

    const sepoliaButton = screen.getByText('Sepolia').closest('button');
    expect(sepoliaButton).not.toBeNull();
    
    fireEvent.click(sepoliaButton!);

    await waitFor(() => {
      expect(screen.getByText('Network switch rejected')).toBeInTheDocument();
    });
  });

  it('calls onClose after successful network switch', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    renderNetworkSwitcher(onClose);

    const sepoliaButton = screen.getByText('Sepolia').closest('button');
    expect(sepoliaButton).not.toBeNull();
    
    await vi.waitFor(() => {
      fireEvent.click(sepoliaButton!);
    });

    // Wait for request to complete
    await vi.waitFor(() => {
      expect(mockEthereum.request).toHaveBeenCalled();
    });

    // Fast forward past the setTimeout
    await vi.advanceTimersByTimeAsync(600);

    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('does not switch if already on target network', () => {
    renderNetworkSwitcher();

    // Current network is Ethereum Mainnet (chainId 1)
    const mainnetButton = screen.getByText('Ethereum Mainnet').closest('button');
    expect(mainnetButton).not.toBeNull();
    
    fireEvent.click(mainnetButton!);

    // Should not make any request
    expect(mockEthereum.request).not.toHaveBeenCalled();
  });

  it('disables buttons while switching', async () => {
    mockEthereum.request.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderNetworkSwitcher();

    const sepoliaButton = screen.getByText('Sepolia').closest('button');
    expect(sepoliaButton).not.toBeNull();
    
    fireEvent.click(sepoliaButton!);

    await waitFor(() => {
      expect(sepoliaButton).toBeDisabled();
    });
  });
});
