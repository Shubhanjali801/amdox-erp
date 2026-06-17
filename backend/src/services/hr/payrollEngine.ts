/**
 * Payroll Engine — M4 / F-04
 * Runs payroll for a period: for every active employee, computes
 * gross → net (allowances, PF, TDS) and generates a payslip.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

const round2 = (n: number) => Math.round(n * 100) / 100;

// ── Simple Indian-style salary breakdown ─────────────────
function computeSalary(baseSalary: number) {
  const basic = round2(baseSalary * 0.50);          // 50% basic
  const hra   = round2(baseSalary * 0.30);          // 30% HRA
  const special = round2(baseSalary - basic - hra); // remainder
  const allowances = { hra, special };
  const totalAllowances = round2(hra + special);
  const gross = round2(basic + totalAllowances);

  // Deductions
  const pf  = round2(basic * 0.12);                 // 12% of basic (PF)
  const tds = round2(gross > 50000 ? gross * 0.10 : 0); // 10% TDS above 50k
  const deductions = { pf, tds };
  const totalDeductions = round2(pf + tds);

  const net = round2(gross - totalDeductions);
  return { basic, allowances, totalAllowances, gross, deductions, totalDeductions, net };
}

export const payrollEngine = {

  // ── List payroll runs ────────────────────────────────────
  async list(tenantId: string) {
    return prisma.payrollRun.findMany({
      where: { tenantId }, orderBy: { period: 'desc' },
      include: { _count: { select: { payslips: true } } },
    });
  },

  // ── Get one run (with payslips) ──────────────────────────
  async getById(tenantId: string, id: string) {
    const run = await prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: { payslips: { include: { employee: { select: { employeeCode: true } } } } },
    });
    if (!run) throw new Error('RUN_NOT_FOUND');
    return run;
  },

  // ── Run payroll for a period (e.g. "2026-06") ────────────
  async run(tenantId: string, period: string, currency = 'INR') {
    // One run per period
    const existing = await prisma.payrollRun.findFirst({ where: { tenantId, period } });
    if (existing) throw new Error('PERIOD_ALREADY_RUN');

    // All active employees
    const employees = await prisma.employee.findMany({
      where: { tenantId, status: 'ACTIVE', deletedAt: null },
    });
    if (employees.length === 0) throw new Error('NO_ACTIVE_EMPLOYEES');

    let totalGross = 0, totalDeductions = 0, totalNet = 0;

    const run = await prisma.$transaction(async (tx) => {
      const payrollRun = await tx.payrollRun.create({
        data: { tenantId, period, status: 'PROCESSING', currency, totalEmployees: employees.length },
      });

      for (const emp of employees) {
        const calc = computeSalary(Number(emp.baseSalary));
        totalGross      += calc.gross;
        totalDeductions += calc.totalDeductions;
        totalNet        += calc.net;

        await tx.payslip.create({
          data: {
            payrollRunId:    payrollRun.id,
            employeeId:      emp.id,
            basicSalary:     calc.basic,
            allowances:      calc.allowances,
            totalAllowances: calc.totalAllowances,
            grossSalary:     calc.gross,
            deductions:      calc.deductions,
            totalDeductions: calc.totalDeductions,
            netSalary:       calc.net,
            currency,
          },
        });
      }

      return tx.payrollRun.update({
        where: { id: payrollRun.id },
        data: {
          status:          'COMPLETED',
          totalGross:      round2(totalGross),
          totalDeductions: round2(totalDeductions),
          totalNet:        round2(totalNet),
          processedAt:     new Date(),
        },
        include: { payslips: { include: { employee: { select: { employeeCode: true } } } } },
      });
    });

    logger.info(`Payroll run ${period}: ${employees.length} employees, net ${round2(totalNet)}`);
    return run;
  },

  // ── Get a single payslip ─────────────────────────────────
  async getPayslip(tenantId: string, payslipId: string) {
    const slip = await prisma.payslip.findFirst({
      where: { id: payslipId, payrollRun: { tenantId } },
      include: { employee: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    if (!slip) throw new Error('PAYSLIP_NOT_FOUND');
    return slip;
  },

  // ── Delete a run (and its payslips) ──────────────────────
  async remove(tenantId: string, id: string) {
    const run = await prisma.payrollRun.findFirst({ where: { id, tenantId } });
    if (!run) throw new Error('RUN_NOT_FOUND');
    await prisma.$transaction([
      prisma.payslip.deleteMany({ where: { payrollRunId: id } }),
      prisma.payrollRun.delete({ where: { id } }),
    ]);
    logger.info(`Payroll run deleted: ${run.period}`);
  },
};
