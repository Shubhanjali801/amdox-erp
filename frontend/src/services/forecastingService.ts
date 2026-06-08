import api from './api';

// forecastingService — all API calls for this module
export const forecastingService = {
  getAll:    (params?: any)        => api.get('/forecasting', { params }),
  getById:   (id: string)          => api.get('/forecasting/' + id),
  create:    (data: any)           => api.post('/forecasting', data),
  update:    (id: string, data: any) => api.put('/forecasting/' + id, data),
  remove:    (id: string)          => api.delete('/forecasting/' + id),
};
