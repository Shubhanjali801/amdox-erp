-- ============================================================
-- Amdox ERP — Initial Migration
-- Generated: 2026-06-01
-- Database: PostgreSQL 18
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- F-01: AUTH & MULTI-TENANCY
-- ============================================================

CREATE TYPE "PlanType" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

CREATE TABLE "tenants" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL UNIQUE,
  "domain"    TEXT UNIQUE,
  "plan"      "PlanType" NOT NULL DEFAULT 'STARTER',
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
  "logoUrl"   TEXT,
  "settings"  JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "users" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"     UUID NOT NULL REFERENCES "tenants"("id"),
  "email"        TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "firstName"    TEXT NOT NULL,
  "lastName"     TEXT NOT NULL,
  "avatarUrl"    TEXT,
  "phone"        TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT TRUE,
  "mfaEnabled"   BOOLEAN NOT NULL DEFAULT FALSE,
  "mfaSecret"    TEXT,
  "lastLoginAt"  TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt"    TIMESTAMPTZ,
  UNIQUE ("tenantId", "email")
);
CREATE INDEX idx_users_tenant ON "users"("tenantId");
CREATE INDEX idx_users_email  ON "users"("email");

CREATE TABLE "roles" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    UUID NOT NULL REFERENCES "tenants"("id"),
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "isSystem"    BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenantId", "name")
);

CREATE TABLE "permissions" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "resource"    TEXT NOT NULL,
  "action"      TEXT NOT NULL,
  "description" TEXT,
  UNIQUE ("resource", "action")
);

CREATE TABLE "user_roles" (
  "id"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "roleId" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  UNIQUE ("userId", "roleId")
);

CREATE TABLE "role_permissions" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "roleId"       UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permissionId" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  UNIQUE ("roleId", "permissionId")
);

CREATE TABLE "sessions" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"       UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "refreshToken" TEXT NOT NULL UNIQUE,
  "ipAddress"    TEXT,
  "userAgent"    TEXT,
  "expiresAt"    TIMESTAMPTZ NOT NULL,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_user ON "sessions"("userId");

-- ============================================================
-- F-02: FINANCIAL LEDGER (GL)
-- ============================================================

CREATE TYPE "AccountType"        AS ENUM ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE');
CREATE TYPE "PeriodStatus"       AS ENUM ('OPEN','LOCKED','CLOSED');
CREATE TYPE "JournalEntryStatus" AS ENUM ('DRAFT','POSTED','REVERSED');

CREATE TABLE "chart_of_accounts" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    UUID NOT NULL REFERENCES "tenants"("id"),
  "code"        TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "type"        "AccountType" NOT NULL,
  "subType"     TEXT,
  "currency"    TEXT NOT NULL DEFAULT 'USD',
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "parentId"    UUID REFERENCES "chart_of_accounts"("id"),
  "description" TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenantId", "code")
);
CREATE INDEX idx_coa_tenant ON "chart_of_accounts"("tenantId");

CREATE TABLE "accounting_periods" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"  UUID NOT NULL,
  "name"      TEXT NOT NULL,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate"   TIMESTAMPTZ NOT NULL,
  "status"    "PeriodStatus" NOT NULL DEFAULT 'OPEN',
  "closedAt"  TIMESTAMPTZ,
  "closedBy"  UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_periods_tenant ON "accounting_periods"("tenantId");

CREATE TABLE "journal_entries" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    UUID NOT NULL REFERENCES "tenants"("id"),
  "entryNumber" TEXT NOT NULL,
  "periodId"    UUID REFERENCES "accounting_periods"("id"),
  "date"        TIMESTAMPTZ NOT NULL,
  "description" TEXT NOT NULL,
  "reference"   TEXT,
  "status"      "JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
  "totalDebit"  NUMERIC(18,2) NOT NULL,
  "totalCredit" NUMERIC(18,2) NOT NULL,
  "createdBy"   UUID NOT NULL REFERENCES "users"("id"),
  "postedAt"    TIMESTAMPTZ,
  "reversedAt"  TIMESTAMPTZ,
  "reversalId"  UUID,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenantId", "entryNumber")
);
CREATE INDEX idx_je_tenant_date ON "journal_entries"("tenantId", "date");

CREATE TABLE "journal_entry_lines" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "journalEntryId" UUID NOT NULL REFERENCES "journal_entries"("id") ON DELETE CASCADE,
  "debitAccountId"  UUID REFERENCES "chart_of_accounts"("id"),
  "creditAccountId" UUID REFERENCES "chart_of_accounts"("id"),
  "amount"         NUMERIC(18,2) NOT NULL,
  "currency"       TEXT NOT NULL DEFAULT 'USD',
  "description"    TEXT,
  "lineNumber"     INTEGER NOT NULL
);
CREATE INDEX idx_jel_entry ON "journal_entry_lines"("journalEntryId");

CREATE TABLE "currency_rates" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fromCurrency" TEXT NOT NULL,
  "toCurrency"   TEXT NOT NULL,
  "rate"         NUMERIC(18,6) NOT NULL,
  "date"         TIMESTAMPTZ NOT NULL,
  "source"       TEXT NOT NULL DEFAULT 'ECB',
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("fromCurrency", "toCurrency", "date")
);
CREATE INDEX idx_rates_date ON "currency_rates"("date");

-- ============================================================
-- F-03: AP / AR AUTOMATION
-- ============================================================

CREATE TYPE "InvoiceType"    AS ENUM ('AP','AR');
CREATE TYPE "InvoiceStatus"  AS ENUM ('DRAFT','PENDING','APPROVED','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED');
CREATE TYPE "MatchingStatus" AS ENUM ('PENDING','MATCHED','MISMATCHED','EXCEPTION');
CREATE TYPE "PaymentMethod"  AS ENUM ('BANK_TRANSFER','CHEQUE','CARD','CASH','CRYPTO');
CREATE TYPE "PaymentStatus"  AS ENUM ('PENDING','COMPLETED','FAILED','REFUNDED');

CREATE TABLE "invoices" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"        UUID NOT NULL REFERENCES "tenants"("id"),
  "type"            "InvoiceType" NOT NULL,
  "invoiceNumber"   TEXT NOT NULL,
  "vendorId"        UUID,
  "customerId"      UUID,
  "purchaseOrderId" UUID,
  "amount"          NUMERIC(18,2) NOT NULL,
  "taxAmount"       NUMERIC(18,2) NOT NULL DEFAULT 0,
  "totalAmount"     NUMERIC(18,2) NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'USD',
  "issueDate"       TIMESTAMPTZ NOT NULL,
  "dueDate"         TIMESTAMPTZ NOT NULL,
  "status"          "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "ocrData"         JSONB,
  "ocrConfidence"   NUMERIC(5,2),
  "matchingStatus"  "MatchingStatus" NOT NULL DEFAULT 'PENDING',
  "approvedBy"      UUID,
  "approvedAt"      TIMESTAMPTZ,
  "paidAt"          TIMESTAMPTZ,
  "notes"           TEXT,
  "attachmentUrl"   TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt"       TIMESTAMPTZ,
  UNIQUE ("tenantId", "invoiceNumber")
);
CREATE INDEX idx_invoices_tenant_type   ON "invoices"("tenantId","type","status");
CREATE INDEX idx_invoices_tenant_due    ON "invoices"("tenantId","dueDate");

CREATE TABLE "invoice_line_items" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceId"   UUID NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "quantity"    NUMERIC(10,2) NOT NULL,
  "unitPrice"   NUMERIC(18,2) NOT NULL,
  "totalPrice"  NUMERIC(18,2) NOT NULL,
  "taxRate"     NUMERIC(5,2) NOT NULL DEFAULT 0,
  "accountId"   UUID
);

CREATE TABLE "payments" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    UUID NOT NULL,
  "invoiceId"   UUID NOT NULL REFERENCES "invoices"("id"),
  "amount"      NUMERIC(18,2) NOT NULL,
  "currency"    TEXT NOT NULL DEFAULT 'USD',
  "method"      "PaymentMethod" NOT NULL,
  "reference"   TEXT,
  "paymentDate" TIMESTAMPTZ NOT NULL,
  "status"      "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_invoice ON "payments"("invoiceId");

-- ============================================================
-- F-04: HR & PAYROLL
-- ============================================================

CREATE TYPE "EmploymentType"  AS ENUM ('FULL_TIME','PART_TIME','CONTRACT','INTERN');
CREATE TYPE "EmployeeStatus"  AS ENUM ('ACTIVE','ON_LEAVE','SUSPENDED','TERMINATED');
CREATE TYPE "PayFrequency"    AS ENUM ('WEEKLY','BI_WEEKLY','MONTHLY','QUARTERLY');
CREATE TYPE "LeaveStatus"     AS ENUM ('PENDING','APPROVED','REJECTED','CANCELLED');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT','ABSENT','HALF_DAY','HOLIDAY','WORK_FROM_HOME');
CREATE TYPE "PayrollStatus"   AS ENUM ('DRAFT','PROCESSING','COMPLETED','FAILED','CANCELLED');

CREATE TABLE "departments" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"  UUID NOT NULL,
  "name"      TEXT NOT NULL,
  "code"      TEXT,
  "managerId" UUID,
  "parentId"  UUID REFERENCES "departments"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenantId", "name")
);

CREATE TABLE "employees" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"        UUID NOT NULL REFERENCES "tenants"("id"),
  "userId"          UUID NOT NULL UNIQUE REFERENCES "users"("id"),
  "employeeCode"    TEXT NOT NULL,
  "departmentId"    UUID REFERENCES "departments"("id"),
  "designation"     TEXT NOT NULL,
  "managerId"       UUID REFERENCES "employees"("id"),
  "employmentType"  "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
  "status"          "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
  "joinDate"        TIMESTAMPTZ NOT NULL,
  "terminationDate" TIMESTAMPTZ,
  "baseSalary"      NUMERIC(18,2) NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'USD',
  "payFrequency"    "PayFrequency" NOT NULL DEFAULT 'MONTHLY',
  "dateOfBirth"     TIMESTAMPTZ,
  "gender"          TEXT,
  "nationality"     TEXT,
  "taxId"           TEXT,
  "bankAccount"     TEXT,
  "bankName"        TEXT,
  "bankIfsc"        TEXT,
  "address"         JSONB,
  "emergencyContact" JSONB,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt"       TIMESTAMPTZ,
  UNIQUE ("tenantId", "employeeCode")
);
CREATE INDEX idx_employees_tenant ON "employees"("tenantId");

CREATE TABLE "leave_types" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"           UUID NOT NULL,
  "name"               TEXT NOT NULL,
  "daysAllowedPerYear" INTEGER NOT NULL,
  "carryForward"       BOOLEAN NOT NULL DEFAULT FALSE,
  "maxCarryForward"    INTEGER,
  "isPaid"             BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenantId", "name")
);

CREATE TABLE "leave_requests" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "employeeId"     UUID NOT NULL REFERENCES "employees"("id"),
  "leaveTypeId"    UUID NOT NULL REFERENCES "leave_types"("id"),
  "startDate"      TIMESTAMPTZ NOT NULL,
  "endDate"        TIMESTAMPTZ NOT NULL,
  "totalDays"      NUMERIC(4,1) NOT NULL,
  "reason"         TEXT,
  "status"         "LeaveStatus" NOT NULL DEFAULT 'PENDING',
  "approvedBy"     UUID,
  "approvedAt"     TIMESTAMPTZ,
  "rejectedReason" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_leave_employee ON "leave_requests"("employeeId");

CREATE TABLE "attendances" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "employeeId"    UUID NOT NULL REFERENCES "employees"("id"),
  "date"          DATE NOT NULL,
  "clockIn"       TIMESTAMPTZ,
  "clockOut"      TIMESTAMPTZ,
  "totalHours"    NUMERIC(4,2),
  "overtimeHours" NUMERIC(4,2),
  "status"        "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
  "notes"         TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("employeeId", "date")
);
CREATE INDEX idx_attendance_emp_date ON "attendances"("employeeId","date");

CREATE TABLE "payroll_runs" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"         UUID NOT NULL REFERENCES "tenants"("id"),
  "period"           TEXT NOT NULL,
  "status"           "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
  "totalEmployees"   INTEGER NOT NULL DEFAULT 0,
  "totalGross"       NUMERIC(18,2) NOT NULL DEFAULT 0,
  "totalDeductions"  NUMERIC(18,2) NOT NULL DEFAULT 0,
  "totalNet"         NUMERIC(18,2) NOT NULL DEFAULT 0,
  "currency"         TEXT NOT NULL DEFAULT 'USD',
  "processedAt"      TIMESTAMPTZ,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenantId", "period")
);

CREATE TABLE "payslips" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "payrollRunId"    UUID NOT NULL REFERENCES "payroll_runs"("id"),
  "employeeId"      UUID NOT NULL REFERENCES "employees"("id"),
  "basicSalary"     NUMERIC(18,2) NOT NULL,
  "allowances"      JSONB NOT NULL DEFAULT '{}',
  "totalAllowances" NUMERIC(18,2) NOT NULL DEFAULT 0,
  "grossSalary"     NUMERIC(18,2) NOT NULL,
  "deductions"      JSONB NOT NULL DEFAULT '{}',
  "totalDeductions" NUMERIC(18,2) NOT NULL DEFAULT 0,
  "netSalary"       NUMERIC(18,2) NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'USD',
  "pdfUrl"          TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("payrollRunId", "employeeId")
);

-- ============================================================
-- F-05: SUPPLY CHAIN & INVENTORY
-- ============================================================

CREATE TYPE "VendorStatus"   AS ENUM ('ACTIVE','INACTIVE','BLACKLISTED');
CREATE TYPE "POStatus"       AS ENUM ('DRAFT','SENT','ACKNOWLEDGED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED');
CREATE TYPE "CostingMethod"  AS ENUM ('FIFO','LIFO','WEIGHTED_AVERAGE');
CREATE TYPE "MovementType"   AS ENUM ('IN','OUT','ADJUSTMENT','TRANSFER');

CREATE TABLE "vendors" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"     UUID NOT NULL REFERENCES "tenants"("id"),
  "name"         TEXT NOT NULL,
  "code"         TEXT NOT NULL,
  "email"        TEXT,
  "phone"        TEXT,
  "website"      TEXT,
  "taxId"        TEXT,
  "paymentTerms" INTEGER NOT NULL DEFAULT 30,
  "currency"     TEXT NOT NULL DEFAULT 'USD',
  "rating"       NUMERIC(3,2),
  "status"       "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
  "address"      JSONB,
  "bankDetails"  JSONB,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt"    TIMESTAMPTZ,
  UNIQUE ("tenantId", "code")
);
CREATE INDEX idx_vendors_tenant ON "vendors"("tenantId");

CREATE TABLE "purchase_orders" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"         UUID NOT NULL REFERENCES "tenants"("id"),
  "poNumber"         TEXT NOT NULL,
  "vendorId"         UUID NOT NULL REFERENCES "vendors"("id"),
  "requestedBy"      UUID,
  "approvedBy"       UUID,
  "status"           "POStatus" NOT NULL DEFAULT 'DRAFT',
  "currency"         TEXT NOT NULL DEFAULT 'USD',
  "subtotal"         NUMERIC(18,2) NOT NULL,
  "taxAmount"        NUMERIC(18,2) NOT NULL DEFAULT 0,
  "totalAmount"      NUMERIC(18,2) NOT NULL,
  "expectedDelivery" TIMESTAMPTZ,
  "deliveredAt"      TIMESTAMPTZ,
  "notes"            TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenantId", "poNumber")
);
CREATE INDEX idx_po_tenant_status ON "purchase_orders"("tenantId","status");

CREATE TABLE "inventory_items" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"          UUID NOT NULL REFERENCES "tenants"("id"),
  "sku"               TEXT NOT NULL,
  "name"              TEXT NOT NULL,
  "description"       TEXT,
  "category"          TEXT,
  "unitOfMeasure"     TEXT NOT NULL DEFAULT 'PCS',
  "costingMethod"     "CostingMethod" NOT NULL DEFAULT 'FIFO',
  "unitCost"          NUMERIC(18,2) NOT NULL,
  "sellingPrice"      NUMERIC(18,2),
  "quantityOnHand"    NUMERIC(10,2) NOT NULL DEFAULT 0,
  "quantityOnOrder"   NUMERIC(10,2) NOT NULL DEFAULT 0,
  "reorderPoint"      NUMERIC(10,2) NOT NULL DEFAULT 0,
  "reorderQty"        NUMERIC(10,2) NOT NULL DEFAULT 0,
  "warehouseLocation" TEXT,
  "preferredVendorId" UUID REFERENCES "vendors"("id"),
  "isActive"          BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenantId", "sku")
);
CREATE INDEX idx_inventory_tenant ON "inventory_items"("tenantId");

CREATE TABLE "po_line_items" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "purchaseOrderId" UUID NOT NULL REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
  "inventoryItemId" UUID REFERENCES "inventory_items"("id"),
  "description"     TEXT NOT NULL,
  "quantity"        NUMERIC(10,2) NOT NULL,
  "unitPrice"       NUMERIC(18,2) NOT NULL,
  "totalPrice"      NUMERIC(18,2) NOT NULL,
  "receivedQty"     NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE "goods_receipts" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "purchaseOrderId" UUID NOT NULL REFERENCES "purchase_orders"("id"),
  "receivedBy"      UUID,
  "receiptDate"     TIMESTAMPTZ NOT NULL,
  "notes"           TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "goods_receipt_lines" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "goodsReceiptId"  UUID NOT NULL REFERENCES "goods_receipts"("id") ON DELETE CASCADE,
  "inventoryItemId" UUID,
  "description"     TEXT NOT NULL,
  "orderedQty"      NUMERIC(10,2) NOT NULL,
  "receivedQty"     NUMERIC(10,2) NOT NULL
);

CREATE TABLE "stock_movements" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "inventoryItemId" UUID NOT NULL REFERENCES "inventory_items"("id"),
  "type"            "MovementType" NOT NULL,
  "quantity"        NUMERIC(10,2) NOT NULL,
  "unitCost"        NUMERIC(18,2),
  "reference"       TEXT,
  "notes"           TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_stock_item_date ON "stock_movements"("inventoryItemId","createdAt");

-- ============================================================
-- F-06: AI DEMAND FORECASTING
-- ============================================================

CREATE TABLE "forecasts" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"        UUID NOT NULL REFERENCES "tenants"("id"),
  "inventoryItemId" UUID NOT NULL REFERENCES "inventory_items"("id"),
  "modelType"       TEXT NOT NULL DEFAULT 'PROPHET',
  "modelVersion"    TEXT,
  "forecastDate"    TIMESTAMPTZ NOT NULL,
  "forecastPeriod"  TEXT NOT NULL,
  "predictedQty"    NUMERIC(10,2) NOT NULL,
  "confidenceLow"   NUMERIC(10,2),
  "confidenceHigh"  NUMERIC(10,2),
  "mape"            NUMERIC(6,3),
  "actualQty"       NUMERIC(10,2),
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_forecast_item_period ON "forecasts"("tenantId","inventoryItemId","forecastPeriod");

-- ============================================================
-- F-07: PROJECT MANAGEMENT
-- ============================================================

CREATE TYPE "ProjectStatus"   AS ENUM ('PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED');
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','DELAYED');
CREATE TYPE "TaskStatus"      AS ENUM ('TODO','IN_PROGRESS','IN_REVIEW','COMPLETED','CANCELLED');
CREATE TYPE "Priority"        AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');

CREATE TABLE "projects" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    UUID NOT NULL REFERENCES "tenants"("id"),
  "name"        TEXT NOT NULL,
  "code"        TEXT NOT NULL,
  "description" TEXT,
  "status"      "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
  "startDate"   TIMESTAMPTZ,
  "endDate"     TIMESTAMPTZ,
  "budget"      NUMERIC(18,2) NOT NULL DEFAULT 0,
  "actualCost"  NUMERIC(18,2) NOT NULL DEFAULT 0,
  "currency"    TEXT NOT NULL DEFAULT 'USD',
  "managerId"   UUID,
  "clientName"  TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt"   TIMESTAMPTZ,
  UNIQUE ("tenantId", "code")
);
CREATE INDEX idx_projects_tenant ON "projects"("tenantId");

CREATE TABLE "project_milestones" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId"   UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "dueDate"     TIMESTAMPTZ NOT NULL,
  "status"      "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
  "completedAt" TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "project_tasks" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId"      UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "milestoneId"    UUID REFERENCES "project_milestones"("id"),
  "parentTaskId"   UUID REFERENCES "project_tasks"("id"),
  "title"          TEXT NOT NULL,
  "description"    TEXT,
  "status"         "TaskStatus" NOT NULL DEFAULT 'TODO',
  "priority"       "Priority" NOT NULL DEFAULT 'MEDIUM',
  "assignedTo"     UUID,
  "estimatedHours" NUMERIC(6,2),
  "actualHours"    NUMERIC(6,2),
  "startDate"      TIMESTAMPTZ,
  "dueDate"        TIMESTAMPTZ,
  "completedAt"    TIMESTAMPTZ,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tasks_project ON "project_tasks"("projectId");

CREATE TABLE "project_resources" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId"  UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "employeeId" UUID NOT NULL REFERENCES "employees"("id"),
  "role"       TEXT,
  "allocation" NUMERIC(5,2) NOT NULL DEFAULT 100,
  "startDate"  TIMESTAMPTZ,
  "endDate"    TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("projectId", "employeeId")
);

-- ============================================================
-- F-08: BUSINESS INTELLIGENCE
-- ============================================================

CREATE TYPE "WidgetType"    AS ENUM ('BAR_CHART','LINE_CHART','PIE_CHART','METRIC_CARD','TABLE','HEATMAP','FUNNEL','GANTT');
CREATE TYPE "ReportFormat"  AS ENUM ('PDF','EXCEL','CSV');

CREATE TABLE "dashboards" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    UUID NOT NULL REFERENCES "tenants"("id"),
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "createdBy"   UUID NOT NULL,
  "isPublic"    BOOLEAN NOT NULL DEFAULT FALSE,
  "layout"      JSONB NOT NULL DEFAULT '[]',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dashboards_tenant ON "dashboards"("tenantId");

CREATE TABLE "widgets" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "dashboardId"    UUID NOT NULL REFERENCES "dashboards"("id") ON DELETE CASCADE,
  "title"          TEXT NOT NULL,
  "type"           "WidgetType" NOT NULL,
  "dataSource"     TEXT NOT NULL,
  "config"         JSONB NOT NULL DEFAULT '{}',
  "position"       JSONB NOT NULL DEFAULT '{}',
  "refreshInterval" INTEGER,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "scheduled_reports" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    UUID NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "reportType"  TEXT NOT NULL,
  "format"      "ReportFormat" NOT NULL DEFAULT 'PDF',
  "schedule"    TEXT NOT NULL,
  "recipients"  TEXT[] NOT NULL DEFAULT '{}',
  "config"      JSONB NOT NULL DEFAULT '{}',
  "lastRunAt"   TIMESTAMPTZ,
  "nextRunAt"   TIMESTAMPTZ,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reports_tenant ON "scheduled_reports"("tenantId");

-- ============================================================
-- F-09: AUDIT & COMPLIANCE LOG
-- ============================================================

CREATE TABLE "audit_logs" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"   UUID NOT NULL REFERENCES "tenants"("id"),
  "userId"     UUID REFERENCES "users"("id"),
  "action"     TEXT NOT NULL,
  "resource"   TEXT NOT NULL,
  "resourceId" TEXT,
  "oldValues"  JSONB,
  "newValues"  JSONB,
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "hash"       TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_tenant_resource ON "audit_logs"("tenantId","resource","createdAt");
CREATE INDEX idx_audit_tenant_user     ON "audit_logs"("tenantId","userId","createdAt");

-- ============================================================
-- F-10: NOTIFICATION ENGINE
-- ============================================================

CREATE TYPE "NotificationType"    AS ENUM ('INFO','SUCCESS','WARNING','ERROR');
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP','EMAIL','SMS','WEBHOOK');

CREATE TABLE "notifications" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    UUID NOT NULL REFERENCES "tenants"("id"),
  "userId"      UUID NOT NULL REFERENCES "users"("id"),
  "title"       TEXT NOT NULL,
  "message"     TEXT NOT NULL,
  "type"        "NotificationType" NOT NULL DEFAULT 'INFO',
  "channel"     "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
  "event"       TEXT NOT NULL,
  "resourceId"  TEXT,
  "isRead"      BOOLEAN NOT NULL DEFAULT FALSE,
  "readAt"      TIMESTAMPTZ,
  "deliveredAt" TIMESTAMPTZ,
  "failedAt"    TIMESTAMPTZ,
  "retryCount"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_user_read   ON "notifications"("tenantId","userId","isRead");
CREATE INDEX idx_notif_tenant_date ON "notifications"("tenantId","createdAt");

CREATE TABLE "notification_preferences" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"  UUID NOT NULL REFERENCES "tenants"("id"),
  "userId"    UUID NOT NULL REFERENCES "users"("id"),
  "event"     TEXT NOT NULL,
  "inApp"     BOOLEAN NOT NULL DEFAULT TRUE,
  "email"     BOOLEAN NOT NULL DEFAULT TRUE,
  "sms"       BOOLEAN NOT NULL DEFAULT FALSE,
  "webhook"   BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenantId","userId","event")
);

CREATE TABLE "webhooks" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"   UUID NOT NULL REFERENCES "tenants"("id"),
  "name"       TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "secret"     TEXT NOT NULL,
  "events"     TEXT[] NOT NULL DEFAULT '{}',
  "isActive"   BOOLEAN NOT NULL DEFAULT TRUE,
  "lastUsedAt" TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_webhooks_tenant ON "webhooks"("tenantId");

CREATE TABLE "webhook_deliveries" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "webhookId"   UUID NOT NULL REFERENCES "webhooks"("id"),
  "event"       TEXT NOT NULL,
  "payload"     JSONB NOT NULL,
  "statusCode"  INTEGER,
  "response"    TEXT,
  "attempt"     INTEGER NOT NULL DEFAULT 1,
  "succeededAt" TIMESTAMPTZ,
  "failedAt"    TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wh_delivery_webhook ON "webhook_deliveries"("webhookId");

-- ============================================================
-- F-12: PWA / OFFLINE SYNC
-- ============================================================

CREATE TYPE "SyncStatus" AS ENUM ('PENDING','SYNCED','FAILED');

CREATE TABLE "sync_queue" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"  UUID NOT NULL,
  "userId"    UUID NOT NULL,
  "operation" TEXT NOT NULL,
  "resource"  TEXT NOT NULL,
  "payload"   JSONB NOT NULL,
  "status"    "SyncStatus" NOT NULL DEFAULT 'PENDING',
  "syncedAt"  TIMESTAMPTZ,
  "errorMsg"  TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sync_tenant_user ON "sync_queue"("tenantId","userId","status");
