import api from './api';

// supplyChainService — all API calls for this module
export const supplyChainService = {
  getAll:    (params?: any)        => api.get('/supplychain', { params }),
  getById:   (id: string)          => api.get('/supplychain/' + id),
  create:    (data: any)           => api.post('/supplychain', data),
  update:    (id: string, data: any) => api.put('/supplychain/' + id, data),
  remove:    (id: string)          => api.delete('/supplychain/' + id),
};
