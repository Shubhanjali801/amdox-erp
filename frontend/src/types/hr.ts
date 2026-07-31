export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type PayFrequency = 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY';

export interface Department {
  id: string;
  name: string;
  code?: string | null;
  managerId?: string | null;
  parentId?: string | null;
}

export interface EmployeeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
}

export interface Employee {
  id: string;
  tenantId: string;
  userId: string;
  employeeCode: string;
  designation: string;
  departmentId?: string | null;
  managerId?: string | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  joinDate: string;
  baseSalary: number | string;
  currency: string;
  payFrequency: PayFrequency;
  user: EmployeeUser;
  department?: Department | null;
  manager?: {
    id: string;
    employeeCode: string;
    user: Pick<EmployeeUser, 'firstName' | 'lastName' | 'email'>;
  } | null;
}

export interface EmployeeFormData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  designation: string;
  managerId?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  joinDate: string;
  baseSalary: number;
  currency: string;
  payFrequency: PayFrequency;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason?: string;
  rejectedReason?: string | null;
  employee?: Employee;
  leaveType?: LeaveType;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
  status: string;
  totalHours?: number | string | null;
  overtimeHours?: number | string | null;
  notes?: string | null;
  employee?: Employee;
}

export interface Payslip {
  id: string;
  employeeId: string;
  payrollRunId: string;
  basicSalary: number;
  grossSalary?: number | string;
  totalDeductions?: number | string;
  netSalary: number;
  currency: string;
  employee?: Employee;
}

export interface LeaveType {
  id: string;
  tenantId: string;
  name: string;
  daysAllowedPerYear: number;
  carryForward: boolean;
  maxCarryForward?: number | null;
  isPaid: boolean;
}

export interface PayrollRun {
  id: string;
  tenantId: string;
  period: string;
  status: string;
  totalEmployees: number;
  totalGross: number | string;
  totalDeductions: number | string;
  totalNet: number | string;
  currency: string;
  processedAt?: string | null;
  payslips?: Payslip[];
}
