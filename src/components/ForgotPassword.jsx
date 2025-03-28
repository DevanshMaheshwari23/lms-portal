import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/request-otp', { email });
      setLoading(false);
      
      if (response.data.success) {
        setMessage('OTP sent to your email');
      } else {
        setMessage(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error requesting OTP', error);
      setMessage('An error occurred while requesting OTP');
    }
  };

  // Verify OTP and update password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/verify-otp', {
        email,
        otp,
        newPassword,
      });
      setLoading(false);

      if (response.data.success) {
        setMessage('Password updated successfully');
        navigate('/login'); // Redirect to login page after success
      } else {
        setMessage(response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error verifying OTP or updating password', error);
      setMessage('An error occurred while verifying OTP or updating the password');
    }
  };

  return (
    <div className="forgot-password">
      <h2>Forgot Password</h2>

      {/* Step 1: Request OTP */}
      <form onSubmit={handleRequestOtp}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>Request OTP</button>
      </form>

      {/* Step 2: Enter OTP and new password */}
      {message === 'OTP sent to your email' && (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp">OTP:</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword">New Password:</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading || !otp || !newPassword}>Reset Password</button>
        </form>
      )}

      {/* Message display */}
      {message && <p>{message}</p>}

      {/* Loading indicator */}
      {loading && <p>Loading...</p>}
    </div>
  );
};

export default ForgotPassword;
