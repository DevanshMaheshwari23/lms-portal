import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./LoginPage.css";
import Banner1 from "../assets/Banner1.jpg";
import Banner2 from "../assets/Banner2.jpg";
import Banner3 from "../assets/Banner3.jpg";
import apiService from "../services/apiService";

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    try {
      const response = await apiService.login({ email, password });
      
      if (response.data.success) {
        // Store email in localStorage for fallback
        localStorage.setItem('userEmail', email);
        // Fetch the user profile after successful login
        const profileResponse = await apiService.getProfile(email);
        const profile = profileResponse.data;
        setUser(profile);
        
        // Navigate based on course selection
        if (profile && profile.selectedCourse) {
          navigate('/home');
        } else {
          navigate('/profile');
        }
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
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
              />
              <div className="forgot-password">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
              <button type="submit" className="sign-in-btn">Sign in</button>
            </form>
            <div className="register">
              Not a member? <Link to="/register">Register for free</Link>
            </div>
          </div>
        </div>
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

export default LoginPage;
