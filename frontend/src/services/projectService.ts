import api from './api';

// projectService — all API calls for this module
export const projectService = {
  getAll:    (params?: any)        => api.get('/project', { params }),
  getById:   (id: string)          => api.get('/project/' + id),
  create:    (data: any)           => api.post('/project', data),
  update:    (id: string, data: any) => api.put('/project/' + id, data),
  remove:    (id: string)          => api.delete('/project/' + id),
};
