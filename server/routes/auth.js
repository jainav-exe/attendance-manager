const express = require('express');
const jwt = require('jsonwebtoken');
const { sanitizers, validate } = require('../middleware/sanitizer');
const { authenticate } = require('../middleware/auth');
const { hasRole } = require('../middleware/rbac');
const { ROLES } = require('../middleware/rbac');
const User = require('../models/User');
const config = require('../config/config');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');

const router = express.Router();

// Login route with rate limiting and input sanitization
router.post('/login', sanitizers.login, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and check if account is locked
    const user = await User.findOne({ email });
    if (!user || user.isLocked()) {
      throw new UnauthorizedError('Invalid credentials or account locked');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementFailedLoginAttempts();
      throw new UnauthorizedError('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    await user.resetFailedLoginAttempts();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Set token in cookie
    res.cookie(config.jwt.cookieName, token, {
      httpOnly: true,
      secure: config.security.cookieSecure,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie(config.jwt.cookieName);
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// Create new user (admin only)
router.post('/users', authenticate, hasRole([ROLES.ADMIN]), sanitizers.login, validate, async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('User already exists');
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      role: role || ROLES.STUDENT
    });

    await user.save();

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 