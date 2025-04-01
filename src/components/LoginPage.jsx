import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./LoginPage.css";
import Banner1 from "../assets/Banner1.jpg";
import Banner2 from "../assets/Banner2.jpg";
import Banner3 from "../assets/Banner3.jpg";
import apiService from "../services/api";

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const images = [Banner1, Banner2, Banner3];
  const { setUser } = useContext(AuthContext);

  // Change the image every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Try to get current user without clearing cookies
        const response = await apiService.getCurrentUser();
        if (response.success) {
          setUser(response.data);
          if (response.data.selectedCourse) {
            navigate('/home');
          } else {
            navigate('/profile');
          }
        }
      } catch (err) {
        // Ignore error if no session exists
        console.log('No active session');
      }
    };

    // Only check session if we're not already on the login page
    if (!window.location.pathname.includes('/login')) {
      checkSession();
    }
  }, [navigate, setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!email || !password) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }

    try {
      // First try to login
      const loginResponse = await apiService.login({ email, password });
      
      if (loginResponse.success) {
        // Store email in localStorage for fallback
        localStorage.setItem('userEmail', email);
        
        // Get the current user to check session
        const currentUserResponse = await apiService.getCurrentUser();
        if (currentUserResponse.success) {
          const userData = currentUserResponse.data;
          setUser(userData);
          
          // Navigate based on course selection
          if (userData && userData.selectedCourse) {
            navigate('/home');
          } else {
            navigate('/profile');
          }
        } else {
          // If we can't get the current user, try to get the profile
          const profileResponse = await apiService.getProfile(email);
          if (profileResponse.success) {
            const profile = profileResponse.data;
            setUser(profile);
            
            // Navigate based on course selection
            if (profile && profile.selectedCourse) {
              navigate('/home');
            } else {
              navigate('/profile');
            }
          } else {
            setError(profileResponse.message || 'Error fetching profile');
          }
        }
      } else {
        setError(loginResponse.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.message === 'Network error. Please check your connection and try again.') {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (err.message === 'Session expired. Please log in again.') {
        // Clear any existing session data
        localStorage.removeItem('userEmail');
        localStorage.removeItem('selectedCourse');
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <nav className="navbar">
        <div className="navbar-left">
          <h1 className="brand-name">KNS Education</h1>
        </div>
        <ul className="nav-links">
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/courses">Courses</Link></li>
          <li><Link to="/about">About Us</Link></li>
        </ul>
        <Link to="/enroll"><button className="enroll-btn">Enroll Now</button></Link>
      </nav>
      <div className="content-wrapper">
        <div className="left-section">
          <div className="login-card">
            <h2>Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="username@gmail.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                disabled={isLoading}
              />
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
              <div className="forgot-password">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
              <button 
                type="submit" 
                className="sign-in-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
            <div className="register-link">
              <p>Don't have an account? <Link to="/register">Register</Link></p>
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
}

export default LoginPage;
