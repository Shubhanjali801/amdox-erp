import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors';

interface RunPayrollPayload {
  period: string;
  currency?: string;
}

const payrollInclude = {
  payslips: {
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          designation: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.PayrollRunInclude;

export const validatePayrollPeriod = (period: string) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new ValidationError('period must be in YYYY-MM format');
  }
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const calculatePayslip = (baseSalaryValue: Prisma.Decimal | number | string) => {
  const basicSalary = Number(baseSalaryValue);
  const allowances = {
    hra: roundMoney(basicSalary * 0.4),
    transport: 1600,
    medical: 1250,
  };
  const totalAllowances = roundMoney(Object.values(allowances).reduce((sum, value) => sum + value, 0));
  const grossSalary = roundMoney(basicSalary + totalAllowances);
  const deductions = {
    providentFund: roundMoney(basicSalary * 0.12),
    professionalTax: grossSalary > 15000 ? 200 : 0,
    incomeTax: roundMoney(Math.max(grossSalary - 50000, 0) * 0.1),
  };
  const totalDeductions = roundMoney(Object.values(deductions).reduce((sum, value) => sum + value, 0));
  const netSalary = roundMoney(grossSalary - totalDeductions);

  return {
    basicSalary,
    allowances,
    totalAllowances,
    grossSalary,
    deductions,
    totalDeductions,
    netSalary,
  };
};

export const payrollEngineService = {
  list: (tenantId: string) =>
    prisma.payrollRun.findMany({
      where: { tenantId },
      include: { payslips: true },
      orderBy: { createdAt: 'desc' },
    }),

  get: async (tenantId: string, id: string) => {
    const run = await prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: payrollInclude,
    });
    if (!run) throw new NotFoundError('Payroll run');
    return run;
  },

  runPayroll: async (tenantId: string, payload: RunPayrollPayload) => {
    validatePayrollPeriod(payload.period);

    const existing = await prisma.payrollRun.findUnique({
      where: { tenantId_period: { tenantId, period: payload.period } },
    });
    if (existing) throw new ConflictError('Payroll already exists for this period');

    const employees = await prisma.employee.findMany({
      where: { tenantId, deletedAt: null, status: { in: ['ACTIVE', 'ON_LEAVE'] } },
      include: { user: true, department: true },
      orderBy: { employeeCode: 'asc' },
    });
    if (employees.length === 0) throw new ValidationError('No active employees found for payroll');

    const slips = employees.map(employee => {
      const calculation = calculatePayslip(employee.baseSalary);
      return {
        employeeId: employee.id,
        basicSalary: calculation.basicSalary,
        allowances: calculation.allowances,
        totalAllowances: calculation.totalAllowances,
        grossSalary: calculation.grossSalary,
        deductions: calculation.deductions,
        totalDeductions: calculation.totalDeductions,
        netSalary: calculation.netSalary,
        currency: payload.currency || employee.currency || 'INR',
      };
    });

    const totals = slips.reduce(
      (sum, slip) => ({
        totalGross: sum.totalGross + slip.grossSalary,
        totalDeductions: sum.totalDeductions + slip.totalDeductions,
        totalNet: sum.totalNet + slip.netSalary,
      }),
      { totalGross: 0, totalDeductions: 0, totalNet: 0 }
    );

    return prisma.payrollRun.create({
      data: {
        tenantId,
        period: payload.period,
        status: 'COMPLETED',
        totalEmployees: employees.length,
        totalGross: roundMoney(totals.totalGross),
        totalDeductions: roundMoney(totals.totalDeductions),
        totalNet: roundMoney(totals.totalNet),
        currency: payload.currency || 'INR',
        processedAt: new Date(),
        payslips: { create: slips },
      },
      include: payrollInclude,
    });
  },

  cancel: async (tenantId: string, id: string) => {
    await payrollEngineService.get(tenantId, id);
    return prisma.payrollRun.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: payrollInclude,
    });
  },

  remove: async (tenantId: string, id: string) => {
    await payrollEngineService.get(tenantId, id);
    await prisma.payslip.deleteMany({ where: { payrollRunId: id } });
    await prisma.payrollRun.delete({ where: { id } });
  },
};
