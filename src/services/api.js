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
    // Ensure credentials are included
    config.withCredentials = true;
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
          // Clear any existing session data
          document.cookie.split(';').forEach(cookie => {
            document.cookie = cookie
              .replace(/^ +/, '')
              .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
          });
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
  login: async (credentials) => {
    try {
      const response = await api.post('/api/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  logout: async () => {
    try {
      const response = await api.post('/api/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  register: async (userData) => {
    try {
      const response = await api.post('/api/register', userData);
      // Ensure we return a consistent response format
      return {
        success: true,
        message: 'User registered successfully',
        data: response.data
      };
    } catch (error) {
      console.error('Registration error:', error);
      // Return a consistent error format
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        error: error.response?.data || error.message
      };
    }
  },
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/current-user');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // Courses
  getCourses: async () => {
    try {
      const response = await api.get('/api/courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },
  getCourse: async (id) => {
    try {
      const response = await api.get(`/api/courses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching course ${id}:`, error);
      throw error;
    }
  },
  createCourse: async (courseData) => {
    try {
      const response = await api.post('/api/courses', courseData);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },
  updateCourse: async (id, courseData) => {
    try {
      const response = await api.put(`/api/courses/${id}`, courseData);
      return response.data;
    } catch (error) {
      console.error(`Error updating course ${id}:`, error);
      throw error;
    }
  },
  deleteCourse: async (id) => {
    try {
      const response = await api.delete(`/api/courses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting course ${id}:`, error);
      throw error;
    }
  },
  getCoursesWithUsers: async () => {
    try {
      const response = await api.get('/api/courses-with-users');
      return response.data;
    } catch (error) {
      console.error('Error fetching courses with users:', error);
      throw error;
    }
  },

  // Users
  getUsers: async () => {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  getUser: async (id) => {
    try {
      const response = await api.get(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/api/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  // Profiles
  getProfile: async (email) => {
    try {
      const response = await api.get(`/api/profile?email=${email}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  uploadProfileImage: async (formData) => {
    try {
      const response = await api.post('/api/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  },

  // Banned Users
  getBannedUsers: async () => {
    try {
      const response = await api.get('/api/banned-users');
      return response.data;
    } catch (error) {
      console.error('Error fetching banned users:', error);
      throw error;
    }
  },
  unblockUser: async (id) => {
    try {
      const response = await api.put(`/api/banned-users/${id}/unblock`);
      return response.data;
    } catch (error) {
      console.error(`Error unblocking user ${id}:`, error);
      throw error;
    }
  },
};

export { api, apiService };
export default apiService; 
