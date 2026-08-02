import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token');
    const userDetails = localStorage.getItem('user_details');
    if (token) {
      setUser({ token, ...(userDetails ? JSON.parse(userDetails) : {}) });
    }
    setLoading(false);
  }, []);

  // Listen for auth expired event from API layer
  useEffect(() => {
    const handleAuthExpired = () => {
      // authAPI.logout() clears access_token, refresh_token, and user_details
      authAPI.logout();
      setUser(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [navigate]);

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    if (data.access) {
      localStorage.setItem('user_details', JSON.stringify(data.user));
      setUser({ token: data.access, ...data.user });
    }
    return data;
  };

  const register = async (username, email, password, password_confirm) => {
    const data = await authAPI.register(username, email, password, password_confirm);
    if (data.access) {
      localStorage.setItem('user_details', JSON.stringify(data.user));
      setUser({ token: data.access, ...data.user });
    }
    return data;
  };

  const logout = () => {
    // authAPI.logout() clears access_token, refresh_token, and user_details
    authAPI.logout();
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
