import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MobileViewSelector.css';

const MobileViewSelector = ({ view, onViewChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const views = [
    { id: 'home', label: 'Home' },
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'search', label: 'Search', isRoute: true },
  ];

  const handleClick = (v) => {
    if (v.isRoute) {
      navigate('/search');
    } else {
      onViewChange(v.id);
    }
  };

  const isActive = (v) => {
    if (v.isRoute) {
      return location.pathname === '/search';
    }
    return view === v.id;
  };

  return (
    <div className="mobile-view-selector">
      <div className="mobile-view-selector-scroll">
        {views.map((v) => (
          <button
            key={v.id}
            className={`mobile-view-btn ${isActive(v) ? 'active' : ''}`}
            onClick={() => handleClick(v)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileViewSelector;


