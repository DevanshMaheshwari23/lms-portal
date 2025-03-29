import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Profile from './components/Profile';
import Home from './components/Home';
import RegisterPage from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import api from './services/api';

// Replace axios interceptor with the one in api.js
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage/>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/adminlogin" element={<AdminLogin />} />
            
            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/home" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            
          </Routes>
        </AuthProvider>
      </Router>
      <Route path="*" component={LoginPage} />
    </ErrorBoundary>
  );

}

export default App;