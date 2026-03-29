/**
 * api/types.ts
 * Raw shapes returned by the Spring Boot API.
 * These match the Java entity/DTO fields exactly (camelCase from Jackson).
 */

// ── Accounts ─────────────────────────────────────────────────
export interface ApiUserAccount {
  accountId: number;
  username: string;
  password?: string;
  accountType: 'MERCHANT' | 'ADMIN' | 'MANAGER';
  accountStatus: 'NORMAL' | 'SUSPENDED' | 'IN_DEFAULT';
  isActive: boolean;
  contactName?: string;
  companyName?: string;
  address?: string;
  phone: string;
  fax?: string;
  email: string;
  creditLimit?: number;       // BigDecimal → number
  balance: number;
  paymentDueDate?: string;    // ISO date
  discountPlan?: ApiDiscountPlan;
  monthlyDiscounts?: ApiMonthlyDiscount[];
}

// ── Discount Plans ───────────────────────────────────────────
export interface ApiDiscountPlan {
  discountPlanId: number;
  planType: 'FIXED' | 'FLEXIBLE';
  tiers?: ApiDiscountTier[];
}

export interface ApiDiscountTier {
  tierId: number;
  minValue: number;
  maxValue: number | null;
  discountRate: number;       // e.g. 3.00 = 3%
}

export interface ApiMonthlyDiscount {
  monthlyDiscountId: number;
  monthYear: string;
  totalOrdersValue: number;
  discountRateApplied: number;
  discountAmount: number;
  settlementMethod: 'CHEQUE' | 'ORDER_DEDUCTION';
  settled: boolean;
}

// ── Catalogue ────────────────────────────────────────────────
export interface ApiCatalogueItem {
  itemId: string;
  description: string;
  packageType: string;
  unit: string;
  unitsInPack: number;
  packageCost: number;
  availability: number;
  minStockLevel: number;
  reorderBufferPct: number;
}

// ── Orders ───────────────────────────────────────────────────
export interface ApiOrder {
  orderId: string;
  account: ApiUserAccount;
  orderDate: string;
  totalValue: number;
  status: 'ACCEPTED' | 'BEING_PROCESSED' | 'DISPATCHED' | 'DELIVERED';
  dispatchedBy?: string;
  dispatchDate?: string;
  courier?: string;
  courierRef?: string;
  expectedDelivery?: string;
  deliveryDate?: string;
  discountApplied: number;
  paymentStatus: 'PENDING' | 'PAID';
  items?: ApiOrderItem[];
}

export interface ApiOrderItem {
  orderItemId: number;
  item: ApiCatalogueItem;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

// ── Invoices ─────────────────────────────────────────────────
export interface ApiInvoice {
  invoiceId: string;
  order: ApiOrder;
  account: ApiUserAccount;
  invoiceDate: string;
  amountDue: number;
}

// ── Payments ─────────────────────────────────────────────────
export interface ApiPayment {
  paymentId: number;
  account: ApiUserAccount;
  invoice: ApiInvoice;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
  recordedBy?: string;
}

// ── Reports ──────────────────────────────────────────────────
export interface ApiLowStockItem {
  itemId: string;
  description: string;
  currentAvailability: number;
  minStockLevel: number;
  recommendedOrderQty: number;
}

export interface ApiTurnoverReport {
  from: string;
  to: string;
  totalRevenue: number;
  totalOrders: number;
  rows: {
    orderId: string;
    accountId: number;
    companyName: string;
    orderDate: string;
    totalValue: number;
  }[];
}

export interface ApiMerchantOrdersSummary {
  accountId: number;
  companyName: string;
  from: string;
  to: string;
  totalValue: number;
  orders: {
    orderId: string;
    orderDate: string;
    totalValue: number;
    dispatchDate?: string;
    deliveryDate?: string;
    paymentStatus: string;
  }[];
}

export interface ApiDetailedOrderReport {
  accountId: number;
  companyName: string;
  from: string;
  to: string;
  grandTotal: number;
  orders: {
    orderId: string;
    orderDate: string;
    totalValue: number;
    discountApplied: number;
    items: {
      itemId: string;
      description: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }[];
  }[];
}

export interface ApiStockTurnoverReport {
  from: string;
  to: string;
  rows: {
    itemId: string;
    description: string;
    quantityDelivered: number;
    quantitySold: number;
    netChange: number;
  }[];
}

export interface ApiDebtorReminderItem {
  accountId: number;
  companyName: string;
  contactName: string;
  email: string;
  balance: number;
  paymentDueDate: string;
  daysOverdue: number;
  accountStatus: string;
}
