import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const useAuth = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const isAuthenticated = !!token;
  const user = authService.getCurrentUser();

  const logout = useCallback(async () => {
    await authService.logout();
    navigate('/login');
  }, [navigate]);

  return { isAuthenticated, token, user, logout };
};
