import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import apiService from '../services/apiService';

function AdminPanel() {
  // Course form state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [sections, setSections] = useState([
    { 
      sectionTitle: '', 
      chapters: [
        { 
          chapterTitle: '', 
          subChapters: [] 
        }
      ] 
    },
  ]);
  const [error, setError] = useState('');

  // Additional state for editing courses
  const [coursesList, setCoursesList] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  
  // Dropdown states for course form
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [expandedSubChapters, setExpandedSubChapters] = useState({});

  // New state for managing tabs (Courses or Settings)
  const [activeTab, setActiveTab] = useState('courses');
  // State for user list (for settings)
  const [users, setUsers] = useState([]);
  // State for banned users list
  const [bannedUsers, setBannedUsers] = useState([]);
  // New dropdown state for settings tab
  const [activeUsersDropdownExpanded, setActiveUsersDropdownExpanded] = useState(false);
  const [bannedUsersDropdownExpanded, setBannedUsersDropdownExpanded] = useState(false);

  // Add new state for dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeUsers: 0,
    completionRate: 0
  });

  const navigate = useNavigate();

  // Authentication check on mount
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/adminlogin');
    }
  }, [navigate]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/adminlogin");
  };

  // Prevent forward navigation
  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      window.history.go(1);
    };
  }, []);

  // Force logout on browser back navigation
  useEffect(() => {
    const handlePopState = () => {
      localStorage.removeItem("isLoggedIn");
      navigate("/adminlogin");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  // Fetch courses list on mount or after changes
  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCoursesList();
    }
  }, [activeTab]);

  const fetchCoursesList = async () => {
    try {
      const res = await apiService.getCourses();
      setCoursesList(res.data);
    } catch (err) {
      console.error('Error fetching courses list:', err);
    }
  };

  // Fetch user list when Settings tab is active
  useEffect(() => {
    if (activeTab === 'settings') {
      fetchUsers();
      fetchBannedUsers();
    }
  }, [activeTab]);
  
  const fetchUsers = async () => {
    try {
      const res = await apiService.getUsers();
      console.log('Users:', res.data);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchBannedUsers = async () => {
    try {
      const res = await apiService.getBannedUsers();
      console.log('Banned Users:', res.data);
      setBannedUsers(res.data);
    } catch (err) {
      console.error('Error fetching banned users:', err);
    }
  };

  // Block user function remains unchanged
  const blockUser = async (userId, userEmail) => {
    try {
      await apiService.blockUser(userId);
      alert(`User with email ${userEmail} has been blocked, banned, and deleted.`);
      localStorage.setItem('forceLogout', Date.now());
      fetchUsers();
      fetchBannedUsers();
    } catch (err) {
      console.error('Error blocking user:', err);
      alert('Error blocking user');
    }
  };

  // Unblock user function
  const unblockUser = async (bannedUserId, bannedEmail) => {
    try {
      await apiService.unblockUser(bannedUserId);
      alert(`User with email ${bannedEmail} has been unblocked.`);
      fetchBannedUsers();
    } catch (err) {
      console.error('Error unblocking user:', err);
      alert('Error unblocking user');
    }
  };

  // --- Course management helper functions remain unchanged except chapterContent removal ---
  const addSection = () => {
    setSections([
      ...sections,
      { sectionTitle: '', chapters: [{ chapterTitle: '', subChapters: [] }] },
    ]);
  };

  const removeSection = (sectionIndex) => {
    const newSections = sections.filter((_, index) => index !== sectionIndex);
    setSections(newSections);
  };

  const handleSectionTitleChange = (sectionIndex, value) => {
    const newSections = [...sections];
    newSections[sectionIndex].sectionTitle = value;
    setSections(newSections);
  };

  const toggleSection = (sectionIndex) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex]
    }));
  };

  const addChapter = (sectionIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].chapters.push({ 
      chapterTitle: '', 
      subChapters: [] 
    });
    setSections(newSections);
  };

  const removeChapter = (sectionIndex, chapterIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].chapters = newSections[sectionIndex].chapters.filter(
      (_, index) => index !== chapterIndex
    );
    setSections(newSections);
  };

  // Updated to only handle chapterTitle changes
  const handleChapterChange = (sectionIndex, chapterIndex, field, value) => {
    const newSections = [...sections];
    newSections[sectionIndex].chapters[chapterIndex][field] = value;
    setSections(newSections);
  };

  const toggleChapter = (sectionIndex, chapterIndex) => {
    setExpandedChapters(prev => {
      const sectionChapters = prev[sectionIndex] || {};
      return {
        ...prev,
        [sectionIndex]: {
          ...sectionChapters,
          [chapterIndex]: !sectionChapters[chapterIndex]
        }
      };
    });
  };

  const addSubChapter = (sectionIndex, chapterIndex) => {
    const newSections = [...sections];
    if (!newSections[sectionIndex].chapters[chapterIndex].subChapters) {
      newSections[sectionIndex].chapters[chapterIndex].subChapters = [];
    }
    newSections[sectionIndex].chapters[chapterIndex].subChapters.push({
      subTitle: '',
      subUrl: ''
    });
    setSections(newSections);
  };

  const removeSubChapter = (sectionIndex, chapterIndex, subIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].chapters[chapterIndex].subChapters = 
      newSections[sectionIndex].chapters[chapterIndex].subChapters.filter((_, index) => index !== subIndex);
    setSections(newSections);
  };

  const handleSubChapterChange = (sectionIndex, chapterIndex, subIndex, field, value) => {
    const newSections = [...sections];
    newSections[sectionIndex].chapters[chapterIndex].subChapters[subIndex][field] = value;
    setSections(newSections);
  };

  // Toggle the entire sub-chapter block (title and URL together)
  const toggleSubChapter = (sectionIndex, chapterIndex, subIndex) => {
    const key = `${sectionIndex}-${chapterIndex}-${subIndex}`;
    setExpandedSubChapters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save or update course function
  const handleSaveCourse = async () => {
    const courseData = {
      title: courseTitle,
      description: courseDescription,
      category: courseCategory,
      sections: sections.map(sec => ({
        sectionTitle: sec.sectionTitle,
        chapters: sec.chapters,
      })),
    };

    try {
      if (editMode && editingCourseId) {
        await apiService.updateCourse(editingCourseId, courseData);
        alert('Course updated successfully!');
      } else {
        const res = await apiService.createCourse(courseData);
        if (res.status === 201) {
          alert('Course saved successfully!');
        }
      }
      resetForm();
      fetchCoursesList();
    } catch (err) {
      console.error(err);
      setError('Error saving course');
    }
  };

  const handleEditCourse = (course) => {
    setCourseTitle(course.title);
    setCourseDescription(course.description);
    setCourseCategory(course.category);
    const updatedSections = (course.sections || []).map(sec => ({
      ...sec,
      chapters: sec.chapters.map(chap => ({
        ...chap,
        subChapters: chap.subChapters || []
      }))
    }));
    setSections(updatedSections.length ? updatedSections : [{ sectionTitle: '', chapters: [{ chapterTitle: '', subChapters: [] }] }]);
    setEditMode(true);
    setEditingCourseId(course._id);
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this course?');
      if (confirmDelete) {
        await apiService.deleteCourse(courseId);
        alert('Course deleted successfully!');
        fetchCoursesList();
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Error deleting course');
    }
  };

  const resetForm = () => {
    setCourseTitle('');
    setCourseDescription('');
    setCourseCategory('');
    setSections([{ sectionTitle: '', chapters: [{ chapterTitle: '', subChapters: [] }] }]);
    setEditMode(false);
    setEditingCourseId(null);
    setExpandedSections({});
    setExpandedChapters({});
    setExpandedSubChapters({});
  };

  // Add new useEffect for fetching dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [usersRes, coursesRes] = await Promise.all([
          apiService.getUsers(),
          apiService.getCourses()
        ]);

        setDashboardStats({
          totalUsers: usersRes.data.length,
          totalCourses: coursesRes.data.length,
          activeUsers: usersRes.data.filter(user => !user.isBanned).length,
          completionRate: 75 // This should be calculated based on your data
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };

    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    }
  }, [activeTab]);

  return (
    <div className="admin-panel">
      {/* Sidebar with tab options */}
      <div className="sidebar">
        <h3>Admin Panel</h3>
        <ul>
          <li 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </li>
          <li 
            className={activeTab === 'courses' ? 'active' : ''} 
            onClick={() => setActiveTab('courses')}
          >
            Courses
          </li>
          <li 
            className={activeTab === 'settings' ? 'active' : ''} 
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </li>
        </ul>
        {activeTab === 'courses' && (
          <>
            <ul>
              <li className={!editMode ? 'active' : ''} onClick={resetForm}>
                Create Course
              </li>
              {coursesList.map(course => (
                <li key={course._id}>
                  <span onClick={() => handleEditCourse(course)}>{course.title}</span>
                  <button onClick={() => handleDeleteCourse(course._id)} style={{ marginLeft: '10px' }}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <button
          onClick={handleLogout}
          style={{ backgroundColor: "red", color: "white", padding: "10px", border: "none", cursor: "pointer" }}
        >
          Logout
        </button>
      </div>

      {/* Main content area */}
      <div className="content">
        {activeTab === 'dashboard' && (
          <div className="dashboard animate-fade-in">
            <h2>Dashboard Overview</h2>
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>Total Users</h3>
                <p className="stat-number">{dashboardStats.totalUsers}</p>
              </div>
              <div className="dashboard-card">
                <h3>Active Users</h3>
                <p className="stat-number">{dashboardStats.activeUsers}</p>
              </div>
              <div className="dashboard-card">
                <h3>Total Courses</h3>
                <p className="stat-number">{dashboardStats.totalCourses}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <>
            <h2>{editMode ? 'Edit Course' : 'Course Setup'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div className="course-form">
              <div>
                <label>Course Title:</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                />
              </div>
              <div>
                <label>Course Description:</label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                ></textarea>
              </div>
              <div>
                <label>Course Category:</label>
                <input
                  type="text"
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                />
              </div>

              <div className="sections">
                <h3>Sections</h3>
                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="section">
                    <div className="section-header" onClick={() => toggleSection(sectionIndex)}>
                      <label>Section Title:</label>
                      <input
                        type="text"
                        value={section.sectionTitle}
                        onChange={(e) => handleSectionTitleChange(sectionIndex, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button onClick={() => removeSection(sectionIndex)}>Remove Section</button>
                      <span className="toggle-icon">
                        {expandedSections[sectionIndex] ? '-' : '+'}
                      </span>
                    </div>
                    {expandedSections[sectionIndex] && (
                      <div className="chapters">
                        <h4>Chapters</h4>
                        {section.chapters.map((chapter, chapterIndex) => (
                          <div key={chapterIndex} className="chapter">
                            <div className="chapter-header" onClick={() => toggleChapter(sectionIndex, chapterIndex)}>
                              <label>Chapter Title:</label>
                              <input
                                type="text"
                                value={chapter.chapterTitle}
                                onChange={(e) =>
                                  handleChapterChange(sectionIndex, chapterIndex, 'chapterTitle', e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={() => removeChapter(sectionIndex, chapterIndex)}>Remove Chapter</button>
                              <span className="toggle-icon">
                                {(expandedChapters[sectionIndex] && expandedChapters[sectionIndex][chapterIndex]) ? '-' : '+'}
                              </span>
                            </div>
                            {expandedChapters[sectionIndex] && expandedChapters[sectionIndex][chapterIndex] && (
                              <div className="chapter-details">
                                <div className="sub-chapters">
                                  <h5>Sub-Chapters</h5>
                                  {(chapter.subChapters || []).map((sub, subIndex) => {
                                    const key = `${sectionIndex}-${chapterIndex}-${subIndex}`;
                                    return (
                                      <div key={subIndex} className="sub-chapter">
                                        <div className="sub-chapter-header" onClick={() => toggleSubChapter(sectionIndex, chapterIndex, subIndex)}>
                                          <h6 style={{ margin: '0 10px 0 0' }}>Sub-Chapter {subIndex + 1}</h6>
                                          <span className="toggle-icon">
                                            {expandedSubChapters[key] ? '-' : '+'}
                                          </span>
                                        </div>
                                        {expandedSubChapters[key] && (
                                          <div className="sub-chapter-content">
                                            <div>
                                              <label>Title:</label>
                                              <input
                                                type="text"
                                                value={sub.subTitle}
                                                onChange={(e) =>
                                                  handleSubChapterChange(sectionIndex, chapterIndex, subIndex, 'subTitle', e.target.value)
                                                }
                                              />
                                            </div>
                                            <div>
                                              <label>Sub-Chapter URL:</label>
                                              <input
                                                type="text"
                                                value={sub.subUrl}
                                                onChange={(e) =>
                                                  handleSubChapterChange(sectionIndex, chapterIndex, subIndex, 'subUrl', e.target.value)
                                                }
                                              />
                                            </div>
                                            <button onClick={() => removeSubChapter(sectionIndex, chapterIndex, subIndex)}>
                                              Remove Sub-Chapter
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  <button onClick={() => addSubChapter(sectionIndex, chapterIndex)}>
                                    Add Sub-Chapter
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <button onClick={() => addChapter(sectionIndex)}>Add Chapter</button>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={addSection}>Add Section</button>
              </div>

              <button className="save-button" onClick={handleSaveCourse}>
                {editMode ? 'Update Course' : 'Save Course'}
              </button>
              {editMode && (
                <button onClick={resetForm} style={{ marginLeft: '10px' }}>
                  Cancel Edit
                </button>
              )}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section animate-fade-in">
            <h2>User Management</h2>
            <div className="active-users">
              <h3 
                style={{ cursor: 'pointer' }} 
                onClick={() => setActiveUsersDropdownExpanded(prev => !prev)}
              >
                Active Users {activeUsersDropdownExpanded ? '-' : '+'}
              </h3>
              {activeUsersDropdownExpanded && (
                <ul>
                  {users.map(user => (
                    <li key={user._id} className="user-item">
                      <span>
                        {(user.profile && user.profile.name) || user.name} ({user.email})
                      </span>
                      <button
                        onClick={() => blockUser(user._id, user.email)}
                        className="block-button"
                      >
                        Block User
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="banned-users">
              <h3 
                style={{ cursor: 'pointer' }} 
                onClick={() => setBannedUsersDropdownExpanded(prev => !prev)}
              >
                Blocked Users {bannedUsersDropdownExpanded ? '-' : '+'}
              </h3>
              {bannedUsersDropdownExpanded && (
                <>
                  {bannedUsers.length ? (
                    <ul>
                      {bannedUsers.map(banned => (
                        <li key={banned._id} className="user-item">
                          <span>{banned.email} (Banned on: {new Date(banned.bannedAt).toLocaleString()})</span>
                          <button
                            onClick={() => unblockUser(banned._id, banned.email)}
                            className="unblock-button"
                          >
                            Unblock User
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No banned users.</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
