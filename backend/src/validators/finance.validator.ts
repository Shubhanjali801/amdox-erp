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

// ─── AP / AR Invoices ─────────────────────────────────────
const lineItemSchema = Joi.object({
  description: Joi.string().trim().min(1).max(255).required(),
  quantity:    Joi.number().positive().required(),
  unitPrice:   Joi.number().min(0).required(),
  taxRate:     Joi.number().min(0).max(100).optional(),
  accountId:   Joi.string().uuid().optional().allow(null, ''),
});

export const createApSchema = Joi.object({
  invoiceNumber:   Joi.string().trim().min(1).max(50).required(),
  vendorId:        Joi.string().uuid().optional().allow(null, ''),
  purchaseOrderId: Joi.string().uuid().optional().allow(null, ''),
  currency:        Joi.string().trim().uppercase().length(3).optional(),
  issueDate:       Joi.date().required(),
  dueDate:         Joi.date().required(),
  notes:           Joi.string().trim().max(500).optional().allow(''),
  lineItems:       Joi.array().items(lineItemSchema).min(1).required()
    .messages({ 'array.min': 'At least one line item is required' }),
});

export const updateApSchema = Joi.object({
  notes:   Joi.string().trim().max(500).optional().allow(''),
  dueDate: Joi.date().optional(),
  status:  Joi.string().valid('DRAFT', 'PENDING', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED').optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

export const createArSchema = Joi.object({
  invoiceNumber: Joi.string().trim().min(1).max(50).required(),
  customerId:    Joi.string().optional().allow(null, ''),
  currency:      Joi.string().trim().uppercase().length(3).optional(),
  issueDate:     Joi.date().required(),
  dueDate:       Joi.date().required(),
  notes:         Joi.string().trim().max(500).optional().allow(''),
  lineItems:     Joi.array().items(lineItemSchema).min(1).required()
    .messages({ 'array.min': 'At least one line item is required' }),
});

export const updateArSchema = updateApSchema;

// kept for backwards-compat
export const createInvoiceSchema = createApSchema;
