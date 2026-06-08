export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

export const API_TIMEOUT = 30000

export const API_ENDPOINTS = {
  // Auth (M2)
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    MFA_SETUP: '/auth/mfa/setup',
    MFA_VERIFY: '/auth/mfa/verify',
  },
  // Finance (M3)
  FINANCE: {
    LEDGER: '/finance/ledger',
    ACCOUNTS: '/finance/accounts',
    AP_INVOICES: '/finance/ap/invoices',
    AR_INVOICES: '/finance/ar/invoices',
    PAYMENTS: '/finance/payments',
    CURRENCY: '/finance/currency',
  },
  // HR (M4)
  HR: {
    EMPLOYEES: '/hr/employees',
    LEAVE: '/hr/leave',
    ATTENDANCE: '/hr/attendance',
    PAYROLL: '/hr/payroll',
    ORG_CHART: '/hr/organisation',
  },
  // Projects (M4)
  PROJECTS: {
    LIST: '/projects',
    TASKS: '/projects/tasks',
    RESOURCES: '/projects/resources',
    BUDGET: '/projects/budget',
  },
  // Supply Chain (M5)
  SUPPLY_CHAIN: {
    PO: '/supply-chain/purchase-orders',
    INVENTORY: '/supply-chain/inventory',
    VENDORS: '/supply-chain/vendors',
    FORECASTING: '/supply-chain/forecasting',
  },
  // Notifications (M5)
  NOTIFICATIONS: {
    LIST: '/notifications',
    PREFERENCES: '/notifications/preferences',
    WEBHOOKS: '/notifications/webhooks',
  },
  // Dashboard (M6)
  DASHBOARD: {
    WIDGETS: '/dashboard/widgets',
    METRICS: '/dashboard/metrics',
    REPORTS: '/dashboard/reports',
  },
}
