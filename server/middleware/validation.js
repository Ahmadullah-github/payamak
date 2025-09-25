const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to check for errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim()
    .escape(),
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim()
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Message validation
const validateMessage = [
  body('chatId')
    .isNumeric()
    .withMessage('Chat ID must be a number'),
  body('content')
    .isLength({ min: 1, max: 4000 })
    .withMessage('Message content must be between 1 and 4000 characters')
    .trim(),
  body('type')
    .optional()
    .isIn(['text', 'image', 'video', 'file', 'audio'])
    .withMessage('Invalid message type'),
  handleValidationErrors
];

// Chat creation validation
const validateChatCreation = [
  body('type')
    .isIn(['private', 'group'])
    .withMessage('Chat type must be either private or group'),
  body('name')
    .if(body('type').equals('group'))
    .isLength({ min: 1, max: 100 })
    .withMessage('Group chat name is required and must be max 100 characters')
    .trim()
    .escape(),
  body('memberIds')
    .isArray({ min: 1 })
    .withMessage('At least one member ID is required'),
  body('memberIds.*')
    .isNumeric()
    .withMessage('Member IDs must be numbers'),
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim()
    .escape(),
  handleValidationErrors
];

// Parameter validation for IDs
const validateId = [
  param('id')
    .isNumeric()
    .withMessage('ID must be a number'),
  handleValidationErrors
];

const validateChatId = [
  param('chatId')
    .isNumeric()
    .withMessage('Chat ID must be a number'),
  handleValidationErrors
];

const validateMessageId = [
  param('messageId')
    .isNumeric()
    .withMessage('Message ID must be a number'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateMessage,
  validateChatCreation,
  validateProfileUpdate,
  validateId,
  validateChatId,
  validateMessageId,
  validatePagination,
  handleValidationErrors
};