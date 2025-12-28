import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import ThemeSelector from './ThemeSelector';
import { removeAuthToken } from '../utils/auth';
import './AppHeader.css';

/**
 * Shared App Header Component
 * Used across all pages for consistent navigation
 * Includes: Logo (Home link), Theme Selector, User info, Logout
 */
const AppHeader = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeAuthToken();
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  if (!user) {
    return null; // Don't show header if not logged in
  }

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button 
          className="mobile-menu-btn"
          onClick={() => {
            // Toggle drawer - dispatch custom event for mobile drawer
            const event = new CustomEvent('toggleDrawer');
            window.dispatchEvent(event);
          }}
          aria-label="Open menu"
        >
          ☰
        </button>
        <Logo />
      </div>
      <div className="app-header-right">
        <ThemeSelector />
        <span className="user-welcome">Welcome, {user.username}!</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
};

export default AppHeader;


