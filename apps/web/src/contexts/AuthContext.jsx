import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token');
    const userDetails = localStorage.getItem('user_details');
    if (token) {
      setUser({ token, ...(userDetails ? JSON.parse(userDetails) : {}) });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    if (data.access) {
      localStorage.setItem('user_details', JSON.stringify(data.user));
      setUser({ token: data.access, ...data.user });
    }
    return data;
  };

  const register = async (username, email, password) => {
    const data = await authAPI.register(username, email, password);
    if (data.access) {
      localStorage.setItem('user_details', JSON.stringify(data.user));
      setUser({ token: data.access, ...data.user });
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('user_details');
    authAPI.logout();
    setUser(null);
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