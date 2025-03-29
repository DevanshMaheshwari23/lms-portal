import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = 'लोड हो रहा है...' }) => {
  return (
    <div className="loading-container">
      <div className={`spinner ${size}`}></div>
      <p className="loading-text">{text}</p>
    </div>
  );
};

export default LoadingSpinner; 