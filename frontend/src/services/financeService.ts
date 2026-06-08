import api from './api';

// financeService — all API calls for this module
export const financeService = {
  getAll:    (params?: any)        => api.get('/finance', { params }),
  getById:   (id: string)          => api.get('/finance/' + id),
  create:    (data: any)           => api.post('/finance', data),
  update:    (id: string, data: any) => api.put('/finance/' + id, data),
  remove:    (id: string)          => api.delete('/finance/' + id),
};
