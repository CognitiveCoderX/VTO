const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import User model
const User = require('../models/User');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password // Password will be hashed in the pre-save hook
    });

    // Save user to database
    await newUser.save();

    // Create JWT token
    const payload = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'customxshop-secret-key',
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      token, 
      user: { 
        id: newUser.id, 
        username: newUser.username, 
        email: newUser.email 
      } 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      console.log(`Login attempt failed: User with email ${email} not found`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`Login attempt failed: Invalid password for ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'customxshop-secret-key',
      { expiresIn: '1h' }
    );

    console.log(`User ${email} logged in successfully`);
    
    // Return successful response with token and user data
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * @route   GET /api/auth/user
 * @desc    Get user data
 * @access  Private
 */
router.get('/user', async (req, res) => {
  try {
    // When authentication middleware is set up, this will work properly
    // const userId = req.user.id;
    //
    // const user = await User.findById(userId).select('-password');
    // if (!user) {
    //   return res.status(404).json({ message: 'User not found' });
    // }
    //
    // res.json(user);

    // For now, return a mock response
    res.json({
      id: 'mock-id',
      username: 'mockuser',
      email: 'user@example.com',
      createdAt: new Date()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/auth/user
 * @desc    Update user profile
 * @access  Private
 */
router.put('/user', async (req, res) => {
  try {
    // When authentication middleware is set up, this will work properly
    // const userId = req.user.id;
    // const { username, email } = req.body;
    //
    // // Find user and update
    // const updatedUser = await User.findByIdAndUpdate(
    //   userId,
    //   { username, email },
    //   { new: true }
    // ).select('-password');
    //
    // if (!updatedUser) {
    //   return res.status(404).json({ message: 'User not found' });
    // }
    //
    // res.json(updatedUser);

    // For now, return a mock response
    res.json({
      message: 'Profile update endpoint (not implemented yet)',
      user: {
        id: 'mock-id',
        username: req.body.username || 'mockuser',
        email: req.body.email || 'user@example.com',
        updatedAt: new Date()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', async (req, res) => {
  try {
    // When authentication middleware is set up, this will work properly
    // const userId = req.user.id;
    // const { currentPassword, newPassword } = req.body;
    //
    // // Find user
    // const user = await User.findById(userId);
    // if (!user) {
    //   return res.status(404).json({ message: 'User not found' });
    // }
    //
    // // Check current password
    // const isMatch = await bcrypt.compare(currentPassword, user.password);
    // if (!isMatch) {
    //   return res.status(400).json({ message: 'Current password is incorrect' });
    // }
    //
    // // Hash new password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);
    //
    // // Update password
    // user.password = hashedPassword;
    // await user.save();
    //
    // res.json({ message: 'Password updated successfully' });

    // For now, return a mock response
    res.json({ message: 'Password change endpoint (not implemented yet)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get complete user profile with orders and designs
 * @access  Private
 */
router.get('/profile', async (req, res) => {
  try {
    // Mock response for now, will be replaced with actual database queries when DB is set up
    const mockUserProfile = {
      profile: {
        id: 'usr-' + Math.floor(Math.random() * 10000),
        username: 'user' + Math.floor(Math.random() * 100),
        email: 'user@example.com',
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        createdAt: new Date(),
        avatar: '/images/default-avatar.png',
        membershipLevel: 'Standard',
        preferences: {
          notifications: true,
          marketing: true,
          newsletter: false,
          twoFactorAuth: false
        }
      },
      stats: {
        orderCount: 0,
        designCount: 0,
        lastLogin: new Date(),
        accountAge: '1 day',
        totalSpent: 0
      },
      orders: [],
      designs: [],
      // Additional sections can be added as needed
      paymentMethods: [],
      addresses: [],
      recentActivity: []
    };

    // Simulate delay to mimic database query
    setTimeout(() => {
      res.json(mockUserProfile);
    }, 200);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update complete user profile
 * @access  Private
 */
router.put('/profile', async (req, res) => {
  try {
    const { profile } = req.body;
    
    // Validate profile data
    if (!profile) {
      return res.status(400).json({ message: 'Profile data is required' });
    }
    
    // Mock response - just echo back the data with timestamp
    const updatedProfile = {
      ...profile,
      updatedAt: new Date()
    };
    
    // In a real implementation:
    // 1. Validate the incoming data
    // 2. Sanitize user input
    // 3. Update the user document in the database
    // 4. Return the updated user document
    
    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

module.exports = router; 