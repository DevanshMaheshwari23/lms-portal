import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import session from 'express-session';

dotenv.config();

// Create an Express app
const app = express();
const port = process.env.PORT || 5001;

// Enable CORS and JSON parsing
app.use(cors({
  origin: ['https://lms-portal-qz69.onrender.com', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Referer'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Set-Cookie'],
  maxAge: 86400,
  preflightContinue: false
}));

// Add additional headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (['https://lms-portal-qz69.onrender.com', 'http://localhost:5173'].includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Referer');
    res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range, Set-Cookie');
    res.header('Vary', 'Origin, Accept-Encoding');
    
    // Add security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }
  next();
});

app.use(bodyParser.json());

// Session middleware configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: true,
  saveUninitialized: false,
  cookie: { 
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    domain: '.onrender.com'
  },
  name: 'lms_session',
  proxy: true,
  rolling: true,
  unset: 'destroy',
  store: new session.MemoryStore(),
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    domain: '.onrender.com'
  }
}));

// Add trust proxy for secure cookies
app.set('trust proxy', 1);

// Add session debugging middleware
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session:', req.session);
  next();
});

// Serve static files from the "uploads" folder so that images can be accessed via URL
app.use('/uploads', express.static('uploads'));

const mongoURI = process.env.mongoURI;

// MongoDB Connection
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

/* =====================
   USER & PROFILE MODELS & ENDPOINTS
   ===================== */

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Profile Schema (associated with an email)
const profileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  selectedCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  profileImage: { type: String }
});
const Profile = mongoose.model('Profile', profileSchema);

/* =====================
   BANNED EMAIL MODEL
   ===================== */
const bannedEmailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  bannedAt: { type: Date, default: Date.now }
});
const BannedEmail = mongoose.model('BannedEmail', bannedEmailSchema);

/* =====================
   MULTER CONFIGURATION
   ===================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Files will be stored in "uploads/" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate unique filename
  },
});
const upload = multer({ storage });

/* =====================
   OTP, EMAIL & AUTHENTICATION ENDPOINTS
   ===================== */

let otpStore = {};

// Generate OTP (default 6-digit)
function generateOTP(length = 6) {
  let otp = '';
  const chars = '0123456789';
  for (let i = 0; i < length; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return otp;
}

// Store OTP with expiry (5 minutes)
function storeOTP(email, otp) {
  otpStore[email] = { otp, expiry: Date.now() + 5 * 60 * 1000 };
  console.log(`Stored OTP for ${email}:`, otpStore[email]);
}

// Send OTP email using Nodemailer
async function sendOTPEmail(receiverEmail, otp) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: {
      name: "LMS Portal Security",
      address: process.env.EMAIL
    },
    replyTo: process.env.EMAIL,
    to: receiverEmail,
    subject: 'Secure Verification Code - LMS Portal',
    headers: {
      'List-Unsubscribe': `<mailto:${process.env.EMAIL}>`,
      'Precedence': 'bulk',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    },
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="format-detection" content="telephone=no">
          <meta name="x-apple-disable-message-reformatting">
          <title>Secure Verification Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .otp-box {
              background-color: #f8f9fa;
              border: 2px dashed #3b82f6;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #3b82f6;
              letter-spacing: 5px;
              margin: 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
            .security-notice {
              background-color: #f8f9fa;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #1a56db; margin-bottom: 20px;">Secure Verification Code</h1>
            </div>
            
            <p>Dear User,</p>
            
            <p>We received a request to verify your identity for the LMS Portal. To complete the process, please use the following secure verification code:</p>
            
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
            </div>
            
            <div class="security-notice">
              <p><strong>Security Notice:</strong></p>
              <ul>
                <li>This verification code will expire in 5 minutes</li>
                <li>If you didn't request this verification, please ignore this email</li>
                <li>For security reasons, never share this code with anyone</li>
                <li>Our support team will never ask for this code</li>
              </ul>
            </div>
            
            <p>If you need assistance, please contact our support team.</p>
            
            <div class="footer">
              <p>This is a secure message from LMS Portal. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} LMS Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Secure Verification Code: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this verification, please ignore this email.\n\nFor security reasons, never share this code with anyone.\n\nBest regards,\nLMS Portal Security Team`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

// Request OTP endpoint
app.post('/api/request-otp', async (req, res) => {
  let { email } = req.body;
  email = email.trim().toLowerCase();
  console.log('Request OTP for:', email);

  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found for OTP request:', email);
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const otp = generateOTP();
  storeOTP(email, otp);
  await sendOTPEmail(email, otp);
  res.json({ success: true, message: 'OTP sent to email' });
});

// Verify OTP and update password endpoint
app.post('/api/verify-otp', async (req, res) => {
  let { email, otp, newPassword } = req.body;
  email = email.trim().toLowerCase();
  otp = otp.trim();
  newPassword = newPassword.trim();
  console.log('Verifying OTP for:', email, 'with OTP:', otp);

  if (!email || !otp || !newPassword) {
    console.log('Missing required fields');
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const otpData = otpStore[email];
  if (!otpData) {
    console.log('No OTP data for:', email);
    return res.status(400).json({ success: false, message: 'OTP not sent or expired' });
  }

  if (Date.now() > otpData.expiry) {
    console.log('OTP expired for:', email);
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'OTP has expired' });
  }

  if (otpData.otp !== otp) {
    console.log('Invalid OTP. Received:', otp, 'Expected:', otpData.otp);
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for:', email);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    delete otpStore[email];

    console.log('Password updated successfully for:', email);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'Error updating password', error: error.message });
  }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim().toLowerCase();
    password = password.trim();
    console.log('Registering user:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // Create profile for the user
    const newProfile = new Profile({
      email,
      name: email.split('@')[0], // Use part of email as default name
      selectedCourse: null,
      profileImage: 'default-profile.png'
    });
    await newProfile.save();

    console.log('User registered successfully:', email);
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully' 
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering user', 
      error: err.message 
    });
  }
});

// Login endpoint (with banned email check and session handling)
app.post('/api/login', async (req, res) => {
  let { email, password } = req.body;
  email = email.trim().toLowerCase();
  password = password.trim();
  console.log('Login attempt for:', email);

  // Check if email is banned
  const banned = await BannedEmail.findOne({ email });
  if (banned) {
    console.log('Banned email attempted to login:', email);
    return res.status(401).json({ success: false, message: 'This email has been banned.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for:', email);
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // Get user profile
      let profile = await Profile.findOne({ email });
      if (!profile) {
        profile = new Profile({
          email,
          name: email.split('@')[0],
          selectedCourse: null,
          profileImage: 'default-profile.png'
        });
        await profile.save();
      }

      // Save user info into session
      req.session.user = { 
        email: user.email,
        name: profile.name,
        selectedCourse: profile.selectedCourse,
        profileImage: profile.profileImage,
        hasProfile: !!profile.name && profile.name !== email.split('@')[0]
      };

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).json({ success: false, message: 'Error creating session' });
        }

        // Set session cookie explicitly
        res.cookie('lms_session', req.session.id, {
          secure: true,
          sameSite: 'none',
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          path: '/',
          domain: '.onrender.com'
        });

        // Set additional headers for security
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        console.log('Login successful for:', email);
        return res.json({ 
          success: true,
          data: {
            email: user.email,
            name: profile.name,
            selectedCourse: profile.selectedCourse,
            profileImage: profile.profileImage,
            hasProfile: !!profile.name && profile.name !== email.split('@')[0]
          }
        });
      });
    } else {
      console.log('Invalid credentials for:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ success: false, message: 'Error during login', error: error.message });
  }
});

// Endpoint to get current user from session
app.get('/api/current-user', async (req, res) => {
  console.log('Current user request - Session:', req.session);
  
  if (req.session && req.session.user) {
    try {
      // Get the user's email from the session
      const { email } = req.session.user;
      
      // Check if the email is banned
      const banned = await BannedEmail.findOne({ email });
      if (banned) {
        return res.status(401).json({ success: false, message: 'This account has been banned.' });
      }
      
      // Get the latest user data from the database
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      // Get the latest profile data
      const profile = await Profile.findOne({ email });
      
      // Update session with latest data
      req.session.user = {
        email: user.email,
        name: profile ? profile.name : email.split('@')[0],
        selectedCourse: profile ? profile.selectedCourse : null,
        profileImage: profile ? profile.profileImage : 'default-profile.png',
        hasProfile: profile ? (!!profile.name && profile.name !== email.split('@')[0]) : false
      };

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).json({ success: false, message: 'Error saving session' });
        }

        // Set session cookie explicitly
        res.cookie('lms_session', req.session.id, {
          secure: true,
          sameSite: 'none',
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          path: '/',
          domain: '.onrender.com'
        });

        // Return the updated session user data
        return res.json({ 
          success: true,
          data: req.session.user
        });
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      return res.status(500).json({ success: false, message: 'Error fetching user data' });
    }
  }
  
  // If no session or user, clear any existing session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  });
});

/* =====================
   PROFILE ENDPOINTS
   ===================== */

// GET /api/profile - Returns the profile for the given email (or creates a default profile if none exists)
app.get('/api/profile', async (req, res) => {
  console.log('GET /api/profile hit');
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required' });
    }
    
    // Check if the email is banned
    const banned = await BannedEmail.findOne({ email });
    if (banned) {
      return res.status(401).json({ message: 'This account has been banned.' });
    }

    let profile = await Profile.findOne({ email }).populate('selectedCourse');
    // Create a default profile if none exists
    if (!profile) {
      profile = new Profile({ 
        email,
        name: "Default Name", 
        profileImage: "default-profile.png" 
      });
      await profile.save();
    }
    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/profile - Create a new profile with image upload support and course selection
app.post('/api/profile', upload.single('profileImage'), async (req, res) => {
  console.log('POST /api/profile hit');
  try {
    const { name, course, profile: profileText, email } = req.body;
    if (!name || !course || !profileText || !email) {
      return res.status(400).json({ error: 'Name, course, profile text, and email are required' });
    }
    const profileImage = req.file ? `/uploads/${req.file.filename}` : 'default-profile.png';
    const newProfile = new Profile({ name, selectedCourse: course, profileImage, email });
    await newProfile.save();
    console.log('Profile created for:', name);
    res.json(newProfile);
  } catch (err) {
    console.error('Error creating profile:', err);
    res.status(500).json({ error: 'Failed to create profile', details: err.message });
  }
});

// PUT /api/profile - Update the existing profile (including course selection)
app.put('/api/profile', upload.single('profileImage'), async (req, res) => {
  console.log('PUT /api/profile hit');
  try {
    const { name, course, email } = req.body;
    let profileImage = req.body.profileImage || '';
    if (req.file) {
      profileImage = `/uploads/${req.file.filename}`;
    }
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const profile = await Profile.findOne({ email });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    profile.name = name;
    profile.selectedCourse = course;
    profile.profileImage = profileImage;
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/* =====================
   COURSE MODELS & ENDPOINTS
   ===================== */

// Define a Sub-Chapter Schema for multiple sub-chapter entries
const subChapterSchema = new mongoose.Schema({
  subTitle: { type: String, required: true },
  subUrl: { type: String, required: true }
});

// Updated Chapter Schema (removed chapterUrl, added subChapters)
const chapterSchema = new mongoose.Schema({
  chapterTitle: { type: String, required: true },
  chapterContent: { type: String },
  subChapters: [subChapterSchema]
});

// Section Schema uses the updated chapterSchema
const sectionSchema = new mongoose.Schema({
  sectionTitle: { type: String, required: true },
  description: { type: String },
  chapters: [chapterSchema]
});

// Course Schema
const courseSchema = new mongoose.Schema({
  teacherId: { type: String },
  name: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  category: { type: String, required: true },
  sections: [sectionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  enrollments: { type: Number, default: 0 }
});
const Course = mongoose.model('Course', courseSchema);

// GET all courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET a single course by courseId
app.get('/api/course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// POST /api/courses - Create a new course
app.post('/api/courses', async (req, res) => {
  try {
    const courseData = req.body;
    const course = new Course(courseData);
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/courses/:id - Update an existing course
app.put('/api/courses/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const updateData = req.body;
    updateData.updatedAt = Date.now();
    const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, { new: true });
    if (!updatedCourse) return res.status(404).json({ error: 'Course not found' });
    res.json(updatedCourse);
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE /api/courses/:id - Delete a course
app.delete('/api/courses/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const deletedCourse = await Course.findByIdAndDelete(courseId);
    if (!deletedCourse) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// GET all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// DELETE /api/users/:id - Block (ban) and delete a user by ID
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Find the user first to get their email
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Add the user's email to the banned emails collection if not already banned
    const bannedExists = await BannedEmail.findOne({ email: user.email });
    if (!bannedExists) {
      const bannedEmail = new BannedEmail({ email: user.email });
      await bannedEmail.save();
    }
    // Delete the user account
    await User.findByIdAndDelete(id);
    // Optionally, delete the associated profile
    await Profile.findOneAndDelete({ email: user.email });
    res.json({ message: 'User blocked, banned, and deleted successfully' });
  } catch (err) {
    console.error('Error blocking user:', err);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// GET banned users
app.get('/api/banned-users', async (req, res) => {
  try {
    const bannedUsers = await BannedEmail.find();
    res.json(bannedUsers);
  } catch (err) {
    console.error('Error fetching banned users:', err);
    res.status(500).json({ error: 'Failed to fetch banned users' });
  }
});

// Unblock user endpoint
app.put('/api/banned-users/:id/unblock', async (req, res) => {
  const bannedId = req.params.id;
  try {
    const bannedUser = await BannedEmail.findByIdAndDelete(bannedId);
    if (!bannedUser) {
      return res.status(404).json({ error: 'Banned user not found' });
    }
    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (err) {
    console.error('Error unblocking user:', err);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// GET all courses with enrolled users
app.get('/api/courses-with-users', async (req, res) => {
  try {
    const courses = await Course.find();
    const profiles = await Profile.find().populate('selectedCourse');
    
    // Group profiles by their selected course
    const courseGroups = {};
    courses.forEach(course => {
      courseGroups[course._id] = {
        course: course,
        enrolledUsers: []
      };
    });

    // Add users to their respective course groups
    profiles.forEach(profile => {
      if (profile.selectedCourse) {
        const courseId = typeof profile.selectedCourse === 'object' 
          ? profile.selectedCourse._id 
          : profile.selectedCourse;
        
        if (courseGroups[courseId]) {
          courseGroups[courseId].enrolledUsers.push({
            name: profile.name,
            email: profile.email,
            profileImage: profile.profileImage
          });
        }
      }
    });

    res.json(Object.values(courseGroups));
  } catch (err) {
    console.error('Error fetching courses with users:', err);
    res.status(500).json({ error: 'Failed to fetch courses with users' });
  }
});

/* =====================
   ADMIN ROUTES
   ===================== */

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Check if the credentials match the admin credentials
  if (email === process.env.VITE_ADMIN_EMAIL && password === process.env.VITE_ADMIN_PASSWORD) {
    // Set admin session
    req.session.user = {
      email,
      isAdmin: true
    };

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Error saving admin session:', err);
        return res.status(500).json({ success: false, message: 'Error creating session' });
      }

      // Set session cookie explicitly
      res.cookie('lms_session', req.session.id, {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
        domain: '.onrender.com'
      });

      // Set additional headers for security
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      console.log('Admin login successful');
      return res.json({ 
        success: true,
        data: {
          email,
          isAdmin: true
        }
      });
    });
  } else {
    console.log('Invalid admin credentials');
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
};

// Update the admin route to use the isAdmin middleware
app.get('/admin', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Update the catch-all route to handle admin routes properly
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else if (req.path === '/admin') {
    if (req.session && req.session.user && req.session.user.isAdmin) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    } else {
      res.redirect('/adminlogin');
    }
  } else {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

/* =====================
   START THE SERVER
   ===================== */
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
