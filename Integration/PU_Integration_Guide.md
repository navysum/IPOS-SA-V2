# IPOS-PU Integration Guide
### For the Pharmacy Union Portal Team

This document explains exactly which IPOS-SA API endpoints your (PU) system needs to call, in what order, and with what data.

---

## Your Role in IPOS

The Pharmacy Union (PU) portal is the **external, customer-facing** subsystem. It serves two types of users:

1. **Prospective merchants** — pharmacies that want to join InfoPharma. They submit a PU commercial application through your portal. SA staff review and approve/reject it.
2. **Existing merchants** — approved pharmacies with an IPOS account. They log in to browse the catalogue, place orders, view invoices, and check their balance.

You do **not** manage stock, dispatch orders, or handle accounting. That is SA and WH.

---

## Base URL

```
http://localhost:8080/api
```

---

## User Authentication

PU portal users authenticate against the SA accounts database.

### How to authenticate a merchant login

```http
GET /api/accounts
```

Fetch all accounts and match `username` + `password` in your frontend. Filter for `accountType === "MERCHANT"`.

The key fields you need after login:
- `accountId` — use this for all subsequent API calls (orders, invoices, balance)
- `accountStatus` — if `SUSPENDED` or `IN_DEFAULT`, block order placement and show a message
- `companyName`, `contactName`, `email` — display on profile

> **Important:** Only allow login for accounts with `accountType === "MERCHANT"`. Staff accounts (ADMIN, MANAGER) log in through the SA frontend, not the PU portal.

---

## Workflow 1 — PU Commercial Application

For a new pharmacy that wants to join InfoPharma:

### Submit an application
```http
POST /api/pu-applications
Content-Type: application/json

{
  "applicationId": "PU0010",
  "type": "commercial",
  "email": "contact@newpharm.co.uk",
  "submittedAt": "2026-04-01",
  "status": "PENDING",
  "companyName": "New Pharm Ltd",
  "companyHouseReg": "UK99887766CompH",
  "directorName": "Dr Alice Brown",
  "businessType": "Independent Pharmacy",
  "address": "5 Market Street, Manchester M1 1AA",
  "notes": null
}
```

**Response 201:** The created application. SA staff will be notified via the SA frontend.

### Application ID format
Generate a unique `applicationId` in your portal using the format `PU-COM-{sequence}` or `PU{4-digit-number}`. Check existing IDs first via `GET /api/pu-applications` to avoid collisions.

### Application outcome
When SA approves or rejects the application, an automated email is sent to the applicant's `email`. Your portal does **not** need to poll for this — the applicant is notified directly by SA.

---

## Workflow 2 — Browsing the Catalogue

### Get all catalogue items
```http
GET /api/catalogue
```

**Response:**
```json
[
  {
    "itemId": "100 00001",
    "description": "Paracetamol",
    "packageType": "box",
    "unit": "Caps",
    "unitsInPack": 20,
    "packageCost": 0.10,
    "availability": 10285,
    "minStockLevel": 300,
    "reorderBufferPct": 10.00
  }
]
```

Key fields to show merchants:
- `itemId` — used when placing orders
- `description` — product name
- `packageType`, `unit`, `unitsInPack` — package details
- `packageCost` — price per pack
- `availability` — current stock (show "In Stock" / "Low Stock" / "Out of Stock")

### Search the catalogue
```http
GET /api/catalogue/search?keyword=paracetamol
```

Searches both `itemId` and `description`. Case-insensitive.

---

## Workflow 3 — Placing an Order

### Before placing: check account status
```http
GET /api/accounts/{accountId}
```

If `accountStatus` is `SUSPENDED` or `IN_DEFAULT`, **do not** allow order placement. Show a message to the merchant explaining their account is restricted and they need to contact InfoPharma.

### Place the order
```http
POST /api/orders
Content-Type: application/json

{
  "accountId": 8,
  "items": [
    { "itemId": "100 00001", "quantity": 100 },
    { "itemId": "100 00002", "quantity": 50 }
  ]
}
```

**Response 201:**
```json
{
  "orderId": "IP0006",
  "status": "ACCEPTED",
  "orderDate": "2026-04-01",
  "totalValue": 35.00,
  "discountApplied": 0.00,
  "paymentStatus": "PENDING",
  "items": [...]
}
```

**Response 400** (error cases):
- Insufficient stock for one or more items
- Account is SUSPENDED or IN_DEFAULT
- Order would exceed the merchant's credit limit

> **SA side effects on order placement:**
> - Stock is immediately deducted from catalogue availability
> - An invoice is automatically generated
> - If this is the merchant's first unpaid order, `paymentDueDate` is set to 30 days from today

---

## Workflow 4 — Viewing Orders

### Get merchant's own orders
```http
GET /api/orders/my?accountId={accountId}
```

**Response:** Array of orders for that merchant only.

Order status values to display to the merchant:
| Status | Meaning |
|--------|---------|
| `ACCEPTED` | Order received by InfoPharma |
| `BEING_PROCESSED` | Being picked in the warehouse |
| `DISPATCHED` | Shipped — show courier and expected delivery |
| `DELIVERED` | Confirmed delivered |

When `status === "DISPATCHED"`, show the merchant:
- `courier` — e.g. "DHL"
- `courierRef` — tracking reference
- `expectedDelivery` — expected delivery date

---

## Workflow 5 — Viewing Invoices

### Get merchant's invoices
```http
GET /api/invoices/account/{accountId}
```

**Response:**
```json
[
  {
    "invoiceId": "100001",
    "invoiceDate": "2026-01-15",
    "amountDue": 184.30,
    "order": { "orderId": "IP0001", "status": "DELIVERED", "paymentStatus": "PAID" }
  }
]
```

Show `paymentStatus` from the linked `order` field. `PENDING` means the invoice has not been paid yet.

---

## Workflow 6 — Checking Account Balance

### Get current balance
```http
GET /api/accounts/{accountId}/balance
```

**Response:**
```json
{ "accountId": 8, "balance": 0.00 }
```

The balance represents total outstanding debt. Show this prominently on the merchant's dashboard.

### Full account details
```http
GET /api/accounts/{accountId}
```

Useful fields:
- `balance` — outstanding balance
- `creditLimit` — credit limit (optionally display remaining credit)
- `paymentDueDate` — when payment is due (null if no outstanding balance)
- `accountStatus` — NORMAL / SUSPENDED / IN_DEFAULT
- `discountPlan` — the merchant's discount plan (FIXED rate or FLEXIBLE tiers)

---

## Consistency and Business Rules

### Account status restrictions
- `SUSPENDED` merchants: show a warning, block new orders
- `IN_DEFAULT` merchants: show a strong warning, block new orders — they must contact InfoPharma directly
- `NORMAL` merchants: full access

### Discount plan display
Merchants may have a `FIXED` or `FLEXIBLE` discount plan. Display it on their profile so they understand their pricing:

- **FIXED:** A flat percentage off every order (e.g. "3% discount on all orders")
- **FLEXIBLE:** Tiered discount based on order value (e.g. "0% under £1,000 · 1% £1,000–£2,000 · 2% over £2,000"). Paid back monthly by cheque or deducted from next order.

### Credit limit
```
remainingCredit = creditLimit - balance
```

If `totalValue` of a new order would push `balance + totalValue > creditLimit`, SA will reject the order with a 400 error.

### Payments
Merchants **do not** record their own payments. Payments are processed by InfoPharma's accounting staff via the SA frontend. If a merchant has an outstanding balance, advise them to contact InfoPharma directly.

---

## Seeded Demo Merchant Credentials

These exist in the SA database for testing:

| Username | Password | Company | Account Status | Balance |
|----------|----------|---------|----------------|---------|
| city | northampton | CityPharmacy | NORMAL | £0.00 |
| cosymed | bondstreet | Cosymed Ltd | NORMAL | £0.00 |
| hello | there | HelloPharmacy | SUSPENDED | £1,750.00 |

`HelloPharmacy` is useful for testing the suspended account flow.

---

## Things You Should NOT Do

| Action | Why |
|--------|-----|
| Call `PUT /api/orders/{id}/dispatch` or `/delivered` | That is WH's responsibility |
| Call `POST /api/payments` | Payments are recorded by SA staff only |
| Call `PUT /api/catalogue/{id}/stock` | That is WH's responsibility |
| Access `GET /api/accounts` as a merchant and show all accounts | Scope to the logged-in `accountId` only |
| Use `GET /api/orders` (all orders) | Use `GET /api/orders/my?accountId=` instead |
| Allow login for `ADMIN` or `MANAGER` accounts | Those users log in through the SA frontend |
