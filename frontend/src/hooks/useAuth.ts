import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { isSsoSession, keycloakLogout } from '../services/keycloak';

export const useAuth = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const isAuthenticated = !!token;
  const user = authService.getCurrentUser();

  const logout = useCallback(async () => {
    // SSO sessions must also be ended at Keycloak (this redirects to Keycloak
    // and back to /login); local sessions use the classic logout.
    if (isSsoSession()) {
      await keycloakLogout();
      return;
    }
    await authService.logout();
    navigate('/');
  }, [navigate]);

  return { isAuthenticated, token, user, logout };
};
