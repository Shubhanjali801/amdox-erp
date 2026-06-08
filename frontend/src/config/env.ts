export const ENV = {
  API_URL:        import.meta.env.VITE_API_URL        || 'http://localhost:5000',
  APP_NAME:       import.meta.env.VITE_APP_NAME       || 'Amdox ERP',
  KEYCLOAK_URL:   import.meta.env.VITE_KEYCLOAK_URL   || 'http://localhost:8080',
  KEYCLOAK_REALM: import.meta.env.VITE_KEYCLOAK_REALM || 'amdox-erp',
} as const;
