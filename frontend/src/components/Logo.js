import React from 'react';
import './Logo.css';

const Logo = ({ onNavigateToHome }) => {
  const handleClick = () => {
    if (onNavigateToHome) {
      onNavigateToHome();
    }
  };

  return (
    <h1 className="app-logo" onClick={handleClick} title="Go to main page">
      📔 Web Diary
    </h1>
  );
};

export default Logo;

