-- Migration 001: Initial Setup
-- Owner: M1 / M2
-- Creates base collections indexes for MongoDB

-- Note: MongoDB is schema-less but we define indexes here for performance

-- Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "tenantId": 1 });
db.users.createIndex({ "tenantId": 1, "role": 1 });

-- Tenants collection indexes
db.tenants.createIndex({ "slug": 1 }, { unique: true });
db.tenants.createIndex({ "domain": 1 });

-- Audit logs (append-only)
db.auditLogs.createIndex({ "tenantId": 1, "createdAt": -1 });
db.auditLogs.createIndex({ "userId": 1, "createdAt": -1 });
db.auditLogs.createIndex({ "resource": 1, "action": 1 });
