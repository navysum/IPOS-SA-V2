# IPOS-WH Integration Guide
### For the Warehouse Subsystem Team

This document explains exactly which IPOS-SA API endpoints your (WH) system needs to call, in what order, and with what data.

---

## Your Role in IPOS

The Warehouse (WH) subsystem is responsible for:

1. **Receiving stock deliveries** from suppliers → update SA stock levels
2. **Picking and processing orders** → transition orders from ACCEPTED to BEING_PROCESSED
3. **Dispatching orders** → transition orders to DISPATCHED and record courier details
4. **Confirming delivery** → transition orders to DELIVERED

You do **not** manage accounts, invoices, or payments — those are handled by SA.

---

## Base URL

```
http://localhost:8080/api
```

---

## Workflow 1 — Receiving a Stock Delivery

When a supplier delivers goods to the warehouse:

### Step 1: Get current stock levels (optional, for display)
```http
GET /api/catalogue
```

### Step 2: Record the stock delivery
```http
PUT /api/catalogue/{itemId}/stock
Content-Type: application/json

{
  "quantity": 500,
  "recordedBy": "warehouse1"
}
```

- `itemId` must match exactly (e.g. `100 00001` — note the space; URL-encode as `100%2000001`)
- `quantity` is the number of **packs** received
- `recordedBy` is the warehouse employee username
- SA will increase `availability` by this amount and log a `StockDelivery` record
- **Response:** `204 No Content` on success

**Example — receiving 200 boxes of Paracetamol:**
```http
PUT /api/catalogue/100%2000001/stock
{ "quantity": 200, "recordedBy": "warehouse2" }
```

---

## Workflow 2 — Processing Orders

### Step 1: Poll for new orders (ACCEPTED status)
```http
GET /api/orders/incomplete
```

This returns all orders with status `ACCEPTED`, `BEING_PROCESSED`, or `DISPATCHED`. Filter by `status === "ACCEPTED"` to find new work.

**Response shape:**
```json
[
  {
    "orderId": "IP0005",
    "status": "ACCEPTED",
    "orderDate": "2026-04-01",
    "totalValue": 310.00,
    "account": { "accountId": 8, "companyName": "CityPharmacy", "address": "..." },
    "items": [
      { "item": { "itemId": "100 00007", "description": "Lipitor TB, 20 mg" }, "quantity": 20, "unitCost": 15.50 }
    ]
  }
]
```

### Step 2: Start processing an order
When a warehouse employee begins picking the order:
```http
PUT /api/orders/{orderId}/process
```

- No request body needed
- Status transitions: `ACCEPTED` → `BEING_PROCESSED`
- **Response:** `200 OK` with updated order

### Step 3: Dispatch the order
When goods leave the warehouse:
```http
PUT /api/orders/{orderId}/dispatch
Content-Type: application/json

{
  "dispatchedBy": "warehouse1",
  "courier": "DHL",
  "courierRef": "DHL7010",
  "expectedDelivery": "2026-04-25"
}
```

- Status transitions: `BEING_PROCESSED` → `DISPATCHED`
- All fields are required
- **Response:** `200 OK` with updated order

### Step 4: Confirm delivery
When the goods have been confirmed as delivered:
```http
PUT /api/orders/{orderId}/delivered
```

- No request body needed
- Status transitions: `DISPATCHED` → `DELIVERED`
- **Response:** `200 OK` with updated order

---

## Workflow 3 — Low Stock Alerts

To check which items need reordering:
```http
GET /api/catalogue/low-stock
```

**Response:**
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

`recommendedOrderQty` is calculated as: `(minStockLevel × (1 + reorderBufferPct/100)) - currentAvailability`

---

## Order Status State Machine

Only these transitions are valid. Attempting others will return `400 Bad Request`:

```
ACCEPTED  ──[/process]──►  BEING_PROCESSED  ──[/dispatch]──►  DISPATCHED  ──[/delivered]──►  DELIVERED
```

The `/dispatch` endpoint requires courier details. The other two require no body.

---

## Item ID Format

Catalogue item IDs contain spaces (e.g. `100 00001`). When used in URL paths, URL-encode the space as `%20`:

| Raw ID | URL path |
|--------|----------|
| `100 00001` | `/api/catalogue/100%2000001/stock` |
| `200 00004` | `/api/catalogue/200%2000004/stock` |
| `300 00001` | `/api/catalogue/300%2000001/stock` |

---

## Consistency Notes

- **Stock deduction** happens automatically when an order is placed (by SA/PU). You do not need to deduct stock when dispatching — it is already deducted.
- **Stock increase** only happens when you call `PUT /api/catalogue/{id}/stock`. SA does not auto-increase stock.
- **Do not** create orders, invoices, or payments — those are SA/PU responsibilities.
- **Do not** modify account status — that is SA's responsibility.

---

## Seeded Demo Credentials (for testing)

| Username | Password | Role |
|----------|----------|------|
| warehouse1 | Get_a_beer | Warehouse |
| warehouse2 | Lot_smell | Warehouse |
| delivery | Too_dark | Delivery |

These accounts exist in the SA database with `accountType = MANAGER`.
