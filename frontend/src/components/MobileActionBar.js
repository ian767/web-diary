import React from 'react';
import './MobileActionBar.css';

const MobileActionBar = ({ onNewEntry, secondaryAction }) => {
  return (
    <div className="mobile-action-bar">
      {secondaryAction && (
        <button 
          className="mobile-action-secondary"
          onClick={secondaryAction.onClick}
        >
          {secondaryAction.label}
        </button>
      )}
      <button 
        className="mobile-action-primary"
        onClick={onNewEntry}
      >
        + New Entry
      </button>
    </div>
  );
};

export default MobileActionBar;


