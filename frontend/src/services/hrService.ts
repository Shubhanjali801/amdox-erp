import api from './api';

// hrService — all API calls for this module
export const hrService = {
  getAll:    (params?: any)        => api.get('/hr', { params }),
  getById:   (id: string)          => api.get('/hr/' + id),
  create:    (data: any)           => api.post('/hr', data),
  update:    (id: string, data: any) => api.put('/hr/' + id, data),
  remove:    (id: string)          => api.delete('/hr/' + id),
};
