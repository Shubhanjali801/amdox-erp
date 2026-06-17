# Amdox ERP — Git Branch Timeline

> Render at https://mermaid.live or any Mermaid-enabled viewer (GitHub renders it automatically).

```mermaid
gitGraph
    commit id: "init: project setup"
    commit id: "db: 43-table schema"
    branch feature/m2-auth
    checkout feature/m2-auth
    commit id: "auth: login + JWT"
    commit id: "users + tenants CRUD"
    checkout main
    merge feature/m2-auth tag: "Auth done"

    branch feature/m3-finance
    checkout feature/m3-finance
    commit id: "finance: chart of accounts"
    checkout main
    merge feature/m3-finance tag: "Ledger done"

    branch feature/m5-supply-chain-ml
    checkout feature/m5-supply-chain-ml
    commit id: "ml: PyTorch LSTM + Prophet"
    checkout main
    merge feature/m5-supply-chain-ml tag: "ML service done"

    branch feature/m4-hr
    checkout feature/m4-hr
    commit id: "hr: employees + payroll"
    checkout main
    merge feature/m4-hr tag: "HR done"

    branch feature/m6-frontend
    checkout feature/m6-frontend
    commit id: "frontend: dashboard"
    checkout main
    merge feature/m6-frontend tag: "v1.0 complete"
```

## How to read it
- **main** (bottom line) = the complete application — every feature merges here
- Each **branch** = one member building one module
- Each **merge** = that module's finished work joining `main`
- **tags** = milestones (e.g. "Ledger done")

## Your current situation
- `feature/m3-finance` → **Ledger** already merged into `main`
- `feature/m5-supply-chain-ml` → **ML Service** ready to merge into `main` next
