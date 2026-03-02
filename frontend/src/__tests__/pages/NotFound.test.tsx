import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import NotFound from '../../pages/NotFound';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useNetworkTheme
vi.mock('../../hooks/useNetworkTheme', () => ({
  useNetworkTheme: () => ({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    accentColor: '#f093fb',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glowColor: 'rgba(102, 126, 234, 0.3)',
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NotFound', () => {
  it('renders 404 heading', () => {
    renderWithRouter(<NotFound />);
    const heading = screen.getByRole('heading', { level: 1, name: /page not found/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders 404 number display', () => {
    renderWithRouter(<NotFound />);
    const errorNumber = screen.getByText('404', { exact: true });
    expect(errorNumber).toBeInTheDocument();
  });

  it('renders helpful description', () => {
    renderWithRouter(<NotFound />);
    expect(
      screen.getByText(/the page you're looking for doesn't exist/i)
    ).toBeInTheDocument();
  });

  it('renders Go Back button', () => {
    renderWithRouter(<NotFound />);
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('renders Go to Home link', () => {
    renderWithRouter(<NotFound />);
    const homeLink = screen.getByRole('link', { name: /go to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders quick navigation links', () => {
    renderWithRouter(<NotFound />);
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /analytics/i })).toBeInTheDocument();
  });

  it('displays error code', () => {
    renderWithRouter(<NotFound />);
    expect(screen.getByText(/error code: 404/i)).toBeInTheDocument();
  });

  it('calls navigate(-1) when Go Back is clicked', () => {
    renderWithRouter(<NotFound />);
    const goBackButton = screen.getByRole('button', { name: /go back/i });
    goBackButton.click();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('has proper accessible structure', () => {
    renderWithRouter(<NotFound />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });
});
