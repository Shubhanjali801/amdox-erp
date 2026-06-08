export const APP_NAME    = 'Amdox ERP';
export const APP_VERSION = '1.0.0';
export const DATE_FORMAT = 'MM/DD/YYYY';
export const CURRENCY    = 'USD';
export const PAGE_SIZES  = [10, 20, 50, 100];
export const ROLES       = ['super_admin','tenant_admin','manager','viewer'] as const;
export const STATUS_COLORS: Record<string,string> = {
  ACTIVE:    'text-green-400',  INACTIVE: 'text-gray-400',
  PENDING:   'text-yellow-400', APPROVED: 'text-green-400',
  REJECTED:  'text-red-400',    DRAFT:    'text-blue-400',
  COMPLETED: 'text-green-400',  OVERDUE:  'text-red-400',
};
