# IPOS-SA — InfoPharma Ordering System (Server Application)

Full-stack project:  
- **frontend/** — React 18 + TypeScript + Vite  
- **backend/**  — Spring Boot 4 + PostgreSQL + JPA
- **Supabase Password/** - lDTKeWUN49Kvqrui
---


## Running with Docker (Recommended)

If you have Docker Desktop installed, you don't need to install PostgreSQL separately.

### Start everything

```bash
# 1 — Start the database (from the IPOS-SA root folder)
docker-compose up -d

# 2 — Start the backend (wait ~5 seconds after step 1)
cd backend
./mvnw spring-boot:run

# 3 — Start the frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Stop the database
```bash
docker-compose down
```

Data is persisted in a Docker volume (`ipos_pgdata`) so it survives restarts.  
Use `docker-compose down -v` to wipe the database completely and start fresh.

---
## Quick Start (Manual PostgreSQL)

### Prerequisites
- Node.js 18+
- Java 21
- PostgreSQL running locally with a database called `iposdb`

### 1 — Start the backend

```bash
cd backend
./mvnw spring-boot:run
```

The API starts on **http://localhost:8080**.

Default DB config (`src/main/resources/application.properties`):
```
spring.datasource.url=jdbc:postgresql://localhost:5432/iposdb
spring.datasource.username=postgres
spring.datasource.password=password
```
Change these if your PostgreSQL setup differs.

> `ddl-auto=create-drop` means the schema is rebuilt on every start.  
> Change to `update` once you want data to persist between restarts.

### 2 — Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at **http://localhost:5173**. The Vite dev server proxies all `/api/*` requests to `localhost:8080` automatically — no manual CORS setup needed.

---

## Login Credentials

### Staff (seeded via Spring Boot on startup — add to data.sql if needed)

| Role       | Username    | Password           |
|------------|-------------|-------------------|
| Admin      | Sysdba      | London_weighting  |
| Manager    | manager     | Get_it_done       |
| Accountant | accountant  | Count_money       |
| Clerk      | clerk       | Paperwork         |
| Warehouse  | warehouse1  | Get_a_beer        |
| Warehouse  | warehouse2  | Lot_smell         |
| Delivery   | delivery    | Too_dark          |

### Merchants (created via the Accounts UI or seeded via data.sql)

| Company         | Username  | Password    |
|----------------|-----------|-------------|
| CityPharmacy   | city      | northampton |
| Cosymed Ltd    | cosymed   | bondstreet  |
| HelloPharmacy  | hello     | there       |

---

## Project Structure

```
IPOS-SA/
├── backend/                         Spring Boot API
│   ├── src/main/java/com/infopharma/ipos_sa/
│   │   ├── config/                  CorsConfig, MapperConfig
│   │   ├── controller/              REST controllers (7 controllers)
│   │   ├── dto/                     Request/Response shapes
│   │   ├── entity/                  JPA entities
│   │   ├── mapper/                  ModelMapper wrappers
│   │   ├── repository/              Spring Data JPA repos
│   │   └── service/                 Business logic
│   └── src/main/resources/
│       └── application.properties
│
└── frontend/                        React/Vite app
    ├── src/
    │   ├── api/                     API layer
    │   │   ├── client.ts            Base fetch wrapper
    │   │   ├── types.ts             Java entity types (TypeScript)
    │   │   ├── adapters.ts          Backend ↔ frontend field mapping
    │   │   └── endpoints.ts         One typed function per API route
    │   ├── components/              Shared UI components
    │   ├── context/
    │   │   ├── AppDataContext.tsx   Live data from API (shared state)
    │   │   └── AuthContext.tsx      Login via GET /api/accounts
    │   ├── pages/                   All application pages
    │   └── types/index.ts           Frontend TypeScript types
    └── vite.config.ts               Includes /api proxy to :8080
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/accounts | All user accounts |
| POST | /api/accounts | Create account |
| PUT | /api/accounts/{id} | Update contact info |
| PUT | /api/accounts/{id}/status | Set account status |
| PUT | /api/accounts/{id}/credit-limit | Set credit limit |
| PUT | /api/accounts/{id}/discount-plan | Assign discount plan |
| DELETE | /api/accounts/{id} | Delete (cascades) |
| GET | /api/accounts/debtors | Overdue merchant list |
| GET/POST | /api/catalogue | List / add items |
| PUT | /api/catalogue/{id} | Update item |
| PUT | /api/catalogue/{id}/stock | Add stock |
| GET | /api/catalogue/low-stock | Items below minimum |
| DELETE | /api/catalogue/{id} | Remove item |
| GET/POST | /api/orders | List all / place order |
| GET | /api/orders/incomplete | Not-yet-delivered orders |
| PUT | /api/orders/{id}/dispatch | Record dispatch |
| PUT | /api/orders/{id}/delivered | Mark delivered |
| GET | /api/invoices | All invoices |
| GET | /api/invoices/account/{id} | Invoices for one merchant |
| POST | /api/payments | Record payment |
| GET/POST/PUT/DELETE | /api/discount-plans | Manage discount plans |
| GET | /api/reports/turnover | Revenue report |
| GET | /api/reports/merchant/{id}/orders | Merchant summary (Appendix 4) |
| GET | /api/reports/merchant/{id}/orders/detailed | Merchant detailed (Appendix 5) |
| GET | /api/reports/invoices | All invoices by date range |
| GET | /api/reports/merchant/{id}/invoices | Merchant invoices by date range |
| GET | /api/reports/stock-turnover | Stock received vs sold |

---

## Notes

- **Spring Security** is commented out in `pom.xml`. Login works by matching username/password against `GET /api/accounts`. When you enable Security, replace the `login()` function in `frontend/src/context/AuthContext.tsx` with a `POST /api/auth/login` call.
- **Passwords are stored in plaintext** in the current version — acceptable for demo, not for production.
- The **AccountScheduler** runs nightly at midnight to auto-update merchant account statuses (NORMAL → SUSPENDED → IN_DEFAULT) based on `paymentDueDate`.
- **PU Applications** have no backend endpoint — they are managed in local frontend state only.
