import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Profile from './components/Profile';
import Home from './components/Home';
import RegisterPage from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import axios from 'axios';


axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data.message &&
      error.response.data.message.toLowerCase().includes('banned')
    ) {
      console.log('Interceptor caught banned error:', error.response.data);
      // Clear user data and redirect to login page
      alert('Your account has been banned. You will be logged out.');
      localStorage.removeItem('userEmail');
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<RegisterPage/>} />
        {/* Redirect any unknown route to the login page */}
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;