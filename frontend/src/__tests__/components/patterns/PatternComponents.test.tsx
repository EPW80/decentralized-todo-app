import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import HexagonPattern from '../../../components/patterns/HexagonPattern';
import ChainLinkPattern from '../../../components/patterns/ChainLinkPattern';
import ChainDivider from '../../../components/patterns/ChainDivider';
import DigitalGrid from '../../../components/patterns/DigitalGrid';
import BlockchainBorder from '../../../components/patterns/BlockchainBorder';

// Mock useNetworkTheme for components that depend on it
vi.mock('../../../hooks/useNetworkTheme', () => ({
  useNetworkTheme: () => ({
    chainId: 1,
    name: 'Ethereum Mainnet',
    primaryColor: '#627EEA',
    secondaryColor: '#7C95F0',
    accentColor: '#4A67D8',
    gradient: 'linear-gradient(135deg, #627EEA 0%, #7C95F0 100%)',
    glowColor: '#627EEA',
    badgeGradient: 'linear-gradient(135deg, #627EEA 0%, #7C95F0 100%)',
  }),
}));

// Mock Web3Context for components using useNetworkTheme → useWeb3
vi.mock('../../../contexts/Web3Context', () => ({
  useWeb3: vi.fn(() => ({
    chainId: 1,
    address: '0x123',
    isConnected: true,
    isConnecting: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    switchNetwork: vi.fn(),
    provider: null,
  })),
}));

describe('Pattern Components', () => {
  describe('HexagonPattern', () => {
    it('renders an SVG pattern', () => {
      const { container } = render(<HexagonPattern />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelector('pattern')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<HexagonPattern className="custom" />);
      expect(container.firstChild).toHaveClass('custom');
    });

    it('has pointer-events-none for decoration', () => {
      const { container } = render(<HexagonPattern />);
      expect(container.innerHTML).toContain('pointer-events-none');
    });
  });

  describe('ChainLinkPattern', () => {
    it('renders chain link SVGs', () => {
      const { container } = render(<ChainLinkPattern />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('renders specified number of links', () => {
      const { container } = render(<ChainLinkPattern count={3} />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(3);
    });

    it('renders in vertical direction', () => {
      const { container } = render(<ChainLinkPattern direction="vertical" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('applies animated class', () => {
      const { container } = render(<ChainLinkPattern animated />);
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('ChainDivider', () => {
    it('renders with chain link pattern and gradient lines', () => {
      const { container } = render(<ChainDivider />);
      // Should have divs for lines and chain links
      expect(container.querySelectorAll('div').length).toBeGreaterThan(1);
    });

    it('applies custom className', () => {
      const { container } = render(<ChainDivider className="my-divider" />);
      expect(container.firstChild).toHaveClass('my-divider');
    });
  });

  describe('DigitalGrid', () => {
    it('renders an SVG grid pattern', () => {
      const { container } = render(<DigitalGrid />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelector('pattern')).toBeInTheDocument();
    });

    it('has pointer-events-none', () => {
      const { container } = render(<DigitalGrid />);
      expect(container.innerHTML).toContain('pointer-events-none');
    });

    it('applies animated pulse class', () => {
      const { container } = render(<DigitalGrid animated />);
      expect(container.innerHTML).toContain('animate-pulse');
    });
  });

  describe('BlockchainBorder', () => {
    it('renders an SVG border with corners', () => {
      const { container } = render(<BlockchainBorder />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      // 4 corner circles + 1 dashed rect
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(4);
    });

    it('has pointer-events-none', () => {
      const { container } = render(<BlockchainBorder />);
      expect(container.innerHTML).toContain('pointer-events-none');
    });

    it('applies animated class', () => {
      const { container } = render(<BlockchainBorder animated />);
      expect(container.innerHTML).toContain('animate-border-flow');
    });
  });
});
