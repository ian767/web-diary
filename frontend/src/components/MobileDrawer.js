import React, { useEffect } from 'react';
import './MobileDrawer.css';

const MobileDrawer = ({ isOpen, onClose, children }) => {
  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Close on ESC key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="mobile-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className="mobile-drawer">
        <div className="mobile-drawer-header">
          <button 
            className="mobile-drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>
        <div className="mobile-drawer-content">
          {children}
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;


