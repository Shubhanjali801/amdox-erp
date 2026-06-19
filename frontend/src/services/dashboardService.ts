import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export interface DashboardStats {
  finance: { invoices: number; paymentsReceived: number; arOutstanding: number; apOutstanding: number };
  hr: { employees: number };
  supply: { inventoryItems: number; vendors: number; purchaseOrders: number; lowStockItems: number };
  projects: { total: number; byStatus: Record<string, number> };
  generatedAt: string;
}

export const dashboardService = {
  // Cross-module KPI overview
  async getStats(): Promise<DashboardStats> {
    const res = await api.get(API_ENDPOINTS.DASHBOARD_STATS);
    return res.data.data ?? res.data;
  },

  list:    (params?: any)            => api.get(API_ENDPOINTS.DASHBOARDS, { params }),
  getById: (id: string)             => api.get(`${API_ENDPOINTS.DASHBOARDS}/${id}`),
  create:  (data: any)              => api.post(API_ENDPOINTS.DASHBOARDS, data),
  update:  (id: string, data: any)  => api.put(`${API_ENDPOINTS.DASHBOARDS}/${id}`, data),
  remove:  (id: string)             => api.delete(`${API_ENDPOINTS.DASHBOARDS}/${id}`),
};
