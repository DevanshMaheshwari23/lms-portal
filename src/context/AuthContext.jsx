import React, { createContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // user will be the object stored in MongoDB (from the /api/profile endpoint)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Instead of localStorage, you can start with an initial fetch (or use cookies/tokens)
  // For this example, assume you have a token stored in an HTTP‑only cookie
  // and your server will read that token to determine the user.
  // Here we call a /api/current-user endpoint to get the authenticated user.
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setLoading(true);
      try {
        const res = await apiService.getCurrentUser();
        if (res.data) {
          setUser(res.data);
          setAuthError(null);
        } else {
          setUser(null);
          setAuthError('No user data received');
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        setUser(null);
        setAuthError('Failed to authenticate user');
        
        // Only redirect to login if we're not already on a public route
        const publicRoutes = ['/login', '/register', '/adminlogin', '/forgot-password'];
        if (!publicRoutes.includes(location.pathname)) {
          navigate('/login', { state: { from: location.pathname } });
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch user if we're not on a public route and not already authenticated
    const publicRoutes = ['/login', '/register', '/adminlogin', '/forgot-password'];
    if (!publicRoutes.includes(location.pathname) && !user) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [navigate, location, user]);

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      setAuthError(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
};
