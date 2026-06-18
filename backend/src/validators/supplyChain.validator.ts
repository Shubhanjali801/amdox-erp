import Joi from 'joi';

const VENDOR_STATUS  = ['ACTIVE', 'INACTIVE', 'BLACKLISTED'];
const MOVEMENT_TYPES = ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'];
const COSTING        = ['FIFO', 'LIFO', 'WEIGHTED_AVERAGE'];

// ─── Vendors ──────────────────────────────────────────────
export const createVendorSchema = Joi.object({
  code:         Joi.string().trim().min(1).max(30).required(),
  name:         Joi.string().trim().min(2).max(150).required(),
  email:        Joi.string().trim().lowercase().email().optional().allow(''),
  phone:        Joi.string().trim().max(30).optional().allow(''),
  website:      Joi.string().trim().max(200).optional().allow(''),
  taxId:        Joi.string().trim().max(50).optional().allow(''),
  paymentTerms: Joi.number().integer().min(0).max(365).optional(),
  currency:     Joi.string().trim().uppercase().length(3).optional(),
  rating:       Joi.number().min(0).max(5).optional(),
  address:      Joi.object().optional(),
  bankDetails:  Joi.object().optional(),
});

export const updateVendorSchema = Joi.object({
  name:         Joi.string().trim().min(2).max(150).optional(),
  email:        Joi.string().trim().lowercase().email().optional().allow(''),
  phone:        Joi.string().trim().max(30).optional().allow(''),
  website:      Joi.string().trim().max(200).optional().allow(''),
  taxId:        Joi.string().trim().max(50).optional().allow(''),
  paymentTerms: Joi.number().integer().min(0).max(365).optional(),
  currency:     Joi.string().trim().uppercase().length(3).optional(),
  rating:       Joi.number().min(0).max(5).optional(),
  status:       Joi.string().uppercase().valid(...VENDOR_STATUS).optional(),
  address:      Joi.object().optional(),
  bankDetails:  Joi.object().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// ─── Inventory Items ──────────────────────────────────────
export const createItemSchema = Joi.object({
  sku:               Joi.string().trim().min(1).max(50).required(),
  name:              Joi.string().trim().min(2).max(150).required(),
  description:       Joi.string().trim().max(500).optional().allow(''),
  category:          Joi.string().trim().max(80).optional().allow(''),
  unitOfMeasure:     Joi.string().trim().max(20).optional(),
  costingMethod:     Joi.string().uppercase().valid(...COSTING).optional(),
  unitCost:          Joi.number().min(0).required(),
  sellingPrice:      Joi.number().min(0).optional(),
  quantityOnHand:    Joi.number().min(0).optional(),
  reorderPoint:      Joi.number().min(0).optional(),
  reorderQty:        Joi.number().min(0).optional(),
  warehouseLocation: Joi.string().trim().max(100).optional().allow(''),
  preferredVendorId: Joi.string().uuid().optional().allow(null, ''),
});

export const updateItemSchema = Joi.object({
  name:              Joi.string().trim().min(2).max(150).optional(),
  description:       Joi.string().trim().max(500).optional().allow(''),
  category:          Joi.string().trim().max(80).optional().allow(''),
  unitOfMeasure:     Joi.string().trim().max(20).optional(),
  costingMethod:     Joi.string().uppercase().valid(...COSTING).optional(),
  unitCost:          Joi.number().min(0).optional(),
  sellingPrice:      Joi.number().min(0).optional(),
  reorderPoint:      Joi.number().min(0).optional(),
  reorderQty:        Joi.number().min(0).optional(),
  warehouseLocation: Joi.string().trim().max(100).optional().allow(''),
  preferredVendorId: Joi.string().uuid().optional().allow(null, ''),
  isActive:          Joi.boolean().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// Stock movement (manual IN/OUT/ADJUSTMENT)
export const stockMovementSchema = Joi.object({
  type:      Joi.string().uppercase().valid(...MOVEMENT_TYPES).required(),
  quantity:  Joi.number().positive().required(),
  unitCost:  Joi.number().min(0).optional(),
  reference: Joi.string().trim().max(100).optional().allow(''),
  notes:     Joi.string().trim().max(255).optional().allow(''),
}).messages({ 'any.only': 'type must be one of: IN, OUT, ADJUSTMENT, TRANSFER' });

// ─── Purchase Orders ──────────────────────────────────────
const poLineSchema = Joi.object({
  inventoryItemId: Joi.string().uuid().optional().allow(null, ''),
  description:     Joi.string().trim().min(1).max(255).required(),
  quantity:        Joi.number().positive().required(),
  unitPrice:       Joi.number().min(0).required(),
});

export const createPOSchema = Joi.object({
  poNumber:         Joi.string().trim().min(1).max(50).required(),
  vendorId:         Joi.string().uuid().required(),
  currency:         Joi.string().trim().uppercase().length(3).optional(),
  taxRate:          Joi.number().min(0).max(100).optional(),
  expectedDelivery: Joi.date().optional(),
  notes:            Joi.string().trim().max(500).optional().allow(''),
  lineItems:        Joi.array().items(poLineSchema).min(1).required()
    .messages({ 'array.min': 'At least one line item is required' }),
});

export const receivePOSchema = Joi.object({
  receiptDate: Joi.date().optional(),
  notes:       Joi.string().trim().max(255).optional().allow(''),
  lines: Joi.array().items(Joi.object({
    lineItemId:  Joi.string().uuid().required(),
    receivedQty: Joi.number().positive().required(),
  })).min(1).required().messages({ 'array.min': 'At least one received line is required' }),
});
