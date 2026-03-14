import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('zodo_user');
    const token = localStorage.getItem('zodo_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Sync across tabs
    const handleStorageChange = () => {
      const u = localStorage.getItem('zodo_user');
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loginUser = (userData, token) => {
    localStorage.setItem('zodo_user', JSON.stringify(userData));
    localStorage.setItem('zodo_token', token);
    setUser(userData);
    navigate('/');
  };

  const logoutUser = () => {
    localStorage.removeItem('zodo_user');
    localStorage.removeItem('zodo_token');
    setUser(null);
    navigate('/login');
  };

  const updateUser = (userData) => {
    localStorage.setItem('zodo_user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
