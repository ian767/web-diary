import React, { useState, useEffect } from 'react';
import './ThemeSelector.css';

/**
 * Theme Selector Component
 * 
 * Provides a simple UI for selecting between built-in themes.
 * Architecture supports future "Theme Shop" expansion:
 * - Themes are defined in /src/styles/themes.css
 * - Theme selection is persisted in localStorage with key "theme"
 * - Future: Theme Shop will allow loading additional theme packs
 */
const ThemeSelector = () => {
  // Theme definitions with user-friendly display names
  const themes = [
    { id: 'light', name: 'Daylight', description: 'Light theme' },
    { id: 'warm', name: 'Sunset', description: 'Warm, paper-like theme' },
    { id: 'dark', name: 'Midnight', description: 'Dark theme' },
  ];

  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    // Key: "theme" (for future Theme Shop compatibility)
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    // Persist selection (key: "theme" for Theme Shop compatibility)
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className="theme-selector">
      <label className="theme-selector-label">Theme:</label>
      <div className="theme-options">
        {themes.map((themeOption) => (
          <button
            key={themeOption.id}
            className={`theme-option ${theme === themeOption.id ? 'active' : ''}`}
            onClick={() => handleThemeChange(themeOption.id)}
            title={themeOption.description}
          >
            {themeOption.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;

