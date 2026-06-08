# API Documentation — Amdox ERP

Base URL: `http://localhost:5000/api/v1`
Auth: Bearer JWT in `Authorization` header

## Endpoints

### Auth
| Method | Path              | Description       |
|--------|-------------------|-------------------|
| POST   | /auth/login       | Login             |
| POST   | /auth/refresh     | Refresh token     |
| POST   | /auth/logout      | Logout            |
| GET    | /auth/me          | Current user      |

### Finance
| Method | Path                  | Description          |
|--------|-----------------------|----------------------|
| GET    | /finance/ledger       | Chart of accounts    |
| POST   | /finance/journal      | Create journal entry |
| GET    | /finance/invoices     | List invoices        |
| POST   | /finance/payments     | Record payment       |

### HR
| Method | Path               | Description        |
|--------|--------------------|--------------------|
| GET    | /hr/employees      | List employees     |
| POST   | /hr/employees      | Add employee       |
| GET    | /hr/payroll        | List payroll runs  |
| POST   | /hr/payroll/run    | Run payroll        |

### Supply Chain
| Method | Path               | Description        |
|--------|--------------------|--------------------|
| GET    | /supply/pos        | List purchase orders|
| POST   | /supply/pos        | Create PO          |
| GET    | /supply/inventory  | List inventory     |
| GET    | /supply/forecasts  | Get ML forecasts   |

> Full Swagger docs at: http://localhost:5000/api-docs
