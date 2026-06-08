import Joi from 'joi';
export const createProjectSchema = Joi.object({ name: Joi.string().required(), startDate: Joi.date().required(), budget: Joi.number().min(0).required() });

