jest.mock('../../src/config/keycloak', () => ({
  keycloak: { verifyToken: jest.fn().mockResolvedValue({ sub: 'user-1', email: 'test@amdox.com', realm_access: { roles: ['manager'] } }) },
}));
