import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { Helmet } from 'react-helmet';
import { AuthContext } from '../context/AuthContext';
import './Home.css';
import logo from './logo.png';

const Home = () => {
  const [user, setUser] = useState({ name: '', profileImage: '', selectedCourse: null });
  const [course, setCourse] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [updatedName, setUpdatedName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [modalVideoUrl, setModalVideoUrl] = useState(null);
  const [expandedSectionIndex, setExpandedSectionIndex] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  // Initialize from localStorage so that state persists across refreshes.
  const [completedSubChapters, setCompletedSubChapters] = useState(() => {
    const stored = localStorage.getItem('completedSubChapters');
    return stored ? JSON.parse(stored) : {};
  });

  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);

  // Sync local state with AuthContext
  useEffect(() => {
    if (authUser && authUser.email) {
      setUser(authUser);
    }
  }, [authUser]);

  // Modified handleLogout: do not clear localStorage.
  const handleLogout = useCallback(() => {
    // Removed clearing localStorage
    // localStorage.removeItem('userEmail');
    window.location.replace('/login');
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      // Try to get email from AuthContext, else localStorage
      const email = (user && user.email) || localStorage.getItem('userEmail');
      if (!email) {
        console.error("User email not found. Redirecting to login.");
        navigate('/login');
        return;
      }
      const res = await axios.get(`http://localhost:5001/api/profile?email=${email}`, {
        withCredentials: true,
      });
      const profileData = res.data;
      setUser(profileData);
      // Update updatedName only if the profile modal is not open,
      // so that it doesn't override the value you're editing.
      if (!showProfile) {
        setUpdatedName(profileData.name);
      }
      let courseId;
      const queryParams = new URLSearchParams(window.location.search);
      if (queryParams.has('courseId')) {
        courseId = queryParams.get('courseId');
      } else if (profileData.selectedCourse) {
        courseId = typeof profileData.selectedCourse === 'object'
          ? profileData.selectedCourse._id
          : profileData.selectedCourse;
      }
      if (courseId) {
        const courseRes = await axios.get(`http://localhost:5001/api/course/${courseId}`);
        setCourse(courseRes.data);
      } else {
        setCourse(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (
        err.response &&
        err.response.status === 401 &&
        err.response.data.message &&
        err.response.data.message.toLowerCase().includes("banned")
      ) {
        alert("Your account has been banned.");
        handleLogout();
      }
    }
  }, [handleLogout, navigate, user, showProfile]);

  // Fetch profile once when the component mounts
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileUpdate = useCallback(async () => {
    const formData = new FormData();
    formData.append('name', updatedName);
    formData.append('email', user.email);
    // Preserve the selected course
    if (user.selectedCourse) {
      const courseId = typeof user.selectedCourse === 'object' 
        ? user.selectedCourse._id 
        : user.selectedCourse;
      formData.append('course', courseId);
    }
    if (imageFile) formData.append('profileImage', imageFile);
    try {
      const res = await axios.put('http://localhost:5001/api/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      // Update local state with the new name and profile image while preserving the course
      setUser((prevUser) => ({
        ...prevUser,
        name: updatedName,
        profileImage: res.data.profileImage,
        selectedCourse: res.data.selectedCourse // Preserve the course from the response
      }));
      alert('Profile updated successfully!');
      setShowProfile(false);
      // Refresh the course data
      if (res.data.selectedCourse) {
        const courseId = typeof res.data.selectedCourse === 'object' 
          ? res.data.selectedCourse._id 
          : res.data.selectedCourse;
        const courseRes = await axios.get(`http://localhost:5001/api/course/${courseId}`);
        setCourse(courseRes.data);
      }
    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err.message);
      alert('There was an error updating your profile. Please try again.');
    }
  }, [updatedName, imageFile, user.email, user.selectedCourse]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'forceLogout' && event.newValue) {
        alert('Your account has been banned. You will be logged out.');
        handleLogout();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleLogout]);

  const toggleSection = useCallback((index) => {
    setExpandedSectionIndex((prevIndex) => (prevIndex === index ? null : index));
  }, []);

  const toggleChapter = useCallback((sectionIndex, chapterIndex) => {
    setExpandedChapters((prev) => {
      const sectionChapters = prev[sectionIndex] || {};
      return {
        ...prev,
        [sectionIndex]: {
          ...sectionChapters,
          [chapterIndex]: !sectionChapters[chapterIndex],
        },
      };
    });
  }, []);

  // Update localStorage when completedSubChapters changes
  useEffect(() => {
    localStorage.setItem('completedSubChapters', JSON.stringify(completedSubChapters));
  }, [completedSubChapters]);

  const toggleSubChapterCompletion = useCallback((sectionIndex, chapterIndex, subIndex) => {
    const key = `${sectionIndex}-${chapterIndex}-${subIndex}`;
    setCompletedSubChapters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const calculateProgress = useCallback(() => {
    if (!course) return { completed: 0, total: 0 };
    let total = 0;
    course.sections?.forEach((section) => {
      section.chapters?.forEach((chapter) => {
        total += chapter.subChapters ? chapter.subChapters.length : 0;
      });
    });
    const completed = Object.values(completedSubChapters).filter(Boolean).length;
    return { completed, total };
  }, [course, completedSubChapters]);

  const { completed, total } = calculateProgress();
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <>
      <Helmet>
        <title>Gurukul LMS Portal - Home</title>
        <meta name="description" content="Access your courses, track your progress, and update your profile on Gurukul LMS Portal." />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <div className="home">
        <header className="navbar">
          <div className="navbar-left">
            <img src={logo} alt="Logo" className="logo" />
            <h2>Gurukul (LMS Portal)</h2>
            <span className="greeting">Welcome, {user.name || 'Guest'}</span>
          </div>
          <div className="navbar-right">
            <img
              src={user.profileImage || 'default-profile.png'}
              alt="Profile"
              className="profile-icon"
              onClick={() => setShowProfile((prev) => !prev)}
            />
          </div>
        </header>
        {showProfile && (
          <section className="profile-section">
            <h3>Profile Options</h3>
            <div className="profile-options">
              <div className="edit-profile">
                <input
                  type="text"
                  value={updatedName}
                  onChange={(e) => setUpdatedName(e.target.value)}
                  placeholder="Enter name"
                  autoComplete="name"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
                <button onClick={handleProfileUpdate}>Save</button>
              </div>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </section>
        )}
        <main className="course-section">
          {course ? (
            <>
              <section className="course-details">
                <h1>
                  <span>Course:</span> {course.title}
                </h1>
                {course.image && (
                  <img src={course.image} alt={`${course.title} banner`} className="course-image" />
                )}
                <h3>
                  <span>Description:</span> {course.description}
                </h3>
                <div className="progress-container-dark">
                  <div className="progress-info">
                    <span className="progress-text-dark">
                      Your Progress: {completed}/{total}
                    </span>
                    <span className="progress-percentage-dark">
                      {progressPercentage}% complete
                    </span>
                  </div>
                  <div className="progress-bar-dark">
                    <div className="progress-fill-dark" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
                </div>
                {course.sections?.map((section, sectionIndex) => (
                  <article key={sectionIndex} className="course-section-content">
                    <div
                      className="section-header"
                      onClick={() => toggleSection(sectionIndex)}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => { if (e.key === 'Enter') toggleSection(sectionIndex); }}
                    >
                      <h4>{section.sectionTitle}</h4>
                      <span className="toggle-icon">
                        {expandedSectionIndex === sectionIndex ? '^' : '>'}
                      </span>
                    </div>
                    {expandedSectionIndex === sectionIndex && (
                      <div className="chapters-list">
                        {section.chapters?.map((chapter, chapterIndex) => (
                          <div key={chapterIndex} className="chapter">
                            <div
                              className="chapter-header"
                              onClick={() => toggleChapter(sectionIndex, chapterIndex)}
                              role="button"
                              tabIndex={0}
                              onKeyPress={(e) => { if (e.key === 'Enter') toggleChapter(sectionIndex, chapterIndex); }}
                            >
                              <h4>{chapter.chapterTitle}</h4>
                              <span className="toggle-icon">
                                {expandedChapters[sectionIndex] && expandedChapters[sectionIndex][chapterIndex] ? '^' : '>'}
                              </span>
                            </div>
                            {expandedChapters[sectionIndex] && expandedChapters[sectionIndex][chapterIndex] && (
                              <div className="chapter-details">
                                <table className="subchapter-table">
                                  <thead>
                                    <tr>
                                      <th>Status</th>
                                      <th>Title</th>
                                      <th>Video</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {chapter.subChapters?.map((sub, subIndex) => {
                                      const key = `${sectionIndex}-${chapterIndex}-${subIndex}`;
                                      return (
                                        <tr key={subIndex}>
                                          <td>
                                            <label>
                                              <input
                                                type="checkbox"
                                                checked={completedSubChapters[key] || false}
                                                onChange={() =>
                                                  toggleSubChapterCompletion(sectionIndex, chapterIndex, subIndex)
                                                }
                                              />
                                            </label>
                                          </td>
                                          <td>{sub.subTitle}</td>
                                          <td>
                                            {sub.subUrl ? (
                                              <button onClick={() => setModalVideoUrl(sub.subUrl)} className="video-button">
                                                <svg className="youtube-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                                                  <path fill="#FF0000" d="M23.498 6.186a2.995 2.995 0 0 0-2.11-2.115C19.76 3.5 12 3.5 12 3.5s-7.76 0-9.388.571A2.995 2.995 0 0 0 .5 6.186 31.38 31.38 0 0 0 0 12a31.38 31.38 0 0 0 .5 5.814 2.995 2.995 0 0 0 2.112 2.115C4.24 20.5 12 20.5 12 20.5s7.76 0 9.388-.571a2.995 2.995 0 0 0 2.11-2.115A31.38 31.38 0 0 0 24 12a31.38 31.38 0 0 0-.502-5.814z" />
                                                  <path fill="#fff" d="M9.545 15.568V8.432L15.818 12z" />
                                                </svg>
                                              </button>
                                            ) : (
                                              'No video'
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </section>
            </>
          ) : (
            <p>No course selected from your profile.</p>
          )}
        </main>
        {modalVideoUrl && (
          <div className="video-modal">
            <div className="video-modal-content">
              <button className="close-modal" onClick={() => setModalVideoUrl(null)}>✕</button>
              <ReactPlayer url={modalVideoUrl} controls playing width="100%" height="100%" />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
