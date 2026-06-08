// ─── Seed: Supply Chain & Inventory ──────────────────────────
// Owner: M5
import { PrismaClient } from '@prisma/client'

export async function seedSupplyChain(prisma: PrismaClient, tenantId: string) {
  console.log('📦 Seeding supply chain data...')

  // ── Vendors ────────────────────────────────────────────────
  const vendorData = [
    { name: 'Tech Components Ltd',   code: 'VEND-001', email: 'orders@techcomp.com',   paymentTerms: 30, rating: 4.5 },
    { name: 'Global Office Supplies', code: 'VEND-002', email: 'sales@globoffice.com',  paymentTerms: 15, rating: 4.2 },
    { name: 'CloudSoft Solutions',   code: 'VEND-003', email: 'billing@cloudsoft.io',  paymentTerms: 30, rating: 4.8 },
    { name: 'FastShip Logistics',    code: 'VEND-004', email: 'ops@fastship.com',       paymentTerms: 7,  rating: 3.9 },
    { name: 'Raw Materials Co.',     code: 'VEND-005', email: 'supply@rawmat.com',      paymentTerms: 45, rating: 4.1 },
  ]
  const vendors: Record<string, any> = {}
  for (const v of vendorData) {
    const vendor = await prisma.vendor.upsert({
      where: { tenantId_code: { tenantId, code: v.code } },
      update: {},
      create: {
        tenantId,
        name: v.name,
        code: v.code,
        email: v.email,
        paymentTerms: v.paymentTerms,
        currency: 'INR',
        rating: v.rating,
        status: 'ACTIVE',
        address: { city: 'Mumbai', country: 'India' },
      },
    })
    vendors[v.code] = vendor
  }

  // ── Inventory Items ────────────────────────────────────────
  const inventoryData = [
    { sku: 'SKU-001', name: 'Laptop 15"',         category: 'Electronics',  unitCost: 75000,  qty: 45,  reorder: 10, vendorCode: 'VEND-001' },
    { sku: 'SKU-002', name: 'Office Chair',        category: 'Furniture',    unitCost: 8500,   qty: 120, reorder: 20, vendorCode: 'VEND-002' },
    { sku: 'SKU-003', name: 'Wireless Mouse',      category: 'Electronics',  unitCost: 1200,   qty: 200, reorder: 50, vendorCode: 'VEND-001' },
    { sku: 'SKU-004', name: 'A4 Paper Ream',       category: 'Stationery',   unitCost: 350,    qty: 500, reorder: 100,vendorCode: 'VEND-002' },
    { sku: 'SKU-005', name: 'Server RAM 32GB',     category: 'Electronics',  unitCost: 12000,  qty: 30,  reorder: 8,  vendorCode: 'VEND-001' },
    { sku: 'SKU-006', name: 'Monitor 27"',         category: 'Electronics',  unitCost: 22000,  qty: 60,  reorder: 15, vendorCode: 'VEND-001' },
    { sku: 'SKU-007', name: 'Desk Organiser',      category: 'Stationery',   unitCost: 450,    qty: 80,  reorder: 25, vendorCode: 'VEND-002' },
    { sku: 'SKU-008', name: 'Network Switch 24P',  category: 'Networking',   unitCost: 18000,  qty: 15,  reorder: 5,  vendorCode: 'VEND-003' },
  ]
  for (const item of inventoryData) {
    await prisma.inventoryItem.upsert({
      where: { tenantId_sku: { tenantId, sku: item.sku } },
      update: {},
      create: {
        tenantId,
        sku: item.sku,
        name: item.name,
        category: item.category,
        unitOfMeasure: 'PCS',
        costingMethod: 'FIFO',
        unitCost: item.unitCost,
        quantityOnHand: item.qty,
        reorderPoint: item.reorder,
        reorderQty: item.reorder * 2,
        warehouseLocation: `RACK-${item.sku.split('-')[1]}`,
        preferredVendorId: vendors[item.vendorCode]?.id,
      },
    })
  }

  console.log(`   ✅ ${vendorData.length} vendors + ${inventoryData.length} inventory items created`)
  return { vendors }
}
