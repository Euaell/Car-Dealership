const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Role } = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
// Uncomment when email service is implemented
// const emailService = require('../services/emailService');

/**
 * Generate access token for user
 * @param {Object} user - User object to generate token for
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    user.toJWTPayload(),
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

/**
 * Generate refresh token for user
 * @param {Object} user - User object to generate token for
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * User registration
 * @route POST /api/auth/signup
 */
const signup = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error', 
        errors: errors.array() 
      });
    }

    const { name, email, password, phone, address } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        status: 'error', 
        message: 'Email already in use' 
      });
    }

    // Get the customer role
    const customerRole = await Role.findOne({ 
      where: { name: Role.CUSTOMER }
    });

    if (!customerRole) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Default role not found' 
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      roleId: customerRole.id,
      phone,
      address,
      isActive: true
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log the user creation
    logger.info(`New user registered: ${user.id} - ${user.email}`);

    // Return user and tokens
    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: customerRole.name
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Registration failed' 
    });
  }
};

/**
 * User login
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Role, as: 'role' }]
    });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid email or password' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Account is disabled. Please contact support.' 
      });
    }

    // Check password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid email or password' 
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last login time
    await User.update(
      { lastLogin: new Date() },
      { where: { id: user.id } }
    );

    // Log the login
    logger.info(`User logged in: ${user.id} - ${user.email}`);

    // Return user and tokens
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Login failed' 
    });
  }
};

/**
 * User logout
 * @route POST /api/auth/logout
 */
const logout = (req, res) => {
  // Note: For a complete logout system, you would need to implement token blacklisting
  // using Redis or a database table to track invalidated tokens
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          phone: user.phone,
          address: user.address,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get user profile' 
    });
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return res.status(200).json({
        status: 'success',
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store token in user record
    await User.update(
      { 
        resetToken,
        resetTokenExpiry
      },
      { where: { id: user.id } }
    );

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email with reset link - Uncomment when email service is implemented
    /* 
    await emailService.sendPasswordResetEmail({
      to: user.email,
      subject: 'Password Reset Request',
      resetUrl
    });
    */

    // For now, just log the reset URL
    logger.info(`Password reset URL for ${user.email}: ${resetUrl}`);

    res.status(200).json({
      status: 'success',
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to process password reset request' 
    });
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          [Op.gt]: new Date() // Token must not be expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await User.update(
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      },
      { where: { id: user.id } }
    );

    logger.info(`Password reset successful for user: ${user.id} - ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to reset password' 
    });
  }
};

/**
 * Change password
 * @route POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isPasswordValid = await user.checkPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.update(
      { password: hashedPassword },
      { where: { id: user.id } }
    );

    logger.info(`Password changed for user: ${user.id} - ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to change password' 
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword
}; 