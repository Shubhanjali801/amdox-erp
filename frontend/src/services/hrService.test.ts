import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import api from './api';
import { hrService } from './hrService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

type ApiMock = {
  get: Mock;
  post: Mock;
  put: Mock;
  delete: Mock;
};

const apiMock = api as unknown as ApiMock;

describe('hrService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps employee APIs to the HR employees endpoint', () => {
    const filters = { page: 2, limit: 20, search: 'asha', status: 'ACTIVE' };

    hrService.employees.list(filters);
    hrService.employees.getById('emp-1');
    hrService.employees.update('emp-1', { designation: 'HR Manager' });
    hrService.employees.departments();

    expect(apiMock.get).toHaveBeenNthCalledWith(1, '/hr/employees', { params: filters });
    expect(apiMock.get).toHaveBeenNthCalledWith(2, '/hr/employees/emp-1');
    expect(apiMock.put).toHaveBeenCalledWith('/hr/employees/emp-1', { designation: 'HR Manager' });
    expect(apiMock.get).toHaveBeenNthCalledWith(3, '/hr/employees/departments');
  });

  it('maps leave and attendance APIs to their module endpoints', () => {
    const leavePayload = { employeeId: 'emp-1', leaveTypeId: 'annual', startDate: '2026-07-10' };
    const attendancePayload = { employeeId: 'emp-1', date: '2026-07-08', status: 'PRESENT' };

    hrService.leave.types();
    hrService.leave.create(leavePayload);
    hrService.attendance.create(attendancePayload);
    hrService.attendance.remove('att-1');

    expect(apiMock.get).toHaveBeenCalledWith('/hr/leave/types');
    expect(apiMock.post).toHaveBeenNthCalledWith(1, '/hr/leave', leavePayload);
    expect(apiMock.post).toHaveBeenNthCalledWith(2, '/hr/attendance', attendancePayload);
    expect(apiMock.delete).toHaveBeenCalledWith('/hr/attendance/att-1');
  });

  it('maps payroll and organisation APIs to the expected F-04 routes', () => {
    hrService.payroll.run({ period: '2026-07', currency: 'INR' });
    hrService.payroll.getById('run-1');
    hrService.payroll.cancel('run-1');
    hrService.organisation.chart();
    hrService.organisation.createDepartment({ name: 'People Ops', code: 'PO' });
    hrService.organisation.updateDepartment('dept-1', { name: 'People Operations' });
    hrService.organisation.removeDepartment('dept-1');

    expect(apiMock.post).toHaveBeenNthCalledWith(1, '/hr/payroll/run', { period: '2026-07', currency: 'INR' });
    expect(apiMock.get).toHaveBeenNthCalledWith(1, '/hr/payroll/run-1');
    expect(apiMock.put).toHaveBeenCalledWith('/hr/payroll/run-1', {});
    expect(apiMock.get).toHaveBeenNthCalledWith(2, '/hr/organisation/chart');
    expect(apiMock.post).toHaveBeenNthCalledWith(2, '/hr/organisation', { name: 'People Ops', code: 'PO' });
    expect(apiMock.put).toHaveBeenCalledWith('/hr/organisation/dept-1', { name: 'People Operations' });
    expect(apiMock.delete).toHaveBeenCalledWith('/hr/organisation/dept-1');
  });
});
