# seedData — demo data reference

Two ways to get data into Amdox ERP.

## 1. Automatic (recommended) — the seeder

Fills **every** screen in one command. Run inside the backend pod:

```bash
POD=$(sudo k3s kubectl -n amdox get pod -l app=backend --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')
sudo k3s kubectl -n amdox exec -it "$POD" -- node dist/db/seeds/index.js
```

Locally: `cd backend && npm run seed`

**What gets created:**

| Seeder | Data |
|---|---|
| `01_tenants` | 2 tenants (`amdox-demo`, `acme-corp`) |
| `02_roles_permissions` | 33 permissions, 8 roles |
| `03_users` | 6 users (see credentials below) |
| `04_finance` | 21 GL accounts, 1 period, 5 FX rates |
| `05_hr` | 6 departments, 6 leave types, 6 employees |
| `06_supply_chain` | 5 vendors, 8 inventory items |
| `07_projects` | 3 projects + milestones + tasks |
| `08_dashboard` | 1 dashboard, 6 widgets, 1 scheduled report |
| **`09_transactions`** | **6 AP + 6 AR invoices, payments, 5 POs, ~80 attendance rows, 5 leave requests, 1 payroll run** |

Then add 18 months of sales history so **AI Forecasting** works:
```bash
sudo k3s kubectl -n amdox exec -it "$POD" -- node dist/db/seed-forecast-all.js
```
→ creates `FORECAST-DEMO-001` ("Forecast Demo Widget"). **Forecast that item**, not the SKU-00x ones (they have no history).

> The seeders are **idempotent** — safe to re-run. `09_transactions` clears its own records first, so re-seeding resets to clean demo values.

## 2. Manual — copy-paste values

Use [`manual-entry.md`](./manual-entry.md) when you want to *demonstrate* creating records live (e.g. on camera). Every value matches the form fields exactly.

---

## Login credentials

| Login | Password | Access |
|---|---|---|
| `admin@amdox.com` | `Admin@1234` | Everything |
| `finance@amdox.com` | `Finance@1234` | Finance only |
| `hr@amdox.com` | `HR@1234` | HR & Payroll only |
| `supply@amdox.com` | `Supply@1234` | Supply Chain only |
| `pm@amdox.com` | `PM@1234` | Projects only |
| `viewer@amdox.com` | `Viewer@1234` | Read-only, all modules |

⚠️ **Always demo as `admin@amdox.com`** — it owns the tenant that has all the seeded data. Accounts you register yourself create **new empty companies** (that's multi-tenancy working correctly, but it looks like the app is empty).
