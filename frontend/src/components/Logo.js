import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

/**
 * Logo Component
 * Clickable logo that navigates to Home page
 * Uses Link for consistent navigation across the app
 */
const Logo = () => {
  return (
    <Link to="/" className="app-logo-link" title="Go to Home">
      <h1 className="app-logo">
        📔 Web Diary
      </h1>
    </Link>
  );
};

export default Logo;

