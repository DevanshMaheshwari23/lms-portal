import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Profile.css';
import apiService from '../services/api';

function Profile() {
  const [name, setName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [existingProfile, setExistingProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getCourses();
        if (response.success) {
          setCourses(response.data);
        } else {
          setError(response.message || 'Error fetching courses');
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Error fetching courses');
      }
    };

    const fetchProfile = async () => {
      try {
        if (!user || !user.email) {
          setError('User email not found.');
          return;
        }
        const response = await apiService.getProfile(user.email);
        if (response.success) {
          setExistingProfile(response.data);
          setName(response.data.name);
          if (response.data.selectedCourse) {
            const courseId =
              typeof response.data.selectedCourse === 'object'
                ? response.data.selectedCourse._id
                : response.data.selectedCourse;
            setSelectedCourse(courseId);
          }
          if (response.data.profileImage) {
            setPreviewUrl(response.data.profileImage);
          }
        } else {
          setError(response.message || 'Error fetching profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Error fetching profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchProfile();
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !selectedCourse) {
      setError('Name and course selection are required');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('course', selectedCourse);
    if (image) {
      formData.append('profileImage', image);
    }
    formData.append('email', user.email);

    try {
      let response;
      if (existingProfile) {
        response = await apiService.updateProfile(formData);
      } else {
        response = await apiService.uploadProfileImage(formData);
      }

      if (response.success) {
        // Update the user context with the new profile data
        setUser(prevUser => ({
          ...prevUser,
          ...response.data
        }));
        navigate(`/home?courseId=${selectedCourse}`);
      } else {
        setError(response.message || 'Error creating/updating profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="content-wrapper">
        <div className="left-section">
          <div className="profile-card">
            <h2>{existingProfile ? 'Update Profile' : 'Create Profile'}</h2>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-control"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="course">Select Course</label>
                    <select
                      id="course"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="form-control"
                    >
                      <option value="">-- Select Course --</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <div className="image-upload-section">
                    <div className="image-preview-container">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Profile preview"
                          className="image-preview"
                        />
                      ) : (
                        <svg
                          className="default-avatar"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>
                    <label className="image-upload-button">
                      <svg
                        className="image-upload-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Choose Profile Picture
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>
                      Recommended: Square image, max 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="button-group">
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {existingProfile ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
