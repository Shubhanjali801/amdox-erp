# Contributing Guide — Amdox ERP Team

## Team Branch Ownership

| Member | GitHub Username | Branch Prefix | Owns |
|--------|----------------|---------------|------|
| M1 | @member-1 | `infra/m1-*` | Docker, CI/CD, DevOps |
| M2 | @member-2 | `feature/m2-*` | Auth, Core, RBAC |
| M3 | @member-3 | `feature/m3-*` | Finance (GL, AP, AR) |
| M4 | @member-4 | `feature/m4-*` | HR, Payroll, Projects |
| M5 | @member-5 | `feature/m5-*` | Supply Chain, AI/ML, Notifications |
| M6 | @member-6 | `feature/m6-*` | Dashboard, BI, QA, Tests |

> Replace @member-X with your real GitHub username in CODEOWNERS.

---

## Git Workflow (Everyone Must Follow)

### Step 1 — Always start from main
```bash
git checkout main
git pull origin main
```

### Step 2 — Create your feature branch
```bash
# Use YOUR member prefix
git checkout -b feature/m3-finance-ledger
git checkout -b feature/m4-hr-employee-crud
git checkout -b feature/m5-supply-chain-po
git checkout -b fix/m3-currency-exchange-bug
```

### Step 3 — Work in YOUR folders only
```
M2 → backend/src/controllers/authController.ts   ✅
M2 → backend/src/services/finance/               ❌ (M3 owns this)
```

### Step 4 — Commit with conventional commits
```bash
# Format: type(scope): message
git commit -m "feat(finance): add GL journal entry double-entry validation"
git commit -m "fix(hr): resolve payroll batch job retry logic"
git commit -m "test(supply-chain): add PO creation integration test"
git commit -m "docs(auth): update JWT refresh token flow"
```

#### Commit Types
| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `test` | Adding tests |
| `docs` | Documentation |
| `refactor` | Code cleanup |
| `chore` | Config, tooling |
| `style` | Formatting only |

### Step 5 — Push and open PR
```bash
git push origin feature/m3-finance-ledger
# Then open PR on GitHub: feature/m3-finance-ledger → dev
```

---

## PR Rules

### Who Reviews What
| PR touches | Required Reviewer |
|-----------|------------------|
| `backend/src/routes/index.ts` | @member-2 |
| `frontend/src/App.tsx` | @member-6 |
| `docker-compose.yml` | @member-1 |
| Any finance file | @member-3 |
| Any HR file | @member-4 |
| Any supply chain file | @member-5 |

### PR Checklist (fill this before opening PR)
```
## What does this PR do?
Brief description

## Module
[ ] Finance (M3)
[ ] HR/Payroll (M4)
[ ] Supply Chain/AI (M5)
[ ] Dashboard/QA (M6)
[ ] Auth/Core (M2)
[ ] DevOps (M1)

## Checklist
[ ] I only changed files in MY folder ownership
[ ] I added/updated tests
[ ] No console.log left in code
[ ] TypeScript compiles without errors (npm run type-check)
[ ] Lint passes (npm run lint)
[ ] Tested locally with Docker running
```

### PR Size Rule
- **Max 400 lines changed** per PR
- Break large features into smaller PRs
- One feature = one PR

---

## Branch Protection Rules (Set on GitHub)

### `main` branch
- ✅ Require PR review (2 approvals)
- ✅ Require status checks (CI must pass)
- ✅ No direct push allowed (even M1)
- ✅ Only merge via squash

### `dev` branch
- ✅ Require PR review (1 approval)
- ✅ Require CI to pass
- ✅ No direct push allowed
- ✅ CODEOWNERS must approve

---

## What NOT to do ❌

```bash
# NEVER push directly to main or dev
git push origin main        ❌
git push origin dev         ❌

# NEVER edit another member's files
# M3 editing hr/payrollService.ts  ❌

# NEVER commit .env files
git add .env                ❌

# NEVER use force push on shared branches
git push --force origin dev ❌

# NEVER commit directly without a branch
git commit -m "quick fix"   (on main) ❌
```

---

## Shared Files — Editing Rules

These files are shared and need coordination:

| File | Owner | Rule |
|------|-------|------|
| `backend/src/routes/index.ts` | M2 | Comment your route in, M2 uncomments |
| `frontend/src/App.tsx` | M6 | Your routes are already stubbed — just implement the page |
| `frontend/src/store/store.ts` | M2 | Add your slice import via PR |
| `docker-compose.yml` | M1 | Request M1 to add new services |
| `.env.example` | M1 | Add your new vars, notify team |

---

## Daily Sync Rule

Every day before starting work:
```bash
git checkout main
git pull origin main
git checkout your-branch
git rebase main              # keep your branch up to date
```

---

## Merge Schedule

| Day | Activity |
|-----|---------|
| Day 10 | M2 merges auth → dev. Everyone rebases. |
| Day 25 | All Week 2 modules merge → dev. Integration test. |
| Day 40 | AI/ML + BI + Notifications merge → dev. |
| Day 50 | Code freeze. Only bug fixes. |
| Day 56 |  main. Deploy to staging. |
| Day 60 | Final tag + production deploy. |
