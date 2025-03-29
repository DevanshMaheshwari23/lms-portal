import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - let the AuthContext handle the navigation
          console.error('Unauthorized access');
          break;
        case 403:
          console.error('Access denied');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('An error occurred');
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth
  login: (credentials) => api.post('/login', credentials),
  logout: () => api.post('/logout'),
  register: (userData) => api.post('/register', userData),
  getCurrentUser: () => api.get('/current-user'),

  // Courses
  getCourses: () => api.get('/courses'),
  getCourse: (id) => api.get(`/courses/${id}`),
  createCourse: (courseData) => api.post('/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  getCoursesWithUsers: () => api.get('/courses-with-users'),

  // Users
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Profiles
  getProfile: (email) => api.get(`/profile?email=${email}`),
  updateProfile: (profileData) => api.put('/profile', profileData),
  uploadProfileImage: (formData) => api.post('/profile', formData),

  // Banned Users
  getBannedUsers: () => api.get('/banned-users'),
  unblockUser: (id) => api.put(`/banned-users/${id}/unblock`),
};

export default apiService; 