import Joi from 'joi';
export const createEmployeeSchema = Joi.object({ firstName: Joi.string().required(), lastName: Joi.string().required(), email: Joi.string().email().required(), departmentId: Joi.string().uuid().required(), baseSalary: Joi.number().positive().required() });

