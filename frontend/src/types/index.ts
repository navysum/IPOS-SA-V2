// ─────────────────────────────────────────────
// IPOS-SA Type Definitions
// ─────────────────────────────────────────────

// ── Auth & Users ──────────────────────────────

// Roles per IPOS_SA.pdf sample data
export type UserRole = 'admin' | 'manager' | 'clerk' | 'warehouse' | 'delivery' | 'merchant';

export type AccountStatus = 'normal' | 'suspended' | 'in_default';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  merchantId?: string;
}

// ── Merchant ──────────────────────────────────

export type DiscountPlanType = 'fixed' | 'flexible';

export interface FixedDiscountPlan {
  type: 'fixed';
  rate: number; // 0.03 = 3%
}

export interface FlexibleDiscountTier {
  minValue: number;
  maxValue: number | null;
  rate: number;
}

export interface FlexibleDiscountPlan {
  type: 'flexible';
  tiers: FlexibleDiscountTier[];
}

export type DiscountPlan = FixedDiscountPlan | FlexibleDiscountPlan;

export interface Merchant {
  id: string;
  companyName: string;
  contactName: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  fax?: string;
  email: string;
  iposAccount: string;   // e.g. "ACC0001"
  creditLimit: number;
  currentBalance: number;
  accountStatus: AccountStatus;
  discountPlan: DiscountPlan;
  createdAt: string;
  paymentDueDays: number;
  paymentOverdueDays?: number;
  loginUsername?: string;
}

// ── Catalogue ─────────────────────────────────

export type PackageType = 'box' | 'bottle' | 'tube' | 'sachet' | 'other';
export type UnitType = 'Caps' | 'ml' | 'g' | 'tabs' | 'units';

export interface CatalogueItem {
  id: string;
  description: string;
  packageType: PackageType;
  unit: UnitType;
  unitsInPack: number;
  packageCost: number;
  availability: number;
  stockLimit: number;
  bufferPercent: number;
  isActive: boolean;
}

// ── Orders ────────────────────────────────────

// Spec checklist: accepted → ready_to_dispatch → dispatched → delivered
export type OrderStatus =
  | 'submitted'
  | 'accepted'
  | 'ready_to_dispatch'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'received' | 'overdue';

export interface OrderItem {
  itemId: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface DispatchDetails {
  dispatchedBy: string;
  dispatchedAt: string;
  courier: string;
  courierRef: string;
  expectedDelivery: string;
}

export interface Order {
  id: string;
  merchantId: string;
  merchantName: string;
  orderedAt: string;
  items: OrderItem[];
  subtotal: number;
  discountApplied: number;
  totalAmount: number;
  status: OrderStatus;
  dispatch?: DispatchDetails;
  deliveredAt?: string;
  paymentStatus: PaymentStatus;
  paymentReceivedAt?: string;
  invoiceId?: string;
}

// ── Invoices ──────────────────────────────────

export interface Invoice {
  id: string;
  orderId: string;
  merchantId: string;
  merchantName: string;
  issuedAt: string;
  dueDate: string;
  items: OrderItem[];
  subtotal: number;
  discountApplied: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentReceivedAt?: string;
  paymentMethod?: 'bank_transfer' | 'card' | 'cheque';
  paymentRef?: string;
}

// ── Payments ──────────────────────────────────

export interface Payment {
  id: string;
  merchantId: string;
  invoiceId: string;
  amount: number;
  method: 'bank_transfer' | 'card' | 'cheque';
  receivedAt: string;
  enteredBy: string;
  ref?: string;
}

// ── PU Applications ───────────────────────────

export type PUApplicationStatus = 'pending' | 'approved' | 'rejected';
export type PUMembershipType = 'non_commercial' | 'commercial';

export interface PUApplication {
  id: string;
  type: PUMembershipType;
  email: string;
  submittedAt: string;
  status: PUApplicationStatus;
  // commercial only
  companyName?: string;
  companyHouseReg?: string;
  directorName?: string;
  businessType?: string;
  address?: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

// ── Reports ───────────────────────────────────

export interface ReportPeriod {
  startDate: string;
  endDate: string;
}

export interface TurnoverReportRow {
  itemId: string;
  description: string;
  quantitySold: number;
  revenue: number;
}

export interface LowStockReportRow {
  itemId: string;
  description: string;
  availability: number;
  stockLimit: number;
  recommendedMinOrder: number;
}

// ── UI Helpers ────────────────────────────────

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
