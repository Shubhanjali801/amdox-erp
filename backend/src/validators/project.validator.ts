import Joi from 'joi';

const PROJECT_STATUS   = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const TASK_STATUS      = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'];
const MILESTONE_STATUS = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];
const PRIORITY         = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// ─── Projects ─────────────────────────────────────────────
export const createProjectSchema = Joi.object({
  code:        Joi.string().trim().min(1).max(30).required(),
  name:        Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().max(1000).optional().allow(''),
  startDate:   Joi.date().optional(),
  endDate:     Joi.date().optional(),
  budget:      Joi.number().min(0).optional(),
  currency:    Joi.string().trim().uppercase().length(3).optional(),
  managerId:   Joi.string().uuid().optional().allow(null, ''),
  clientName:  Joi.string().trim().max(150).optional().allow(''),
});

export const updateProjectSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().max(1000).optional().allow(''),
  status:      Joi.string().uppercase().valid(...PROJECT_STATUS).optional(),
  startDate:   Joi.date().optional(),
  endDate:     Joi.date().optional(),
  budget:      Joi.number().min(0).optional(),
  currency:    Joi.string().trim().uppercase().length(3).optional(),
  managerId:   Joi.string().uuid().optional().allow(null, ''),
  clientName:  Joi.string().trim().max(150).optional().allow(''),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// ─── Milestones (sub-resource of project) ─────────────────
export const createMilestoneSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().max(500).optional().allow(''),
  dueDate:     Joi.date().required(),
  status:      Joi.string().uppercase().valid(...MILESTONE_STATUS).optional(),
});

// ─── Tasks ────────────────────────────────────────────────
export const createTaskSchema = Joi.object({
  projectId:            Joi.string().uuid().required(),
  milestoneId:          Joi.string().uuid().optional().allow(null, ''),
  parentTaskId:         Joi.string().uuid().optional().allow(null, ''),
  title:                Joi.string().trim().min(2).max(200).required(),
  description:          Joi.string().trim().max(1000).optional().allow(''),
  priority:             Joi.string().uppercase().valid(...PRIORITY).optional(),
  estimatedHours:       Joi.number().min(0).optional(),
  startDate:            Joi.date().optional(),
  dueDate:              Joi.date().optional(),
  assignedToEmployeeId: Joi.string().uuid().optional().allow(null, ''),
  assignedToUserId:     Joi.string().uuid().optional().allow(null, ''),
});

export const updateTaskSchema = Joi.object({
  title:                Joi.string().trim().min(2).max(200).optional(),
  description:          Joi.string().trim().max(1000).optional().allow(''),
  status:               Joi.string().uppercase().valid(...TASK_STATUS).optional(),
  priority:             Joi.string().uppercase().valid(...PRIORITY).optional(),
  estimatedHours:       Joi.number().min(0).optional(),
  actualHours:          Joi.number().min(0).optional(),
  milestoneId:          Joi.string().uuid().optional().allow(null, ''),
  startDate:            Joi.date().optional(),
  dueDate:              Joi.date().optional(),
  assignedToEmployeeId: Joi.string().uuid().optional().allow(null, ''),
  assignedToUserId:     Joi.string().uuid().optional().allow(null, ''),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// ─── Resource allocation ──────────────────────────────────
export const createResourceSchema = Joi.object({
  projectId:  Joi.string().uuid().required(),
  employeeId: Joi.string().uuid().required(),
  role:       Joi.string().trim().max(100).optional().allow(''),
  allocation: Joi.number().min(0).max(100).required(),  // percent
  startDate:  Joi.date().optional(),
  endDate:    Joi.date().optional(),
});

export const updateResourceSchema = Joi.object({
  role:       Joi.string().trim().max(100).optional().allow(''),
  allocation: Joi.number().min(0).max(100).optional(),
  startDate:  Joi.date().optional(),
  endDate:    Joi.date().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// ─── Budget ───────────────────────────────────────────────
export const updateBudgetSchema = Joi.object({
  budget:  Joi.number().min(0).optional(),
  addCost: Joi.number().optional(),  // delta to actualCost (can be negative)
  setCost: Joi.number().min(0).optional(),
}).min(1).messages({ 'object.min': 'Provide budget, addCost, or setCost' });
