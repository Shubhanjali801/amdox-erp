# Amdox ERP — User Manual

**AI-Powered Cloud ERP Suite (AMX-ERP-2026)**

A practical, end-user guide to signing in and working in Amdox ERP. No technical
background needed — if you can use a web dashboard, you can use this.

- **Live app:** https://13.127.204.51.nip.io
- **Best experience:** latest Chrome, Edge, Firefox, or Safari. Works on tablet and mobile too.

> **Reviewer quick start:** sign in at the URL above with
> **`admin@amdox.com` / `Admin@1234`** (full-access admin) and jump to
> [The modules](#5-the-modules).

---

## Contents

1. [What Amdox ERP is](#1-what-amdox-erp-is)
2. [Signing in](#2-signing-in)
3. [Your access (roles)](#3-your-access-roles)
4. [Getting around the workspace](#4-getting-around-the-workspace)
5. [The modules](#5-the-modules)
6. [AI demand forecasting](#6-ai-demand-forecasting)
7. [Notifications](#7-notifications)
8. [Administration & settings](#8-administration--settings)
9. [Troubleshooting & FAQ](#9-troubleshooting--faq)

---

## 1. What Amdox ERP is

Amdox ERP brings a company's core operations into one place:

| Area | What you manage |
|------|-----------------|
| **Finance** | Ledger, money you owe (payables), money owed to you (receivables), reports |
| **HR & Payroll** | Employees, attendance, leave, payroll runs |
| **Supply Chain** | Vendors, inventory, purchase orders, **AI demand forecasting** |
| **Projects** | Projects, tasks, resource planning, budgets |
| **Dashboard** | A live overview of all of the above |

Each company (called a **tenant**) has its own private data — you only ever see
your own organisation's information.

---

## 2. Signing in

### Create a company account (first-time owner)

1. Open the app and choose **Register**.
2. Enter your **company name**, your name, email, and a password.
3. You're signed in as the company owner with full access, and your company
   workspace is created automatically.

### Sign in (existing user)

1. Go to the app and enter your **email** and **password**.
2. Select **Sign In**.

### Two-factor authentication (2FA / MFA)

For extra security you can protect your account with a 6-digit code from an
authenticator app (Google Authenticator, Authy, 1Password, etc.).

- **Turn it on:** go to **Settings → Security**, choose to enable 2FA, and scan
  the QR code with your authenticator app. Enter the current 6-digit code to
  confirm.
- **From then on:** after your password, you'll be asked for the current
  6-digit code. Enter it to finish signing in.

### Single Sign-On (SSO)

If your organisation has enabled SSO, the login page shows a **Sign in with SSO**
button. Select it, sign in with your company identity provider, and you're
returned to Amdox ERP already signed in — no separate Amdox password needed.
(Your Amdox roles and permissions still apply exactly as normal.)

### Forgot your password?

1. On the login page choose **Forgot password?**
2. Enter your email — you'll receive a reset link.
3. Open the link, set a new password, and sign in.

---

## 3. Your access (roles)

What you can see and do depends on your **role**. The app only shows you the
areas you're allowed to use — if a module isn't in your sidebar, your role
doesn't include it (and the server enforces this too, so it's genuinely secure,
not just hidden).

| Role | Typical access |
|------|----------------|
| **Super admin / Tenant admin** | Everything, plus Settings (users, roles, security) |
| **Finance manager** | Finance module only |
| **HR manager** | HR & Payroll module only |
| **Supply chain manager** | Supply Chain module only |
| **Project manager** | Projects module only |
| **Manager** | Broad operational access across modules |
| **Viewer** | Read-only access |

After you sign in, Amdox takes you to the first area you have access to
(Dashboard when available). If your role has no modules yet, you'll see a
**No access** page — ask your administrator to assign you a role.

---

## 4. Getting around the workspace

- **Sidebar (left):** your modules — Dashboard, Finance, HR & Payroll, Supply
  Chain, Projects. Only the ones you're allowed to use appear.
- **Top bar:** notifications, your profile, and sign-out.
- **Notifications (🔔):** in-app alerts (e.g. a payroll run finished, stock is
  low). See [Notifications](#7-notifications).
- **Appearance:** Amdox uses a clean dark theme by default; you can adjust it in
  **Settings → Appearance**.
- **Signing out:** open your profile menu and choose **Sign out**. (If you signed
  in with SSO, this also signs you out of the SSO session.)

---

## 5. The modules

### 📊 Dashboard

Your landing overview. At a glance: finance totals, HR headcount, supply-chain
health, and project status — pulled live from every module you can access.

### 💰 Finance

| Screen | What you do |
|--------|-------------|
| **Ledger** | View journal entries and account balances — the financial system of record |
| **Payables (AP)** | Bills your company owes to vendors; record and track payments out |
| **Receivables (AR)** | Invoices your customers owe you; track what's paid vs outstanding |
| **Reports** | Financial summaries and exports |

Multi-currency is supported, so amounts show in their original currency.

### 👥 HR & Payroll

| Screen | What you do |
|--------|-------------|
| **Employees** | The staff directory — details, designation, department, status |
| **Attendance** | Daily attendance records |
| **Leave** | Leave requests and approvals |
| **Payroll** | Run payroll for a period; review and approve pay |

### 📦 Supply Chain

| Screen | What you do |
|--------|-------------|
| **Vendors** | Your supplier list and details |
| **Inventory** | Stock items, quantity on hand, and reorder points |
| **Purchase Orders** | Raise and track POs to vendors |
| **Forecasting** | **AI demand forecast** with reorder advice — see below |

### 📋 Projects

| Screen | What you do |
|--------|-------------|
| **Projects** | List of projects with status and budget |
| **Project detail** | Tasks, timeline, and progress for one project |
| **Resource planning** | Who's assigned where, and capacity |

---

## 6. AI demand forecasting

**Supply Chain → Forecasting** predicts future demand for an inventory item and
tells you **when and how much to reorder**.

How to use it:

1. Pick an inventory item.
2. Amdox analyses its sales/movement history and produces a demand forecast for
   the coming periods, with a confidence range.
3. You get a **reorder recommendation**: a reorder point and suggested quantity
   that accounts for demand variability and supplier lead time.

**How to read it honestly:** the forecast automatically picks the model that
actually performs best for that item's history (it won't over-promise with a
fancy model that doesn't fit). It shows the measured accuracy of the chosen
model, so you know how much to trust it. Real-world retail demand is naturally
"lumpy," so treat the forecast as informed guidance for reordering — not a
guarantee.

---

## 7. Notifications

Amdox keeps you informed inside the app via the **bell (🔔)** in the top bar —
for example when a payroll run completes, an invoice is due, or stock drops below
its reorder point.

Administrators can also connect **webhooks** (Settings → Integrations) so these
same events are sent to external systems like Slack or another app in real time.

---

## 8. Administration & settings

Available to administrators (Settings appears in the sidebar for them).

| Screen | What you do |
|--------|-------------|
| **General** | Company/tenant details |
| **Users** | Invite and manage people in your company |
| **Roles** | Define roles and which modules/actions each can use (RBAC) |
| **Security** | Enable 2FA, review sign-in security |
| **Integrations** | Webhooks and external connections |
| **Appearance** | Theme and display preferences |

**Assigning access:** in **Roles**, give a user a role (e.g. *Finance manager*).
They'll immediately see only that module the next time they sign in.

---

## 9. Troubleshooting & FAQ

**I don't see a module I expect.**
Your role doesn't include it. Ask an administrator to assign the right role in
**Settings → Roles**.

**I get "No access" after signing in.**
Your account has no module permissions yet — an administrator needs to assign
you a role.

**"Too many requests" message.**
A safety limit to prevent abuse. Wait a minute and try again.

**My 6-digit code isn't accepted.**
Make sure your phone's clock is accurate (authenticator codes are time-based),
and enter the *current* code — each one is valid for ~30 seconds.

**I forgot my password.**
Use **Forgot password?** on the login page.

**A page shows no data.**
You may not have any records in that area yet, or your role is read-only. If it
persists, contact your administrator.

---

### Reviewer credentials

| Login | Role | Sees |
|-------|------|------|
| `admin@amdox.com` / `Admin@1234` | Super admin | Everything + Settings |

Department-scoped demo logins (finance/HR/supply/projects managers) are available
on request to show role-based access in action.

*Amdox ERP — multi-tenant, role-secured, and AI-assisted.*
