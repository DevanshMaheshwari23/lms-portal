import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://lms-portal-backend-qgui.onrender.com',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  maxRedirects: 0, // Disable redirects to prevent loops
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Don't reject if status is less than 500
  }
});

// Add request interceptor to handle authentication and paths
api.interceptors.request.use(
  (config) => {
    // Log request URL in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request URL:', config.url);
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
    
    // Add API prefix if not present and not already an API endpoint
    if (!config.url.startsWith('/api/') && !config.url.includes('/profile/')) {
      config.url = `/api${config.url}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // If the response contains an image URL, update it to use the full backend URL
    if (response.data && response.data.profileImage) {
      response.data.profileImage = `${import.meta.env.VITE_API_URL}${response.data.profileImage}`;
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_FAILED') {
      console.error('Network error:', error);
      // Clear any existing session data
      localStorage.removeItem('userEmail');
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection and try again.',
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
          // Only redirect if we're not already on the login page
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
      message: 'An unexpected error occurred. Please try again.',
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
      
      if (response.data.success) {
        // Store email in localStorage for fallback
        localStorage.setItem('userEmail', credentials.email);
      }
      
      return handleApiResponse(response);
    } catch (error) {
      console.error('Login error:', error);
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
      // Try to get the current user without checking email first
      const response = await api.get('/current-user');
      return handleApiResponse(response);
    } catch (error) {
      // If we get a 401, clear the stored email
      if (error.response?.status === 401) {
        localStorage.removeItem('userEmail');
      }
      return handleApiError(error);
    }
  },

  // Courses
  getCourses: async () => {
    try {
      const response = await api.get('/courses');
      if (!response.data) {
        throw new Error('No courses data received');
      }
      // Check if the response has a data property
      const courses = response.data.data || response.data;
      return {
        success: true,
        message: 'Courses fetched successfully',
        data: courses
      };
    } catch (error) {
      console.error('Error fetching courses:', error);
      return handleApiError(error);
    }
  },
  getCourse: async (courseId) => {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      const response = await api.get(`/courses/${courseId}`);
      if (!response.data) {
        throw new Error('No course data received');
      }
      // Check if the response has a data property
      const course = response.data.data || response.data;
      return {
        success: true,
        message: 'Course fetched successfully',
        data: course
      };
    } catch (error) {
      console.error(`Error fetching course ${courseId}:`, error);
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
      // Use the correct URL format with query parameters
      const response = await api.get('/api/profile', {
        params: { email }
      });
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
      const response = await api.post('/profile', formData, {
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

  // Password reset methods
  requestOtp: async (email) => {
    try {
      const response = await api.post('/request-otp', { email });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error requesting OTP:', error);
      return handleApiError(error);
    }
  },

  verifyOtp: async (data) => {
    try {
      const response = await api.post('/verify-otp', data);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return handleApiError(error);
    }
  },
};

export default apiService; 
