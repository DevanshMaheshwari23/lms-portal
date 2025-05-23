import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';
import './ForgotPassword.css';
import Banner1 from "../assets/Banner1.jpg";
import Banner2 from "../assets/Banner2.jpg";
import Banner3 from "../assets/Banner3.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const images = [Banner1, Banner2, Banner3];

  // Change the image every 4 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!email) {
      setMessage('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.requestOtp(email);
      setLoading(false);
      
      if (response.success) {
        setMessage('OTP sent to your email (Check spam folder)');
      } else {
        setMessage(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error requesting OTP:', error);
      setMessage(error.message || 'An error occurred while requesting OTP. Please try again.');
    }
  };

  // Verify OTP and update password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!otp || !newPassword || !confirmPassword) {
      setMessage('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.verifyOtp({
        email,
        otp,
        newPassword,
      });
      setLoading(false);

      if (response.success) {
        setMessage('Password updated successfully. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(response.message || 'OTP verification failed. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error verifying OTP:', error);
      setMessage(error.message || 'An error occurred while verifying OTP. Please try again.');
    }
  };

  return (
    <div className="forgot-password-page">
      

      <div className="content-wrapper">
        <div className="left-section">
          <div className="forgot-password-card">
            <h2>Reset Password</h2>
            <p>Enter your email to receive a verification code</p>

            {message && (
              <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            {/* Step 1: Request OTP */}
            <form onSubmit={handleRequestOtp}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </div>
            </form>

            {/* Step 2: Enter OTP and new password */}
            {message === 'OTP sent to your email (Check spam folder)' && (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="otp">Verification Code</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter the code sent to your email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                  />
                </div>
                <div className="button-group">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Updating Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </div>
              </form>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        <div className="right-section">
         
          <div className="hero-image">
            <img
              src={images[currentImage]}
              alt="Learning Platform"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
