# Manual entry data

Copy-paste values for creating records live in the UI. Every field matches the form.

---

## Finance → Payables (AP) → **+ New Invoice**

| Invoice number | Vendor | Issue date | Due date | Line description | Qty | Unit price |
|---|---|---|---|---|---|---|
| `INV-AP-2026-101` | *any* | 01-07-2026 | 31-07-2026 | `Dell Latitude 5540 laptops` | `10` | `68000` |
| `INV-AP-2026-102` | *any* | 05-07-2026 | 04-08-2026 | `Ergonomic office chairs` | `25` | `12500` |
| `INV-AP-2026-103` | *any* | 10-07-2026 | 09-08-2026 | `Annual cloud hosting renewal` | `1` | `450000` |
| `INV-AP-2026-104` | *any* | 12-07-2026 | 11-08-2026 | `Network switches & cabling` | `6` | `32000` |

## Finance → Receivables (AR) → **+ New Invoice**

| Invoice number | Customer name | Issue date | Due date | Line description | Qty | Unit price |
|---|---|---|---|---|---|---|
| `INV-AR-2026-101` | `Zenith Retail Pvt Ltd` | 01-07-2026 | 31-07-2026 | `ERP implementation — Phase 1` | `1` | `850000` |
| `INV-AR-2026-102` | `Northwind Logistics` | 03-07-2026 | 02-08-2026 | `Annual support contract` | `1` | `225000` |
| `INV-AR-2026-103` | `Vertex Manufacturing` | 08-07-2026 | 07-08-2026 | `Custom module development` | `120` | `3500` |
| `INV-AR-2026-104` | `Solaris Energy` | 11-07-2026 | 10-08-2026 | `Consulting retainer — Q2` | `1` | `320000` |

> **Workflow to demo:** create → **approve** → **pay** → status flips to `PAID` and the 🔔 fires.

---

## Supply Chain → Vendors → **+ Add Vendor**

| Code | Name | Email | Phone |
|---|---|---|---|
| `VEN-101` | `Apex Office Supplies` | `sales@apexoffice.in` | `+91 98200 11223` |
| `VEN-102` | `Nimbus Cloud Services` | `billing@nimbus.io` | `+91 80452 33445` |
| `VEN-103` | `Ironclad Hardware Ltd` | `orders@ironclad.co.in` | `+91 44332 55667` |

## Supply Chain → Inventory → **+ Add Item**

| SKU | Name | Category | Unit cost | Reorder point |
|---|---|---|---|---|
| `SKU-101` | `Mechanical Keyboard` | `Electronics` | `4500` | `20` |
| `SKU-102` | `USB-C Docking Station` | `Electronics` | `11800` | `10` |
| `SKU-103` | `Standing Desk` | `Furniture` | `28000` | `5` |
| `SKU-104` | `Whiteboard 6x4` | `Office Supplies` | `3200` | `8` |

## Supply Chain → Purchase Orders → **+ New PO**

| PO number | Vendor | Tax % | Item | Qty | Unit price |
|---|---|---|---|---|---|
| `PO-2026-101` | *any* | `18` | pick any SKU | `15` | auto-fills |
| `PO-2026-102` | *any* | `18` | pick any SKU | `8` | auto-fills |

> **Workflow to demo:** create → **send** → **receive** → stock increases automatically + 🔔 fires.

---

## HR → Employees → **+ Add Employee**

| Code | Designation | Employment type | Base salary | Join date |
|---|---|---|---|---|
| `EMP-101` | `Backend Engineer` | FULL_TIME | `95000` | 15-01-2026 |
| `EMP-102` | `Financial Analyst` | FULL_TIME | `78000` | 01-02-2026 |
| `EMP-103` | `UX Designer` | CONTRACT | `65000` | 10-03-2026 |

## HR → Leave → **Request Leave**

| Employee | Leave type | From | To | Reason |
|---|---|---|---|---|
| *any* | *any* | 20-07-2026 | 22-07-2026 | `Family function` |
| *any* | *any* | 25-07-2026 | 25-07-2026 | `Medical appointment` |

> Then **approve** or **reject** it as admin — the 🔔 fires on request.

---

## Projects → **+ New Project**

| Code | Name | Status | Budget | Start | End |
|---|---|---|---|---|---|
| `PRJ-101` | `Warehouse Automation` | ACTIVE | `1500000` | 01-06-2026 | 30-11-2026 |
| `PRJ-102` | `Mobile App Rollout` | PLANNING | `850000` | 15-07-2026 | 31-12-2026 |

---

## Supply Chain → AI Forecasting

| Field | Value |
|---|---|
| Inventory item | **`FORECAST-DEMO-001 — Forecast Demo Widget`** |
| Model | `LSTM` (then try `Prophet`) |
| Horizon | `6` |

⚠️ Only `FORECAST-DEMO-001` has the 18 months of history the models need. The `SKU-00x` items will correctly return *"Need at least 6 months of sales history."*
