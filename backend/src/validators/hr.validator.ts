import Joi from 'joi';

const optionalUuid = Joi.string().uuid().allow(null, '');

export const employeeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow('').optional(),
  status: Joi.string().valid('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED').optional(),
  departmentId: optionalUuid.optional(),
});

export const createEmployeeSchema = Joi.object({
  employeeCode: Joi.string().trim().max(30).required(),
  firstName: Joi.string().trim().max(80).required(),
  lastName: Joi.string().trim().max(80).required(),
  email: Joi.string().email().lowercase().required(),
  phone: Joi.string().trim().max(30).allow('', null).optional(),
  departmentId: optionalUuid.optional(),
  designation: Joi.string().trim().max(120).required(),
  managerId: optionalUuid.optional(),
  employmentType: Joi.string().valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN').default('FULL_TIME'),
  status: Joi.string().valid('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED').default('ACTIVE'),
  joinDate: Joi.date().iso().required(),
  baseSalary: Joi.number().positive().required(),
  currency: Joi.string().trim().uppercase().length(3).default('INR'),
  payFrequency: Joi.string().valid('WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY').default('MONTHLY'),
  dateOfBirth: Joi.date().iso().allow(null).optional(),
  gender: Joi.string().trim().max(30).allow('', null).optional(),
  nationality: Joi.string().trim().max(80).allow('', null).optional(),
  taxId: Joi.string().trim().max(80).allow('', null).optional(),
  bankAccount: Joi.string().trim().max(80).allow('', null).optional(),
  bankName: Joi.string().trim().max(120).allow('', null).optional(),
  bankIfsc: Joi.string().trim().max(30).allow('', null).optional(),
  address: Joi.object().unknown(true).optional(),
  emergencyContact: Joi.object().unknown(true).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.fork(
  ['employeeCode', 'firstName', 'lastName', 'email', 'designation', 'joinDate', 'baseSalary'],
  schema => schema.optional()
);

export const attendanceSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  clockIn: Joi.date().iso().allow(null).optional(),
  clockOut: Joi.date().iso().allow(null).optional(),
  totalHours: Joi.number().min(0).max(24).allow(null).optional(),
  overtimeHours: Joi.number().min(0).max(24).allow(null).optional(),
  status: Joi.string().valid('PRESENT', 'ABSENT', 'HALF_DAY', 'HOLIDAY', 'WORK_FROM_HOME').default('PRESENT'),
  notes: Joi.string().trim().max(500).allow('', null).optional(),
});

export const updateAttendanceSchema = attendanceSchema.fork(['employeeId', 'date'], schema => schema.optional());

export const leaveSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  leaveTypeId: Joi.string().uuid().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  totalDays: Joi.number().positive().optional(),
  reason: Joi.string().trim().max(500).allow('', null).optional(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED').default('PENDING'),
  approvedBy: optionalUuid.optional(),
  rejectedReason: Joi.string().trim().max(500).allow('', null).optional(),
});

export const updateLeaveSchema = leaveSchema.fork(['employeeId', 'leaveTypeId', 'startDate', 'endDate'], schema => schema.optional());

export const departmentSchema = Joi.object({
  name: Joi.string().trim().max(120).required(),
  code: Joi.string().trim().max(30).allow('', null).optional(),
  managerId: optionalUuid.optional(),
  parentId: optionalUuid.optional(),
});

export const updateDepartmentSchema = departmentSchema.fork(['name'], schema => schema.optional());

export const payrollRunSchema = Joi.object({
  period: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).required(),
  currency: Joi.string().trim().uppercase().length(3).default('INR'),
});
