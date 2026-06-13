/**
 * OpenAPI 3.0 spec for the Amdox ERP API.
 * Served via swagger-ui-express at /api-docs.
 */
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Amdox ERP API',
    version: '1.0.0',
    description: 'AI-Powered Cloud ERP Suite — REST API (Auth, Users, Tenants, Finance, Supply Chain + ML forecasting)',
  },
  servers: [{ url: 'http://localhost:5000/api/v1', description: 'Local dev' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  tags: [
    { name: 'Auth' }, { name: 'Users' }, { name: 'Tenants' },
    { name: 'Finance' }, { name: 'Supply Chain / ML' }, { name: 'Health' },
  ],
  paths: {
    '/health/live': {
      get: { tags: ['Health'], summary: 'Liveness check', responses: { 200: { description: 'OK' } } },
    },

    // ── Auth ──
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register company + admin',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password', 'companyName'],
          properties: {
            firstName: { type: 'string', example: 'Shubhanjali' },
            lastName: { type: 'string', example: 'Sharma' },
            email: { type: 'string', example: 'admin@amdox.com' },
            password: { type: 'string', example: 'Admin@123' },
            companyName: { type: 'string', example: 'Amdox Technologies' },
          },
        } } } },
        responses: { 201: { description: 'Created' }, 409: { description: 'Email taken' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login → JWT',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['email', 'password'],
          properties: { email: { type: 'string', example: 'admin@amdox.com' }, password: { type: 'string', example: 'Admin@123' } },
        } } } },
        responses: { 200: { description: 'accessToken + refreshToken' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/auth/refresh': { post: { tags: ['Auth'], summary: 'Rotate access token', responses: { 200: { description: 'New token' } } } },
    '/auth/logout': { post: { tags: ['Auth'], security: [{ bearerAuth: [] }], summary: 'Logout', responses: { 200: { description: 'OK' } } } },
    '/auth/me': { get: { tags: ['Auth'], security: [{ bearerAuth: [] }], summary: 'Current user', responses: { 200: { description: 'Profile' } } } },
    '/auth/change-password': { put: { tags: ['Auth'], security: [{ bearerAuth: [] }], summary: 'Change password', responses: { 200: { description: 'OK' } } } },

    // ── Users ──
    '/users': {
      get: { tags: ['Users'], security: [{ bearerAuth: [] }], summary: 'List users (paginated)', responses: { 200: { description: 'List' } } },
      post: {
        tags: ['Users'], security: [{ bearerAuth: [] }], summary: 'Create user',
        requestBody: { content: { 'application/json': { schema: {
          type: 'object',
          properties: {
            firstName: { type: 'string' }, lastName: { type: 'string' },
            email: { type: 'string' }, password: { type: 'string' },
            roleNames: { type: 'array', items: { type: 'string' }, example: ['manager'] },
          },
        } } } },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/users/{id}': {
      get: { tags: ['Users'], security: [{ bearerAuth: [] }], summary: 'Get user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'User' } } },
      put: { tags: ['Users'], security: [{ bearerAuth: [] }], summary: 'Update user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Users'], security: [{ bearerAuth: [] }], summary: 'Delete user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deleted' } } },
    },

    // ── Tenants ──
    '/tenants': {
      get: { tags: ['Tenants'], security: [{ bearerAuth: [] }], summary: 'Get current tenant', responses: { 200: { description: 'Tenant' } } },
      put: { tags: ['Tenants'], security: [{ bearerAuth: [] }], summary: 'Update tenant (admin)', responses: { 200: { description: 'Updated' } } },
    },

    // ── Finance Ledger ──
    '/finance/ledger': {
      get: { tags: ['Finance'], security: [{ bearerAuth: [] }], summary: 'List accounts', responses: { 200: { description: 'List' } } },
      post: {
        tags: ['Finance'], security: [{ bearerAuth: [] }], summary: 'Create account',
        requestBody: { content: { 'application/json': { schema: {
          type: 'object', required: ['code', 'name', 'type'],
          properties: {
            code: { type: 'string', example: '1001' },
            name: { type: 'string', example: 'Cash in Hand' },
            type: { type: 'string', enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] },
          },
        } } } },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/finance/ledger/{id}': {
      get: { tags: ['Finance'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], summary: 'Get account', responses: { 200: { description: 'Account' } } },
      put: { tags: ['Finance'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], summary: 'Update account', responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Finance'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], summary: 'Delete account', responses: { 200: { description: 'Deleted' } } },
    },

    // ── Supply Chain / ML ──
    '/supply/forecasts/health/ml': {
      get: { tags: ['Supply Chain / ML'], security: [{ bearerAuth: [] }], summary: 'Check ML service is reachable', responses: { 200: { description: 'mlServiceUp' } } },
    },
    '/supply/forecasts': {
      get: { tags: ['Supply Chain / ML'], security: [{ bearerAuth: [] }], summary: 'List forecasts', responses: { 200: { description: 'List' } } },
      post: {
        tags: ['Supply Chain / ML'], security: [{ bearerAuth: [] }], summary: 'Generate forecast (calls ML / LSTM)',
        requestBody: { content: { 'application/json': { schema: {
          type: 'object', required: ['inventoryItemId'],
          properties: {
            inventoryItemId: { type: 'string' },
            modelType: { type: 'string', enum: ['auto', 'lstm', 'prophet'], example: 'lstm' },
            horizon: { type: 'integer', example: 6 },
          },
        } } } },
        responses: { 201: { description: 'Forecast generated' }, 502: { description: 'ML service error' } },
      },
    },
  },
};
