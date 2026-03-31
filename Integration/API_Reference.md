# IPOS-SA — Full REST API Reference

Base URL: `http://localhost:8080/api`

All request and response bodies are JSON (`Content-Type: application/json`).
Dates: `YYYY-MM-DD`. Decimals: 2 d.p. (e.g. `1234.56`).

---

## Accounts `/api/accounts`

### GET /api/accounts
List all user accounts (staff + merchants).

**Response 200:**
```json
[
  {
    "accountId": 8,
    "username": "city",
    "password": "northampton",
    "accountType": "MERCHANT",
    "accountStatus": "NORMAL",
    "isActive": true,
    "contactName": "Prof David Rhind",
    "companyName": "CityPharmacy",
    "address": "Northampton Square, London EC1V 0HB",
    "phone": "0207 040 8000",
    "fax": null,
    "email": "city@citypharmacy.co.uk",
    "creditLimit": 10000.00,
    "balance": 0.00,
    "paymentDueDate": null,
    "discountPlan": { "discountPlanId": 1, "planType": "FIXED", "tiers": [...] }
  }
]
```

---

### GET /api/accounts/{id}
Get a single account by numeric ID.

**Response 200:** Single account object (same shape as above).
**Response 404:** Account not found.

---

### GET /api/accounts/{id}/balance
Get the current outstanding balance for a merchant.

**Response 200:**
```json
{ "accountId": 8, "balance": 1750.00 }
```

---

### GET /api/accounts/debtors
Get all merchants currently overdue (for on-screen debtor reminders).

**Response 200:**
```json
[
  {
    "accountId": 10,
    "companyName": "HelloPharmacy",
    "contactName": "Mr Bruno Wright",
    "email": "hello@hellopharmacy.co.uk",
    "balance": 1750.00,
    "paymentDueDate": "2026-02-28",
    "daysOverdue": 31,
    "accountStatus": "SUSPENDED"
  }
]
```

---

### POST /api/accounts
Create a new account (staff or merchant).

**Request body:**
```json
{
  "username": "newpharmacy",
  "password": "securepass",
  "accountType": "MERCHANT",
  "accountStatus": "NORMAL",
  "contactName": "Jane Smith",
  "companyName": "New Pharmacy Ltd",
  "address": "10 High Street, London W1A 1AA",
  "phone": "020 7000 0001",
  "fax": null,
  "email": "jane@newpharmacy.co.uk"
}
```

**Response 201:** Created account object with auto-generated `accountId`.

---

### PUT /api/accounts/{id}
Update a merchant's contact details.

**Request body (all fields optional):**
```json
{
  "contactName": "Jane Smith",
  "companyName": "New Pharmacy Ltd",
  "address": "10 High Street, London W1A 1AA",
  "phone": "020 7000 0001",
  "fax": null,
  "email": "jane@newpharmacy.co.uk"
}
```

**Response 200:** Updated object.

---

### PUT /api/accounts/{id}/details
Change an account's role or status.

**Request body:**
```json
{
  "accountType": "MANAGER",
  "accountStatus": "NORMAL"
}
```

**Response 200:** Updated object.

---

### PUT /api/accounts/{id}/credit-limit
Set or update a merchant's credit limit.

**Request body:**
```json
{ "creditLimit": 15000.00 }
```

**Response 200:** `{ "accountId": 8, "creditLimit": 15000.00 }`

---

### PUT /api/accounts/{id}/discount-plan
Assign a discount plan to a merchant account.

**Request body:**
```json
{ "discountPlanId": 2 }
```

**Response 204:** No content.

---

### PUT /api/accounts/{id}/status
Restore an account to NORMAL (manager-only action, used after clearing balance).

**Request body:**
```json
{ "accountStatus": "NORMAL" }
```

**Response 200:** Updated object.

---

### DELETE /api/accounts/{id}
Delete an account and all associated data (cascades: payments → invoices → orders → account).

**Response 204:** No content.

---

## Catalogue `/api/catalogue`

### GET /api/catalogue
List all catalogue items.

**Response 200:**
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

---

### GET /api/catalogue/search?keyword={keyword}
Search items by ID or description (case-insensitive).

**Response 200:** Array of matching items.

---

### GET /api/catalogue/low-stock
Items where current availability is at or below minimum stock level.

**Response 200:**
```json
[
  {
    "itemId": "200 00004",
    "description": "Iodine tincture",
    "currentAvailability": 87,
    "minStockLevel": 200,
    "recommendedOrderQty": 220
  }
]
```

---

### GET /api/catalogue/{id}
Get a single catalogue item. `id` uses URL-encoded spaces (e.g. `100%2000001`).

**Response 200:** Single item object.
**Response 404:** Item not found.

---

### POST /api/catalogue
Add a new item to the catalogue.

**Request body:**
```json
{
  "itemId": "500 00001",
  "description": "Ibuprofen 400mg",
  "packageType": "box",
  "unit": "Caps",
  "unitsInPack": 24,
  "packageCost": 2.50,
  "availability": 500,
  "minStockLevel": 100,
  "reorderBufferPct": 10.00
}
```

**Response 201:** Created item.

---

### PUT /api/catalogue/{id}
Update an existing catalogue item (partial update supported).

**Response 200:** Updated item.

---

### PUT /api/catalogue/{id}/stock
Add stock to an item (called by warehouse when goods are received).

**Request body:**
```json
{ "quantity": 500, "recordedBy": "warehouse1" }
```

**Response 204:** No content. The `availability` field on the catalogue item increases by `quantity`.

---

### DELETE /api/catalogue/{id}
Remove an item from the catalogue.

**Response 204:** No content.

---

## Orders `/api/orders`

### GET /api/orders
List all orders (staff view — all merchants).

**Response 200:**
```json
[
  {
    "orderId": "IP0001",
    "account": { "accountId": 8, "companyName": "CityPharmacy", ... },
    "orderDate": "2026-01-15",
    "totalValue": 184.30,
    "status": "DELIVERED",
    "dispatchedBy": "warehouse1",
    "dispatchDate": "2026-01-17",
    "courier": "DHL",
    "courierRef": "DHL7001",
    "expectedDelivery": "2026-01-21",
    "deliveryDate": "2026-01-20",
    "discountApplied": 5.70,
    "paymentStatus": "PAID",
    "items": [
      { "orderItemId": 1, "item": { "itemId": "100 00001", ... }, "quantity": 200, "unitCost": 0.10, "totalCost": 20.00 }
    ]
  }
]
```

---

### GET /api/orders/incomplete
Orders not yet delivered (status: ACCEPTED, BEING_PROCESSED, or DISPATCHED). Used by WH system to find work to do.

**Response 200:** Array of order objects.

---

### GET /api/orders/my?accountId={accountId}
Orders belonging to a specific merchant. Used by PU portal.

**Path param:** `accountId` — the numeric `accountId` of the merchant.

**Response 200:** Array of order objects for that merchant only.

---

### GET /api/orders/{id}
Get a single order by order ID (e.g. `IP0001`).

**Response 200:** Single order object.
**Response 404:** Order not found.

---

### POST /api/orders
Place a new order. Stock is deducted from catalogue availability immediately. An invoice is auto-generated.

**Request body:**
```json
{
  "accountId": 8,
  "items": [
    { "itemId": "100 00001", "quantity": 100 },
    { "itemId": "100 00002", "quantity": 50 }
  ]
}
```

**Response 201:** Created order object including generated `orderId` and `invoice`.
**Response 400:** Insufficient stock, account suspended/in_default, or credit limit exceeded.

---

### PUT /api/orders/{id}/process
Mark an order as BEING_PROCESSED (ACCEPTED → BEING_PROCESSED). Called by WH when work begins.

**Request body:** None.
**Response 200:** Updated order object.

---

### PUT /api/orders/{id}/dispatch
Mark an order as DISPATCHED (BEING_PROCESSED → DISPATCHED). Called by WH when goods leave the warehouse.

**Request body:**
```json
{
  "dispatchedBy": "warehouse1",
  "courier": "DHL",
  "courierRef": "DHL7005",
  "expectedDelivery": "2026-04-25"
}
```

**Response 200:** Updated order object.

---

### PUT /api/orders/{id}/delivered
Mark an order as DELIVERED (DISPATCHED → DELIVERED). Called by delivery/WH when goods arrive.

**Request body:** None.
**Response 200:** Updated order object.

---

## Invoices `/api/invoices`

### GET /api/invoices
List all invoices.

**Response 200:**
```json
[
  {
    "invoiceId": "100001",
    "order": { "orderId": "IP0001", ... },
    "account": { "accountId": 8, "companyName": "CityPharmacy", ... },
    "invoiceDate": "2026-01-15",
    "amountDue": 184.30
  }
]
```

---

### GET /api/invoices/{id}
Get a single invoice.

**Response 200:** Single invoice object.
**Response 404:** Invoice not found.

---

### GET /api/invoices/account/{accountId}
All invoices for a specific merchant. Used by PU portal.

**Response 200:** Array of invoice objects.

---

## Payments `/api/payments`

### POST /api/payments
Record a payment against an invoice.

**Request body:**
```json
{
  "accountId": 8,
  "invoiceId": "100001",
  "amountPaid": 184.30,
  "paymentMethod": "BANK_TRANSFER",
  "recordedBy": "accountant"
}
```

**Response 201:** Created payment object.

> **Side effect:** The merchant's `balance` is reduced by `amountPaid`. If balance reaches ≤ 0, `paymentDueDate` is cleared and `accountStatus` is automatically set to `NORMAL`.

---

## Discount Plans `/api/discount-plans`

### GET /api/discount-plans
List all discount plans.

**Response 200:**
```json
[
  {
    "discountPlanId": 1,
    "planType": "FIXED",
    "tiers": [
      { "tierId": 1, "minValue": 0.00, "maxValue": null, "discountRate": 3.00 }
    ]
  },
  {
    "discountPlanId": 2,
    "planType": "FLEXIBLE",
    "tiers": [
      { "tierId": 2, "minValue": 0.00,    "maxValue": 1000.00, "discountRate": 0.00 },
      { "tierId": 3, "minValue": 1000.00, "maxValue": 2000.00, "discountRate": 1.00 },
      { "tierId": 4, "minValue": 2000.00, "maxValue": null,    "discountRate": 2.00 }
    ]
  }
]
```

---

### POST /api/discount-plans
Create a new discount plan.

**Request body:**
```json
{
  "planType": "FLEXIBLE",
  "tiers": [
    { "minValue": 0.00,    "maxValue": 500.00, "discountRate": 0.00 },
    { "minValue": 500.00,  "maxValue": 1500.00,"discountRate": 1.50 },
    { "minValue": 1500.00, "maxValue": null,   "discountRate": 3.00 }
  ]
}
```

**Response 201:** Created plan with generated `discountPlanId`.

---

### PUT /api/discount-plans/{id}
Update an existing plan.

**Response 200:** Updated plan.

---

### DELETE /api/discount-plans/{id}
Delete a plan (only if not assigned to any merchant).

**Response 204:** No content.

---

## PU Applications `/api/pu-applications`

### GET /api/pu-applications
List all pharmacy union applications.

**Response 200:**
```json
[
  {
    "applicationId": "PU0003",
    "type": "commercial",
    "email": "pondPharma@example.com",
    "submittedAt": "2026-01-15",
    "status": "PENDING",
    "companyName": "Pond Pharmacy",
    "companyHouseReg": "UK10003429CompH",
    "directorName": "Not provided",
    "businessType": "Pharmacy",
    "address": "Chislehurst, 25 High Street, BR7 5BN",
    "notes": null,
    "processedBy": null,
    "processedAt": null
  }
]
```

---

### POST /api/pu-applications
Submit a new application. Called by PU portal when a pharmacy applies for an IPOS account.

**Request body:**
```json
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

**Response 201:** Created application.

---

### PUT /api/pu-applications/{id}/decision
Approve or reject an application (SA staff action). Sends an outcome email to the applicant.

**Request body:**
```json
{
  "status": "APPROVED",
  "notes": "Welcome to InfoPharma. Account setup in progress.",
  "processedBy": "manager"
}
```

**Response 200:** Updated application with `processedBy` and `processedAt` set.

> **Side effect (APPROVED):** Triggers an email to the applicant's `email` address confirming approval. SA staff must then manually create a merchant account via `POST /api/accounts`.

---

## Monthly Discounts `/api/monthly-discounts`

### GET /api/monthly-discounts
List all monthly discount records (settled and pending).

---

### GET /api/monthly-discounts/pending
List only unsettled discount records.

---

### POST /api/monthly-discounts/calculate?month={YYYY-MM-DD}
Calculate and store monthly discounts for all FLEXIBLE-plan merchants for the given month. Pass the first day of the month (e.g. `2026-03-01`).

**Response 201:** Array of created `MonthlyDiscount` objects.

---

### PUT /api/monthly-discounts/{id}/settle
Mark a monthly discount as settled.

**Request body:**
```json
{ "settlementMethod": "ORDER_DEDUCTION" }
```

**Response 200:** Updated record.

> `ORDER_DEDUCTION` automatically reduces the merchant's `balance`.

---

## Reports `/api/reports`

All date parameters: `from=YYYY-MM-DD&to=YYYY-MM-DD`

| Endpoint | Description |
|----------|-------------|
| `GET /api/reports/turnover?from=&to=` | Overall sales revenue and order list |
| `GET /api/reports/merchant/{id}/orders?from=&to=` | Order summary for one merchant |
| `GET /api/reports/merchant/{id}/orders/detailed?from=&to=` | Detailed orders with line items |
| `GET /api/reports/merchant/{id}/invoices?from=&to=` | Invoices for one merchant |
| `GET /api/reports/invoices?from=&to=` | All invoices across all merchants |
| `GET /api/reports/stock-turnover?from=&to=` | Stock received vs sold per catalogue item |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — successful read or update |
| 201 | Created — resource successfully created |
| 204 | No Content — successful delete or assignment |
| 400 | Bad Request — validation error (check error message) |
| 404 | Not Found — resource does not exist |
| 500 | Internal Server Error — unexpected error |
