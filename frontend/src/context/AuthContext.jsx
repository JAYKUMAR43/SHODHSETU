import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('bharatpanchyt_user');
    const token = localStorage.getItem('bharatpanchyt_token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('bharatpanchyt_user');
        localStorage.removeItem('bharatpanchyt_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data;
    const userData = {
      id: data.user_id,
      name: data.name,
      email: data.email,
      role: data.role,
      organisation_id: data.organisation_id,
      district_id: data.district_id,
      token: data.access_token
    };
    localStorage.setItem('bharatpanchyt_token', data.access_token);
    localStorage.setItem('bharatpanchyt_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('bharatpanchyt_token');
    localStorage.removeItem('bharatpanchyt_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      isUniversity: user?.role === 'university',
      isIndustry: user?.role === 'industry',
      isValidationOfficer: user?.role === 'validation_officer',
      isGovernment: user?.role === 'government'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
