export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

export const API_TIMEOUT = 30000

// Endpoints mirror the real Express backend (routes/index.ts)
export const API_ENDPOINTS = {
  // Auth & Core (M2)
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: '/users',
  TENANTS: '/tenants',

  // Finance (M3)
  FINANCE: {
    LEDGER: '/finance/ledger',
    AP: '/finance/ap',
    AR: '/finance/ar',
    CURRENCY: '/finance/currency',
    PAYMENTS: '/finance/payments',
  },

  // HR & Payroll (M4)
  HR: {
    EMPLOYEES: '/hr/employees',
    LEAVE: '/hr/leave',
    ATTENDANCE: '/hr/attendance',
    PAYROLL: '/hr/payroll',
    ORGANISATION: '/hr/organisation',
  },

  // Projects (M4 / F-07)
  PROJECTS: {
    LIST: '/projects',
    TASKS: '/projects/tasks',
    RESOURCES: '/projects/resources',
    BUDGET: '/projects/budget',
  },

  // Supply Chain + ML (M5)
  SUPPLY: {
    VENDORS: '/supply/vendors',
    INVENTORY: '/supply/inventory',
    POS: '/supply/pos',
    FORECASTS: '/supply/forecasts',
  },

  // Notifications (F-10)
  NOTIFICATIONS: '/notifications',
  WEBHOOKS: '/webhooks',
  EVENTS: '/events',

  // Dashboard & BI (F-08)
  DASHBOARDS: '/dashboards',
  DASHBOARD_STATS: '/dashboards/stats/overview',
  WIDGETS: '/widgets',
  REPORTS: '/reports',

  // Settings & RBAC (M2)
  SETTINGS: '/settings',
  ROLES: '/roles',
  PERMISSIONS: '/permissions',
  INTEGRATIONS: '/integrations',
}
