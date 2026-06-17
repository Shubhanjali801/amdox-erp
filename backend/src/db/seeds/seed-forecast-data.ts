/**
 * Standalone seed: creates ONE inventory item + 18 months of OUT stock
 * movements so the ML forecast flow (POST /supply/forecasts) can be tested.
 *
 * Run:  npx ts-node src/db/seeds/seed-forecast-data.ts
 */
import prisma from '../../config/database';

async function main() {
  // Use the first tenant in the DB (your registered company)
  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!tenant) {
    console.error('❌ No tenant found. Register a company first.');
    process.exit(1);
  }
  console.log(`Using tenant: ${tenant.name} (${tenant.id})`);

  // Create (or reuse) an inventory item
  const sku = 'FORECAST-DEMO-001';
  let item = await prisma.inventoryItem.findFirst({
    where: { tenantId: tenant.id, sku },
  });
  if (!item) {
    item = await prisma.inventoryItem.create({
      data: {
        tenantId:       tenant.id,
        sku,
        name:           'Forecast Demo Widget',
        category:       'Electronics',
        unitCost:       500,
        sellingPrice:   900,
        quantityOnHand: 1000,
        reorderPoint:   200,
        reorderQty:     500,
      },
    });
    console.log(`✅ Created inventory item: ${item.sku}`);
  } else {
    console.log(`ℹ️  Inventory item already exists: ${item.sku}`);
    // clear old movements so we don't double up
    await prisma.stockMovement.deleteMany({ where: { inventoryItemId: item.id } });
  }

  // Generate 18 months of OUT movements (rising trend + seasonality + noise)
  const now = new Date();
  const movements = [];
  for (let i = 18; i >= 1; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 15); // mid-month
    const base = 100 + (18 - i) * 5;                  // upward trend
    const season = 30 * Math.sin((2 * Math.PI * date.getMonth()) / 12); // seasonality
    const noise = Math.round((Math.random() - 0.5) * 20);
    const qty = Math.max(10, Math.round(base + season + noise));

    movements.push({
      inventoryItemId: item.id,
      type:            'OUT' as const,
      quantity:        qty,
      reference:       `SALE-${date.toISOString().slice(0, 7)}`,
      createdAt:       date,
    });
  }

  await prisma.stockMovement.createMany({ data: movements });
  console.log(`✅ Created ${movements.length} months of OUT stock movements`);

  console.log('\n──────────────────────────────────────────────');
  console.log('🎯 Test the forecast in Postman with this body:');
  console.log('POST http://localhost:5000/api/v1/supply/forecasts');
  console.log(JSON.stringify({ inventoryItemId: item.id, modelType: 'lstm', horizon: 6 }, null, 2));
  console.log('──────────────────────────────────────────────\n');

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
