import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import apiService from '../services/api';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon
} from '@mui/icons-material';

function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeUsers: 0,
    bannedUsers: 0
  });

  // Course Management
  const [courses, setCourses] = useState([]);
  const [courseDialog, setCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    level: 'Beginner',
    sections: []
  });

  // User Management
  const [users, setUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, coursesRes, usersRes, bannedRes] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getCourses(),
        apiService.getUsers(),
        apiService.getBannedUsers()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (coursesRes.success) setCourses(coursesRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (bannedRes.success) setBannedUsers(bannedRes.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCourseDialogOpen = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseData(course);
    } else {
      setEditingCourse(null);
      setCourseData({
        title: '',
        description: '',
        price: '',
        duration: '',
        level: 'Beginner',
        sections: []
      });
    }
    setCourseDialog(true);
  };

  const handleCourseDialogClose = () => {
    setCourseDialog(false);
    setEditingCourse(null);
    setCourseData({
      title: '',
      description: '',
      price: '',
      duration: '',
      level: 'Beginner',
      sections: []
    });
  };

  const handleCourseSubmit = async () => {
    try {
      const response = editingCourse
        ? await apiService.updateCourse(editingCourse._id, courseData)
        : await apiService.createCourse(courseData);

      if (response.success) {
        fetchDashboardData();
        handleCourseDialogClose();
      } else {
        setError(response.message || 'Failed to save course');
      }
    } catch (err) {
      setError('Failed to save course');
      console.error('Error saving course:', err);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await apiService.deleteCourse(courseId);
        if (response.success) {
          fetchDashboardData();
        } else {
          setError(response.message || 'Failed to delete course');
        }
      } catch (err) {
        setError('Failed to delete course');
        console.error('Error deleting course:', err);
      }
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const response = await apiService.blockUser(userId);
      if (response.success) {
        fetchDashboardData();
      } else {
        setError(response.message || 'Failed to block user');
      }
    } catch (err) {
      setError('Failed to block user');
      console.error('Error blocking user:', err);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const response = await apiService.unblockUser(userId);
      if (response.success) {
        fetchDashboardData();
      } else {
        setError(response.message || 'Failed to unblock user');
      }
    } catch (err) {
      setError('Failed to unblock user');
      console.error('Error unblocking user:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4">{stats.totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Courses
              </Typography>
              <Typography variant="h4">{stats.totalCourses}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4">{stats.activeUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Banned Users
              </Typography>
              <Typography variant="h4">{stats.bannedUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<DashboardIcon />} label="Overview" />
          <Tab icon={<SchoolIcon />} label="Courses" />
          <Tab icon={<PeopleIcon />} label="Users" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          {/* Add recent activity list here */}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Course Management</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleCourseDialogOpen()}
            >
              Add Course
            </Button>
          </Box>

          <Grid container spacing={3}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{course.title}</Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {course.description}
                    </Typography>
                    <Typography variant="body2">
                      Price: ${course.price} | Duration: {course.duration}
                    </Typography>
                  </CardContent>
                  <Box display="flex" justifyContent="flex-end" p={2}>
                    <IconButton onClick={() => handleCourseDialogOpen(course)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteCourse(course._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            User Management
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            Active Users
          </Typography>
          <List>
            {users.map((user) => (
              <ListItem key={user._id}>
                <ListItemText
                  primary={user.email}
                  secondary={`Joined: ${new Date(user.createdAt).toLocaleDateString()}`}
                />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => handleBlockUser(user._id)}>
                    <BlockIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>
            Banned Users
          </Typography>
          <List>
            {bannedUsers.map((user) => (
              <ListItem key={user._id}>
                <ListItemText
                  primary={user.email}
                  secondary={`Banned on: ${new Date(user.bannedAt).toLocaleDateString()}`}
                />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => handleUnblockUser(user._id)}>
                    <CheckCircleIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Dialog open={courseDialog} onClose={handleCourseDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={courseData.title}
              onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={courseData.description}
              onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
            />
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={courseData.price}
              onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Duration"
              value={courseData.duration}
              onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="Level"
              value={courseData.level}
              onChange={(e) => setCourseData({ ...courseData, level: e.target.value })}
              margin="normal"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCourseDialogClose}>Cancel</Button>
          <Button onClick={handleCourseSubmit} variant="contained" color="primary">
            {editingCourse ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminPanel;
