import Joi from 'joi';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

// ─── Chart of Accounts (Ledger) ──────────────────────────
export const createAccountSchema = Joi.object({
  code:        Joi.string().trim().min(1).max(20).required(),
  name:        Joi.string().trim().min(2).max(100).required(),
  type:        Joi.string().uppercase().valid(...ACCOUNT_TYPES).required(),
  subType:     Joi.string().trim().max(50).optional().allow(''),
  currency:    Joi.string().trim().uppercase().length(3).optional(),
  parentId:    Joi.string().uuid().optional().allow(null, ''),
  description: Joi.string().trim().max(255).optional().allow(''),
}).messages({
  'any.only': 'type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE',
});

export const updateAccountSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100).optional(),
  subType:     Joi.string().trim().max(50).optional().allow(''),
  currency:    Joi.string().trim().uppercase().length(3).optional(),
  parentId:    Joi.string().uuid().optional().allow(null, ''),
  description: Joi.string().trim().max(255).optional().allow(''),
  isActive:    Joi.boolean().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// ─── Invoices (kept for later AP/AR work) ─────────────────
export const createInvoiceSchema = Joi.object({
  invoiceNumber: Joi.string().required(),
  totalAmount:   Joi.number().positive().required(),
  dueDate:       Joi.date().required(),
});
