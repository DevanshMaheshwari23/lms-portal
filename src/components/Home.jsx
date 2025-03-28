import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { Helmet } from 'react-helmet';
import { AuthContext } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const [course, setCourse] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [updatedName, setUpdatedName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [modalVideoUrl, setModalVideoUrl] = useState(null);
  const [expandedSectionIndex, setExpandedSectionIndex] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [completedSubChapters, setCompletedSubChapters] = useState({});

  // Use an environment variable for the API base URL. If not set, default to an empty string.
  const API_BASE = process.env.REACT_APP_API_URL || '';

  // Logout function using context
  const handleLogout = useCallback(() => {
    logout();
    window.location.replace('/login');
  }, [logout]);

  // Fetch profile and course info from backend using a dynamic base URL
  const fetchProfileAndCourse = useCallback(async () => {
    if (!user || !user.email) {
      console.error("User not logged in or email not found");
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/api/profile?email=${user.email}`, {
        withCredentials: true,
      });
      
      let courseId;
      const queryParams = new URLSearchParams(window.location.search);
      if (queryParams.has('courseId')) {
        courseId = queryParams.get('courseId');
      } else if (res.data.selectedCourse) {
        courseId = res.data.selectedCourse._id || res.data.selectedCourse;
      }

      if (courseId) {
        const courseRes = await axios.get(`${API_BASE}/api/course/${courseId}`);
        setCourse(courseRes.data);
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
  }, [user, handleLogout, API_BASE]);

  // Fetch profile on mount and poll every 20 seconds
  useEffect(() => {
    fetchProfileAndCourse();
    const intervalId = setInterval(fetchProfileAndCourse, 20000);
    return () => clearInterval(intervalId);
  }, [fetchProfileAndCourse]);

  // Update profile handler using dynamic base URL
  const handleProfileUpdate = useCallback(async () => {
    if (!user || !user.email) return;
    const formData = new FormData();
    formData.append('name', updatedName);
    formData.append('email', user.email);
    if (imageFile) formData.append('profileImage', imageFile);

    try {
      await axios.put(`${API_BASE}/api/profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      alert('Profile updated successfully!');
      setShowProfile(false);
    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err.message);
      alert('There was an error updating your profile. Please try again.');
    }
  }, [updatedName, imageFile, user, API_BASE]);

  // Calculate progress
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

  // Instead of an early return, conditionally render inside the JSX.
  return (
    <>
      <Helmet>
        <title>Gurukul LMS Portal - Home</title>
        <meta name="description" content="Access your courses, track your progress, and update your profile on Gurukul LMS Portal." />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <div className="home">
        {/* Header / Navbar */}
        <header className="navbar">
          <div className="navbar-left">
            <img src="logo.png" alt="Logo" className="logo" />
            <h2>Gurukul (LMS Portal)</h2>
            <span className="greeting"> Welcome, {user?.name || 'Guest'}</span>
          </div>
          <div className="navbar-right">
            <img
              src={user?.profileImage || 'default-profile.png'}
              alt="Profile"
              className="profile-icon"
              onClick={() => setShowProfile((prev) => !prev)}
            />
          </div>
        </header>

        {/* If user data isn't available, show a loading indicator */}
        {!user ? (
          <div>Loading...</div>
        ) : (
          <>
            {/* Profile Modal */}
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

            {/* Main Content */}
            <main className="course-section">
              {course ? (
                <>
                  <section className="course-details">
                    <h1>
                      <span>Course:</span> {course.title}
                    </h1>
                    <h3>
                      <span>Description:</span> {course.description}
                    </h3>

                    {/* Progress Bar */}
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
                        <div
                          className="progress-fill-dark"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Course Sections */}
                    {course.sections?.map((section, sectionIndex) => (
                      <article key={sectionIndex} className="course-section-content">
                        <div
                          className="section-header"
                          onClick={() => setExpandedSectionIndex(expandedSectionIndex === sectionIndex ? null : sectionIndex)}
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              setExpandedSectionIndex(expandedSectionIndex === sectionIndex ? null : sectionIndex);
                            }
                          }}
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
                                  onClick={() => setExpandedChapters((prev) => ({
                                    ...prev,
                                    [sectionIndex]: {
                                      ...prev[sectionIndex],
                                      [chapterIndex]: !prev[sectionIndex]?.[chapterIndex],
                                    },
                                  }))}
                                  role="button"
                                  tabIndex={0}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      setExpandedChapters((prev) => ({
                                        ...prev,
                                        [sectionIndex]: {
                                          ...prev[sectionIndex],
                                          [chapterIndex]: !prev[sectionIndex]?.[chapterIndex],
                                        },
                                      }));
                                    }
                                  }}
                                >
                                  <h4>{chapter.chapterTitle}</h4>
                                  <span className="toggle-icon">
                                    {expandedChapters[sectionIndex] &&
                                    expandedChapters[sectionIndex][chapterIndex]
                                      ? '^'
                                      : '>'}
                                  </span>
                                </div>
                                {expandedChapters[sectionIndex] &&
                                  expandedChapters[sectionIndex][chapterIndex] && (
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
                                                        setCompletedSubChapters((prev) => ({
                                                          ...prev,
                                                          [key]: !prev[key],
                                                        }))
                                                      }
                                                    />
                                                  </label>
                                                </td>
                                                <td>{sub.subTitle}</td>
                                                <td>
                                                  {sub.subUrl ? (
                                                    <button
                                                      onClick={() => setModalVideoUrl(sub.subUrl)}
                                                      className="video-button"
                                                    >
                                                      <svg
                                                        className="youtube-icon"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        width="28"
                                                        height="28"
                                                      >
                                                        <path
                                                          fill="#FF0000"
                                                          d="M23.498 6.186a2.995 2.995 0 0 0-2.11-2.115C19.76 3.5 12 3.5 12 3.5s-7.76 0-9.388.571A2.995 2.995 0 0 0 .5 6.186 31.38 31.38 0 0 0 0 12a31.38 31.38 0 0 0 .5 5.814 2.995 2.995 0 0 0 2.112 2.115C4.24 20.5 12 20.5 12 20.5s7.76 0 9.388-.571a2.995 2.995 0 0 0 2.11-2.115A31.38 31.38 0 0 0 24 12a31.38 31.38 0 0 0-.502-5.814z"
                                                        />
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
                <div className="no-course-message">
                  <p>You have not selected any course in your profile.</p>
                  <button onClick={() => window.location.replace('/profile')}>
                    Update Profile
                  </button>
                </div>
              )}
            </main>

            {/* Video Modal */}
            {modalVideoUrl && (
              <div className="video-modal">
                <div className="video-modal-content">
                  <button className="close-modal" onClick={() => setModalVideoUrl(null)}>
                    ✕
                  </button>
                  <ReactPlayer url={modalVideoUrl} controls playing width="100%" height="100%" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Home;
