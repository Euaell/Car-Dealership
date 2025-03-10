const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const logger = require('../utils/logger');

/**
 * Authentication middleware to verify JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Authentication required. Please log in.' 
      });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Authentication token missing' 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }]
    });
    
    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'User not found or unauthorized' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Account is disabled. Please contact support.' 
      });
    }

    // Attach user info to the request
    req.user = user;
    
    // Update last login time
    await User.update(
      { lastLogin: new Date() },
      { where: { id: user.id } }
    );
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Authentication token expired' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid authentication token' 
      });
    }
    
    logger.error('Authentication error:', error);
    
    return res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error during authentication' 
    });
  }
};

/**
 * Authorization middleware to check user roles
 * @param {string[]} roles - Array of role names allowed to access the route
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'User not authenticated' 
      });
    }

    // Convert single role to array
    if (typeof roles === 'string') {
      roles = [roles];
    }

    // If no roles specified, allow all authenticated users
    if (roles.length === 0) {
      return next();
    }

    // Check if user role is included in the allowed roles
    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * @param {string} resource - The resource being accessed (e.g., 'cars', 'users')
 * @param {string} action - The action being performed (e.g., 'read', 'create', 'update', 'delete')
 */
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'User not authenticated' 
      });
    }

    // Get user permissions from role
    const { permissions } = req.user.role;
    
    // Check if user has permission for the resource and action
    if (!permissions || 
        !permissions[resource] || 
        !permissions[resource].includes(action)) {
      return res.status(403).json({ 
        status: 'error',
        message: `You do not have permission to ${action} ${resource}` 
      });
    }

    next();
  };
};

/**
 * Refresh token middleware
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Refresh token is required' 
      });
    }
    
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user by ID
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid refresh token' 
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Account is disabled' 
      });
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      user.toJWTPayload(),
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    
    // Send new access token
    res.status(200).json({
      status: 'success',
      accessToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Refresh token expired, please log in again' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid refresh token' 
      });
    }
    
    logger.error('Refresh token error:', error);
    
    return res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error during token refresh' 
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  refreshToken
}; 