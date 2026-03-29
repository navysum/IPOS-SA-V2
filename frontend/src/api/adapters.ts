/**
 * api/adapters.ts
 * Converts between API shapes (Java/Spring) and frontend types (AppDataContext).
 * Centralises all field-name translation so pages never see raw API data.
 */

import type {
  ApiUserAccount, ApiCatalogueItem, ApiOrder, ApiInvoice,
  ApiPayment, ApiDiscountPlan,
} from './types';
import type {
  Merchant, CatalogueItem, Order, Invoice, Payment,
  DiscountPlan, OrderItem, AccountStatus,
} from '@/types';

// ── Status maps ──────────────────────────────────────────────

const ORDER_STATUS_MAP: Record<string, Order['status']> = {
  ACCEPTED:         'accepted',
  BEING_PROCESSED:  'ready_to_dispatch',
  DISPATCHED:       'dispatched',
  DELIVERED:        'delivered',
};

const ORDER_STATUS_REVERSE: Record<string, string> = {
  accepted:          'ACCEPTED',
  ready_to_dispatch: 'BEING_PROCESSED',
  dispatched:        'DISPATCHED',
  delivered:         'DELIVERED',
};

const ACCOUNT_STATUS_MAP: Record<string, AccountStatus> = {
  NORMAL:     'normal',
  SUSPENDED:  'suspended',
  IN_DEFAULT: 'in_default',
};

// ── Discount plan ────────────────────────────────────────────

export function adaptDiscountPlan(api: ApiDiscountPlan | undefined): DiscountPlan {
  if (!api) return { type: 'fixed', rate: 0 };
  if (api.planType === 'FIXED') {
    // Fixed plan: rate is stored as first tier discountRate (e.g. 3.00 = 3%)
    const rate = api.tiers?.[0]?.discountRate ?? 0;
    return { type: 'fixed', rate: rate / 100 };
  }
  return {
    type: 'flexible',
    tiers: (api.tiers ?? []).map(t => ({
      minValue: t.minValue,
      maxValue: t.maxValue,
      rate: t.discountRate / 100,
    })),
  };
}

// ── Merchant / UserAccount ───────────────────────────────────

export function adaptAccount(api: ApiUserAccount): Merchant {
  const days = api.paymentDueDate
    ? Math.max(0, Math.floor((Date.now() - new Date(api.paymentDueDate).getTime()) / 86400000))
    : 0;

  return {
    id:                String(api.accountId),
    companyName:       api.companyName ?? api.username,
    contactName:       api.contactName ?? '',
    address:           api.address ?? '',
    city:              '',   // not stored separately in backend — embedded in address
    postcode:          '',
    phone:             api.phone,
    fax:               api.fax,
    email:             api.email,
    iposAccount:       `ACC${String(api.accountId).padStart(4, '0')}`,
    creditLimit:       api.creditLimit ?? 0,
    currentBalance:    api.balance,
    accountStatus:     ACCOUNT_STATUS_MAP[api.accountStatus] ?? 'normal',
    discountPlan:      adaptDiscountPlan(api.discountPlan),
    createdAt:         '',
    paymentDueDays:    30,
    paymentOverdueDays: days > 0 ? days : undefined,
    loginUsername:     api.username,
    _backendId:        api.accountId,       // kept for API calls
    _discountPlanId:   api.discountPlan?.discountPlanId,  // for discount plan updates
  } as Merchant & { _backendId: number; _discountPlanId?: number };
}

// ── CatalogueItem ─────────────────────────────────────────────

export function adaptCatalogueItem(api: ApiCatalogueItem): CatalogueItem {
  return {
    id:            api.itemId,
    description:   api.description,
    packageType:   api.packageType as CatalogueItem['packageType'],
    unit:          api.unit as CatalogueItem['unit'],
    unitsInPack:   api.unitsInPack,
    packageCost:   api.packageCost,
    availability:  api.availability,
    stockLimit:    api.minStockLevel,
    bufferPercent: api.reorderBufferPct,
    isActive:      true,
  };
}

export function catalogueItemToApi(item: Partial<CatalogueItem>): Partial<ApiCatalogueItem> {
  return {
    itemId:          item.id,
    description:     item.description,
    packageType:     item.packageType,
    unit:            item.unit,
    unitsInPack:     item.unitsInPack,
    packageCost:     item.packageCost,
    availability:    item.availability,
    minStockLevel:   item.stockLimit,
    reorderBufferPct: item.bufferPercent,
  };
}

// ── Order ─────────────────────────────────────────────────────

export function adaptOrder(api: ApiOrder): Order {
  const items: OrderItem[] = (api.items ?? []).map(i => ({
    itemId:      i.item.itemId,
    description: i.item.description,
    quantity:    i.quantity,
    unitCost:    i.unitCost,
    totalCost:   i.totalCost,
  }));

  const subtotal = items.reduce((s, i) => s + i.totalCost, 0);

  return {
    id:              api.orderId,
    merchantId:      String(api.account.accountId),
    merchantName:    api.account.companyName ?? api.account.username,
    orderedAt:       api.orderDate,
    items,
    subtotal,
    discountApplied: api.discountApplied,
    totalAmount:     api.totalValue,
    status:          ORDER_STATUS_MAP[api.status] ?? 'accepted',
    paymentStatus:   api.paymentStatus === 'PAID' ? 'received' : 'pending',
    invoiceId:       undefined,   // filled in from invoices list
    deliveredAt:     api.deliveryDate,
    paymentReceivedAt: undefined,
    dispatch:        api.dispatchedBy ? {
      dispatchedBy:     api.dispatchedBy,
      dispatchedAt:     api.dispatchDate ?? '',
      courier:          api.courier ?? '',
      courierRef:       api.courierRef ?? '',
      expectedDelivery: api.expectedDelivery ?? '',
    } : undefined,
  };
}

export function orderStatusToApi(status: Order['status']): string {
  return ORDER_STATUS_REVERSE[status] ?? 'ACCEPTED';
}

// ── Invoice ───────────────────────────────────────────────────

export function adaptInvoice(api: ApiInvoice): Invoice {
  const order = api.order;
  const items: OrderItem[] = (order?.items ?? []).map(i => ({
    itemId:      i.item.itemId,
    description: i.item.description,
    quantity:    i.quantity,
    unitCost:    i.unitCost,
    totalCost:   i.totalCost,
  }));

  return {
    id:              api.invoiceId,
    orderId:         order?.orderId ?? '',
    merchantId:      String(api.account.accountId),
    merchantName:    api.account.companyName ?? api.account.username,
    issuedAt:        api.invoiceDate,
    dueDate:         api.invoiceDate,   // backend doesn't store dueDate separately
    items,
    subtotal:        api.amountDue,     // no separate subtotal — use amountDue
    discountApplied: order?.discountApplied ?? 0,
    totalAmount:     api.amountDue,
    paymentStatus:   order?.paymentStatus === 'PAID' ? 'received' : 'pending',
  };
}

// ── Payment ───────────────────────────────────────────────────

export function adaptPayment(api: ApiPayment): Payment {
  return {
    id:          String(api.paymentId),
    merchantId:  String(api.account.accountId),
    invoiceId:   api.invoice?.invoiceId ?? '',
    amount:      api.amountPaid,
    method:      api.paymentMethod.toLowerCase().replace('_', '_') as Payment['method'],
    receivedAt:  api.paymentDate,
    enteredBy:   api.recordedBy ?? '',
  };
}
