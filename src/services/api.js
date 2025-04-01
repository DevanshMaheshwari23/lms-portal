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
  async (config) => {
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

    // Remove any CORS headers from client-side requests
    delete config.headers['Access-Control-Allow-Origin'];
    delete config.headers['Access-Control-Allow-Credentials'];

    // Try to refresh session before making the request
    if (config.url !== '/api/current-user' && config.url !== '/api/login') {
      try {
        const sessionRefreshed = await sessionManager.refreshSession();
        if (!sessionRefreshed) {
          sessionManager.clearSession();
          sessionManager.redirectToLogin();
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      } catch (error) {
        console.error('Session refresh error:', error);
        sessionManager.clearSession();
        sessionManager.redirectToLogin();
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add session management functions
const sessionManager = {
  clearSession: () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('selectedCourse');
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
  },

  saveSession: (userData) => {
    if (userData.email) {
      localStorage.setItem('userEmail', userData.email);
    }
    if (userData.course) {
      localStorage.setItem('selectedCourse', userData.course);
    }
  },

  redirectToLogin: () => {
    if (!window.location.pathname.includes('/login')) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = '/login';
    }
  },

  refreshSession: async () => {
    try {
      const response = await api.get('/current-user');
      if (response.data.success) {
        sessionManager.saveSession(response.data.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  }
};

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // If the response contains an image URL, update it to use the full backend URL
    if (response.data && response.data.profileImage) {
      // Handle default profile image
      if (response.data.profileImage === 'default-profile.png') {
        response.data.profileImage = '/default-profile.png';
      }
      // Ensure the URL starts with a slash
      const imagePath = response.data.profileImage.startsWith('/') 
        ? response.data.profileImage 
        : `/${response.data.profileImage}`;
      response.data.profileImage = `${import.meta.env.VITE_API_URL}${imagePath}`;
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_FAILED') {
      console.error('Network error:', error);
      sessionManager.clearSession();
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
          sessionManager.clearSession();
          sessionManager.redirectToLogin();
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
      // Ensure credentials are properly formatted
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      const response = await api.post('/login', credentials, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true,
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Don't reject if status is less than 500
        }
      });
      
      // Handle both JSON and text responses
      let responseData;
      if (typeof response.data === 'string') {
        try {
          responseData = JSON.parse(response.data);
        } catch (e) {
          responseData = { success: false, message: response.data };
        }
      } else {
        responseData = response.data;
      }
      
      if (responseData.success) {
        // Store email in localStorage for fallback
        localStorage.setItem('userEmail', credentials.email);
        return handleApiResponse({ data: responseData });
      } else {
        return handleApiError({ response: { data: responseData } });
      }
    } catch (error) {
      console.error('Login error:', error);
      // Handle network errors specifically
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_FAILED') {
        return handleApiError({
          response: {
            data: {
              message: 'Unable to connect to the server. Please check your internet connection and try again.'
            }
          }
        });
      }
      // Handle session expiration
      if (error.response?.status === 401) {
        return handleApiError({
          response: {
            data: {
              message: 'Session expired. Please log in again.'
            }
          }
        });
      }
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
      
      // Handle both JSON and text responses
      let responseData;
      if (typeof response.data === 'string') {
        try {
          responseData = JSON.parse(response.data);
        } catch (e) {
          responseData = { success: false, message: response.data };
        }
      } else {
        responseData = response.data;
      }

      if (responseData.success && responseData.data) {
        // Store user data in localStorage for fallback
        if (responseData.data.email) {
          localStorage.setItem('userEmail', responseData.data.email);
        }
        if (responseData.data.selectedCourse) {
          localStorage.setItem('selectedCourse', 
            typeof responseData.data.selectedCourse === 'object' 
              ? responseData.data.selectedCourse._id 
              : responseData.data.selectedCourse
          );
        }
        return handleApiResponse({ data: responseData });
      } else {
        // If no user data, try to get profile using email from localStorage
        const email = localStorage.getItem('userEmail');
        if (email) {
          const profileResponse = await api.get('/profile', {
            params: { email },
            headers: {
              'Accept': 'application/json'
            }
          });
          return handleApiResponse({ data: profileResponse.data });
        }
        return handleApiError({ response: { data: responseData } });
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Handle session expiration
      if (error.response?.status === 401) {
        // Clear session data
        localStorage.removeItem('userEmail');
        localStorage.removeItem('selectedCourse');
        return handleApiError({
          response: {
            data: {
              message: 'Session expired. Please log in again.'
            }
          }
        });
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
  blockUser: async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/block`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error blocking user ${userId}:`, error);
      return handleApiError(error);
    }
  },
  unblockUser: async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/unblock`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error unblocking user ${userId}:`, error);
      return handleApiError(error);
    }
  },

  // Profiles
  getProfile: async (email) => {
    try {
      // Ensure email is provided
      if (!email) {
        throw new Error('Email is required');
      }

      // Use the correct URL format with query parameters
      const response = await api.get('/profile', {
        params: { email },
        headers: {
          'Accept': 'application/json'
        }
      });

      // Handle both JSON and text responses
      let responseData;
      if (typeof response.data === 'string') {
        try {
          responseData = JSON.parse(response.data);
        } catch (e) {
          responseData = { success: false, message: response.data };
        }
      } else {
        responseData = response.data;
      }

      return handleApiResponse({ data: responseData });
    } catch (error) {
      console.error('Profile fetch error:', error);
      return handleApiError(error);
    }
  },
  updateProfile: async (formData) => {
    try {
      // Validate formData
      if (!formData) {
        throw new Error('Form data is required');
      }

      // Ensure required fields are present
      const email = formData.get('email');
      if (!email) {
        throw new Error('Email is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Log the form data for debugging
      console.log('Updating profile with:', {
        email,
        hasName: formData.has('name'),
        hasCourse: formData.has('course'),
        hasImage: formData.has('profileImage')
      });

      // Validate image if present
      const imageFile = formData.get('profileImage');
      if (imageFile) {
        // Check file size (max 5MB)
        if (imageFile.size > 5 * 1024 * 1024) {
          throw new Error('File size too large. Please upload an image smaller than 5MB.');
        }
        // Check file type
        if (!imageFile.type.startsWith('image/')) {
          throw new Error('Invalid file type. Please upload an image file (JPG, PNG, etc.).');
        }
      }

      // Try to refresh session before proceeding
      const sessionRefreshed = await sessionManager.refreshSession();
      if (!sessionRefreshed) {
        throw new Error('Session expired. Please log in again.');
      }

      const response = await api.put('/profile', formData, {
        headers: {
          'Accept': 'application/json'
        },
        withCredentials: true,
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Don't reject if status is less than 500
        }
      });

      // Handle both JSON and text responses
      let responseData;
      if (typeof response.data === 'string') {
        try {
          responseData = JSON.parse(response.data);
        } catch (e) {
          responseData = { success: false, message: response.data };
        }
      } else {
        responseData = response.data;
      }

      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to update profile');
      }

      // If update was successful, get the current user's course
      try {
        const currentUserResponse = await api.get('/current-user');
        if (currentUserResponse.data.success && currentUserResponse.data.data) {
          // Store the user data including course
          sessionManager.saveSession(currentUserResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching updated user data:', error);
      }

      // Return success response
      return handleApiResponse({ data: responseData });
    } catch (error) {
      console.error('Profile update error:', error);
      // Provide more specific error messages
      if (error.response?.status === 400) {
        return handleApiError({
          response: {
            data: {
              message: error.response.data.message || 'Invalid profile data. Please check your input.'
            }
          }
        });
      }
      if (error.response?.status === 401) {
        sessionManager.clearSession();
        sessionManager.redirectToLogin();
        return handleApiError({
          response: {
            data: {
              message: 'Session expired. Please log in again.'
            }
          }
        });
      }
      if (error.response?.status === 413) {
        return handleApiError({
          response: {
            data: {
              message: 'File size too large. Please upload an image smaller than 5MB.'
            }
          }
        });
      }
      if (error.response?.status === 415) {
        return handleApiError({
          response: {
            data: {
              message: 'Invalid file type. Please upload an image file (JPG, PNG, etc.).'
            }
          }
        });
      }
      if (error.response?.status === 500) {
        return handleApiError({
          response: {
            data: {
              message: 'Server error. Please try again later or contact support if the issue persists.'
            }
          }
        });
      }
      return handleApiError(error);
    }
  },
  uploadProfileImage: async (formData) => {
    try {
      // Ensure formData is provided
      if (!formData) {
        throw new Error('Form data is required');
      }

      const response = await api.post('/profile', formData, {
        headers: {
          'Accept': 'application/json'
        }
      });

      // Handle both JSON and text responses
      let responseData;
      if (typeof response.data === 'string') {
        try {
          responseData = JSON.parse(response.data);
        } catch (e) {
          responseData = { success: false, message: response.data };
        }
      } else {
        responseData = response.data;
      }

      return handleApiResponse({ data: responseData });
    } catch (error) {
      console.error('Profile image upload error:', error);
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
