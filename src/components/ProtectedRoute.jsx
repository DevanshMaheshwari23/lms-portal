import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { user, loading, authError } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner text="ऑथेंटिकेट कर रहा है..." />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute; 