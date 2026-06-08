import Joi from 'joi';
export const createInvoiceSchema = Joi.object({ invoiceNumber: Joi.string().required(), totalAmount: Joi.number().positive().required(), dueDate: Joi.date().required() });

