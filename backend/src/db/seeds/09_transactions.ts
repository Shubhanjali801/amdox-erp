// ─── Seed: Transactional data ─────────────────────────────────
// The other seeders create MASTER data (accounts, vendors, inventory,
// employees, projects). This one fills the transactional screens that would
// otherwise be empty: AP/AR invoices, payments, purchase orders, attendance,
// leave requests and a payroll run.
//
// Idempotent — clears its own records for the tenant before re-inserting.
import { PrismaClient } from '@prisma/client'

const d = (daysAgo: number) => {
  const x = new Date()
  x.setDate(x.getDate() - daysAgo)
  x.setUTCHours(0, 0, 0, 0)
  return x
}
const money = (n: number) => Math.round(n * 100) / 100

export async function seedTransactions(prisma: PrismaClient, tenantId: string) {
  console.log('🧾 Seeding transactions (invoices, POs, attendance, leave, payroll)...')

  const vendors   = await prisma.vendor.findMany({ where: { tenantId, deletedAt: null }, orderBy: { name: 'asc' } })
  const items     = await prisma.inventoryItem.findMany({ where: { tenantId }, orderBy: { sku: 'asc' } })
  const employees = await prisma.employee.findMany({ where: { tenantId, deletedAt: null }, orderBy: { employeeCode: 'asc' } })
  const leaveTypes = await prisma.leaveType.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })

  if (!vendors.length || !employees.length) {
    console.log('   ⚠️  Master data missing — run the earlier seeders first. Skipping.')
    return
  }

  // ── Clean prior transactional data for this tenant (idempotent re-run) ──
  const oldInvoices = await prisma.invoice.findMany({ where: { tenantId }, select: { id: true } })
  const oldInvIds = oldInvoices.map((i) => i.id)
  if (oldInvIds.length) {
    await prisma.payment.deleteMany({ where: { invoiceId: { in: oldInvIds } } })
    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: { in: oldInvIds } } })
    await prisma.invoice.deleteMany({ where: { tenantId } })
  }
  const empIds = employees.map((e) => e.id)
  await prisma.attendance.deleteMany({ where: { employeeId: { in: empIds } } })
  await prisma.leaveRequest.deleteMany({ where: { employeeId: { in: empIds } } })
  const oldRuns = await prisma.payrollRun.findMany({ where: { tenantId }, select: { id: true } })
  if (oldRuns.length) {
    await prisma.payslip.deleteMany({ where: { payrollRunId: { in: oldRuns.map((r) => r.id) } } })
    await prisma.payrollRun.deleteMany({ where: { tenantId } })
  }

  // ── 1. Accounts Payable (vendor invoices) ────────────────────
  const apSpecs = [
    { n: 'INV-AP-2026-001', v: 0, desc: 'Dell Latitude laptops (10 units)', qty: 10, price: 68000, status: 'PAID'           as const, days: 45 },
    { n: 'INV-AP-2026-002', v: 1, desc: 'Ergonomic office chairs',          qty: 25, price: 12500, status: 'APPROVED'       as const, days: 30 },
    { n: 'INV-AP-2026-003', v: 2, desc: 'Annual cloud hosting renewal',     qty:  1, price: 450000, status: 'PARTIALLY_PAID' as const, days: 21 },
    { n: 'INV-AP-2026-004', v: 3, desc: 'Office stationery — Q2 bulk',      qty: 80, price: 450,   status: 'PENDING'        as const, days: 12 },
    { n: 'INV-AP-2026-005', v: 4, desc: 'Network switches & cabling',       qty:  6, price: 32000, status: 'APPROVED'       as const, days: 8 },
    { n: 'INV-AP-2026-006', v: 0, desc: '27" monitors (12 units)',          qty: 12, price: 24000, status: 'DRAFT'          as const, days: 3 },
  ]

  for (const s of apSpecs) {
    const vendor = vendors[s.v % vendors.length]
    const amount = money(s.qty * s.price)
    const tax    = money(amount * 0.18)          // 18% GST
    const total  = money(amount + tax)
    await prisma.invoice.create({
      data: {
        tenantId, type: 'AP', invoiceNumber: s.n, vendorId: vendor.id,
        amount, taxAmount: tax, totalAmount: total, currency: 'INR',
        issueDate: d(s.days), dueDate: d(s.days - 30), status: s.status,
        paidAt: s.status === 'PAID' ? d(s.days - 20) : null,
        notes: `Supplier: ${vendor.name}`,
        lineItems: {
          create: [{ description: s.desc, quantity: s.qty, unitPrice: s.price, totalPrice: amount, taxRate: 18 }],
        },
      },
    })
  }

  // ── 2. Accounts Receivable (customer invoices) ───────────────
  const arSpecs = [
    { n: 'INV-AR-2026-001', c: 'Zenith Retail Pvt Ltd',   desc: 'ERP implementation — Phase 1', qty: 1,  price: 850000, status: 'PAID'            as const, days: 60 },
    { n: 'INV-AR-2026-002', c: 'Northwind Logistics',     desc: 'Annual support contract',      qty: 1,  price: 225000, status: 'PAID'            as const, days: 40 },
    { n: 'INV-AR-2026-003', c: 'Vertex Manufacturing',    desc: 'Custom module development',    qty: 120, price: 3500,  status: 'PARTIALLY_PAID'  as const, days: 25 },
    { n: 'INV-AR-2026-004', c: 'Harbour Foods Ltd',       desc: 'Onboarding & training',        qty: 40,  price: 2800,  status: 'APPROVED'        as const, days: 15 },
    { n: 'INV-AR-2026-005', c: 'Solaris Energy',          desc: 'Consulting retainer — Q2',     qty: 1,   price: 320000, status: 'OVERDUE'        as const, days: 75 },
    { n: 'INV-AR-2026-006', c: 'Blue Orbit Media',        desc: 'Licence renewal (25 seats)',   qty: 25,  price: 9600,  status: 'PENDING'         as const, days: 5 },
  ]

  for (const s of arSpecs) {
    const amount = money(s.qty * s.price)
    const tax    = money(amount * 0.18)
    const total  = money(amount + tax)
    await prisma.invoice.create({
      data: {
        tenantId, type: 'AR', invoiceNumber: s.n, customerId: s.c,
        amount, taxAmount: tax, totalAmount: total, currency: 'INR',
        issueDate: d(s.days), dueDate: d(s.days - 30), status: s.status,
        paidAt: s.status === 'PAID' ? d(s.days - 25) : null,
        notes: `Customer: ${s.c}`,
        lineItems: {
          create: [{ description: s.desc, quantity: s.qty, unitPrice: s.price, totalPrice: amount, taxRate: 18 }],
        },
      },
    })
  }

  // ── 3. Payments against the settled invoices ─────────────────
  const settled = await prisma.invoice.findMany({
    where: { tenantId, status: { in: ['PAID', 'PARTIALLY_PAID'] } },
  })
  for (const inv of settled) {
    const full = inv.status === 'PAID'
    const amt  = full ? Number(inv.totalAmount) : money(Number(inv.totalAmount) * 0.4)
    await prisma.payment.create({
      data: {
        tenantId, invoiceId: inv.id, amount: amt, currency: inv.currency,
        method: inv.type === 'AP' ? 'BANK_TRANSFER' : 'CHEQUE',
        reference: `PAY-${inv.invoiceNumber}`,
        paymentDate: d(5), status: 'COMPLETED',
      },
    })
  }

  // ── 4. Purchase orders across the lifecycle ──────────────────
  if (items.length) {
    const poSpecs = [
      { n: 'PO-2026-001', v: 0, status: 'RECEIVED'  as const, days: 40, lines: [0, 1] },
      { n: 'PO-2026-002', v: 1, status: 'SENT'      as const, days: 20, lines: [2, 3] },
      { n: 'PO-2026-003', v: 2, status: 'SENT'      as const, days: 10, lines: [4] },
      { n: 'PO-2026-004', v: 3, status: 'DRAFT'     as const, days: 4,  lines: [5, 6] },
      { n: 'PO-2026-005', v: 0, status: 'CANCELLED' as const, days: 55, lines: [7] },
    ]
    for (const s of poSpecs) {
      const vendor = vendors[s.v % vendors.length]
      const lines = s.lines.map((li) => {
        const it = items[li % items.length]
        const qty = 5 + (li * 3)
        const price = Number(it.unitCost) || 1000
        return { inventoryItemId: it.id, description: it.name, quantity: qty, unitPrice: price, totalPrice: money(qty * price), receivedQty: s.status === 'RECEIVED' ? qty : 0 }
      })
      const sub = money(lines.reduce((a, l) => a + l.totalPrice, 0))
      const tax = money(sub * 0.18)
      const existing = await prisma.purchaseOrder.findFirst({ where: { tenantId, poNumber: s.n } })
      if (existing) {
        await prisma.pOLineItem.deleteMany({ where: { purchaseOrderId: existing.id } })
        await prisma.purchaseOrder.delete({ where: { id: existing.id } })
      }
      await prisma.purchaseOrder.create({
        data: {
          tenantId, poNumber: s.n, vendorId: vendor.id, status: s.status,
          subtotal: sub, taxAmount: tax, totalAmount: money(sub + tax), currency: 'INR',
          expectedDelivery: d(s.days - 14),
          deliveredAt: s.status === 'RECEIVED' ? d(s.days - 12) : null,
          lineItems: { create: lines },
        },
      })
    }
  }

  // ── 5. Attendance — last 10 working days for every employee ──
  const attendance: any[] = []
  for (const emp of employees) {
    for (let i = 1; i <= 10; i++) {
      const day = d(i)
      if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue   // skip weekends
      const roll = (i + emp.employeeCode.length) % 10
      const status = roll === 0 ? 'ABSENT' : roll === 1 ? 'WORK_FROM_HOME' : roll === 2 ? 'HALF_DAY' : 'PRESENT'
      const clockIn  = new Date(day); clockIn.setUTCHours(9, roll, 0, 0)
      const clockOut = new Date(day); clockOut.setUTCHours(status === 'HALF_DAY' ? 13 : 18, roll, 0, 0)
      attendance.push({
        employeeId: emp.id, date: day, status,
        clockIn:  status === 'ABSENT' ? null : clockIn,
        clockOut: status === 'ABSENT' ? null : clockOut,
        totalHours: status === 'ABSENT' ? null : status === 'HALF_DAY' ? 4 : 9,
      })
    }
  }
  if (attendance.length) await prisma.attendance.createMany({ data: attendance })

  // ── 6. Leave requests in each state ──────────────────────────
  if (leaveTypes.length) {
    const leaveSpecs = [
      { e: 0, t: 0, from: 12, days: 3, status: 'APPROVED' as const, reason: 'Family function' },
      { e: 1, t: 1, from: 6,  days: 2, status: 'PENDING'  as const, reason: 'Medical appointment' },
      { e: 2, t: 0, from: 30, days: 5, status: 'APPROVED' as const, reason: 'Annual vacation' },
      { e: 3, t: 1, from: 3,  days: 1, status: 'PENDING'  as const, reason: 'Personal work' },
      { e: 4, t: 0, from: 20, days: 2, status: 'REJECTED' as const, reason: 'Short notice travel' },
    ]
    for (const s of leaveSpecs) {
      const emp = employees[s.e % employees.length]
      const lt  = leaveTypes[s.t % leaveTypes.length]
      await prisma.leaveRequest.create({
        data: {
          employeeId: emp.id, leaveTypeId: lt.id,
          startDate: d(s.from), endDate: d(s.from - s.days + 1),
          totalDays: s.days, reason: s.reason, status: s.status,
          approvedAt: s.status === 'APPROVED' ? d(s.from + 2) : null,
          rejectedReason: s.status === 'REJECTED' ? 'Insufficient notice period' : null,
        },
      })
    }
  }

  // ── 7. A completed payroll run with payslips ─────────────────
  const period = `${new Date().getFullYear()}-${String(new Date().getMonth()).padStart(2, '0')}`
  const payslips = employees.map((e) => {
    const basic = Number(e.baseSalary) || 50000
    const allow = money(basic * 0.25)
    const gross = money(basic + allow)
    const ded   = money(gross * 0.12)
    return {
      employeeId: e.id,
      basicSalary: basic,
      allowances: { hra: money(basic * 0.15), transport: money(basic * 0.05), special: money(basic * 0.05) },
      totalAllowances: allow,
      grossSalary: gross,
      deductions: { pf: money(gross * 0.08), tax: money(gross * 0.04) },
      totalDeductions: ded,
      netSalary: money(gross - ded),
      currency: 'INR',
    }
  })
  await prisma.payrollRun.create({
    data: {
      tenantId, period, status: 'COMPLETED', currency: 'INR',
      totalEmployees: payslips.length,
      totalGross:      money(payslips.reduce((a, p) => a + p.grossSalary, 0)),
      totalDeductions: money(payslips.reduce((a, p) => a + p.totalDeductions, 0)),
      totalNet:        money(payslips.reduce((a, p) => a + p.netSalary, 0)),
      processedAt: d(2),
      payslips: { create: payslips },
    },
  })

  console.log(`   ✅ ${apSpecs.length} AP + ${arSpecs.length} AR invoices, ${settled.length} payments, 5 POs, ${attendance.length} attendance, 5 leave requests, 1 payroll run`)
}
