import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';

const renderWithTheme = () => {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
};

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders theme toggle button', () => {
    renderWithTheme();
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('shows moon icon in light mode', () => {
    renderWithTheme();
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });

  it('toggles theme when clicked', () => {
    renderWithTheme();
    const toggleButton = screen.getByRole('button');
    
    // Initially light mode (moon icon)
    expect(screen.getByText('🌙')).toBeInTheDocument();
    
    // Click to toggle to dark mode
    fireEvent.click(toggleButton);
    expect(screen.getByText('☀️')).toBeInTheDocument();
    
    // Click again to toggle back to light mode
    fireEvent.click(toggleButton);
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });

  it('persists theme preference in localStorage', () => {
    renderWithTheme();
    const toggleButton = screen.getByRole('button');
    
    fireEvent.click(toggleButton);
    expect(localStorage.getItem('theme')).toBe('dark');
    
    fireEvent.click(toggleButton);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});




