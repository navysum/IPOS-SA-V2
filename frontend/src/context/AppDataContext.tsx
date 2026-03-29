/**
 * AppDataContext — live data from Spring Boot backend.
 *
 * Load strategy:
 *  - On mount: fetch accounts, catalogue, orders + invoices in parallel.
 *  - Payments are derived from invoices (no GET /api/payments endpoint).
 *  - Every mutation calls the appropriate API endpoint, then re-fetches
 *    the affected slice(s) so the UI always reflects DB state.
 *
 * Order status mapping (backend → frontend):
 *   ACCEPTED        → accepted
 *   BEING_PROCESSED → ready_to_dispatch
 *   DISPATCHED      → dispatched
 *   DELIVERED       → delivered
 *
 * The backend has no endpoints for accepted→BEING_PROCESSED transition
 * so that step is optimistic-local only (fine for demo).
 */
import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react';
import type {
  Merchant, CatalogueItem, Order, Invoice, Payment,
  PUApplication, AccountStatus, OrderStatus, DiscountPlan, OrderItem,
} from '@/types';
import {
  accountsApi, catalogueApi, ordersApi, invoicesApi, paymentsApi, discountPlansApi,
} from '@/api/endpoints';
import {
  adaptAccount, adaptCatalogueItem, adaptOrder, adaptInvoice,
  catalogueItemToApi,
} from '@/api/adapters';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

export function calcDiscount(plan: DiscountPlan, subtotal: number): number {
  if (plan.type === 'fixed') return subtotal * plan.rate;
  const tier = [...plan.tiers]
    .sort((a, b) => b.minValue - a.minValue)
    .find(t => subtotal >= t.minValue);
  return tier ? subtotal * tier.rate : 0;
}

/** Map frontend AccountStatus → backend enum string */
function toApiStatus(status: AccountStatus): string {
  const map: Record<AccountStatus, string> = {
    normal:     'NORMAL',
    suspended:  'SUSPENDED',
    in_default: 'IN_DEFAULT',
  };
  return map[status];
}

/** Map frontend payment method → backend enum */
const PM_TO_API: Record<string, 'BANK_TRANSFER' | 'CARD' | 'CHEQUE'> = {
  bank_transfer: 'BANK_TRANSFER',
  card:          'CARD',
  cheque:        'CHEQUE',
};

/** Upsert a discount plan on the backend and return its ID. */
async function syncDiscountPlan(
  plan: DiscountPlan,
  existingPlanId?: number,
): Promise<number> {
  // Backend stores fixed plans as a single tier with the rate
  const tiers = plan.type === 'flexible'
    ? plan.tiers.map(t => ({
        minValue:     t.minValue,
        maxValue:     t.maxValue,
        discountRate: t.rate * 100,       // store as 3.00 = 3%
      }))
    : [{ minValue: 0, maxValue: null, discountRate: plan.rate * 100 }];

  const payload = {
    planType: plan.type === 'fixed' ? 'FIXED' : 'FLEXIBLE',
    tiers,
  };

  if (existingPlanId) {
    const updated = await discountPlansApi.update(existingPlanId, payload);
    return updated.discountPlanId;
  }
  const created = await discountPlansApi.create(payload);
  return created.discountPlanId;
}

// ─────────────────────────────────────────────────────────────
// STATIC PU APPS (no backend endpoint exists)
// ─────────────────────────────────────────────────────────────

const STATIC_PU_APPS: PUApplication[] = [
  {
    id: 'PU0003', type: 'commercial', email: 'pondPharma@example.com',
    submittedAt: '2026-01-15', status: 'pending',
    companyName: 'Pond Pharmacy', companyHouseReg: 'UK10003429CompH',
    directorName: 'Not provided', businessType: 'Pharmacy',
    address: 'Chislehurst, 25 High Street, BR7 5BN',
  },
  {
    id: 'PU-COM-002', type: 'commercial', email: 'meds@rapidhealth.co.uk',
    submittedAt: '2026-02-01', status: 'pending',
    companyName: 'Rapid Health Ltd', companyHouseReg: 'UK20045611CompH',
    directorName: 'Ms Sarah Barnes', businessType: 'Online Pharmacy',
    address: '8 Commerce Park, Bristol BS1 4AB',
  },
];

// ─────────────────────────────────────────────────────────────
// CONTEXT TYPES
// ─────────────────────────────────────────────────────────────

export interface AppDataContextValue {
  merchants:  Merchant[];
  catalogue:  CatalogueItem[];
  orders:     Order[];
  invoices:   Invoice[];
  payments:   Payment[];
  puApps:     PUApplication[];
  loading:    boolean;
  error:      string | null;

  refreshAll:       () => Promise<void>;
  refreshOrders:    () => Promise<void>;
  refreshAccounts:  () => Promise<void>;
  refreshCatalogue: () => Promise<void>;
  refreshInvoices:  () => Promise<void>;

  addMerchant:       (m: Omit<Merchant, 'id'>) => Promise<void>;
  updateMerchant:    (id: string, updates: Partial<Merchant>) => Promise<void>;
  deleteMerchant:    (id: string) => Promise<void>;
  setMerchantStatus: (id: string, status: AccountStatus) => Promise<void>;

  addCatalogueItem:    (item: Omit<CatalogueItem, 'id'>, idOverride?: string) => Promise<void>;
  updateCatalogueItem: (id: string, updates: Partial<CatalogueItem>) => Promise<void>;
  deleteCatalogueItem: (id: string) => Promise<void>;
  restockItem:         (id: string, qty: number) => Promise<void>;

  placeOrder:        (merchantId: string, items: OrderItem[]) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, dispatch?: Order['dispatch']) => Promise<void>;
  markDelivered:     (orderId: string) => Promise<void>;

  recordPayment: (p: Omit<Payment, 'id'>) => Promise<void>;

  processPUApp: (id: string, status: 'approved' | 'rejected', notes?: string, by?: string) => void;

  getMerchantById:    (id: string) => Merchant | undefined;
  getMerchantOrders:  (merchantId: string) => Order[];
  getMerchantInvoices:(merchantId: string) => Invoice[];
  getOverdueMerchants:() => Merchant[];
  getLowStockItems:   () => CatalogueItem[];
  getIncompleteOrders:() => Order[];
}

// ─────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [merchants,  setMerchants]  = useState<Merchant[]>([]);
  const [catalogue,  setCatalogue]  = useState<CatalogueItem[]>([]);
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [invoices,   setInvoices]   = useState<Invoice[]>([]);
  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [puApps,     setPuApps]     = useState<PUApplication[]>(STATIC_PU_APPS);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // ── Loaders ──────────────────────────────────────────────────

  const loadAccounts = useCallback(async () => {
    const raw = await accountsApi.getAll();
    setMerchants(raw.filter(a => a.accountType === 'MERCHANT').map(adaptAccount));
  }, []);

  const loadCatalogue = useCallback(async () => {
    const raw = await catalogueApi.getAll();
    setCatalogue(raw.map(adaptCatalogueItem));
  }, []);

  const loadOrdersAndInvoices = useCallback(async () => {
    const [rawOrders, rawInvoices] = await Promise.all([
      ordersApi.getAll(),
      invoicesApi.getAll(),
    ]);

    const adaptedInvoices = rawInvoices.map(adaptInvoice);
    setInvoices(adaptedInvoices);

    // Build invoice lookup by orderId so we can attach invoiceId to each order
    const invByOrder: Record<string, string> = {};
    rawInvoices.forEach(i => {
      if (i.order?.orderId) invByOrder[i.order.orderId] = i.invoiceId;
    });

    // Build payment lookup: orderId → paid
    const paidOrders = new Set(
      rawInvoices
        .filter(i => i.order?.paymentStatus === 'PAID')
        .map(i => i.order.orderId)
    );

    const adaptedOrders = rawOrders.map(o => {
      const adapted = adaptOrder(o);
      adapted.invoiceId = invByOrder[o.orderId];
      if (paidOrders.has(o.orderId)) {
        adapted.paymentStatus = 'received';
      }
      return adapted;
    });
    setOrders(adaptedOrders);

    // Derive payments list from invoices that have been paid
    // (no GET /api/payments endpoint — reconstruct from invoice/order data)
    const derivedPayments: Payment[] = adaptedInvoices
      .filter(i => i.paymentStatus === 'received')
      .map((i, idx) => ({
        id:         `PAY-${idx + 1}`,
        merchantId: i.merchantId,
        invoiceId:  i.id,
        amount:     i.totalAmount,
        method:     'bank_transfer' as Payment['method'],
        receivedAt: i.paymentReceivedAt ?? i.issuedAt,
        enteredBy:  'accountant',
      }));
    setPayments(derivedPayments);
  }, []);

  const loadInvoices = useCallback(async () => {
    const raw = await invoicesApi.getAll();
    setInvoices(raw.map(adaptInvoice));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadAccounts(), loadCatalogue(), loadOrdersAndInvoices()]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      console.error('AppDataContext: API load failed:', msg);
    } finally {
      setLoading(false);
    }
  }, [loadAccounts, loadCatalogue, loadOrdersAndInvoices]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Merchant ops ─────────────────────────────────────────────

  const addMerchant = useCallback(async (m: Omit<Merchant, 'id'>) => {
    // 1. Create discount plan
    const planId = await syncDiscountPlan(m.discountPlan);

    // 2. Create account
    const created = await accountsApi.create({
      username:      m.loginUsername ?? m.companyName.toLowerCase().replace(/\s+/g, ''),
      password:      'ChangeMe123!',
      accountType:   'MERCHANT',
      accountStatus: 'NORMAL',
      contactName:   m.contactName,
      companyName:   m.companyName,
      address:       [m.address, m.city, m.postcode].filter(Boolean).join(', '),
      phone:         m.phone,
      fax:           m.fax,
      email:         m.email,
    });

    // 3. Assign credit limit and discount plan in parallel
    await Promise.all([
      accountsApi.updateCreditLimit(created.accountId, m.creditLimit),
      accountsApi.assignDiscountPlan(created.accountId, planId),
    ]);

    await loadAccounts();
  }, [loadAccounts]);

  const updateMerchant = useCallback(async (id: string, updates: Partial<Merchant>) => {
    const backendId = parseInt(id, 10);

    // Update contact info if any contact fields changed
    const hasContact = ['contactName','companyName','address','city','postcode','phone','fax','email']
      .some(k => k in updates);
    if (hasContact) {
      await accountsApi.updateContact(backendId, {
        contactName: updates.contactName,
        companyName: updates.companyName,
        address:     [updates.address, updates.city, updates.postcode].filter(Boolean).join(', '),
        phone:       updates.phone,
        fax:         updates.fax,
        email:       updates.email,
      });
    }

    if (updates.creditLimit !== undefined) {
      await accountsApi.updateCreditLimit(backendId, updates.creditLimit);
    }

    if (updates.discountPlan) {
      const existing = merchants.find(m => m.id === id);
      const existingPlanId = (existing as any)?._discountPlanId as number | undefined;
      const planId = await syncDiscountPlan(updates.discountPlan, existingPlanId);
      await accountsApi.assignDiscountPlan(backendId, planId);
    }

    await loadAccounts();
  }, [merchants, loadAccounts]);

  const deleteMerchant = useCallback(async (id: string) => {
    await accountsApi.delete(parseInt(id, 10));
    await loadAll();
  }, [loadAll]);

  const setMerchantStatus = useCallback(async (id: string, status: AccountStatus) => {
    await accountsApi.setStatus(parseInt(id, 10), toApiStatus(status));
    await loadAccounts();
  }, [loadAccounts]);

  // ── Catalogue ops ────────────────────────────────────────────

  const addCatalogueItem = useCallback(async (item: Omit<CatalogueItem, 'id'>, idOverride?: string) => {
    await catalogueApi.create({
      itemId:           idOverride,
      description:      item.description,
      packageType:      item.packageType,
      unit:             item.unit,
      unitsInPack:      item.unitsInPack,
      packageCost:      item.packageCost,
      availability:     item.availability,
      minStockLevel:    item.stockLimit,
      reorderBufferPct: item.bufferPercent,
    });
    await loadCatalogue();
  }, [loadCatalogue]);

  const updateCatalogueItem = useCallback(async (id: string, updates: Partial<CatalogueItem>) => {
    await catalogueApi.update(id, catalogueItemToApi(updates));
    await loadCatalogue();
  }, [loadCatalogue]);

  const deleteCatalogueItem = useCallback(async (id: string) => {
    await catalogueApi.delete(id);
    await loadCatalogue();
  }, [loadCatalogue]);

  const restockItem = useCallback(async (id: string, qty: number) => {
    await catalogueApi.addStock(id, qty, 'warehouse');
    await loadCatalogue();
  }, [loadCatalogue]);

  // ── Order ops ────────────────────────────────────────────────

  const placeOrder = useCallback(async (merchantId: string, items: OrderItem[]): Promise<Order> => {
    const raw = await ordersApi.place({
      accountId: parseInt(merchantId, 10),
      items: items.map(i => ({ itemId: i.itemId, quantity: i.quantity })),
    });
    // Refresh orders (new invoice generated server-side) + catalogue (stock deducted) + accounts (balance updated)
    await Promise.all([loadOrdersAndInvoices(), loadCatalogue(), loadAccounts()]);
    return adaptOrder(raw);
  }, [loadOrdersAndInvoices, loadCatalogue, loadAccounts]);

  const updateOrderStatus = useCallback(async (
    orderId: string,
    status: OrderStatus,
    dispatchDetails?: Order['dispatch'],
  ) => {
    if (status === 'dispatched' && dispatchDetails) {
      // Backend: PUT /api/orders/{id}/dispatch → sets DISPATCHED
      await ordersApi.dispatch(orderId, {
        dispatchedBy:     dispatchDetails.dispatchedBy,
        courier:          dispatchDetails.courier,
        courierRef:       dispatchDetails.courierRef,
        expectedDelivery: dispatchDetails.expectedDelivery,
      });
      await loadOrdersAndInvoices();
    } else if (status === 'delivered') {
      await ordersApi.markDelivered(orderId);
      await loadOrdersAndInvoices();
    } else {
      // accepted → ready_to_dispatch (BEING_PROCESSED): no dedicated endpoint
      // Update optimistically in local state — backend has no intermediate step for this
      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, status, ...(dispatchDetails ? { dispatch: dispatchDetails } : {}) }
          : o
      ));
    }
  }, [loadOrdersAndInvoices]);

  const markDelivered = useCallback(async (orderId: string) => {
    await ordersApi.markDelivered(orderId);
    await loadOrdersAndInvoices();
  }, [loadOrdersAndInvoices]);

  // ── Payment ops ──────────────────────────────────────────────

  const recordPayment = useCallback(async (p: Omit<Payment, 'id'>) => {
    await paymentsApi.record({
      accountId:     parseInt(p.merchantId, 10),
      invoiceId:     p.invoiceId,
      amountPaid:    p.amount,
      paymentMethod: PM_TO_API[p.method] ?? 'BANK_TRANSFER',
      recordedBy:    p.enteredBy,
    });
    // Backend: updates balance, marks invoice/order paid, may auto-restore SUSPENDED→NORMAL
    await Promise.all([loadOrdersAndInvoices(), loadAccounts()]);
  }, [loadOrdersAndInvoices, loadAccounts]);

  // ── PU apps (local only — no backend endpoint) ───────────────

  const processPUApp = useCallback((
    id: string,
    status: 'approved' | 'rejected',
    notes = '',
    by = 'manager',
  ) => {
    setPuApps(prev => prev.map(a =>
      a.id === id
        ? { ...a, status, notes, processedBy: by, processedAt: new Date().toISOString().split('T')[0] }
        : a
    ));
  }, []);

  // ── Derived helpers ──────────────────────────────────────────

  const getMerchantById    = useCallback((id: string) => merchants.find(m => m.id === id), [merchants]);
  const getMerchantOrders  = useCallback((mid: string) => orders.filter(o => o.merchantId === mid), [orders]);
  const getMerchantInvoices = useCallback((mid: string) => invoices.filter(i => i.merchantId === mid), [invoices]);
  const getOverdueMerchants = useCallback(() => merchants.filter(m => m.accountStatus !== 'normal'), [merchants]);
  const getLowStockItems   = useCallback(() => catalogue.filter(c => c.availability < c.stockLimit), [catalogue]);
  const getIncompleteOrders = useCallback(() =>
    orders.filter(o => ['submitted','accepted','ready_to_dispatch','dispatched'].includes(o.status)),
  [orders]);

  const value: AppDataContextValue = {
    merchants, catalogue, orders, invoices, payments, puApps, loading, error,
    refreshAll:       loadAll,
    refreshOrders:    loadOrdersAndInvoices,
    refreshAccounts:  loadAccounts,
    refreshCatalogue: loadCatalogue,
    refreshInvoices:  loadInvoices,
    addMerchant, updateMerchant, deleteMerchant, setMerchantStatus,
    addCatalogueItem, updateCatalogueItem, deleteCatalogueItem, restockItem,
    placeOrder, updateOrderStatus, markDelivered,
    recordPayment,
    processPUApp,
    getMerchantById, getMerchantOrders, getMerchantInvoices,
    getOverdueMerchants, getLowStockItems, getIncompleteOrders,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
