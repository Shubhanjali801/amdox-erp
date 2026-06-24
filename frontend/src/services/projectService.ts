import api from './api'
import { API_ENDPOINTS } from '../config/apiConfig'

const unwrap = (r: any) => r.data?.data ?? r.data
const P = API_ENDPOINTS.PROJECTS

export const projectService = {
  // ── Projects ──
  list:    (params?: any) => api.get(P.LIST, { params }).then((r) => r.data),
  getById: (id: string)   => api.get(`${P.LIST}/${id}`).then(unwrap),
  create:  (data: any)    => api.post(P.LIST, data).then(unwrap),
  update:  (id: string, data: any) => api.put(`${P.LIST}/${id}`, data).then(unwrap),
  remove:  (id: string)   => api.delete(`${P.LIST}/${id}`).then(unwrap),

  // ── Milestones ──
  listMilestones: (id: string)   => api.get(`${P.LIST}/${id}/milestones`).then(unwrap),
  addMilestone:   (id: string, data: any) => api.post(`${P.LIST}/${id}/milestones`, data).then(unwrap),

  // ── Tasks ──
  listTasks:  (params?: any) => api.get(P.TASKS, { params }).then((r) => r.data),
  createTask: (data: any)    => api.post(P.TASKS, data).then(unwrap),
  updateTask: (id: string, data: any) => api.put(`${P.TASKS}/${id}`, data).then(unwrap),
  deleteTask: (id: string)   => api.delete(`${P.TASKS}/${id}`).then(unwrap),

  // ── Resources ──
  listResources:  (params?: any) => api.get(P.RESOURCES, { params }).then((r) => r.data),
  allocate:       (data: any)    => api.post(P.RESOURCES, data).then(unwrap),
  removeResource: (id: string)   => api.delete(`${P.RESOURCES}/${id}`).then(unwrap),

  // ── Budget ──
  budgetSummary: () => api.get(P.BUDGET).then((r) => r.data),
  budgetDetail:  (id: string) => api.get(`${P.BUDGET}/${id}`).then(unwrap),
  updateBudget:  (id: string, data: any) => api.put(`${P.BUDGET}/${id}`, data).then(unwrap),
}
