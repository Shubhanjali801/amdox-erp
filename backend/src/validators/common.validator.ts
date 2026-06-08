import Joi from 'joi';
export const paginationSchema = Joi.object({ page: Joi.number().min(1).default(1), limit: Joi.number().min(1).max(100).default(20) });
export const uuidSchema = Joi.string().uuid().required();

