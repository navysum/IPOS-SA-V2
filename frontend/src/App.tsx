import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppDataProvider } from '@/context/AppDataContext';
import { LoadingOverlay, ErrorBanner } from '@/components/LoadingOverlay';
import { useAppData } from '@/context/AppDataContext';
import { Sidebar } from '@/components/Layout/Sidebar';
import { LoginPage }                from '@/pages/Login';
import { DashboardPage }            from '@/pages/Dashboard';
import { CatalogueManagementPage }  from '@/pages/catalogue/CatalogueManagement';
import { LowStockPage }             from '@/pages/catalogue/LowStockPage';
import { OrderManagementPage }      from '@/pages/orders/OrderManagement';
import { InvoicesPage }             from '@/pages/orders/InvoicesPage';
import { RemindersPage }            from '@/pages/orders/RemindersPage';
import { MerchantBalancePage }      from '@/pages/orders/MerchantBalancePage';
import { PlaceOrderPage }           from '@/pages/orders/PlaceOrderPage';
import { PaymentsPage }             from '@/pages/orders/PaymentsPage';
import { MonthlyDiscountsPage }     from '@/pages/orders/MonthlyDiscountsPage';
import { AccountManagementPage }    from '@/pages/accounts/AccountManagement';
import { UserManagementPage }       from '@/pages/accounts/UserManagement';
import { PUApplicationsPage }       from '@/pages/accounts/PUApplicationsPage';
import { ReportsPage }              from '@/pages/reports/Reports';
import type { UserRole } from '@/types';

function AppShell() {
  const { loading, error, refreshAll } = useAppData();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {loading && <LoadingOverlay message="Connecting to InfoPharma backend…" />}
      {!loading && error && <ErrorBanner message={error} onRetry={refreshAll} />}
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingTop: !loading && error ? '48px' : 0 }}>
        <Outlet />
      </div>
    </div>
  );
}

function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, hasRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...roles)) {
    return (
      <div style={{ padding:'60px', textAlign:'center' }}>
        <p style={{ fontSize:'18px', fontWeight:700 }}>Access Denied</p>
        <p style={{ color:'var(--color-text-3)', marginTop:'8px' }}>
          Your account role does not have permission to view this page.
        </p>
      </div>
    );
  }
  return <Outlet />;
}

function ComingSoon({ name }: { name: string }) {
  return (
    <div style={{ padding:'60px', textAlign:'center' }}>
      <p style={{ fontSize:'32px', marginBottom:'8px' }}>🚧</p>
      <p style={{ fontSize:'16px', fontWeight:700 }}>{name}</p>
      <p style={{ color:'var(--color-text-3)', marginTop:'8px' }}>Connect to backend API to enable this page.</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<AppShell />}>
        {/* All authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"       element={<DashboardPage />} />
          <Route path="/orders"          element={<OrderManagementPage />} />
          <Route path="/orders/new"      element={<PlaceOrderPage />} />
          <Route path="/orders/invoices" element={<InvoicesPage />} />
        </Route>

        {/* Staff only — not for merchants */}
        <Route element={<ProtectedRoute roles={['admin','manager','clerk','warehouse','delivery']} />}>
          <Route path="/orders/balance"  element={<MerchantBalancePage />} />
          <Route path="/orders/payments" element={<PaymentsPage />} />
        </Route>

        {/* Management staff only */}
        <Route element={<ProtectedRoute roles={['admin','manager']} />}>
          <Route path="/orders/reminders"         element={<RemindersPage />} />
          <Route path="/orders/monthly-discounts" element={<MonthlyDiscountsPage />} />
        </Route>

        {/* Admin only — full system access */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/catalogue"           element={<CatalogueManagementPage />} />
          <Route path="/catalogue/add"       element={<CatalogueManagementPage />} />
          <Route path="/catalogue/low-stock" element={<LowStockPage />} />
          <Route path="/accounts/users"      element={<UserManagementPage />} />
        </Route>

        {/* Admin + Manager */}
        <Route element={<ProtectedRoute roles={['admin','manager']} />}>
          <Route path="/accounts"             element={<AccountManagementPage />} />
          <Route path="/accounts/new"         element={<AccountManagementPage />} />
          <Route path="/accounts/pu-apps"     element={<PUApplicationsPage />} />
          <Route path="/reports"              element={<ReportsPage />} />
          <Route path="/reports/turnover"           element={<ReportsPage />} />
          <Route path="/reports/merchant-summary"   element={<ReportsPage />} />
          <Route path="/reports/merchant-detailed"  element={<ReportsPage />} />
          <Route path="/reports/stock-turnover"     element={<ReportsPage />} />
          <Route path="/reports/invoices"           element={<ReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <AppRoutes />
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
