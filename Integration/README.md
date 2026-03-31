# IPOS Integration — Overview

## The Three Subsystems

The full InfoPharma Ordering System (IPOS) is split across three independent teams:

| Subsystem | Name | Responsibility |
|-----------|------|----------------|
| **IPOS-SA** | Sales Administration | Central hub — merchant accounts, catalogue, orders, invoices, payments, reports, discount plans |
| **IPOS-WH** | Warehouse | Physical stock management — receive stock deliveries, process and dispatch orders |
| **IPOS-PU** | Pharmacy Union Portal | External customer-facing portal — PU account applications, catalogue browsing, order placement, account self-service |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        IPOS-SA (Port 8080)                   │
│            Spring Boot REST API  ·  PostgreSQL DB            │
│                                                              │
│  All shared data lives here:                                 │
│  • Merchant accounts & credit limits                         │
│  • Catalogue items & stock levels                            │
│  • Orders, invoices, payments                                │
│  • Discount plans                                            │
│  • PU applications                                           │
└────────────────────┬─────────────────────┬───────────────────┘
                     │  REST API calls      │  REST API calls
                     ▼                      ▼
         ┌───────────────────┐   ┌────────────────────────┐
         │    IPOS-WH        │   │       IPOS-PU           │
         │  Warehouse team   │   │   PU Portal team        │
         │                   │   │                         │
         │ • Receive stock   │   │ • Apply for account     │
         │ • Process orders  │   │ • Browse catalogue      │
         │ • Dispatch orders │   │ • Place orders          │
         │ • Mark delivered  │   │ • View own invoices     │
         └───────────────────┘   │ • View own balance      │
                                 └────────────────────────┘
```

**IPOS-SA is the single source of truth.** WH and PU do not have their own databases for shared data — they read and write through the SA REST API.

---

## Base URL

| Environment | URL |
|-------------|-----|
| Local development | `http://localhost:8080/api` |
| Demo (if deployed) | Configure per deployment |

All endpoints are prefixed `/api/`. CORS is open to all origins so any frontend or backend can call the API without browser restrictions.

---

## Authentication

Spring Security is **not enabled** in the current build (demo scope). All endpoints are publicly accessible. Authentication is handled client-side by each subsystem's own frontend.

For the SA system, login credentials are stored in the `user_accounts` table.

---

## Quick Links

- [Full API Reference](./API_Reference.md)
- [Warehouse Integration Guide (IPOS-WH)](./WH_Integration_Guide.md)
- [PU Portal Integration Guide (IPOS-PU)](./PU_Integration_Guide.md)

---

## Shared Data Format

All dates are ISO 8601: `YYYY-MM-DD`
All monetary values are decimals with 2 decimal places: `1234.56`
All responses are `application/json`

### Common Enums

**accountType:** `MERCHANT` | `ADMIN` | `MANAGER`
**accountStatus:** `NORMAL` | `SUSPENDED` | `IN_DEFAULT`
**orderStatus:** `ACCEPTED` | `BEING_PROCESSED` | `DISPATCHED` | `DELIVERED`
**paymentStatus:** `PENDING` | `PAID`
**planType:** `FIXED` | `FLEXIBLE`
**paymentMethod:** `BANK_TRANSFER` | `CARD` | `CHEQUE`
**settlementMethod:** `CHEQUE` | `ORDER_DEDUCTION`
