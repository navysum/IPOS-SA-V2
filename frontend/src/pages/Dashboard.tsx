import React, { useState } from 'react';
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { StatCard, Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OrderStatusBadge, AccountStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';

export function DashboardPage() {
  const { user } = useAuth();
  const { merchants, orders, catalogue, getLowStockItems, getOverdueMerchants, getIncompleteOrders, invoices } = useAppData();

  const [lowStockDismissed, setLowStockDismissed]           = useState(false);
  const [merchantReminderDismissed, setMerchantReminderDismissed] = useState(false);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── Data from real context ───────────────────
  const lowStockItems    = getLowStockItems();
  const overdueMerchants = getOverdueMerchants();
  const incompleteOrders = getIncompleteOrders();
  const recentOrders     = [...orders].sort((a, b) => b.orderedAt.localeCompare(a.orderedAt)).slice(0, 6);

  // Revenue this calendar month
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const revenueMTD = orders
    .filter(o => o.orderedAt.startsWith(monthStr))
    .reduce((s, o) => s + o.totalAmount, 0);

  // ── Low-stock warning modal on admin/manager login (CAT: 3 marks) ──────────
  const showLowStockWarning =
    !lowStockDismissed &&
    (user?.role === 'admin' || user?.role === 'manager') &&
    lowStockItems.length > 0;

  // ── Merchant overdue reminder on every access (RPT: 4 marks) ───────────────
  // Spec §8.1: "IPOS-SA will generate a reminder on the screen every time the account is accessed by the merchant"
  const merchantAccount = user?.role === 'merchant' && user.merchantId
    ? merchants.find(m => m.iposAccount === user.merchantId || m.loginUsername === user.username)
    : null;
  const showMerchantReminder =
    !!merchantAccount &&
    merchantAccount.accountStatus !== 'normal' &&
    merchantAccount.currentBalance > 0 &&
    !merchantReminderDismissed;

  const merchantUnpaidInv = merchantAccount
    ? invoices.filter(i => i.merchantId === merchantAccount.id && i.paymentStatus !== 'received')
        .sort((a, b) => a.issuedAt.localeCompare(b.issuedAt))[0]
    : null;

  return (
    <Page title="Dashboard" subtitle={today}>

      {/* ── MERCHANT OVERDUE REMINDER (RPT — 4 marks) ──────────────────────── */}
      {/* Shown every time merchant accesses IPOS-SA if they have an overdue balance */}
      <Modal
        open={showMerchantReminder}
        onClose={() => setMerchantReminderDismissed(true)}
        title="⚠ Payment Overdue — Action Required"
        width={520}
        footer={<Button onClick={() => setMerchantReminderDismissed(true)}>Acknowledge</Button>}
      >
        {merchantAccount && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px 14px', background: 'var(--color-warning-bg)', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#92400e' }}>
              <p style={{ fontWeight: 700, marginBottom: '6px' }}>REMINDER — INVOICE OVERDUE</p>
              <p>According to our records, payment has <strong>not</strong> been received for:</p>
              <ul style={{ marginTop: '8px', paddingLeft: '18px', lineHeight: 2 }}>
                {merchantUnpaidInv && <>
                  <li>Invoice: <strong className="mono">{merchantUnpaidInv.id}</strong></li>
                  <li>Raised on: <strong>{merchantUnpaidInv.issuedAt}</strong></li>
                </>}
                <li>Amount outstanding: <strong className="mono">£{merchantAccount.currentBalance.toFixed(2)}</strong></li>
                {merchantAccount.paymentOverdueDays && (
                  <li>Overdue by: <strong>{merchantAccount.paymentOverdueDays} days</strong></li>
                )}
              </ul>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
              Please arrange payment by bank transfer to InfoPharma Ltd as soon as possible.
              If payment has already been sent, please accept our apologies.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-3)', fontStyle: 'italic' }}>
              This reminder appears every time you access IPOS-SA until your balance is cleared.
            </p>
          </div>
        )}
      </Modal>

      {/* ── LOW STOCK MODAL (CAT — 3 marks) ────────────────────────────────── */}
      {/* Shown to admin/manager on login whenever any item is below stock limit */}
      <Modal
        open={showLowStockWarning}
        onClose={() => setLowStockDismissed(true)}
        title={`⚠ Low Stock Alert — ${lowStockItems.length} item${lowStockItems.length !== 1 ? 's' : ''} below minimum`}
        width={540}
        footer={<Button onClick={() => setLowStockDismissed(true)}>Acknowledge &amp; Continue</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
            The following catalogue items are below their minimum stock level and require restocking:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {lowStockItems.map(item => {
              const pct = Math.round((item.availability / item.stockLimit) * 100);
              return (
                <div key={item.id} style={{ padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.description}</span>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-3)', marginLeft: '8px' }}>{item.id}</span>
                    </div>
                    <span className="mono" style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: 700 }}>
                      {item.availability.toLocaleString()} / {item.stockLimit.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 99,
                      background: pct < 50 ? 'var(--color-danger)' : 'var(--color-warning)' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
            Go to <strong>Catalogue → Low Stock Report</strong> for recommended order quantities.
          </p>
        </div>
      </Modal>

      {/* ── Welcome banner ──────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, var(--color-sidebar-bg) 0%, #162032 100%)',
        borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', color: '#fff',
      }}>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 700 }}>Welcome, {user?.username} 👋</p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.55)', marginTop: '2px' }}>
            Here's what's happening at InfoPharma today.
          </p>
        </div>
        <Badge variant="primary">
          {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
        </Badge>
      </div>

      {/* ── Stat cards (live data) ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        <StatCard
          label="Total Orders"
          value={String(orders.length)}
          sub={`${incompleteOrders.length} not completed`}
          icon={<ShoppingCart size={18} />}
          trend={{ value: `${incompleteOrders.length} in progress`, positive: true }}
        />
        <StatCard
          label="Catalogue Items"
          value={String(catalogue.length)}
          sub={`${lowStockItems.length} below stock limit`}
          icon={<Package size={18} />}
          accent={lowStockItems.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'}
        />
        <StatCard
          label="Active Merchants"
          value={String(merchants.length)}
          sub={`${overdueMerchants.length} account${overdueMerchants.length !== 1 ? 's' : ''} suspended/default`}
          icon={<Users size={18} />}
          accent={overdueMerchants.length > 0 ? 'var(--color-warning)' : 'var(--color-success)'}
        />
        <StatCard
          label="Revenue (MTD)"
          value={`£${revenueMTD.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
          icon={<TrendingUp size={18} />}
          accent="var(--color-primary)"
        />
      </div>

      {/* ── Two-column grid ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

        {/* Recent orders — live from context */}
        <Card padding="0">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontWeight: 700, fontSize: '14px' }}>Recent Orders</p>
            <a href="/orders" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>View all →</a>
          </div>
          {recentOrders.length === 0 && (
            <p style={{ padding: '24px 20px', fontSize: '13px', color: 'var(--color-text-3)' }}>No orders yet.</p>
          )}
          {recentOrders.map((order, i) => (
            <div key={order.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', borderBottom: i < recentOrders.length - 1 ? '1px solid var(--color-border)' : 'none', gap: '12px',
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{order.id}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {order.merchantName}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>£{order.totalAmount.toFixed(2)}</span>
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>
          ))}
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Account alerts — live from context */}
          <Card padding="0">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} color="var(--color-warning)" />
              <p style={{ fontWeight: 700, fontSize: '13px' }}>
                Account Alerts {overdueMerchants.length > 0 && (
                  <span style={{ background: 'var(--color-danger)', color: '#fff', borderRadius: '99px', padding: '0 6px', fontSize: '11px', fontWeight: 700, marginLeft: 6 }}>
                    {overdueMerchants.length}
                  </span>
                )}
              </p>
            </div>
            {overdueMerchants.length === 0 && (
              <p style={{ padding: '16px', fontSize: '12px', color: 'var(--color-text-3)' }}>No account alerts.</p>
            )}
            {overdueMerchants.map(m => (
              <div key={m.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600 }}>{m.companyName}</p>
                  <AccountStatusBadge status={m.accountStatus} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                  {m.paymentOverdueDays}d overdue · {m.iposAccount} · <span className="mono">£{m.currentBalance.toFixed(2)}</span>
                </p>
              </div>
            ))}
          </Card>

          {/* Low stock summary — live from context */}
          <Card padding="0">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={15} color={lowStockItems.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'} />
              <p style={{ fontWeight: 700, fontSize: '13px' }}>
                Low Stock ({lowStockItems.length})
              </p>
            </div>
            {lowStockItems.length === 0 && (
              <p style={{ padding: '16px', fontSize: '12px', color: 'var(--color-success)', fontWeight: 500 }}>
                ✓ All items above minimum stock level.
              </p>
            )}
            {lowStockItems.slice(0, 5).map(item => {
              const pct = Math.round((item.availability / item.stockLimit) * 100);
              return (
                <div key={item.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600 }}>{item.description}</p>
                    <p className="mono" style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 600 }}>
                      {item.availability}/{item.stockLimit}
                    </p>
                  </div>
                  <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 99,
                      background: pct < 50 ? 'var(--color-danger)' : 'var(--color-warning)' }} />
                  </div>
                </div>
              );
            })}
            {lowStockItems.length > 5 && (
              <p style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--color-text-3)' }}>
                + {lowStockItems.length - 5} more items below minimum stock.
              </p>
            )}
          </Card>

        </div>
      </div>
    </Page>
  );
}
