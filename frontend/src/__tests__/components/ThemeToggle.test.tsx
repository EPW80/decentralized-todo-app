import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../../components/ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';

const renderThemeToggle = () => {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
};

describe('ThemeToggle Component', () => {
  it('renders toggle button', () => {
    renderThemeToggle();

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderThemeToggle();

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
  });

  it('toggles theme when clicked', () => {
    renderThemeToggle();

    const button = screen.getByRole('button');
    const initialLabel = button.getAttribute('aria-label');

    fireEvent.click(button);

    const newLabel = button.getAttribute('aria-label');
    expect(newLabel).not.toBe(initialLabel);
  });

  it('displays correct icon for light mode', () => {
    renderThemeToggle();

    const button = screen.getByRole('button');
    const svgs = button.querySelectorAll('svg');

    // Should have both sun and moon icons
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('has hover effects', () => {
    renderThemeToggle();

    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:shadow-glow');
    expect(button).toHaveClass('hover:scale-105');
  });

  it('has active state styling', () => {
    renderThemeToggle();

    const button = screen.getByRole('button');
    expect(button).toHaveClass('active:scale-95');
  });
});
