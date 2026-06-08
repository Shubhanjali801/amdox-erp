// ─── Seed: Finance (Chart of Accounts + Currency Rates) ──────
// Owner: M3
import { PrismaClient } from '@prisma/client'

export async function seedFinance(prisma: PrismaClient, tenantId: string) {
  console.log('💰 Seeding finance data...')

  // ── Chart of Accounts ──────────────────────────────────────
  const accounts = [
    // ASSETS
    { code: '1001', name: 'Cash & Bank',           type: 'ASSET',     subType: 'Cash' },
    { code: '1002', name: 'Accounts Receivable',   type: 'ASSET',     subType: 'Receivable' },
    { code: '1003', name: 'Inventory',             type: 'ASSET',     subType: 'Inventory' },
    { code: '1004', name: 'Prepaid Expenses',      type: 'ASSET',     subType: 'Prepaid' },
    { code: '1005', name: 'Fixed Assets',          type: 'ASSET',     subType: 'Fixed' },
    // LIABILITIES
    { code: '2001', name: 'Accounts Payable',      type: 'LIABILITY', subType: 'Payable' },
    { code: '2002', name: 'Salaries Payable',      type: 'LIABILITY', subType: 'Payroll' },
    { code: '2003', name: 'Tax Payable',           type: 'LIABILITY', subType: 'Tax' },
    { code: '2004', name: 'Short-Term Loans',      type: 'LIABILITY', subType: 'Loan' },
    // EQUITY
    { code: '3001', name: 'Share Capital',         type: 'EQUITY',    subType: 'Capital' },
    { code: '3002', name: 'Retained Earnings',     type: 'EQUITY',    subType: 'Retained' },
    // REVENUE
    { code: '4001', name: 'Sales Revenue',         type: 'REVENUE',   subType: 'Sales' },
    { code: '4002', name: 'Service Revenue',       type: 'REVENUE',   subType: 'Service' },
    { code: '4003', name: 'Other Income',          type: 'REVENUE',   subType: 'Other' },
    // EXPENSES
    { code: '5001', name: 'Cost of Goods Sold',    type: 'EXPENSE',   subType: 'COGS' },
    { code: '5002', name: 'Salaries & Wages',      type: 'EXPENSE',   subType: 'Payroll' },
    { code: '5003', name: 'Rent & Utilities',      type: 'EXPENSE',   subType: 'Overhead' },
    { code: '5004', name: 'Marketing & Advertising',type:'EXPENSE',   subType: 'Marketing' },
    { code: '5005', name: 'Office Supplies',       type: 'EXPENSE',   subType: 'Admin' },
    { code: '5006', name: 'Depreciation',          type: 'EXPENSE',   subType: 'Depreciation' },
    { code: '5007', name: 'Bank Charges',          type: 'EXPENSE',   subType: 'Finance' },
  ] as const

  for (const acc of accounts) {
    await prisma.chartOfAccount.upsert({
      where: { tenantId_code: { tenantId, code: acc.code } },
      update: {},
      create: { tenantId, ...acc, currency: 'INR' },
    })
  }

  // ── Accounting Period ──────────────────────────────────────
  await prisma.accountingPeriod.upsert({
    where: { id: 'seed-period-2026-04' },
    update: {},
    create: {
      id: 'seed-period-2026-04',
      tenantId,
      name: 'April 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      status: 'OPEN',
    },
  })

  // ── Currency Rates ─────────────────────────────────────────
  const today = new Date('2026-04-01')
  const rates = [
    { from: 'USD', to: 'INR', rate: 83.5 },
    { from: 'USD', to: 'EUR', rate: 0.92 },
    { from: 'USD', to: 'GBP', rate: 0.79 },
    { from: 'EUR', to: 'INR', rate: 90.7 },
    { from: 'GBP', to: 'INR', rate: 105.6 },
  ]
  for (const r of rates) {
    await prisma.currencyRate.upsert({
      where: { fromCurrency_toCurrency_date: { fromCurrency: r.from, toCurrency: r.to, date: today } },
      update: {},
      create: { fromCurrency: r.from, toCurrency: r.to, rate: r.rate, date: today, source: 'ECB' },
    })
  }

  console.log(`   ✅ ${accounts.length} accounts + 1 period + ${rates.length} FX rates created`)
}
