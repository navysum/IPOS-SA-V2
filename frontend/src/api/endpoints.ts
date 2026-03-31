/**
 * api/endpoints.ts
 * One typed function per API endpoint.
 * Pages/context call these — never fetch() directly.
 */

import { api } from './client';
import type {
  ApiUserAccount, ApiCatalogueItem, ApiOrder, ApiInvoice,
  ApiPayment, ApiDiscountPlan, ApiLowStockItem, ApiTurnoverReport,
  ApiMerchantOrdersSummary, ApiDetailedOrderReport, ApiStockTurnoverReport,
  ApiDebtorReminderItem,
} from './types';

// ── Accounts ─────────────────────────────────────────────────
export const accountsApi = {
  getAll:            ()      => api.get<ApiUserAccount[]>('/accounts'),
  getOne:            (id: number) => api.get<ApiUserAccount>(`/accounts/${id}`),
  getDebtors:        ()      => api.get<ApiDebtorReminderItem[]>('/accounts/debtors'),
  create:            (body: unknown)  => api.post<ApiUserAccount>('/accounts', body),
  updateContact:     (id: number, body: unknown) => api.put<ApiUserAccount>(`/accounts/${id}`, body),
  updateDetails:     (id: number, body: unknown) => api.put<ApiUserAccount>(`/accounts/${id}/details`, body),
  updateCreditLimit: (id: number, creditLimit: number) =>
    api.put<unknown>(`/accounts/${id}/credit-limit`, { creditLimit }),
  assignDiscountPlan:(id: number, discountPlanId: number) =>
    api.put<unknown>(`/accounts/${id}/discount-plan`, { discountPlanId }),
  setStatus:         (id: number, accountStatus: string) =>
    api.put<ApiUserAccount>(`/accounts/${id}/status`, { accountStatus }),
  delete:            (id: number) => api.delete<void>(`/accounts/${id}`),
};

// ── Discount Plans ───────────────────────────────────────────
export const discountPlansApi = {
  getAll:  ()                    => api.get<ApiDiscountPlan[]>('/discount-plans'),
  create:  (body: unknown)       => api.post<ApiDiscountPlan>('/discount-plans', body),
  update:  (id: number, body: unknown) => api.put<ApiDiscountPlan>(`/discount-plans/${id}`, body),
  delete:  (id: number)          => api.delete<void>(`/discount-plans/${id}`),
};

// ── Catalogue ────────────────────────────────────────────────
export const catalogueApi = {
  getAll:      ()                => api.get<ApiCatalogueItem[]>('/catalogue'),
  search:      (keyword: string) => api.get<ApiCatalogueItem[]>(`/catalogue/search?keyword=${encodeURIComponent(keyword)}`),
  getLowStock: ()                => api.get<ApiLowStockItem[]>('/catalogue/low-stock'),
  getOne:      (id: string)      => api.get<ApiCatalogueItem>(`/catalogue/${id}`),
  create:      (body: unknown)   => api.post<ApiCatalogueItem>('/catalogue', body),
  update:      (id: string, body: unknown) => api.put<ApiCatalogueItem>(`/catalogue/${id}`, body),
  addStock:    (id: string, quantity: number, recordedBy: string) =>
    api.put<void>(`/catalogue/${id}/stock`, { quantity, recordedBy }),
  delete:      (id: string)      => api.delete<void>(`/catalogue/${id}`),
};

// ── Orders ───────────────────────────────────────────────────
export const ordersApi = {
  getAll:            ()              => api.get<ApiOrder[]>('/orders'),
  getIncomplete:     ()              => api.get<ApiOrder[]>('/orders/incomplete'),
  getByAccount:      (accountId: number) => api.get<ApiOrder[]>(`/orders/my?accountId=${accountId}`),
  getOne:            (id: string)    => api.get<ApiOrder>(`/orders/${id}`),
  place:             (body: unknown) => api.post<ApiOrder>('/orders', body),
  markBeingProcessed:(id: string)    => api.put<ApiOrder>(`/orders/${id}/process`),
  dispatch:          (id: string, body: unknown) => api.put<ApiOrder>(`/orders/${id}/dispatch`, body),
  markDelivered:     (id: string)    => api.put<ApiOrder>(`/orders/${id}/delivered`),
};

// ── Invoices ─────────────────────────────────────────────────
export const invoicesApi = {
  getAll:       ()              => api.get<ApiInvoice[]>('/invoices'),
  getOne:       (id: string)    => api.get<ApiInvoice>(`/invoices/${id}`),
  getByAccount: (accountId: number) => api.get<ApiInvoice[]>(`/invoices/account/${accountId}`),
};

// ── Payments ─────────────────────────────────────────────────
export const paymentsApi = {
  record: (body: {
    accountId: number;
    invoiceId: string;
    amountPaid: number;
    paymentMethod: 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
    recordedBy?: string;
  }) => api.post<ApiPayment>('/payments', body),
};

// ── PU Applications ──────────────────────────────────────────
export const puApplicationsApi = {
  getAll:   ()                          => api.get<any[]>('/pu-applications'),
  create:   (body: unknown)             => api.post<any>('/pu-applications', body),
  decide:   (id: string, body: { status: string; notes?: string; processedBy?: string }) =>
    api.put<any>(`/pu-applications/${id}/decision`, body),
};

// ── Monthly Discounts (FLEXIBLE plan settlement) ─────────────
export const monthlyDiscountsApi = {
  getAll:    ()                => api.get<any[]>('/monthly-discounts'),
  getPending:()                => api.get<any[]>('/monthly-discounts/pending'),
  calculate: (month: string) => api.post<any[]>(`/monthly-discounts/calculate?month=${month}`, {}),
  settle:    (id: number, body: { settlementMethod: string }) =>
    api.put<any>(`/monthly-discounts/${id}/settle`, body),
};

// ── Reports ──────────────────────────────────────────────────
export const reportsApi = {
  turnover:         (from: string, to: string) =>
    api.get<ApiTurnoverReport>(`/reports/turnover?from=${from}&to=${to}`),
  merchantSummary:  (id: number, from: string, to: string) =>
    api.get<ApiMerchantOrdersSummary>(`/reports/merchant/${id}/orders?from=${from}&to=${to}`),
  merchantDetailed: (id: number, from: string, to: string) =>
    api.get<ApiDetailedOrderReport>(`/reports/merchant/${id}/orders/detailed?from=${from}&to=${to}`),
  merchantInvoices: (id: number, from: string, to: string) =>
    api.get<ApiInvoice[]>(`/reports/merchant/${id}/invoices?from=${from}&to=${to}`),
  allInvoices:      (from: string, to: string) =>
    api.get<ApiInvoice[]>(`/reports/invoices?from=${from}&to=${to}`),
  stockTurnover:    (from: string, to: string) =>
    api.get<ApiStockTurnoverReport>(`/reports/stock-turnover?from=${from}&to=${to}`),
};
