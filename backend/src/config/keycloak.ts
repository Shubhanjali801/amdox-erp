import { ENV } from './env';
export const keycloakConfig = {
  realm:        ENV.KEYCLOAK_REALM    || 'amdox-erp',
  authServerUrl:ENV.KEYCLOAK_URL      || 'http://localhost:8080',
  clientId:     ENV.KEYCLOAK_CLIENT_ID || 'amdox-backend',
  clientSecret: ENV.KEYCLOAK_SECRET   || '',
};
