import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://lms-portal-backend-qgui.onrender.com',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to handle errors
api.interceptors.request.use(
  (config) => {
    // Log the request URL in development
    if (import.meta.env.DEV) {
      console.log('Making request to:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
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
const apiService = {
  // Auth
  login: (credentials) => api.post('/api/login', credentials),
  logout: () => api.post('/api/logout'),
  register: (userData) => api.post('/api/register', userData),
  getCurrentUser: () => api.get('/api/current-user'),

  // Courses
  getCourses: () => api.get('/api/courses'),
  getCourse: (id) => api.get(`/api/courses/${id}`),
  createCourse: (courseData) => api.post('/api/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/api/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/api/courses/${id}`),
  getCoursesWithUsers: () => api.get('/api/courses-with-users'),

  // Users
  getUsers: () => api.get('/api/users'),
  getUser: (id) => api.get(`/api/users/${id}`),
  updateUser: (id, userData) => api.put(`/api/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/api/users/${id}`),

  // Profiles
  getProfile: (email) => api.get(`/api/profile?email=${email}`),
  updateProfile: (profileData) => api.put('/api/profile', profileData),
  uploadProfileImage: (formData) => api.post('/api/profile', formData),

  // Banned Users
  getBannedUsers: () => api.get('/api/banned-users'),
  unblockUser: (id) => api.put(`/api/banned-users/${id}/unblock`),
};

export { api, apiService };
export default apiService; 
