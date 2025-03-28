import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext"; // Assume you have this set up
import "./LoginPage.css";
import Banner1 from "../assets/Banner1.jpg";
import Banner2 from "../assets/Banner2.jpg";
import Banner3 from "../assets/Banner3.jpg";

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const images = [Banner1, Banner2, Banner3];
  const { setUser } = useContext(AuthContext); // Update global user on login

  // Change the image every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation for email and password
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      // Make sure to include credentials so your HTTP-only cookie is set
      const response = await axios.post(
        'http://localhost:5001/api/login',
        { email, password },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // After login, fetch the profile using the backend
        const profileResponse = await axios.get(
          `http://localhost:5001/api/profile?email=${email}`,
          { withCredentials: true }
        );
        const profile = profileResponse.data;
        // Update global user state with profile data
        setUser(profile);
        
        // Check if the profile is complete (e.g. if name exists)
        if (profile.name) {
          // Optionally, if a course is selected, redirect with courseId query
          if (profile.selectedCourse) {
            const courseId =
              typeof profile.selectedCourse === 'object'
                ? profile.selectedCourse._id
                : profile.selectedCourse;
            navigate(`/home?courseId=${courseId}`);
          } else {
            navigate('/home');
          }
        } else {
          navigate('/profile');
        }
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Login failed');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="login-page">
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
        {/* Left Section: Login Card */}
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
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />

              <div className="forgot-password">
                <a href="/forgot-password">Forgot password?</a>
              </div>

              <button type="submit" className="sign-in-btn">
                Sign in
              </button>
            </form>
            <div className="register">
              Not a member? <a href="/register">Register for free</a>
            </div>
          </div>
        </div>

        {/* Right Section: Info and Carousel Image */}
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
