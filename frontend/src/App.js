import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Home from './pages/Home';
import EditEntry from './pages/EditEntry';
import ViewEntry from './pages/ViewEntry';
import Search from './components/Search';
import Timeline from './pages/Timeline';
import Account from './pages/Account';
import Settings from './pages/Settings';
import AppLayout from './components/AppLayout';
import { authAPI } from './services/api';
import { getUser, setUser, removeAuthToken } from './utils/auth';
import './App.css';

function App() {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

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
          {user ? (
            <AppLayout user={user} onLogout={handleLogout}>
              <div className="app-content">
                <Routes>
                  <Route
                    path="/login"
                    element={<Navigate to="/" replace />}
                  />
                  <Route
                    path="/entries/:id"
                    element={<ViewEntry />}
                  />
                  <Route
                    path="/entries/:id/edit"
                    element={<EditEntry />}
                  />
                  <Route
                    path="/search"
                    element={<Search />}
                  />
                  <Route
                    path="/timeline"
                    element={<Timeline />}
                  />
                  <Route
                    path="/account"
                    element={<Account />}
                  />
                  <Route
                    path="/settings"
                    element={<Settings />}
                  />
                  <Route
                    path="/"
                    element={<Home />}
                  />
                </Routes>
              </div>
            </AppLayout>
          ) : (
            <div className="app-content">
              <Routes>
                <Route
                  path="/login"
                  element={<Login onLogin={handleLogin} />}
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          )}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;

