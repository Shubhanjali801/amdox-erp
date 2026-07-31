import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';
import { Attendance, Department, Employee, EmployeeFormData, LeaveRequest, LeaveType, PayrollRun } from '../types/hr';

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface EmployeeQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  departmentId?: string;
}

const HR = API_ENDPOINTS.HR;

export const hrService = {
  employees: {
    list: (params?: EmployeeQuery) =>
      api.get<PaginatedResponse<Employee>>(HR.EMPLOYEES, { params }),
    getById: (id: string) =>
      api.get<ApiResponse<Employee>>(`${HR.EMPLOYEES}/${id}`),
    create: (data: EmployeeFormData) =>
      api.post<ApiResponse<Employee>>(HR.EMPLOYEES, data),
    update: (id: string, data: Partial<EmployeeFormData>) =>
      api.put<ApiResponse<Employee>>(`${HR.EMPLOYEES}/${id}`, data),
    remove: (id: string) =>
      api.delete<ApiResponse<null>>(`${HR.EMPLOYEES}/${id}`),
    departments: () =>
      api.get<ApiResponse<Department[]>>(`${HR.EMPLOYEES}/departments`),
  },
  leave: {
    types: () => api.get<ApiResponse<LeaveType[]>>(`${HR.LEAVE}/types`),
    list: (params?: Record<string, unknown>) => api.get<ApiResponse<LeaveRequest[]>>(HR.LEAVE, { params }),
    create: (data: Record<string, unknown>) => api.post<ApiResponse<LeaveRequest>>(HR.LEAVE, data),
    update: (id: string, data: Record<string, unknown>) => api.put<ApiResponse<LeaveRequest>>(`${HR.LEAVE}/${id}`, data),
    remove: (id: string) => api.delete<ApiResponse<null>>(`${HR.LEAVE}/${id}`),
  },
  attendance: {
    list: (params?: Record<string, unknown>) => api.get<ApiResponse<Attendance[]>>(HR.ATTENDANCE, { params }),
    create: (data: Record<string, unknown>) => api.post<ApiResponse<Attendance>>(HR.ATTENDANCE, data),
    update: (id: string, data: Record<string, unknown>) => api.put<ApiResponse<Attendance>>(`${HR.ATTENDANCE}/${id}`, data),
    remove: (id: string) => api.delete<ApiResponse<null>>(`${HR.ATTENDANCE}/${id}`),
  },
  payroll: {
    list: (params?: Record<string, unknown>) => api.get<ApiResponse<PayrollRun[]>>(HR.PAYROLL, { params }),
    getById: (id: string) => api.get<ApiResponse<PayrollRun>>(`${HR.PAYROLL}/${id}`),
    run: (data: { period: string; currency?: string }) => api.post<ApiResponse<PayrollRun>>(`${HR.PAYROLL}/run`, data),
    cancel: (id: string) => api.put<ApiResponse<PayrollRun>>(`${HR.PAYROLL}/${id}`, {}),
    remove: (id: string) => api.delete<ApiResponse<null>>(`${HR.PAYROLL}/${id}`),
  },
  organisation: {
    chart: () => api.get<ApiResponse<Record<string, unknown>[]>>(`${HR.ORG_CHART}/chart`),
    departments: () => api.get<ApiResponse<Department[]>>(HR.ORG_CHART),
    createDepartment: (data: Record<string, unknown>) => api.post<ApiResponse<Department>>(HR.ORG_CHART, data),
    updateDepartment: (id: string, data: Record<string, unknown>) =>
      api.put<ApiResponse<Department>>(`${HR.ORG_CHART}/${id}`, data),
    removeDepartment: (id: string) => api.delete<ApiResponse<null>>(`${HR.ORG_CHART}/${id}`),
  },
};
