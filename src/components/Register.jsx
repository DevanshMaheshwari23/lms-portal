import React, { useState, useEffect } from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";  
import Banner1 from "../assets/Banner1.jpg";
import Banner2 from "../assets/Banner2.jpg";
import Banner3 from "../assets/Banner3.jpg";
import apiService from '../services/api';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const images = [Banner1, Banner2, Banner3];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Basic validation
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.register({
        email,
        password
      });

      if (response.success) {
        // Clear any existing error
        setError('');
        // Redirect to login page on success
        navigate('/login');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-left">
          <h1 className="brand-name">KNS Education</h1>
        </div>
        <ul className="nav-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#careers">Courses</a></li>
          <li><a href="#about">About Us</a></li>
        </ul>
        <button className="enroll-btn">Enroll Now</button>
      </nav>

      {/* Main Content */}
      <div className="content-wrapper">
        {/* Left Section: Register Card */}
        <div className="left-section">
          <div className="register-card">
            <h2>Register</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email"
                required
                autoComplete="username"
                disabled={isLoading}
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                autoComplete="new-password"
                disabled={isLoading}
              />

              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required
                autoComplete="new-password"
                disabled={isLoading}
              />

              <button 
                type="submit" 
                className={`register-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Signing up...' : 'Sign Up'}
              </button>
            </form>
            <div className="login">
              Already have an account? <a href="/login">Login here</a>
            </div>
          </div>
        </div>

        {/* Right Section: Info and Image */}
        <div className="right-section">
          <div className="hero-image">
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt="Banner"
                className={`carousel-image ${currentImage === index ? "visible" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
