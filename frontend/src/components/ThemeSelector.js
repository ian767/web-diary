import React, { useState, useEffect } from 'react';
import './ThemeSelector.css';

const ThemeSelector = () => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    return localStorage.getItem('app-theme') || 'light';
  });

  useEffect(() => {
    // Apply theme to document body
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className="theme-selector">
      <label className="theme-selector-label">Theme:</label>
      <div className="theme-options">
        <button
          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeChange('light')}
          title="Light Theme"
        >
          Light
        </button>
        <button
          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeChange('dark')}
          title="Dark Theme"
        >
          Dark
        </button>
        <button
          className={`theme-option ${theme === 'indigo' ? 'active' : ''}`}
          onClick={() => handleThemeChange('indigo')}
          title="Indigo Theme"
        >
          Indigo
        </button>
      </div>
    </div>
  );
};

export default ThemeSelector;

