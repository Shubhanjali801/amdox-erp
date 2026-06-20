import api from './api'
import { API_ENDPOINTS } from '../config/apiConfig'

const unwrap = (r: any) => r.data?.data ?? r.data

export const supplyChainService = {
  // ── Vendors ──
  listVendors:   (params?: any) => api.get(API_ENDPOINTS.SUPPLY.VENDORS, { params }).then(unwrap),
  createVendor:  (data: any)    => api.post(API_ENDPOINTS.SUPPLY.VENDORS, data).then(unwrap),
  updateVendor:  (id: string, data: any) => api.put(`${API_ENDPOINTS.SUPPLY.VENDORS}/${id}`, data).then(unwrap),
  deleteVendor:  (id: string)   => api.delete(`${API_ENDPOINTS.SUPPLY.VENDORS}/${id}`).then(unwrap),

  // ── Inventory ──
  listInventory:  (params?: any) => api.get(API_ENDPOINTS.SUPPLY.INVENTORY, { params }).then(unwrap),
  createItem:     (data: any)    => api.post(API_ENDPOINTS.SUPPLY.INVENTORY, data).then(unwrap),
  updateItem:     (id: string, data: any) => api.put(`${API_ENDPOINTS.SUPPLY.INVENTORY}/${id}`, data).then(unwrap),
  deleteItem:     (id: string)   => api.delete(`${API_ENDPOINTS.SUPPLY.INVENTORY}/${id}`).then(unwrap),
  addMovement:    (id: string, data: any) => api.post(`${API_ENDPOINTS.SUPPLY.INVENTORY}/${id}/movements`, data).then(unwrap),
  listMovements:  (id: string)   => api.get(`${API_ENDPOINTS.SUPPLY.INVENTORY}/${id}/movements`).then(unwrap),

  // ── Purchase Orders ──
  listPOs:    (params?: any) => api.get(API_ENDPOINTS.SUPPLY.POS, { params }).then(unwrap),
  getPO:      (id: string)   => api.get(`${API_ENDPOINTS.SUPPLY.POS}/${id}`).then(unwrap),
  createPO:   (data: any)    => api.post(API_ENDPOINTS.SUPPLY.POS, data).then(unwrap),
  sendPO:     (id: string)   => api.put(`${API_ENDPOINTS.SUPPLY.POS}/${id}`).then(unwrap),
  cancelPO:   (id: string)   => api.delete(`${API_ENDPOINTS.SUPPLY.POS}/${id}`).then(unwrap),
  receivePO:  (id: string, data: any) => api.post(`${API_ENDPOINTS.SUPPLY.POS}/${id}/receive`, data).then(unwrap),

  // ── Forecasts ──
  listForecasts: (params?: any) => api.get(API_ENDPOINTS.SUPPLY.FORECASTS, { params }).then(unwrap),
  generateForecast: (data: any) => api.post(API_ENDPOINTS.SUPPLY.FORECASTS, data).then(unwrap),
  mlHealth:      () => api.get(`${API_ENDPOINTS.SUPPLY.FORECASTS}/health/ml`).then(unwrap),
}
