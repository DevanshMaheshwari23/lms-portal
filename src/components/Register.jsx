import React, { useState, useEffect } from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";  
import Banner1 from "../assets/Banner1.jpg";
import Banner2 from "../assets/Banner2.jpg";
import Banner3 from "../assets/Banner3.jpg";
import { api } from '../services/api';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
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
    
    // Basic validation
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await api.post('/register', {
        email,
        password
      });

      if (response.ok) {
        navigate('/login');  // Redirect to profile page on success
      } else {
        const data = await response.json();
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="username@gmail.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />

              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required
              />

              <button type="submit" className="register-btn">
                Sign Up
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
