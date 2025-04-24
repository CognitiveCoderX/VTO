const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile data
 * @access  Private
 */
router.get('/profile', async (req, res) => {
  try {
    // Get user ID from auth token (will be implemented when auth middleware is added)
    // For now, get the user by email from request query or use first user in database
    let user;
    
    if (req.query.email) {
      user = await User.findOne({ email: req.query.email });
    } else if (req.headers.authorization) {
      // Extract token from Authorization header
      const token = req.headers.authorization.split(' ')[1];
      
      // Decode token to get user info (simplified, should use proper JWT verification)
      const decodedToken = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      
      // Find user by email from token
      if (decodedToken.email) {
        user = await User.findOne({ email: decodedToken.email });
      }
    }
    
    // If no user found, return default profile
    if (!user) {
      const users = await User.find({}).limit(1);
      user = users[0] || null;
    }
    
    if (!user) {
      // No users in database, return mock data
      return res.status(200).json({
        id: 'usr-' + Math.floor(Math.random() * 10000),
        username: 'Test1234',
        email: 'Test1234@gmail.com',
        fullName: 'Test User',
        phone: '+1 (555) 123-4567',
        createdAt: new Date(),
        avatar: '/images/default-avatar.png',
        membershipLevel: 'Standard',
        preferences: {
          notifications: true,
          marketing: true,
          newsletter: false,
          twoFactorAuth: false
        }
      });
    }
    
    // Format the user data for the response
    const userProfile = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username,
      phone: user.phone || '+1 (555) 123-4567',
      createdAt: user.createdAt,
      avatar: user.avatar || '/images/default-avatar.png',
      membershipLevel: user.role === 'admin' ? 'Admin' : 'Standard',
      preferences: {
        notifications: true,
        marketing: true,
        newsletter: false,
        twoFactorAuth: false
      }
    };

    console.log('Returning user profile:', userProfile.username);
    res.json(userProfile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', async (req, res) => {
  try {
    const profile = req.body;
    
    // Mock response - just echo back the data with timestamp
    const updatedProfile = {
      ...profile,
      updatedAt: new Date()
    };
    
    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

/**
 * @route   GET /api/user/orders
 * @desc    Get user orders
 * @access  Private
 */
router.get('/orders', async (req, res) => {
  try {
    // Mock orders data
    const mockOrders = [];
    
    // Generate a few random orders
    for (let i = 0; i < 3; i++) {
      mockOrders.push({
        id: 'order-' + Math.floor(Math.random() * 10000),
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        status: ['processing', 'shipped', 'delivered'][Math.floor(Math.random() * 3)],
        total: Math.floor(Math.random() * 20000) / 100,
        items: [
          {
            id: 'item-' + Math.floor(Math.random() * 10000),
            name: 'Custom T-Shirt',
            quantity: Math.floor(Math.random() * 3) + 1,
            price: 29.99
          }
        ]
      });
    }
    
    res.json(mockOrders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

/**
 * @route   GET /api/user/designs
 * @desc    Get user designs
 * @access  Private
 */
router.get('/designs', async (req, res) => {
  try {
    // Mock designs data
    const mockDesigns = [];
    
    // Generate a few random designs
    for (let i = 0; i < 2; i++) {
      mockDesigns.push({
        id: 'design-' + Math.floor(Math.random() * 10000),
        name: 'Custom Design ' + (i + 1),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
        previewUrl: '/images/design-preview.jpg',
        productType: 'T-Shirt',
        isPublic: false
      });
    }
    
    res.json(mockDesigns);
  } catch (err) {
    console.error('Error fetching designs:', err);
    res.status(500).json({ message: 'Server error while fetching designs' });
  }
});

/**
 * @route   GET /api/user/payment-methods
 * @desc    Get user payment methods
 * @access  Private
 */
router.get('/payment-methods', async (req, res) => {
  try {
    // Mock payment methods data
    const mockPaymentMethods = [
      {
        id: 'pm-' + Math.floor(Math.random() * 10000),
        type: 'credit_card',
        brand: 'visa',
        lastFour: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      }
    ];
    
    res.json(mockPaymentMethods);
  } catch (err) {
    console.error('Error fetching payment methods:', err);
    res.status(500).json({ message: 'Server error while fetching payment methods' });
  }
});

/**
 * @route   GET /api/user/addresses
 * @desc    Get user addresses
 * @access  Private
 */
router.get('/addresses', async (req, res) => {
  try {
    // Mock addresses data
    const mockAddresses = [
      {
        id: 'addr-' + Math.floor(Math.random() * 10000),
        name: 'Home',
        line1: '123 Main St',
        line2: 'Apt 4B',
        city: 'Anytown',
        state: 'CA',
        postalCode: '90210',
        country: 'US',
        isDefault: true
      }
    ];
    
    res.json(mockAddresses);
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).json({ message: 'Server error while fetching addresses' });
  }
});

/**
 * @route   GET /api/user/activities
 * @desc    Get user recent activities
 * @access  Private
 */
router.get('/activities', async (req, res) => {
  try {
    // Mock activities data
    const mockActivities = [];
    
    // Generate a few random activities
    const activityTypes = ['login', 'order_placed', 'design_created', 'profile_updated'];
    
    for (let i = 0; i < 5; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      
      mockActivities.push({
        id: 'activity-' + Math.floor(Math.random() * 10000),
        type: activityType,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
        details: {
          // Additional details based on activity type
          message: `User ${activityType.replace('_', ' ')}`
        }
      });
    }
    
    res.json(mockActivities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ message: 'Server error while fetching activities' });
  }
});

module.exports = router; 