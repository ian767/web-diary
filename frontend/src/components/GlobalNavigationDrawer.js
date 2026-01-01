import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileDrawer from './MobileDrawer';
import ThemeSelector from './ThemeSelector';
import './GlobalNavigationDrawer.css';

/**
 * Global Navigation Drawer Component
 * Provides navigation links accessible from all pages on mobile
 * Includes: Home, Daily, Weekly, Monthly, Yearly, Search, Theme selector
 */
const GlobalNavigationDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path) => {
    if (path.includes('?view=')) {
      // Handle Home page with view query param
      const [basePath, query] = path.split('?');
      navigate({ pathname: basePath, search: `?${query}` });
    } else {
      navigate(path);
    }
    onClose();
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/' && !location.search) return true;
    if (path.includes('?view=')) {
      const viewParam = path.split('view=')[1];
      return location.pathname === '/' && location.search.includes(`view=${viewParam}`);
    }
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/?view=daily', label: 'Daily', icon: '📅' },
    { path: '/?view=weekly', label: 'Weekly', icon: '📆' },
    { path: '/?view=monthly', label: 'Monthly', icon: '🗓️' },
    { path: '/?view=yearly', label: 'Yearly', icon: '📊' },
    { path: '/search', label: 'Search', icon: '🔍' },
  ];

  const accountItems = [
    { path: '/account', label: 'Account', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <MobileDrawer isOpen={isOpen} onClose={onClose}>
      <div className="global-nav-drawer">
        {/* Account Section */}
        <div className="global-nav-section">
          <div className="global-nav-title-wrapper">
            <div className="global-nav-title">Account</div>
          </div>
          <nav className="global-nav-links">
            {accountItems.map((item) => (
              <button
                key={item.path}
                className={`global-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                <span className="global-nav-icon">{item.icon}</span>
                <span className="global-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Navigation Section */}
        <div className="global-nav-section">
          <div className="global-nav-title-wrapper">
            <div className="global-nav-title">Navigation</div>
          </div>
          <nav className="global-nav-links">
            {navItems.map((item) => (
              <button
                key={item.path}
                className={`global-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                <span className="global-nav-icon">{item.icon}</span>
                <span className="global-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Theme Section */}
        <div className="global-nav-theme-section">
          <div className="global-nav-title-wrapper">
            <div className="global-nav-title">Theme</div>
          </div>
          <div className="global-nav-theme-wrapper">
            <ThemeSelector />
          </div>
        </div>
      </div>
    </MobileDrawer>
  );
};

export default GlobalNavigationDrawer;

