# Testing Guide — Amdox ERP

## Stack
- **Backend unit/integration**: Jest + ts-jest + Supertest
- **Frontend unit**: Vitest + React Testing Library
- **E2E**: Playwright (Chromium + Mobile Chrome)

## Running Tests

```bash
# Backend
cd backend
npm test                  # all tests
npm run test:unit         # unit only
npm run test:integration  # integration only
npm run test:coverage     # with coverage report

# Frontend
cd frontend
npm test                  # unit (vitest)
npm run test:e2e          # e2e (playwright)
npm run test:coverage     # with coverage
```

## Coverage Targets
| Layer       | Target |
|-------------|--------|
| Services    | 80%+   |
| Controllers | 70%+   |
| Utils       | 90%+   |
| Frontend    | 70%+   |
