import React, { useState, useEffect } from 'react';
import AppHeader from './AppHeader';
import GlobalNavigationDrawer from './GlobalNavigationDrawer';

/**
 * AppLayout Component
 * Manages global layout elements: Header and Navigation Drawer
 * Handles drawer toggle state and event listeners
 */
const AppLayout = ({ user, onLogout, children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Listen for 'toggleDrawer' custom event from hamburger button
  useEffect(() => {
    const handleToggleDrawer = () => {
      console.log("🔄 Drawer toggle event received"); // Add this line to debug
      setIsDrawerOpen(prev => !prev);
    };

    window.addEventListener('toggleDrawer', handleToggleDrawer);
    return () => {
      window.removeEventListener('toggleDrawer', handleToggleDrawer);
    };
  }, []);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      <GlobalNavigationDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDrawer} 
      />
      <AppHeader user={user} onLogout={onLogout} />
      {children}
    </>
  );
};

export default AppLayout;

