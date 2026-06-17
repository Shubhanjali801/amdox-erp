import Joi from 'joi';

const NOTIF_TYPES    = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'];
const NOTIF_CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'WEBHOOK'];

// ─── Notifications ────────────────────────────────────────
export const createNotificationSchema = Joi.object({
  userId:     Joi.string().uuid().optional().allow(null, ''), // defaults to current user
  title:      Joi.string().trim().min(2).max(150).required(),
  message:    Joi.string().trim().min(1).max(1000).required(),
  type:       Joi.string().uppercase().valid(...NOTIF_TYPES).optional(),
  channel:    Joi.string().uppercase().valid(...NOTIF_CHANNELS).optional(),
  event:      Joi.string().trim().max(80).optional(),
  resourceId: Joi.string().trim().max(100).optional().allow(null, ''),
});

// ─── Webhooks ─────────────────────────────────────────────
export const createWebhookSchema = Joi.object({
  name:   Joi.string().trim().min(2).max(100).required(),
  url:    Joi.string().trim().uri().required(),
  events: Joi.array().items(Joi.string().trim().max(80)).min(1).required()
    .messages({ 'array.min': 'Subscribe to at least one event' }),
  secret: Joi.string().trim().min(8).max(100).optional(),
});

export const updateWebhookSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(100).optional(),
  url:      Joi.string().trim().uri().optional(),
  events:   Joi.array().items(Joi.string().trim().max(80)).min(1).optional(),
  isActive: Joi.boolean().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// ─── Events ───────────────────────────────────────────────
export const emitEventSchema = Joi.object({
  event:      Joi.string().trim().min(2).max(80).required(),
  userId:     Joi.string().uuid().optional().allow(null, ''), // target user (defaults to current)
  title:      Joi.string().trim().min(2).max(150).required(),
  message:    Joi.string().trim().min(1).max(1000).required(),
  type:       Joi.string().uppercase().valid(...NOTIF_TYPES).optional(),
  resourceId: Joi.string().trim().max(100).optional().allow(null, ''),
});
