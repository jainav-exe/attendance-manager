const { body, validationResult } = require('express-validator');

// Sanitization rules for different routes
const sanitizers = {
  login: [
    body('email')
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Invalid email format'),
    body('password')
      .trim()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],

  timetable: [
    body('periods').isArray().withMessage('Periods must be an array'),
    body('periods.*.startTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid start time format'),
    body('periods.*.endTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid end time format'),
    body('periods.*.message')
      .optional()
      .trim()
      .escape()
  ],

  attendance: [
    body('period')
      .isInt({ min: 1, max: 5 })
      .withMessage('Invalid period number'),
    body('status')
      .isIn(['present', 'absent'])
      .withMessage('Invalid status'),
    body('timestamp')
      .isISO8601()
      .withMessage('Invalid timestamp')
  ],

  messages: [
    body('message')
      .trim()
      .escape()
      .isLength({ max: 500 })
      .withMessage('Message too long')
  ]
};

// Middleware to validate and sanitize input
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  sanitizers,
  validate
}; 