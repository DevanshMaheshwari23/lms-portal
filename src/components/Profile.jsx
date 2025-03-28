import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Profile() {
  const [name, setName] = useState('');
  const [profileText, setProfileText] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [existingProfile, setExistingProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/courses');
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        setError('Error fetching courses');
      }
    };

    const fetchProfile = async () => {
      try {
        if (!user || !user.email) {
          setError('User email not found.');
          return;
        }
        const res = await fetch(`http://localhost:5001/api/profile?email=${user.email}`);
        if (res.ok) {
          const profileData = await res.json();
          setExistingProfile(profileData);
          setName(profileData.name);
          if (profileData.selectedCourse) {
            const courseId =
              typeof profileData.selectedCourse === 'object'
                ? profileData.selectedCourse._id
                : profileData.selectedCourse;
            setSelectedCourse(courseId);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchCourses();
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !profileText || !selectedCourse || !image) {
      setError('All fields are required');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('profile', profileText);
    formData.append('course', selectedCourse);
    formData.append('profileImage', image);
    formData.append('email', user.email);

    try {
      let response;
      if (existingProfile) {
        response = await fetch('http://localhost:5001/api/profile', {
          method: 'PUT',
          body: formData,
        });
      } else {
        response = await fetch('http://localhost:5001/api/profile', {
          method: 'POST',
          body: formData,
        });
      }

      if (response.ok) {
        // Update the AuthContext with the new profile data
        const updatedProfile = await response.json();
        setUser(updatedProfile);
        navigate(`/home?courseId=${selectedCourse}`);
      } else {
        setError('Error creating/updating profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <h2>{existingProfile ? 'Update Profile' : 'Create Profile'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name: </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label>Profile: </label>
          <textarea value={profileText} onChange={(e) => setProfileText(e.target.value)}></textarea>
        </div>
        <div>
          <label>Select Course: </label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="">-- Select Course --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Upload Image: </label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        </div>
        <button type="submit">{existingProfile ? 'Update Profile' : 'Submit Profile'}</button>
      </form>
    </div>
  );
}

export default Profile;
