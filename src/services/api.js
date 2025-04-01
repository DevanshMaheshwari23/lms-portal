// ... existing code ...
export const apiService = {
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
// ... existing code ...
