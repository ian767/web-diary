import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeSelector from './ThemeSelector';
import './DesktopNavigation.css';

/**
 * Desktop Navigation Sidebar Component
 * Provides navigation links for desktop screens (>768px)
 * Hidden on mobile/tablet
 */
const DesktopNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path) => {
    if (path.includes('?view=')) {
      const [basePath, query] = path.split('?');
      navigate({ pathname: basePath, search: `?${query}` });
    } else {
      navigate(path);
    }
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

  const accountItems = [
    { path: '/account', label: 'Account', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/?view=daily', label: 'Daily', icon: '📅' },
    { path: '/?view=weekly', label: 'Weekly', icon: '📆' },
    { path: '/?view=monthly', label: 'Monthly', icon: '🗓️' },
    { path: '/?view=yearly', label: 'Yearly', icon: '📊' },
    { path: '/search', label: 'Search', icon: '🔍' },
  ];

  return (
    <nav className="desktop-navigation">
      {/* Scrollable Navigation Content */}
      <div className="desktop-nav-scrollable">
        {/* Account Section */}
        <div className="desktop-nav-section">
          <div className="desktop-nav-title-wrapper">
            <div className="desktop-nav-title">Account</div>
          </div>
          <div className="desktop-nav-links">
            {accountItems.map((item) => (
              <button
                key={item.path}
                className={`desktop-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                <span className="desktop-nav-icon">{item.icon}</span>
                <span className="desktop-nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Section */}
        <div className="desktop-nav-section">
          <div className="desktop-nav-title-wrapper">
            <div className="desktop-nav-title">Navigation</div>
          </div>
          <div className="desktop-nav-links">
            {navItems.map((item) => (
              <button
                key={item.path}
                className={`desktop-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                <span className="desktop-nav-icon">{item.icon}</span>
                <span className="desktop-nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pinned Theme Section */}
      <div className="desktop-nav-section desktop-nav-theme-section">
        <div className="desktop-nav-title-wrapper">
          <div className="desktop-nav-title">Theme</div>
        </div>
        <div className="desktop-nav-theme-wrapper">
          <ThemeSelector />
        </div>
      </div>
    </nav>
  );
};

export default DesktopNavigation;

