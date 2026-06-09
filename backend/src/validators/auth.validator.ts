import Joi from 'joi';

// ─── Reusable field rules ─────────────────────────────────

const email = Joi.string()
  .trim()
  .lowercase()
  .email({ minDomainSegments: 2, tlds: { allow: true } })
  .max(255)
  .required()
  .messages({
    'string.empty':   'Email is required',
    'string.email':   'Please provide a valid email address',
    'string.max':     'Email must be at most 255 characters',
    'any.required':   'Email is required',
  });

// Strong password: min 8, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
const strongPassword = Joi.string()
  .min(8)
  .max(72) // bcrypt limit
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/)
  .required()
  .messages({
    'string.empty':   'Password is required',
    'string.min':     'Password must be at least 8 characters',
    'string.max':     'Password must be at most 72 characters',
    'any.required':   'Password is required',
  });

const name = (field: string) =>
  Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z][A-Za-z\s'-]*$/)
    .required()
    .messages({
      'string.empty':        `${field} is required`,
      'string.min':          `${field} must be at least 2 characters`,
      'string.max':          `${field} must be at most 50 characters`,
      'string.pattern.base': `${field} may only contain letters, spaces, hyphens and apostrophes`,
      'any.required':        `${field} is required`,
    });

// ─── Schemas ──────────────────────────────────────────────

export const registerSchema = Joi.object({
  firstName:   name('First name'),
  lastName:    name('Last name'),
  email,
  password:    strongPassword,
  companyName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Company name is required',
      'string.min':   'Company name must be at least 2 characters',
      'string.max':   'Company name must be at most 100 characters',
      'any.required': 'Company name is required',
    }),
  companySlug: Joi.string()
    .trim()
    .lowercase()
    .min(2)
    .max(60)
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .messages({
      'string.pattern.base': 'Company slug may only contain lowercase letters, numbers and hyphens',
      'string.min':          'Company slug must be at least 2 characters',
      'string.max':          'Company slug must be at most 60 characters',
    }),
});

export const loginSchema = Joi.object({
  email:    email,
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required',
  }),
  newPassword: strongPassword,
}).custom((value, helpers) => {
  if (value.oldPassword === value.newPassword) {
    return helpers.error('password.same');
  }
  return value;
}).messages({
  'password.same': 'New password must be different from the current password',
});
