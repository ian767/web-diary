import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Home from './pages/Home';
import EditEntry from './pages/EditEntry';
import ViewEntry from './pages/ViewEntry';
import Search from './components/Search';
import Timeline from './pages/Timeline';
import AppHeader from './components/AppHeader';
import GlobalNavigationDrawer from './components/GlobalNavigationDrawer';
import { authAPI } from './services/api';
import { getUser, setUser, removeAuthToken } from './utils/auth';
import './App.css';

function App() {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalDrawerOpen, setGlobalDrawerOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = getUser();
      if (savedUser) {
        try {
          const response = await authAPI.verify();
          setUserState(response.data.user);
          setUser(response.data.user);
        } catch (err) {
          removeAuthToken();
          setUserState(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Listen for global drawer toggle from header hamburger button
  useEffect(() => {
    const handleToggleDrawer = () => {
      setGlobalDrawerOpen(prev => !prev);
    };
    window.addEventListener('toggleDrawer', handleToggleDrawer);
    return () => {
      window.removeEventListener('toggleDrawer', handleToggleDrawer);
    };
  }, []);

  const handleLogin = (userData) => {
    setUserState(userData);
    setUser(userData);
  };

  const handleLogout = () => {
    removeAuthToken();
    setUserState(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          {user && (
            <GlobalNavigationDrawer 
              isOpen={globalDrawerOpen} 
              onClose={() => setGlobalDrawerOpen(false)} 
            />
          )}
          <AppHeader user={user} onLogout={handleLogout} />
          <div className="app-content">
            <Routes>
              <Route
                path="/login"
                element={
                  user ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                }
              />
              <Route
                path="/entries/:id"
                element={
                  user ? (
                    <ViewEntry />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/entries/:id/edit"
                element={
                  user ? (
                    <EditEntry />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/search"
                element={
                  user ? (
                    <Search />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/timeline"
                element={
                  user ? (
                    <Timeline />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/"
                element={
                  user ? (
                    <Home />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;

