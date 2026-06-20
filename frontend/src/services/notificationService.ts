import api from './api'
import { API_ENDPOINTS } from '../config/apiConfig'

const unwrap = (r: any) => r.data?.data ?? r.data

export const notificationService = {
  list:        (params?: any) => api.get(API_ENDPOINTS.NOTIFICATIONS, { params }).then((r) => r.data),
  unreadCount: () => api.get(`${API_ENDPOINTS.NOTIFICATIONS}/unread/count`).then(unwrap),
  markRead:    (id: string) => api.put(`${API_ENDPOINTS.NOTIFICATIONS}/${id}`).then(unwrap),
  markAllRead: () => api.post(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`).then(unwrap),
  remove:      (id: string) => api.delete(`${API_ENDPOINTS.NOTIFICATIONS}/${id}`).then(unwrap),
}
