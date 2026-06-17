import Joi from 'joi';

// ─── Tenant settings ──────────────────────────────────────
export const updateSettingsSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(150).optional(),
  logoUrl:  Joi.string().trim().uri().optional().allow(''),
  settings: Joi.object().optional(),  // arbitrary preference blob (merged)
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// ─── Roles ────────────────────────────────────────────────
export const createRoleSchema = Joi.object({
  name:          Joi.string().trim().min(2).max(60).required(),
  description:   Joi.string().trim().max(255).optional().allow(''),
  permissionIds: Joi.array().items(Joi.string().uuid()).optional(),
});

export const updateRoleSchema = Joi.object({
  name:          Joi.string().trim().min(2).max(60).optional(),
  description:   Joi.string().trim().max(255).optional().allow(''),
  permissionIds: Joi.array().items(Joi.string().uuid()).optional(),  // replaces the set
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

export const assignRoleSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

// ─── Permissions ──────────────────────────────────────────
export const createPermissionSchema = Joi.object({
  resource:    Joi.string().trim().lowercase().min(2).max(50).required(),
  action:      Joi.string().trim().lowercase().min(2).max(50).required(),
  description: Joi.string().trim().max(255).optional().allow(''),
});

// ─── Integrations (stored in tenant.settings.integrations) ─
export const upsertIntegrationSchema = Joi.object({
  enabled: Joi.boolean().optional(),
  config:  Joi.object().optional(),
}).min(1).messages({ 'object.min': 'Provide enabled and/or config' });
