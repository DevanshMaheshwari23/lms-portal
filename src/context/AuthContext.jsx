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
        // Include credentials if your auth token is in an HTTP‑only cookie
        const res = await apiService.getCurrentUser();
        setUser(res.data);
        setAuthError(null);
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

    // Only fetch user if we're not on a public route
    const publicRoutes = ['/login', '/register', '/adminlogin', '/forgot-password'];
    if (!publicRoutes.includes(location.pathname)) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [navigate, location]);

  const logout = async () => {
    try {
      // Call your logout endpoint if needed
      await apiService.logout();
      setUser(null);
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
