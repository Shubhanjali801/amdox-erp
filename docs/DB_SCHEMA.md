# Database Schema — PostgreSQL 17 + Prisma ORM

> ⚠️ **Note:** This file is a legacy reference document.
> The authoritative schema is defined in **`backend/prisma/schema.prisma`** (37 tables, 28 enums).
> For the full ER diagram open **`docs/er-diagram.html`** in a browser.
> For raw SQL DDL see **`backend/prisma/migrations/20260401000000_init/migration.sql`**.

---

## Core Collections (M2)

### users
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "email": "string (unique)",
  "passwordHash": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "super_admin | tenant_admin | manager | viewer",
  "isActive": "boolean",
  "mfaEnabled": "boolean",
  "mfaSecret": "string",
  "lastLoginAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### tenants
```json
{
  "_id": "ObjectId",
  "name": "string",
  "slug": "string (unique)",
  "domain": "string",
  "plan": "starter | professional | enterprise",
  "isActive": "boolean",
  "settings": "object",
  "createdAt": "Date"
}
```

## Finance Collections (M3)

### chartOfAccounts
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "code": "string",
  "name": "string",
  "type": "asset | liability | equity | revenue | expense",
  "currency": "string",
  "isActive": "boolean"
}
```

### journalEntries
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "entryNumber": "string",
  "date": "Date",
  "description": "string",
  "lines": [{ "accountId": "ObjectId", "debit": "number", "credit": "number" }],
  "status": "draft | posted | reversed",
  "createdBy": "ObjectId",
  "createdAt": "Date"
}
```

### invoices
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "type": "ap | ar",
  "invoiceNumber": "string",
  "vendorId / customerId": "ObjectId",
  "amount": "number",
  "currency": "string",
  "dueDate": "Date",
  "status": "draft | pending | approved | paid | overdue",
  "lineItems": "array",
  "createdAt": "Date"
}
```

## HR Collections (M4)

### employees
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "employeeId": "string",
  "userId": "ObjectId",
  "department": "string",
  "designation": "string",
  "managerId": "ObjectId",
  "salary": "number",
  "currency": "string",
  "joinDate": "Date",
  "status": "active | inactive | terminated"
}
```

### payrollRuns
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "period": "string (YYYY-MM)",
  "status": "draft | processing | completed | failed",
  "totalGross": "number",
  "totalNet": "number",
  "processedAt": "Date"
}
```

## Supply Chain Collections (M5)

### purchaseOrders
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "poNumber": "string",
  "vendorId": "ObjectId",
  "status": "draft | sent | acknowledged | received | cancelled",
  "lineItems": "array",
  "totalAmount": "number",
  "currency": "string",
  "expectedDelivery": "Date"
}
```

### inventory
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "sku": "string",
  "name": "string",
  "quantity": "number",
  "reorderPoint": "number",
  "unitCost": "number",
  "warehouseLocation": "string",
  "lastUpdated": "Date"
}
```
