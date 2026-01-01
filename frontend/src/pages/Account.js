import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import { removeAuthToken } from '../utils/auth';
import './Account.css';

const Account = () => {
  const navigate = useNavigate();
  const user = getUser();
  const currentTheme = document.documentElement.dataset.theme || 'light';

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  const themeNames = {
    light: 'Daylight',
    warm: 'Sunset',
    dark: 'Midnight'
  };

  return (
    <div className="account-page">
      <div className="account-container">
        <div className="account-header">
          <h1>Account</h1>
        </div>

        <div className="account-content">
          {/* User Profile Section */}
          <div className="account-section">
            <h2>Profile</h2>
            <div className="profile-info">
              <div className="avatar-placeholder">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="profile-details">
                <div className="profile-field">
                  <label>Username</label>
                  <div className="profile-value">{user?.username || 'N/A'}</div>
                </div>
                <div className="profile-field">
                  <label>Email</label>
                  <div className="profile-value">{user?.email || 'Not provided'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Section */}
          <div className="account-section">
            <h2>Preferences</h2>
            <div className="preference-item">
              <label>Current Theme</label>
              <div className="preference-value">{themeNames[currentTheme] || 'Daylight'}</div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="account-section">
            <h2>Actions</h2>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;

