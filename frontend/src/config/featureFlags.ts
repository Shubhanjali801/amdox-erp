export const FEATURES = {
  MFA_ENABLED:           import.meta.env.VITE_MFA_ENABLED           === 'true',
  AI_FORECASTING:        import.meta.env.VITE_AI_FORECASTING        !== 'false',
  KEYCLOAK_SSO:          import.meta.env.VITE_KEYCLOAK_SSO          === 'true',
  DARK_MODE_ONLY:        true,
  MULTI_CURRENCY:        true,
  PWA_OFFLINE:           import.meta.env.VITE_PWA_OFFLINE           !== 'false',
  GANTT_CHART:           true,
  SCHEDULED_REPORTS:     true,
} as const;
