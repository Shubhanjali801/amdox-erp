import api from './api'
import { API_ENDPOINTS } from '../config/apiConfig'

const unwrap = (r: any) => r.data?.data ?? r.data

export const settingsService = {
  // ── Tenant settings ──
  async getSettings() {
    return unwrap(await api.get(API_ENDPOINTS.SETTINGS))
  },
  async updateSettings(data: any) {
    return unwrap(await api.put(API_ENDPOINTS.SETTINGS, data))
  },

  // ── Users ──
  async listUsers() {
    return unwrap(await api.get(API_ENDPOINTS.USERS))
  },
  async createUser(data: any) {
    return unwrap(await api.post(API_ENDPOINTS.USERS, data))
  },

  // ── Roles ──
  async listRoles() {
    return unwrap(await api.get(API_ENDPOINTS.ROLES))
  },
  async createRole(data: any) {
    return unwrap(await api.post(API_ENDPOINTS.ROLES, data))
  },
  async deleteRole(id: string) {
    return unwrap(await api.delete(`${API_ENDPOINTS.ROLES}/${id}`))
  },
  async assignRole(roleId: string, userId: string) {
    return unwrap(await api.post(`${API_ENDPOINTS.ROLES}/${roleId}/assign`, { userId }))
  },

  // ── Permissions ──
  async listPermissions() {
    return unwrap(await api.get(API_ENDPOINTS.PERMISSIONS))
  },

  // ── Integrations ──
  async listIntegrations() {
    return unwrap(await api.get(API_ENDPOINTS.INTEGRATIONS))
  },
  async upsertIntegration(key: string, data: any) {
    return unwrap(await api.put(`${API_ENDPOINTS.INTEGRATIONS}/${key}`, data))
  },
  async deleteIntegration(key: string) {
    return unwrap(await api.delete(`${API_ENDPOINTS.INTEGRATIONS}/${key}`))
  },
}
