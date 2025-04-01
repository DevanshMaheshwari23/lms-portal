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
          // Redirect to login page if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
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

// Helper function to handle API responses
const handleApiResponse = (response) => {
  return {
    success: true,
    message: response.data?.message || 'Operation successful',
    data: response.data
  };
};

// Helper function to handle API errors
const handleApiError = (error) => {
  return {
    success: false,
    message: error.response?.data?.message || 'Operation failed',
    error: error.response?.data || error.message
  };
};

// API methods
const apiService = {
  // Auth
  login: async (credentials) => {
    try {
      const response = await api.post('/api/login', credentials);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Login error:', error);
      return handleApiError(error);
    }
  },
  logout: async () => {
    try {
      const response = await api.post('/api/logout');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Logout error:', error);
      return handleApiError(error);
    }
  },
  register: async (userData) => {
    try {
      const response = await api.post('/api/register', userData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Registration error:', error);
      return handleApiError(error);
    }
  },
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/current-user');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching current user:', error);
      return handleApiError(error);
    }
  },

  // Courses
  getCourses: async () => {
    try {
      const response = await api.get('/api/courses');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching courses:', error);
      return handleApiError(error);
    }
  },
  getCourse: async (id) => {
    try {
      const response = await api.get(`/api/courses/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching course ${id}:`, error);
      return handleApiError(error);
    }
  },
  createCourse: async (courseData) => {
    try {
      const response = await api.post('/api/courses', courseData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error creating course:', error);
      return handleApiError(error);
    }
  },
  updateCourse: async (id, courseData) => {
    try {
      const response = await api.put(`/api/courses/${id}`, courseData);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating course ${id}:`, error);
      return handleApiError(error);
    }
  },
  deleteCourse: async (id) => {
    try {
      const response = await api.delete(`/api/courses/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting course ${id}:`, error);
      return handleApiError(error);
    }
  },
  getCoursesWithUsers: async () => {
    try {
      const response = await api.get('/api/courses-with-users');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching courses with users:', error);
      return handleApiError(error);
    }
  },

  // Users
  getUsers: async () => {
    try {
      const response = await api.get('/api/users');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching users:', error);
      return handleApiError(error);
    }
  },
  getUser: async (id) => {
    try {
      const response = await api.get(`/api/users/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return handleApiError(error);
    }
  },
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/api/users/${id}`, userData);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      return handleApiError(error);
    }
  },
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/api/users/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return handleApiError(error);
    }
  },

  // Profiles
  getProfile: async (email) => {
    try {
      const response = await api.get(`/api/profile?email=${email}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return handleApiError(error);
    }
  },
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/profile', profileData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error updating profile:', error);
      return handleApiError(error);
    }
  },
  uploadProfileImage: async (formData) => {
    try {
      const response = await api.post('/api/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return handleApiError(error);
    }
  },

  // Banned Users
  getBannedUsers: async () => {
    try {
      const response = await api.get('/api/banned-users');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching banned users:', error);
      return handleApiError(error);
    }
  },
  unblockUser: async (id) => {
    try {
      const response = await api.put(`/api/banned-users/${id}/unblock`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error unblocking user ${id}:`, error);
      return handleApiError(error);
    }
  },
};

export { api, apiService };
export default apiService; 
