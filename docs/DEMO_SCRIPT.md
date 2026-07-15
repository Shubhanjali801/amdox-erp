# Amdox ERP — Demo Video Script (6 minutes)

A scenario-based walkthrough. Aim for **6:00**, hard cap **7:00**.
Record at **1920×1080**, browser zoom **100%**, hide bookmarks bar.

---

## ✅ Pre-recording checklist (do this 10 min before)

- [ ] **EC2 instance is Running** and pods are `1/1`:
      `sudo k3s kubectl -n amdox get pods`
- [ ] Open the live URL and confirm the **padlock** shows (HTTPS valid)
- [ ] **Re-seed** so data is clean and stock isn't inflated:
      `sudo k3s kubectl -n amdox exec -it $POD -- node dist/db/seeds/index.js`
- [ ] Confirm `FORECAST-DEMO-001` exists (AI Forecasting dropdown)
- [ ] **Log out** and clear localStorage — start from the landing page
- [ ] Have **one PO in `SENT` status** ready to receive (for the notification moment)
- [ ] Close extra tabs; silence notifications; **use an incognito window**
- [ ] Have a second terminal open on the server (for the k8s reveal at the end)

---

## 0:00 – 0:30 — Hook: it's actually live

**Show:** the landing page at the live HTTPS URL. Point at the padlock.

> "This is Amdox ERP — an AI-powered, multi-tenant cloud ERP. It's live right now at this HTTPS URL, running on AWS with Kubernetes. Let me show you what it does, and then how it's built."

Scroll the landing page once (Features → Modules). Don't linger.

---

## 0:30 – 1:15 — Login + Executive Dashboard

**Do:** Sign in as `admin@amdox.com` / `Admin@1234`

> "I'm logging in as a super admin. Authentication is JWT — a 15-minute access token with a rotating 7-day refresh token."

**Show:** the dashboard KPIs.

> "This dashboard isn't mock data — every KPI is computed live from the database: receivables, payables, invoice counts, headcount, inventory, low-stock alerts, and active projects. The charts are real aggregations."

---

## 1:15 – 2:15 — Finance (a real business workflow)

**Go:** Finance → **Payables**

> "Finance implements a proper double-entry general ledger, plus payables and receivables with a real approval lifecycle."

**Do:** Click **approve** on a DRAFT invoice → then **pay** → record the payment.

> "Watch what happens: I approve the invoice, then record a payment. The system automatically transitions the invoice to PAID, and — " *(point at the bell)* — "it notifies the team."

**Show:** the 🔔 bell badge → open it → the "Payment recorded" notification.

> "That notification fired from a real business event, not a demo button."

---

## 2:15 – 3:15 — Supply Chain + the stock loop

**Go:** Supply Chain → **Purchase Orders**

> "Supply chain runs the full purchase-order lifecycle: DRAFT → SENT → RECEIVED."

**Do:** Click **receive** on a SENT PO.

> "When I receive goods, three things happen in one transaction: a goods-receipt record is created, inventory stock is incremented automatically, and the PO status updates."

**Go:** → **Inventory** — point at the item whose stock just changed.

> "Stock went up automatically — no manual entry. Low-stock items are flagged against their reorder point."

---

## 3:15 – 4:15 — ⭐ The AI feature

**Go:** Supply Chain → **AI Forecasting**

> "This is the AI layer — a separate Python microservice running FastAPI."

**Do:** Select **`FORECAST-DEMO-001`**, model **LSTM**, horizon **6** → **Generate Forecast**

> "It's forecasting demand using an LSTM neural network built in PyTorch, trained on 18 months of sales history. Our LSTM achieves **12.84% MAPE** on a holdout test."

**Do:** Switch model to **Prophet** → Generate again.

> "We also implemented Facebook's Prophet, which captures trend and seasonality. We validate with a proper holdout back-test rather than in-sample fitting — so the accuracy number is honest."

---

## 4:15 – 5:15 — ⭐⭐ RBAC (the strongest technical moment)

> "Now the part I'm most proud of — role-based access control."

**Do:** **Log out** → log in as `finance@amdox.com` / `Finance@1234`

**Show:** the sidebar — **only Finance**.

> "This is a Finance Manager. Notice the sidebar — only Finance. No HR, no Supply Chain, no Settings."

**Do:** Manually type `/hr/employees` in the URL bar → it **redirects away**.

> "And it's not just hidden menus — if I try to navigate directly to HR, the route guard bounces me. The API would return 403 too. It's enforced at both layers."

**Do:** Log out → log in as `hr@amdox.com` / `HR@1234` → show **only HR & Payroll**.

> "Same platform, different role, completely different surface. Permissions are resolved from the user's roles at login and signed into the JWT. And every database query is filtered by tenant ID — so one company can never see another's data."

---

## 5:15 – 5:45 — The infrastructure reveal

**Switch to:** the terminal on the server.

```bash
sudo k3s kubectl -n amdox get pods
```

> "Under the hood this is a real Kubernetes deployment — k3s on an AWS EC2 instance. Frontend and backend each run two replicas, plus PostgreSQL, Redis, and the ML service. Traefik handles ingress, cert-manager issues the Let's Encrypt certificate automatically, and there's a horizontal pod autoscaler and a Postgres backup CronJob."

*(Optional, if time:)* `sudo k3s kubectl -n amdox get certificate`

---

## 5:45 – 6:00 — Close with the numbers

> "To summarise: 43 database tables, around 120 REST endpoints, six business modules, JWT auth with MFA, role-based access control, multi-tenant isolation, an LSTM forecasting service, and a tamper-evident audit log — deployed on AWS with Kubernetes and HTTPS. Thanks for watching."

---

## 🎙️ Delivery tips

- **Don't narrate clicks** ("now I click here") — say *why* it matters
- **Pause 1–2s** after each result so the viewer can read the screen
- If something errors, **keep going** — edit it out later
- Record in **one take per section**, stitch afterwards (much easier than one long take)
- Speak slightly slower than feels natural

## ⏱️ If you're over time, cut in this order
1. The landing-page scroll
2. The Prophet second forecast
3. Projects module (not in the script — leave it out)
4. `get certificate`

## 🚫 Don't show
- The registration flow (creates an empty tenant — makes the app look empty)
- Any account other than the seeded demo logins
- The Settings pages (unless asked — they're less visual)
