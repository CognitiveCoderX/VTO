const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes that require authentication
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Also check if token exists in cookies
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // If no token, return unauthorized
  if (!token) {
    console.log('No token provided, access denied');
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'customxshop-secret-key');

    // Add user data to request
    req.user = decoded;
    
    // Log the authenticated access
    console.log(`Authenticated user ${req.user.username || req.user.email} accessed ${req.originalUrl}`);
    
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    
    return res.status(401).json({ 
      success: false, 
      message: 'Token is invalid or expired' 
    });
  }
};

/**
 * Middleware to restrict access to certain roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ 
        success: false, 
        message: 'User role not found' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role ${req.user.role} is not authorized to access this route` 
      });
    }
    
    next();
  };
}; 