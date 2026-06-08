// ─── Seed: HR & Payroll ───────────────────────────────────────
// Owner: M4
import { PrismaClient } from '@prisma/client'

export async function seedHR(
  prisma: PrismaClient,
  tenantId: string,
  users: any[]
) {
  console.log('👥 Seeding HR data...')

  // ── Departments ────────────────────────────────────────────
  const deptData = [
    { name: 'Engineering',      code: 'ENG' },
    { name: 'Finance',          code: 'FIN' },
    { name: 'Human Resources',  code: 'HR' },
    { name: 'Supply Chain',     code: 'SCM' },
    { name: 'Sales & Marketing',code: 'MKT' },
    { name: 'Executive',        code: 'EXEC' },
  ]
  const departments: Record<string, any> = {}
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { tenantId_name: { tenantId, name: d.name } },
      update: {},
      create: { tenantId, name: d.name, code: d.code },
    })
    departments[d.code] = dept
  }

  // ── Leave Types ────────────────────────────────────────────
  const leaveTypes = [
    { name: 'Annual Leave',    daysAllowedPerYear: 21, carryForward: true,  maxCarryForward: 10, isPaid: true  },
    { name: 'Sick Leave',      daysAllowedPerYear: 12, carryForward: false, maxCarryForward: 0,  isPaid: true  },
    { name: 'Casual Leave',    daysAllowedPerYear: 6,  carryForward: false, maxCarryForward: 0,  isPaid: true  },
    { name: 'Maternity Leave', daysAllowedPerYear: 180,carryForward: false, maxCarryForward: 0,  isPaid: true  },
    { name: 'Paternity Leave', daysAllowedPerYear: 15, carryForward: false, maxCarryForward: 0,  isPaid: true  },
    { name: 'Unpaid Leave',    daysAllowedPerYear: 30, carryForward: false, maxCarryForward: 0,  isPaid: false },
  ]
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { tenantId_name: { tenantId, name: lt.name } },
      update: {},
      create: { tenantId, ...lt },
    })
  }

  // ── Employees ──────────────────────────────────────────────
  const empData = [
    { email: 'admin@amdox.com',   code: 'EMP-001', dept: 'EXEC', designation: 'CEO',               salary: 500000 },
    { email: 'finance@amdox.com', code: 'EMP-002', dept: 'FIN',  designation: 'Finance Manager',   salary: 150000 },
    { email: 'hr@amdox.com',      code: 'EMP-003', dept: 'HR',   designation: 'HR Manager',        salary: 120000 },
    { email: 'supply@amdox.com',  code: 'EMP-004', dept: 'SCM',  designation: 'Supply Chain Lead', salary: 130000 },
    { email: 'pm@amdox.com',      code: 'EMP-005', dept: 'ENG',  designation: 'Project Manager',   salary: 140000 },
    { email: 'viewer@amdox.com',  code: 'EMP-006', dept: 'MKT',  designation: 'Marketing Analyst', salary: 80000  },
  ]

  const employees: any[] = []
  for (const e of empData) {
    const user = users.find(u => u.email === e.email)
    if (!user) continue
    const emp = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        tenantId,
        userId: user.id,
        employeeCode: e.code,
        departmentId: departments[e.dept]?.id,
        designation: e.designation,
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        joinDate: new Date('2024-01-01'),
        baseSalary: e.salary,
        currency: 'INR',
        payFrequency: 'MONTHLY',
        address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
      },
    })
    employees.push(emp)
  }

  console.log(`   ✅ ${Object.keys(departments).length} departments + ${leaveTypes.length} leave types + ${employees.length} employees created`)
  return { departments, employees }
}
