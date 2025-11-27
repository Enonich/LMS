import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = `${window.location.origin}/api`;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  async function fetchProfile() {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data);
    } catch (e) {
      console.error('Profile fetch failed', e);
      // Clear invalid token
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setToken(res.data.access_token);
      localStorage.setItem('token', res.data.access_token);
    } catch (e) {
      throw e.response?.data?.detail || 'Login failed';
    }
  }

  async function register(data) {
    try {
      await axios.post(`${API_BASE}/auth/register`, data);
    } catch (e) {
      throw e.response?.data?.detail || 'Registration failed';
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  }
  const value = { token, user, login, register, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
