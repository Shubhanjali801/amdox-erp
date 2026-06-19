import Joi from 'joi';

const WIDGET_TYPES   = ['BAR_CHART', 'LINE_CHART', 'PIE_CHART', 'METRIC_CARD', 'TABLE', 'HEATMAP', 'FUNNEL', 'GANTT'];
const REPORT_FORMATS = ['PDF', 'EXCEL', 'CSV'];

// ─── Dashboards ───────────────────────────────────────────
export const createDashboardSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(500).optional().allow(''),
  isPublic:    Joi.boolean().optional(),
  layout:      Joi.array().optional(),
});

export const updateDashboardSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(120).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  isPublic:    Joi.boolean().optional(),
  layout:      Joi.array().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// ─── Widgets ──────────────────────────────────────────────
export const createWidgetSchema = Joi.object({
  dashboardId:     Joi.string().uuid().required(),
  title:           Joi.string().trim().min(2).max(120).required(),
  type:            Joi.string().uppercase().valid(...WIDGET_TYPES).required(),
  dataSource:      Joi.string().trim().min(2).max(80).required(),
  config:          Joi.object().optional(),
  position:        Joi.object().optional(),
  refreshInterval: Joi.number().integer().min(0).optional(),
}).messages({ 'any.only': `type must be one of: ${WIDGET_TYPES.join(', ')}` });

export const updateWidgetSchema = Joi.object({
  title:           Joi.string().trim().min(2).max(120).optional(),
  type:            Joi.string().uppercase().valid(...WIDGET_TYPES).optional(),
  dataSource:      Joi.string().trim().min(2).max(80).optional(),
  config:          Joi.object().optional(),
  position:        Joi.object().optional(),
  refreshInterval: Joi.number().integer().min(0).optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

// ─── Scheduled Reports ────────────────────────────────────
export const createReportSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(500).optional().allow(''),
  reportType:  Joi.string().trim().min(2).max(80).required(),
  format:      Joi.string().uppercase().valid(...REPORT_FORMATS).optional(),
  schedule:    Joi.string().trim().max(100).required(),
  recipients:  Joi.array().items(Joi.string().email()).min(1).required(),
  config:      Joi.object().optional(),
});

export const updateReportSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(120).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  format:      Joi.string().uppercase().valid(...REPORT_FORMATS).optional(),
  schedule:    Joi.string().trim().max(100).optional(),
  recipients:  Joi.array().items(Joi.string().email()).min(1).optional(),
  isActive:    Joi.boolean().optional(),
  config:      Joi.object().optional(),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });
