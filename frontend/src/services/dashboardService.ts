import api from './api';

// dashboardService — all API calls for this module
export const dashboardService = {
  getAll:    (params?: any)        => api.get('/dashboard', { params }),
  getById:   (id: string)          => api.get('/dashboard/' + id),
  create:    (data: any)           => api.post('/dashboard', data),
  update:    (id: string, data: any) => api.put('/dashboard/' + id, data),
  remove:    (id: string)          => api.delete('/dashboard/' + id),
};
