/**
 * GraphQL schema — a flexible READ / BI layer alongside the REST API.
 * (Per the spec: "GraphQL for flexible BI queries; REST for CRUD".)
 * Every query is tenant-scoped and permission-checked in the resolvers.
 */
export const typeDefs = /* GraphQL */ `
  type Me {
    id: ID!
    email: String!
    tenantId: ID!
    roles: [String!]!
    permissions: [String!]!
  }

  type FinanceStats { invoices: Int!, paymentsReceived: Float!, arOutstanding: Float!, apOutstanding: Float! }
  type HrStats { employees: Int! }
  type SupplyStats { inventoryItems: Int!, vendors: Int!, purchaseOrders: Int!, lowStockItems: Int! }
  type StatusCount { status: String!, count: Int! }
  type ProjectStats { total: Int!, byStatus: [StatusCount!]! }
  type DashboardStats {
    finance: FinanceStats!
    hr: HrStats!
    supply: SupplyStats!
    projects: ProjectStats!
    generatedAt: String!
  }

  type Invoice {
    id: ID!
    invoiceNumber: String!
    type: String!
    totalAmount: Float!
    status: String!
    currency: String
    dueDate: String
  }

  type InventoryItem {
    id: ID!
    sku: String!
    name: String!
    category: String
    quantityOnHand: Float!
    reorderPoint: Float!
    lowStock: Boolean!
  }

  type Employee { id: ID!, employeeCode: String!, designation: String, status: String }
  type Project  { id: ID!, name: String!, code: String, status: String!, budget: Float }

  type Query {
    "The currently authenticated user (from the JWT)."
    me: Me

    "Company-wide KPIs (needs dashboard:read)."
    dashboard: DashboardStats!

    "Invoices, optionally filtered by type (AP/AR) and status (needs finance:read)."
    invoices(type: String, status: String, limit: Int = 50): [Invoice!]!

    "Inventory items, optionally only low-stock (needs supply_chain:read)."
    inventory(lowStockOnly: Boolean = false, limit: Int = 100): [InventoryItem!]!

    "Employees (needs hr:read)."
    employees(limit: Int = 100): [Employee!]!

    "Projects (needs project:read)."
    projects(limit: Int = 100): [Project!]!
  }
`;
