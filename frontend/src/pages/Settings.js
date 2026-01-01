import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [compactMode, setCompactMode] = useState(false);
  const [accessibilityFont, setAccessibilityFont] = useState(false);
  const [language, setLanguage] = useState('en');

  const handleResetPreferences = () => {
    setCompactMode(false);
    setAccessibilityFont(false);
    setLanguage('en');
    // Could add a toast notification here
    alert('Preferences have been reset to defaults.');
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
        </div>

        <div className="settings-content">
          {/* Display Settings */}
          <div className="settings-section">
            <h2>Display</h2>
            
            <div className="setting-item">
              <div className="setting-label-group">
                <label htmlFor="compact-mode">Compact Mode</label>
                <span className="setting-description">Reduce spacing and padding for a more compact layout</span>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="compact-mode"
                    checked={compactMode}
                    onChange={(e) => setCompactMode(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label-group">
                <label htmlFor="accessibility-font">Accessibility Font</label>
                <span className="setting-description">Use larger, more readable fonts</span>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="accessibility-font"
                    checked={accessibilityFont}
                    onChange={(e) => setAccessibilityFont(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="settings-section">
            <h2>Language</h2>
            
            <div className="setting-item">
              <div className="setting-label-group">
                <label htmlFor="language">Language</label>
                <span className="setting-description">Choose your preferred language</span>
              </div>
              <div className="setting-control">
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="language-select"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                </select>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="settings-section">
            <h2>About</h2>
            
            <div className="setting-item">
              <div className="setting-label-group">
                <label>App Version</label>
                <span className="setting-description">Web Diary v1.0.0</span>
              </div>
            </div>

            <div className="setting-item">
              <button className="reset-preferences-btn" onClick={handleResetPreferences}>
                Reset Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

