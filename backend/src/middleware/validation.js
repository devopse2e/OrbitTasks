const Joi = require('joi');

// --- Schemas for Authentication ---
const registrationSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().required().valid(Joi.ref('password'))
    .messages({ 'any.only': 'Passwords do not match.' })
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required()
});

// --- NEW: Forgot Password Direct Schema (for resetting on login screen) ---
const forgotPasswordDirectSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.string().required().valid(Joi.ref('newPassword'))
    .messages({ 'any.only': 'Passwords do not match.' })
});

// Legacy for updating password (if needed elsewhere)
const updatePasswordSchema = Joi.object({
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().required().valid(Joi.ref('password'))
    .messages({ 'any.only': 'Passwords do not match.' })
});

// --- NEW: Profile Update Schema ---
const profileUpdateSchema = Joi.object({
  displayName: Joi.string().trim().optional(),
  dob: Joi.date().allow(null).optional(),
  timezone: Joi.string().optional() // Can add custom validation for IANA if needed
}).min(1); // At least one field must be provided for update

// --- Schemas for Todos ---
const todoSchema = Joi.object({
  text: Joi.string().trim().min(1).max(100).required(),
  notes: Joi.string().max(400).allow('').optional(),
  completed: Joi.boolean().optional(),
  dueDate: Joi.date().allow(null).optional(),
  priority: Joi.string()
    .valid('High', 'Medium', 'Low')
    .default('Medium')
    .required(),
  category: Joi.string()
    .valid('Home', 'Work', 'Sports', 'Activity', 'Groceries', 'Shopping', 'Health', 'Finance', 'Personal', 'Others')
    .default('Personal')
    .optional(),
  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .default('#FFFFFF')
    .optional(),
  isRecurring: Joi.boolean().optional(),
  recurrencePattern: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'yearly', 'custom', 'none')
    .when('isRecurring', {
      is: true,
      then: Joi.not().valid('none').required(),
      otherwise: Joi.valid('none').required()
    })
    .required(),
  recurrenceInterval: Joi.number()
    .integer()
    .min(1)
    .optional(),
  recurrenceEndsAt: Joi.date()
    .allow(null)
    .min('now')
    .optional(),
  recurrenceCustomRule: Joi.string()
    .allow('')
    .optional()
});

const todoUpdateSchema = Joi.object({
  text: Joi.string().trim().min(1).max(100).optional(),
  notes: Joi.string().max(400).allow('').optional(),
  completed: Joi.boolean().optional(),
  completedAt: Joi.date().allow(null).optional(),
  dueDate: Joi.date().allow(null).optional(),
  priority: Joi.string()
    .valid('High', 'Medium', 'Low')
    .optional(),
  category: Joi.string()
    .valid('Home', 'Work', 'Sports', 'Activity', 'Groceries', 'Shopping', 'Health', 'Finance', 'Personal', 'Others')
    .optional(),
  color: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .optional(),
  isRecurring: Joi.boolean().optional(),
  recurrencePattern: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'yearly', 'custom', 'none')
    .when('isRecurring', {
      is: true,
      then: Joi.not().valid('none').optional(),
      otherwise: Joi.valid('none').optional()
    })
    .optional(),
  recurrenceInterval: Joi.number()
    .integer()
    .min(1)
    .optional(),
  recurrenceEndsAt: Joi.date()
    .allow(null)
    .min('now')
    .optional(),
  recurrenceCustomRule: Joi.string()
    .allow('')
    .optional()
}).min(1);


// --- Middleware for Authentication ---
const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};


const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};


// --- Middleware for Forgot Password Direct ---
const validateForgotPasswordDirect = (req, res, next) => {
  const { error } = forgotPasswordDirectSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};


const validatePasswordUpdate = (req, res, next) => {
  const { error } = updatePasswordSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};


// --- NEW: Middleware for Profile Update ---
const validateProfileUpdate = (req, res, next) => {
  const { error } = profileUpdateSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};


// --- Middleware for Todos ---
const validateTodo = (req, res, next) => {
  const { error } = todoSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: 'Validation failed', details: error.details[0].message });
  next();
};


const validateTodoUpdate = (req, res, next) => {
  const { error } = todoUpdateSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: 'Validation failed', details: error.details[0].message });
  next();
};


module.exports = {
  validateRegistration,
  validateLogin,
  validateForgotPasswordDirect, // Use this in your forgot password direct route!
  validatePasswordUpdate,
  validateProfileUpdate, // <-- New middleware for profile updates
  validateTodo,
  validateTodoUpdate,
};
