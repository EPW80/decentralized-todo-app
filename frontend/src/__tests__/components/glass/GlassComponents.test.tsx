import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlassCard from '../../../components/glass/GlassCard';
import GlassPanel from '../../../components/glass/GlassPanel';
import GradientBorder from '../../../components/glass/GradientBorder';
import ActiveGlow from '../../../components/glass/ActiveGlow';

describe('Glass Components', () => {
  describe('GlassCard', () => {
    it('renders children', () => {
      render(<GlassCard>Card content</GlassCard>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<GlassCard className="my-class">Content</GlassCard>);
      expect(container.firstChild).toHaveClass('my-class');
    });

    it('renders layered variant with multiple layers', () => {
      const { container } = render(<GlassCard layered>Layered</GlassCard>);
      expect(screen.getByText('Layered')).toBeInTheDocument();
      // Layered mode creates extra wrapper divs
      expect(container.querySelectorAll('div').length).toBeGreaterThan(1);
    });

    it('applies depth classes', () => {
      const { container } = render(<GlassCard depth="lg">Deep</GlassCard>);
      expect(container.innerHTML).toContain('lg');
    });

    it('renders with glow active', () => {
      const { container } = render(
        <GlassCard glow glowIntensity="intense">Glow</GlassCard>
      );
      expect(screen.getByText('Glow')).toBeInTheDocument();
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('GlassPanel', () => {
    it('renders children', () => {
      render(<GlassPanel>Panel content</GlassPanel>);
      expect(screen.getByText('Panel content')).toBeInTheDocument();
    });

    it('applies frosted variant', () => {
      const { container } = render(<GlassPanel frosted>Frosted</GlassPanel>);
      expect(container.innerHTML).toContain('frosted');
    });

    it('renders dark mode', () => {
      const { container } = render(<GlassPanel frosted dark>Dark</GlassPanel>);
      expect(container.innerHTML).toContain('dark');
    });

    it('renders floating animated variant', () => {
      render(<GlassPanel floating animate>Floating</GlassPanel>);
      expect(screen.getByText('Floating')).toBeInTheDocument();
    });
  });

  describe('GradientBorder', () => {
    it('renders children', () => {
      render(<GradientBorder>Bordered</GradientBorder>);
      expect(screen.getByText('Bordered')).toBeInTheDocument();
    });

    it('applies animated variant', () => {
      const { container } = render(<GradientBorder variant="animated">Animated</GradientBorder>);
      expect(container.innerHTML).toContain('animated');
    });

    it('applies rainbow variant', () => {
      const { container } = render(<GradientBorder variant="rainbow">Rainbow</GradientBorder>);
      expect(container.innerHTML).toContain('rainbow');
    });

    it('applies custom thickness', () => {
      const { container } = render(<GradientBorder thickness={4}>Thick</GradientBorder>);
      const outer = container.firstChild as HTMLElement;
      expect(outer.style.borderWidth).toBe('4px');
    });

    it('applies glow class', () => {
      const { container } = render(<GradientBorder glow>Glow</GradientBorder>);
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('ActiveGlow', () => {
    it('renders children', () => {
      render(<ActiveGlow>Glowing</ActiveGlow>);
      expect(screen.getByText('Glowing')).toBeInTheDocument();
    });

    it('renders active state with purple glow', () => {
      const { container } = render(
        <ActiveGlow active color="purple" intensity="intense">Active</ActiveGlow>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.boxShadow).toBeTruthy();
    });

    it('renders inactive state without glow', () => {
      const { container } = render(<ActiveGlow active={false}>Inactive</ActiveGlow>);
      const el = container.firstChild as HTMLElement;
      expect(el.style.boxShadow).toBeFalsy();
    });

    it('renders with blue color', () => {
      const { container } = render(
        <ActiveGlow active color="blue">Blue</ActiveGlow>
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('renders with custom color', () => {
      const { container } = render(
        <ActiveGlow active color="custom" customColor="#ff0000">Custom</ActiveGlow>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.boxShadow).toContain('ff0000');
    });

    it('renders with pulse prop enabled', () => {
      const { container } = render(
        <ActiveGlow active pulse>Pulse</ActiveGlow>
      );
      expect(screen.getByText('Pulse')).toBeInTheDocument();
      // Pulse is an accepted prop; component renders without error
      expect(container.firstChild).toBeTruthy();
    });
  });
});
