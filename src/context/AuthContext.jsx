import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // user will be the object stored in MongoDB (from the /api/profile endpoint)
  const [user, setUser] = useState(null);

  // Instead of localStorage, you can start with an initial fetch (or use cookies/tokens)
  // For this example, assume you have a token stored in an HTTP‑only cookie
  // and your server will read that token to determine the user.
  // Here we call a /api/current-user endpoint to get the authenticated user.
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Include credentials if your auth token is in an HTTP‑only cookie
        const res = await axios.get('http://localhost:5001/api/current-user', {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  const logout = async () => {
    try {
      // Call your logout endpoint if needed
      await axios.post('http://localhost:5001/api/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
