import api from './api';

// reportService — all API calls for this module
export const reportService = {
  getAll:    (params?: any)        => api.get('/report', { params }),
  getById:   (id: string)          => api.get('/report/' + id),
  create:    (data: any)           => api.post('/report', data),
  update:    (id: string, data: any) => api.put('/report/' + id, data),
  remove:    (id: string)          => api.delete('/report/' + id),
};
