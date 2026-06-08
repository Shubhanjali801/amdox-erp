import api from './api';

// authService — all API calls for this module
export const authService = {
  getAll:    (params?: any)        => api.get('/auth', { params }),
  getById:   (id: string)          => api.get('/auth/' + id),
  create:    (data: any)           => api.post('/auth', data),
  update:    (id: string, data: any) => api.put('/auth/' + id, data),
  remove:    (id: string)          => api.delete('/auth/' + id),
};
