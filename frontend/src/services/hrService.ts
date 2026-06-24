import api from './api'
import { API_ENDPOINTS } from '../config/apiConfig'

const unwrap = (r: any) => r.data?.data ?? r.data
const H = API_ENDPOINTS.HR

export const hrService = {
  // ── Employees ──
  listEmployees:  (params?: any) => api.get(H.EMPLOYEES, { params }).then((r) => r.data),
  createEmployee: (data: any)    => api.post(H.EMPLOYEES, data).then(unwrap),
  updateEmployee: (id: string, data: any) => api.put(`${H.EMPLOYEES}/${id}`, data).then(unwrap),
  deleteEmployee: (id: string)   => api.delete(`${H.EMPLOYEES}/${id}`).then(unwrap),

  // ── Leave ──
  listLeave:    (params?: any) => api.get(H.LEAVE, { params }).then((r) => r.data),
  createLeave:  (data: any)    => api.post(H.LEAVE, data).then(unwrap),
  approveLeave: (id: string)   => api.post(`${H.LEAVE}/${id}/approve`).then(unwrap),
  rejectLeave:  (id: string)   => api.post(`${H.LEAVE}/${id}/reject`).then(unwrap),
  listLeaveTypes:  () => api.get(`${H.LEAVE}/types`).then((r) => r.data),
  createLeaveType: (data: any) => api.post(`${H.LEAVE}/types`, data).then(unwrap),

  // ── Attendance ──
  listAttendance:   (params?: any) => api.get(H.ATTENDANCE, { params }).then((r) => r.data),
  createAttendance: (data: any)    => api.post(H.ATTENDANCE, data).then(unwrap),

  // ── Payroll ──
  listPayroll: (params?: any) => api.get(H.PAYROLL, { params }).then((r) => r.data),
  runPayroll:  (data: any)    => api.post(H.PAYROLL, data).then(unwrap),
  getPayrollRun: (id: string) => api.get(`${H.PAYROLL}/${id}`).then(unwrap),

  // ── Departments / Org ──
  listDepartments:  () => api.get(H.ORGANISATION).then((r) => r.data),
  createDepartment: (data: any) => api.post(H.ORGANISATION, data).then(unwrap),
}
