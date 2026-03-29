import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Field, Select } from '@/components/ui/Modal';
import { AccountStatusBadge } from '@/components/ui/Badge';
import { useAppData } from '@/context/AppDataContext';
import type { TableColumn } from '@/types';

interface LedgerEntry {
  date: string;
  description: string;
  type: 'order' | 'payment';
  amount: number;
  runningBalance: number;
}

export function MerchantBalancePage() {
  const { merchants, orders, payments } = useAppData();
  const [selectedId, setSelectedId] = useState(merchants[0]?.id ?? '');

  const merchant = merchants.find(m => m.id === selectedId)!;

  // Build ledger from real orders and payments
  const merchantOrders   = orders.filter(o => o.merchantId === selectedId).sort((a, b) => a.orderedAt.localeCompare(b.orderedAt));
  const merchantPayments = payments.filter(p => p.merchantId === selectedId).sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));

  const events: { date: string; description: string; type: 'order' | 'payment'; amount: number }[] = [
    ...merchantOrders.map(o => ({ date: o.orderedAt, description: `Order ${o.id} placed`, type: 'order' as const, amount: o.totalAmount })),
    ...merchantPayments.map(p => ({ date: p.receivedAt, description: `Payment received (${p.method.replace('_', ' ')})${p.ref ? ` · ${p.ref}` : ''}`, type: 'payment' as const, amount: p.amount })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const ledger: LedgerEntry[] = [];
  let running = 0;
  for (const e of events) {
    running = e.type === 'order' ? running + e.amount : Math.max(0, running - e.amount);
    ledger.push({ ...e, runningBalance: running });
  }

  const currentBalance  = merchant?.currentBalance ?? 0;
  const totalOrdered    = merchantOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPaid       = merchantPayments.reduce((s, p) => s + p.amount, 0);
  const utilisation     = merchant ? Math.round((currentBalance / merchant.creditLimit) * 100) : 0;

  const cols: TableColumn<LedgerEntry>[] = [
    { key: 'date',        header: 'Date',        render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.date}</span> },
    { key: 'description', header: 'Description' },
    { key: 'type',        header: 'Type',
      render: r => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600,
          color: r.type === 'order' ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {r.type === 'order' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {r.type === 'order' ? 'Order charge' : 'Payment received'}
        </span>
      ) },
    { key: 'amount',         header: 'Amount', align: 'right',
      render: r => (
        <span className="mono" style={{ fontWeight: 600, color: r.type === 'order' ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {r.type === 'order' ? '+' : '−'}£{Math.abs(r.amount).toFixed(2)}
        </span>
      ) },
    { key: 'runningBalance', header: 'Running Balance', align: 'right',
      render: r => (
        <span className="mono" style={{ fontWeight: 700, color: r.runningBalance > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
          £{r.runningBalance.toFixed(2)}
        </span>
      ) },
  ];

  return (
    <Page title="Merchant Balance Monitor" subtitle="Live outstanding balances — updated by orders and payments">
      <Card padding="14px 16px">
        <Field label="Select Merchant">
          <Select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ width: '320px' }}>
            {merchants.map(m => (
              <option key={m.id} value={m.id}>{m.companyName} ({m.iposAccount})</option>
            ))}
          </Select>
        </Field>
        {merchant && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <AccountStatusBadge status={merchant.accountStatus} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>
              Login: <strong>{merchant.loginUsername}</strong>
            </span>
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        <Card>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Current Balance</p>
          <p className="mono" style={{ fontSize: '26px', fontWeight: 700, marginTop: '6px', color: currentBalance > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            £{currentBalance.toFixed(2)}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '4px' }}>outstanding unpaid</p>
        </Card>
        <Card>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Credit Limit</p>
          <p className="mono" style={{ fontSize: '26px', fontWeight: 700, marginTop: '6px' }}>£{merchant?.creditLimit.toLocaleString()}</p>
          <p style={{ fontSize: '11px', marginTop: '4px', color: utilisation > 80 ? 'var(--color-danger)' : 'var(--color-text-3)' }}>
            {utilisation}% utilised
          </p>
        </Card>
        <Card>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Total Ordered</p>
          <p className="mono" style={{ fontSize: '26px', fontWeight: 700, marginTop: '6px', color: 'var(--color-danger)' }}>£{totalOrdered.toFixed(2)}</p>
          <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '4px' }}>{merchantOrders.length} order(s)</p>
        </Card>
        <Card>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Total Paid</p>
          <p className="mono" style={{ fontSize: '26px', fontWeight: 700, marginTop: '6px', color: 'var(--color-success)' }}>£{totalPaid.toFixed(2)}</p>
          <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '4px' }}>{merchantPayments.length} payment(s)</p>
        </Card>
      </div>

      <Card padding="16px">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600 }}>Credit Utilisation</p>
          <p className="mono" style={{ fontSize: '13px', fontWeight: 600,
            color: utilisation > 80 ? 'var(--color-danger)' : utilisation > 50 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            £{currentBalance.toFixed(2)} / £{merchant?.creditLimit.toLocaleString()} ({utilisation}%)
          </p>
        </div>
        <div style={{ height: 12, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(utilisation, 100)}%`,
            background: utilisation > 80 ? 'var(--color-danger)' : utilisation > 50 ? 'var(--color-warning)' : 'var(--color-success)' }} />
        </div>
        {utilisation >= 100 && (
          <p style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: 600, marginTop: '6px' }}>
            ⚠ Credit limit reached — no further orders will be accepted.
          </p>
        )}
      </Card>

      <div>
        <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Balance Ledger — {merchant?.companyName}</p>
        <Table columns={cols} data={ledger} keyField="date" emptyMessage="No transactions recorded." />
        {ledger.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '32px', padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', marginTop: '2px', fontSize: '13px' }}>
            <p>Orders: <strong className="mono">+£{totalOrdered.toFixed(2)}</strong></p>
            <p>Payments: <strong className="mono" style={{ color: 'var(--color-success)' }}>−£{totalPaid.toFixed(2)}</strong></p>
            <p>Balance: <strong className="mono" style={{ color: currentBalance > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>£{currentBalance.toFixed(2)}</strong></p>
          </div>
        )}
      </div>
    </Page>
  );
}
