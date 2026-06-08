import Joi from 'joi';

export const createPOSchema = Joi.object({
  vendorId:  Joi.string().uuid().required(),
  orderDate: Joi.date().required(),
  currency:  Joi.string().length(3).default('USD'),
  notes:     Joi.string().optional(),
});

export const createVendorSchema = Joi.object({
  vendorCode: Joi.string().required(),
  name:       Joi.string().required(),
  email:      Joi.string().email().optional(),
  country:    Joi.string().optional(),
});
