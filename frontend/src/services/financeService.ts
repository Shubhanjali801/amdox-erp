import api from './api'
import { API_ENDPOINTS } from '../config/apiConfig'

const unwrap = (r: any) => r.data?.data ?? r.data
const F = API_ENDPOINTS.FINANCE

export const financeService = {
  // ── Ledger (Chart of Accounts) ──
  listAccounts:  (params?: any) => api.get(F.LEDGER, { params }).then((r) => r.data),
  createAccount: (data: any)    => api.post(F.LEDGER, data).then(unwrap),
  deleteAccount: (id: string)   => api.delete(`${F.LEDGER}/${id}`).then(unwrap),

  // ── AP (vendor invoices) ──
  listAP:    (params?: any) => api.get(F.AP, { params }).then((r) => r.data),
  createAP:  (data: any)    => api.post(F.AP, data).then(unwrap),
  approveAP: (id: string)   => api.post(`${F.AP}/${id}/approve`).then(unwrap),
  deleteAP:  (id: string)   => api.delete(`${F.AP}/${id}`).then(unwrap),

  // ── AR (customer invoices) ──
  listAR:    (params?: any) => api.get(F.AR, { params }).then((r) => r.data),
  createAR:  (data: any)    => api.post(F.AR, data).then(unwrap),
  approveAR: (id: string)   => api.post(`${F.AR}/${id}/approve`).then(unwrap),
  deleteAR:  (id: string)   => api.delete(`${F.AR}/${id}`).then(unwrap),

  // ── Payments ──
  listPayments:  (params?: any) => api.get(F.PAYMENTS, { params }).then((r) => r.data),
  createPayment: (data: any)    => api.post(F.PAYMENTS, data).then(unwrap),

  // ── Currency ──
  listCurrencies: () => api.get(F.CURRENCY).then((r) => r.data),
  convert: (params: { from: string; to: string; amount: number }) =>
    api.get(`${F.CURRENCY}/convert`, { params }).then(unwrap),
}
