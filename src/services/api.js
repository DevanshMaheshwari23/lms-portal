import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://lms-portal-backend-qgui.onrender.com',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to handle authentication and paths
api.interceptors.request.use(
  (config) => {
    // Log request URL in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request URL:', config.url);
    }

    // Ensure all requests have the correct path prefix
    if (!config.url.startsWith('/api/')) {
      config.url = `/api${config.url}`;
    }

    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    // Ensure credentials are included
    config.withCredentials = true;
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error:', error);
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
        error: 'Network Error'
      });
    }

    // Handle different error status codes
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('API Error:', error.response.data);
          console.error('Unauthorized access');
          // Clear session data
          localStorage.removeItem('userEmail');
          // Clear cookies
          document.cookie.split(';').forEach(cookie => {
            document.cookie = cookie
              .replace(/^ +/, '')
              .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
          });
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject({
            success: false,
            message: 'Session expired. Please log in again.',
            error: error.response.data
          });
        case 403:
          console.error('Access denied');
          return Promise.reject({
            success: false,
            message: 'Access denied. You do not have permission.',
            error: error.response.data
          });
        case 404:
          console.error('Resource not found');
          return Promise.reject({
            success: false,
            message: 'Resource not found.',
            error: error.response.data
          });
        case 500:
          console.error('Server error');
          return Promise.reject({
            success: false,
            message: 'Server error. Please try again later.',
            error: error.response.data
          });
        default:
          console.error('API Error:', error.response.data);
          return Promise.reject({
            success: false,
            message: error.response.data.message || 'An error occurred.',
            error: error.response.data
          });
      }
    }

    return Promise.reject({
      success: false,
      message: 'An unexpected error occurred.',
      error: error.message
    });
  }
);

// Helper functions for consistent response handling
const handleApiResponse = (response) => {
  return {
    success: true,
    message: response.data.message || 'Operation successful',
    data: response.data.data || response.data
  };
};

const handleApiError = (error) => {
  console.error('API Error:', error);
  return {
    success: false,
    message: error.response?.data?.message || 'An error occurred',
    error: error.response?.data || error.message
  };
};

// API methods
const apiService = {
  // Auth
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      // Store email in localStorage for fallback
      if (response.data.success) {
        localStorage.setItem('userEmail', credentials.email);
      }
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
  logout: async () => {
    try {
      const response = await api.post('/logout');
      // Clear session data
      localStorage.removeItem('userEmail');
      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
  getCurrentUser: async () => {
    try {
      const response = await api.get('/current-user');
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Courses
  getCourses: async () => {
    try {
      const response = await api.get('/courses');
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
  getCourse: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
  createCourse: async (courseData) => {
    try {
      const response = await api.post('/courses', courseData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error creating course:', error);
      return handleApiError(error);
    }
  },
  updateCourse: async (id, courseData) => {
    try {
      const response = await api.put(`/courses/${id}`, courseData);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating course ${id}:`, error);
      return handleApiError(error);
    }
  },
  deleteCourse: async (id) => {
    try {
      const response = await api.delete(`/courses/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting course ${id}:`, error);
      return handleApiError(error);
    }
  },
  getCoursesWithUsers: async () => {
    try {
      const response = await api.get('/courses-with-users');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching courses with users:', error);
      return handleApiError(error);
    }
  },

  // Users
  getUsers: async () => {
    try {
      const response = await api.get('/users');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching users:', error);
      return handleApiError(error);
    }
  },
  getUser: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return handleApiError(error);
    }
  },
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      return handleApiError(error);
    }
  },
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return handleApiError(error);
    }
  },

  // Profiles
  getProfile: async (email) => {
    try {
      const response = await api.get(`/profile/${email}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
  updateProfile: async (formData) => {
    try {
      const response = await api.put('/profile', formData, {
        headers: {
          // Let the browser set the Content-Type with boundary
        }
      });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
  uploadProfileImage: async (formData) => {
    try {
      const response = await api.post('/profile/upload', formData, {
        headers: {
          // Let the browser set the Content-Type with boundary
        }
      });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Banned Users
  getBannedUsers: async () => {
    try {
      const response = await api.get('/banned-users');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching banned users:', error);
      return handleApiError(error);
    }
  },
  unblockUser: async (id) => {
    try {
      const response = await api.put(`/banned-users/${id}/unblock`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error unblocking user ${id}:`, error);
      return handleApiError(error);
    }
  },
};

export default apiService; 
