import Joi from 'joi';

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
const PAY_FREQUENCIES  = ['WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY'];
const EMPLOYEE_STATUS  = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'];

const strongPassword = Joi.string()
  .min(8).max(72)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|\-<>_]).+$/)
  .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character' });

// ─── Employees ────────────────────────────────────────────
export const createEmployeeSchema = Joi.object({
  firstName:      Joi.string().trim().min(2).max(50).required(),
  lastName:       Joi.string().trim().min(2).max(50).required(),
  email:          Joi.string().trim().lowercase().email().max(255).required(),
  password:       strongPassword.required(),
  phone:          Joi.string().trim().max(20).optional().allow(''),
  employeeCode:   Joi.string().trim().min(1).max(30).required(),
  designation:    Joi.string().trim().min(2).max(100).required(),
  departmentId:   Joi.string().uuid().optional().allow(null, ''),
  managerId:      Joi.string().uuid().optional().allow(null, ''),
  employmentType: Joi.string().uppercase().valid(...EMPLOYMENT_TYPES).optional(),
  joinDate:       Joi.date().required(),
  baseSalary:     Joi.number().min(0).required(),
  currency:       Joi.string().trim().uppercase().length(3).optional(),
  payFrequency:   Joi.string().uppercase().valid(...PAY_FREQUENCIES).optional(),
});

export const updateEmployeeSchema = Joi.object({
  designation:    Joi.string().trim().min(2).max(100).optional(),
  departmentId:   Joi.string().uuid().optional().allow(null, ''),
  managerId:      Joi.string().uuid().optional().allow(null, ''),
  employmentType: Joi.string().uppercase().valid(...EMPLOYMENT_TYPES).optional(),
  status:         Joi.string().uppercase().valid(...EMPLOYEE_STATUS).optional(),
  baseSalary:     Joi.number().min(0).optional(),
  payFrequency:   Joi.string().uppercase().valid(...PAY_FREQUENCIES).optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// ─── Departments ──────────────────────────────────────────
export const createDeptSchema = Joi.object({
  name:      Joi.string().trim().min(2).max(100).required(),
  code:      Joi.string().trim().max(20).optional().allow(''),
  parentId:  Joi.string().uuid().optional().allow(null, ''),
  managerId: Joi.string().uuid().optional().allow(null, ''),
});

export const updateDeptSchema = Joi.object({
  name:      Joi.string().trim().min(2).max(100).optional(),
  code:      Joi.string().trim().max(20).optional().allow(''),
  parentId:  Joi.string().uuid().optional().allow(null, ''),
  managerId: Joi.string().uuid().optional().allow(null, ''),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });
