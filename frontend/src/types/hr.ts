export interface Employee      { id: string; tenantId: string; employeeCode: string; firstName: string; lastName: string; email: string; designation: string; departmentId: string; status: string; baseSalary: number; }
export interface LeaveRequest  { id: string; employeeId: string; leaveTypeId: string; startDate: string; endDate: string; totalDays: number; status: string; reason: string; }
export interface Attendance     { id: string; employeeId: string; date: string; checkIn: string; checkOut: string; status: string; workHours: number; }
export interface Payslip        { id: string; employeeId: string; payrollRunId: string; basicSalary: number; netPay: number; month: number; year: number; }
