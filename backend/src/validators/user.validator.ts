import Joi from 'joi';

const ROLE_NAMES = ['super_admin', 'tenant_admin', 'manager', 'viewer'];

const strongPassword = Joi.string()
  .min(8)
  .max(72)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).+$/)
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  });

export const createUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName:  Joi.string().trim().min(2).max(50).required(),
  email:     Joi.string().trim().lowercase().email().max(255).required(),
  password:  strongPassword.required(),
  phone:     Joi.string().trim().max(20).optional().allow(''),
  roleNames: Joi.array().items(Joi.string().valid(...ROLE_NAMES)).optional(),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName:  Joi.string().trim().min(2).max(50).optional(),
  phone:     Joi.string().trim().max(20).optional().allow(''),
  isActive:  Joi.boolean().optional(),
  roleNames: Joi.array().items(Joi.string().valid(...ROLE_NAMES)).optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

export const updateTenantSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(100).optional(),
  domain:   Joi.string().trim().max(255).optional().allow(''),
  logoUrl:  Joi.string().trim().uri().optional().allow(''),
  settings: Joi.object().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });
