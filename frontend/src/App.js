import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Home from './pages/Home';
import EditEntry from './pages/EditEntry';
import ThemeToggle from './components/ThemeToggle';
import ThemeSelector from './components/ThemeSelector';
import Logo from './components/Logo';
import { authAPI } from './services/api';
import { getUser, setUser, removeAuthToken } from './utils/auth';
import './App.css';

function App() {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeNavigateRef, setHomeNavigateRef] = useState(null);

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
            <header className="app-header">
              <div className="app-header-left">
                <button 
                  className="mobile-menu-btn"
                  onClick={() => {
                    // Toggle drawer - need to pass this to Home component
                    const event = new CustomEvent('toggleDrawer');
                    window.dispatchEvent(event);
                  }}
                  aria-label="Open menu"
                >
                  ☰
                </button>
                <Logo onNavigateToHome={homeNavigateRef} />
              </div>
              <div className="user-info">
                <ThemeToggle />
                <span className="user-welcome">Welcome, {user.username}!</span>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </header>
          )}
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
                path="/"
                element={
                  user ? (
                    <Home onNavigateRef={setHomeNavigateRef} />
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

