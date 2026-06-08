#!/bin/bash
# ============================================================
# Amdox ERP — Member Branch Setup Script
# Run this ONCE after cloning the repo
# Usage: bash scripts/setup-member-branch.sh <member-number>
# Example: bash scripts/setup-member-branch.sh 3
# ============================================================

MEMBER=$1

if [ -z "$MEMBER" ]; then
  echo "Usage: bash scripts/setup-member-branch.sh <member-number>"
  echo "Example: bash scripts/setup-member-branch.sh 3"
  exit 1
fi

echo "Setting up workspace for Member $MEMBER..."

# Fetch latest
git fetch origin
git checkout dev
git pull origin dev

case $MEMBER in
  1)
    BRANCH="infra/m1-devops-setup"
    echo "M1 — DevOps & Infrastructure"
    echo "Your folders: .github/, docker-compose*, backend/scripts/, backend/src/config/, docs/"
    ;;
  2)
    BRANCH="feature/m2-auth-core"
    echo "M2 — Auth & Backend Core"
    echo "Your folders: backend/src/controllers/auth*, backend/src/services/auth*, backend/src/models/User*, frontend/src/components/Auth/"
    ;;
  3)
    BRANCH="feature/m3-finance"
    echo "M3 — Finance Module"
    echo "Your folders: backend/src/controllers/finance/, backend/src/services/finance/, frontend/src/components/Finance/, frontend/src/pages/Finance/"
    ;;
  4)
    BRANCH="feature/m4-hr-payroll"
    echo "M4 — HR, Payroll & Projects"
    echo "Your folders: backend/src/controllers/hr/, backend/src/services/hr/, frontend/src/components/HR/, frontend/src/pages/HR/, frontend/src/pages/Projects/"
    ;;
  5)
    BRANCH="feature/m5-supply-chain-ml"
    echo "M5 — Supply Chain, AI/ML & Notifications"
    echo "Your folders: backend/src/controllers/supplyChain/, backend/src/services/supplyChain/, frontend/src/components/SupplyChain/"
    ;;
  6)
    BRANCH="feature/m6-frontend-dashboard"
    echo "M6 — Frontend, BI & QA"
    echo "Your folders: frontend/src/components/Dashboard/, frontend/src/components/Charts/, frontend/tests/"
    ;;
  *)
    echo "Invalid member number. Use 1-6."
    exit 1
    ;;
esac

# Create and switch to the branch
git checkout -b "$BRANCH"
echo ""
echo "Branch '$BRANCH' created and checked out!"
echo ""
echo "Next steps:"
echo "  1. Install dependencies:"
echo "     cd backend && npm install"
echo "     cd ../frontend && npm install"
echo "  2. Start Docker services:"
echo "     docker-compose up -d"
echo "  3. Start coding in your folders!"
echo "  4. When done: git push origin $BRANCH"
echo "     Then open a PR to → dev"
