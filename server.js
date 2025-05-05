
/**
 * Authentication server with password-based login and Google OAuth
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(bodyParser.json());

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Path to users file
const USERS_FILE = path.join(__dirname, 'users.json');

// Load users from file or create new file if doesn't exist
async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create an empty users array
    if (error.code === 'ENOENT') {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    console.error('Error loading users:', error);
    throw error;
  }
}

// Save users to file
async function saveUsers(users) {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('Users saved to file');
  } catch (error) {
    console.error('Error saving users:', error);
    throw error;
  }
}

// ------ AUTHENTICATION ROUTES ------

// Sign up endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Load users
    const users = await loadUsers();
    
    // Check if user already exists
    if (users.some(user => user.email === email)) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      email,
      name: name || email.split('@')[0],
      passwordHash,
    };
    
    // Add to users array
    users.push(newUser);
    
    // Save to file
    await saveUsers(users);
    
    // Return success
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Load users
    const users = await loadUsers();
    
    // Find user
    const user = users.find(u => u.email === email);
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Return success
    res.status(200).json({ 
      message: 'Login successful',
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot password endpoint
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Load users
    const users = await loadUsers();
    
    // Find user
    const user = users.find(u => u.email === email);
    
    // Generate a reset token whether user exists or not (for security)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour
    
    // If user exists, update with reset token
    if (user) {
      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await saveUsers(users);
      
      // In a real app, send email here with the reset link
      console.log(`Reset email would be sent to: ${email}`);
      console.log(`Reset token: ${resetToken}`);
    }
    
    // Return success either way (for security, don't reveal if user exists)
    res.status(200).json({ message: 'Reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password endpoint
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Validate input
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    
    // Load users
    const users = await loadUsers();
    
    // Find user with valid token
    const user = users.find(u => 
      u.resetToken === token && 
      u.resetTokenExpiry && 
      new Date(u.resetTokenExpiry) > new Date()
    );
    
    // Check if token is valid
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update user
    user.passwordHash = passwordHash;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    
    // Save users
    await saveUsers(users);
    
    // Return success
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ------ GOOGLE OAUTH ROUTES ------

// Google OAuth consent URL
app.get('/auth/google', (req, res) => {
  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
  });
  
  res.redirect(`${googleAuthUrl}?${params.toString()}`);
});

// Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).redirect('/login?error=no_code');
    }
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`,
      grant_type: 'authorization_code',
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const { id_token, access_token } = tokenResponse.data;
    
    // Get user info from access token
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    const { email, id: googleId } = userInfoResponse.data;
    
    if (!email) {
      return res.status(400).redirect('/login?error=no_email');
    }
    
    // Load users
    const users = await loadUsers();
    
    // Find or create user
    let user = users.find(u => u.email === email);
    
    if (!user) {
      // Create new user
      user = {
        email,
        googleId,
      };
      users.push(user);
      await saveUsers(users);
    } else if (!user.googleId) {
      // Update existing user with Google ID
      user.googleId = googleId;
      await saveUsers(users);
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Redirect to dashboard with success message
    res.redirect(302, `/dashboard?msg=login-success&token=${token}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/login?error=oauth_error');
  }
});

// Serve static files from public folder
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
