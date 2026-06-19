import { Router, Request, Response } from 'express';

// ── Auth & Core (M2) ──
import authRoutes    from './authRoutes';
import userRoutes    from './userRoutes';
import tenantRoutes  from './tenantRoutes';

// ── Finance (M3) ──
import ledgerRoutes   from './finance/ledgerRoutes';
import apRoutes       from './finance/apRoutes';
import arRoutes       from './finance/arRoutes';
import currencyRoutes from './finance/currencyRoutes';
import paymentRoutes  from './finance/paymentRoutes';

// ── HR & Projects (M4) ──
import employeeRoutes     from './hr/employeeRoutes';
import leaveRoutes        from './hr/leaveRoutes';
import attendanceRoutes   from './hr/attendanceRoutes';
import payrollRoutes      from './hr/payrollRoutes';
import organisationRoutes from './hr/organisationRoutes';
import projectRoutes      from './project/projectRoutes';
import taskRoutes         from './project/taskRoutes';
import resourceRoutes     from './project/resourceRoutes';
import budgetRoutes       from './project/budgetRoutes';

// ── Supply Chain + AI/ML (M5) ──
import poRoutes           from './supplyChain/poRoutes';
import inventoryRoutes    from './supplyChain/inventoryRoutes';
import vendorRoutes       from './supplyChain/vendorRoutes';
import forecastingRoutes  from './supplyChain/forecastingRoutes';
import notificationRoutes from './notification/notificationRoutes';
import webhookRoutes      from './notification/webhookRoutes';
import eventRoutes        from './notification/eventRoutes';

// ── Dashboard & BI (M6) ──
import dashboardRoutes from './dashboard/dashboardRoutes';
import widgetRoutes    from './dashboard/widgetRoutes';
import reportRoutes    from './dashboard/reportRoutes';

// ── Settings & RBAC (M2) ──
import settingsRoutes    from './settings/settingsRoutes';
import roleRoutes        from './settings/roleRoutes';
import permissionRoutes  from './settings/permissionRoutes';
import integrationRoutes from './settings/integrationRoutes';

// ── Audit & Compliance (F-09) ──
import auditRoutes       from './auditRoutes';

const router = Router();

// ─── Health Checks ──────────────────────────────────────────────────────────
router.get('/health/live',  (_req: Request, res: Response) => res.status(200).json({ status: 'ok',    timestamp: new Date().toISOString() }));
router.get('/health/ready', (_req: Request, res: Response) => res.status(200).json({ status: 'ready', timestamp: new Date().toISOString(), db: 'PostgreSQL 17' }));

// ─── F-01: Auth & Multi-Tenancy ─────────────────────────────────────────────
router.use('/auth',    authRoutes);
router.use('/users',   userRoutes);
router.use('/tenants', tenantRoutes);

// ─── F-02 / F-03: General Ledger + AP/AR ────────────────────────────────────
router.use('/finance/ledger',   ledgerRoutes);
router.use('/finance/ap',       apRoutes);
router.use('/finance/ar',       arRoutes);
router.use('/finance/currency', currencyRoutes);
router.use('/finance/payments', paymentRoutes);

// ─── F-04: HR & Payroll ─────────────────────────────────────────────────────
router.use('/hr/employees',    employeeRoutes);
router.use('/hr/leave',        leaveRoutes);
router.use('/hr/attendance',   attendanceRoutes);
router.use('/hr/payroll',      payrollRoutes);
router.use('/hr/organisation', organisationRoutes);

// ─── F-07: Project Management ───────────────────────────────────────────────
// NOTE: specific sub-paths must be registered BEFORE '/projects'
// otherwise '/projects/tasks' is swallowed by the '/:id' route.
router.use('/projects/tasks',     taskRoutes);
router.use('/projects/resources', resourceRoutes);
router.use('/projects/budget',    budgetRoutes);
router.use('/projects',           projectRoutes);

// ─── F-05: Supply Chain & Inventory ─────────────────────────────────────────
router.use('/supply/pos',       poRoutes);
router.use('/supply/inventory', inventoryRoutes);
router.use('/supply/vendors',   vendorRoutes);
router.use('/supply/forecasts', forecastingRoutes);

// ─── F-10: Notifications & Webhooks ─────────────────────────────────────────
router.use('/notifications', notificationRoutes);
router.use('/webhooks',      webhookRoutes);
router.use('/events',        eventRoutes);

// ─── F-08: Dashboard & BI ───────────────────────────────────────────────────
router.use('/dashboards', dashboardRoutes);
router.use('/widgets',    widgetRoutes);
router.use('/reports',    reportRoutes);

// ─── Settings & RBAC ────────────────────────────────────────────────────────
router.use('/settings',     settingsRoutes);
router.use('/roles',        roleRoutes);
router.use('/permissions',  permissionRoutes);
router.use('/integrations', integrationRoutes);

// ─── F-09: Audit & Compliance ───────────────────────────────────────────────
router.use('/audit', auditRoutes);

export default router;
