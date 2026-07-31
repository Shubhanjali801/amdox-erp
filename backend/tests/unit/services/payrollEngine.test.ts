import { Prisma } from '@prisma/client';
import { calculatePayslip, payrollEngineService, validatePayrollPeriod } from '../../../src/services/hr/payrollEngine';
import { ConflictError, ValidationError } from '../../../src/utils/errors';
import { prismaMock } from '../../__mocks__/database.mock';

describe('payrollEngineService', () => {
  it('validates payroll periods in YYYY-MM format', () => {
    expect(() => validatePayrollPeriod('2026-07')).not.toThrow();
    expect(() => validatePayrollPeriod('2026-7')).toThrow(ValidationError);
    expect(() => validatePayrollPeriod('2026-13')).toThrow(ValidationError);
  });

  it('calculates allowances, deductions, and net salary from base salary', () => {
    expect(calculatePayslip(new Prisma.Decimal(50000))).toEqual({
      basicSalary: 50000,
      allowances: { hra: 20000, transport: 1600, medical: 1250 },
      totalAllowances: 22850,
      grossSalary: 72850,
      deductions: { providentFund: 6000, professionalTax: 200, incomeTax: 2285 },
      totalDeductions: 8485,
      netSalary: 64365,
    });
  });

  it('rejects duplicate payroll runs for the same tenant and period', async () => {
    prismaMock.payrollRun.findUnique.mockResolvedValue({ id: 'existing-run' } as any);

    await expect(payrollEngineService.runPayroll('tenant-1', { period: '2026-07' })).rejects.toThrow(ConflictError);
    expect(prismaMock.employee.findMany).not.toHaveBeenCalled();
  });

  it('rejects payroll runs when no active employees exist', async () => {
    prismaMock.payrollRun.findUnique.mockResolvedValue(null);
    prismaMock.employee.findMany.mockResolvedValue([]);

    await expect(payrollEngineService.runPayroll('tenant-1', { period: '2026-07' })).rejects.toThrow(
      'No active employees found for payroll'
    );
  });

  it('creates a completed payroll run with payslips and rounded totals', async () => {
    prismaMock.payrollRun.findUnique.mockResolvedValue(null);
    prismaMock.employee.findMany.mockResolvedValue([
      {
        id: 'emp-1',
        employeeCode: 'AMD001',
        tenantId: 'tenant-1',
        baseSalary: new Prisma.Decimal(50000),
        currency: 'INR',
        user: { firstName: 'Asha', lastName: 'Singh', email: 'asha@example.com' },
        department: { id: 'dept-1', name: 'HR', code: 'HR' },
      },
      {
        id: 'emp-2',
        employeeCode: 'AMD002',
        tenantId: 'tenant-1',
        baseSalary: new Prisma.Decimal(30000),
        currency: 'INR',
        user: { firstName: 'Ravi', lastName: 'Kumar', email: 'ravi@example.com' },
        department: { id: 'dept-2', name: 'Finance', code: 'FIN' },
      },
    ] as any);
    prismaMock.payrollRun.create.mockResolvedValue({ id: 'run-1' } as any);

    await payrollEngineService.runPayroll('tenant-1', { period: '2026-07' });

    expect(prismaMock.payrollRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          period: '2026-07',
          status: 'COMPLETED',
          totalEmployees: 2,
          totalGross: 117700,
          totalDeductions: 12855,
          totalNet: 104845,
          currency: 'INR',
          payslips: {
            create: [
              expect.objectContaining({ employeeId: 'emp-1', grossSalary: 72850, netSalary: 64365 }),
              expect.objectContaining({ employeeId: 'emp-2', grossSalary: 44850, netSalary: 40480 }),
            ],
          },
        }),
      })
    );
  });

  it('cancels an existing payroll run for the tenant', async () => {
    prismaMock.payrollRun.findFirst.mockResolvedValue({ id: 'run-1', tenantId: 'tenant-1' } as any);
    prismaMock.payrollRun.update.mockResolvedValue({ id: 'run-1', status: 'CANCELLED' } as any);

    await payrollEngineService.cancel('tenant-1', 'run-1');

    expect(prismaMock.payrollRun.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'run-1', tenantId: 'tenant-1' } })
    );
    expect(prismaMock.payrollRun.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'run-1' }, data: { status: 'CANCELLED' } })
    );
  });

  it('deletes payslips before deleting a payroll run', async () => {
    prismaMock.payrollRun.findFirst.mockResolvedValue({ id: 'run-1', tenantId: 'tenant-1' } as any);
    prismaMock.payslip.deleteMany.mockResolvedValue({ count: 2 } as any);
    prismaMock.payrollRun.delete.mockResolvedValue({ id: 'run-1' } as any);

    await payrollEngineService.remove('tenant-1', 'run-1');

    expect(prismaMock.payslip.deleteMany).toHaveBeenCalledWith({ where: { payrollRunId: 'run-1' } });
    expect(prismaMock.payrollRun.delete).toHaveBeenCalledWith({ where: { id: 'run-1' } });
  });
});
