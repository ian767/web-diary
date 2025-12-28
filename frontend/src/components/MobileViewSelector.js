import React from 'react';
import './MobileViewSelector.css';

const MobileViewSelector = ({ view, onViewChange }) => {
  const views = [
    { id: 'home', label: 'Home' },
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="mobile-view-selector">
      <div className="mobile-view-selector-scroll">
        {views.map((v) => (
          <button
            key={v.id}
            className={`mobile-view-btn ${view === v.id ? 'active' : ''}`}
            onClick={() => onViewChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileViewSelector;


