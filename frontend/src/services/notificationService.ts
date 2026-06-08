import api from './api';

// notificationService — all API calls for this module
export const notificationService = {
  getAll:    (params?: any)        => api.get('/notification', { params }),
  getById:   (id: string)          => api.get('/notification/' + id),
  create:    (data: any)           => api.post('/notification', data),
  update:    (id: string, data: any) => api.put('/notification/' + id, data),
  remove:    (id: string)          => api.delete('/notification/' + id),
};
