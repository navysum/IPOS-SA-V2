import React, { useState } from 'react';
import { CreditCard, Plus, Search } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal, Field, Input, Select } from '@/components/ui/Modal';
import { useAppData } from '@/context/AppDataContext';
import { useAuth } from '@/context/AuthContext';
import type { TableColumn } from '@/types';

export function PaymentsPage() {
  const { payments, merchants, invoices, recordPayment } = useAppData();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ merchantId: '', invoiceId: '', amount: '', method: 'bank_transfer', ref: '' });

  const merchantMap = Object.fromEntries(merchants.map(m => [m.id, m.companyName]));

  const filtered = payments.filter(p =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    (merchantMap[p.merchantId] ?? '').toLowerCase().includes(search.toLowerCase()) ||
    p.invoiceId.toLowerCase().includes(search.toLowerCase())
  );

  const merchantInvoices = invoices.filter(i => i.merchantId === form.merchantId && i.paymentStatus !== 'received');

  const handleAdd = async () => {
    if (!form.merchantId || !form.amount) return;
    try {
      await recordPayment({
        merchantId: form.merchantId,
        invoiceId: form.invoiceId,
        amount: parseFloat(form.amount),
        method: form.method as 'bank_transfer' | 'card' | 'cheque',
        receivedAt: new Date().toISOString().split('T')[0],
        enteredBy: user?.username ?? 'accountant',
        ref: form.ref,
      });
      setAddModal(false);
      setForm({ merchantId: '', invoiceId: '', amount: '', method: 'bank_transfer', ref: '' });
    } catch (e) {
      alert(`Failed to record payment: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

  const cols: TableColumn<typeof payments[0]>[] = [
    { key: 'id',         header: 'Payment ID',  render: r => <span className="mono" style={{ fontSize: '12px', fontWeight: 600 }}>{r.id}</span> },
    { key: 'merchantId', header: 'Merchant',     render: r => <span>{merchantMap[r.merchantId] ?? r.merchantId}</span> },
    { key: 'invoiceId',  header: 'Invoice',      render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.invoiceId || '—'}</span> },
    { key: 'amount',     header: 'Amount', align: 'right', render: r => <strong className="mono" style={{ color: 'var(--color-success)' }}>£{r.amount.toFixed(2)}</strong> },
    { key: 'method',     header: 'Method',       render: r => <span style={{ fontSize: '12px' }}>{r.method.replace('_', ' ')}</span> },
    { key: 'receivedAt', header: 'Received',     render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.receivedAt}</span> },
    { key: 'enteredBy',  header: 'Entered By',   render: r => <span style={{ fontSize: '12px' }}>{r.enteredBy}</span> },
    { key: 'ref',        header: 'Reference',    render: r => <span className="mono" style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{r.ref || '—'}</span> },
  ];

  return (
    <Page title="Payment Records" subtitle={`${payments.length} payments · £${totalReceived.toFixed(2)} total received`}
      actions={<Button size="sm" icon={<Plus size={14} />} onClick={() => setAddModal(true)}>Record Payment</Button>}
    >
      <Card padding="12px 16px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color="var(--color-text-3)" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by payment ID, merchant, or invoice…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'var(--font-ui)', background: 'transparent' }} />
        </div>
      </Card>

      <Table columns={cols} data={filtered} keyField="id" emptyMessage="No payment records found." />

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Record New Payment" width={480}
        footer={<>
          <Button variant="ghost" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button icon={<CreditCard size={14} />} onClick={handleAdd}>Record Payment</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Merchant" required>
            <Select value={form.merchantId} onChange={e => setForm({ ...form, merchantId: e.target.value, invoiceId: '' })}>
              <option value="">— Select merchant —</option>
              {merchants.map(m => <option key={m.id} value={m.id}>{m.companyName} ({m.iposAccount})</option>)}
            </Select>
          </Field>
          {form.merchantId && (
            <Field label="Invoice (optional — leave blank to apply to oldest unpaid)">
              <Select value={form.invoiceId} onChange={e => setForm({ ...form, invoiceId: e.target.value })}>
                <option value="">Oldest unpaid invoice</option>
                {merchantInvoices.map(i => (
                  <option key={i.id} value={i.id}>{i.id} · £{i.totalAmount.toFixed(2)} · {i.issuedAt}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Amount Received (£)" required>
            <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Payment Method" required>
            <Select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Credit/Debit Card</option>
              <option value="cheque">Cheque</option>
            </Select>
          </Field>
          <Field label="Reference">
            <Input value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })} placeholder="Transaction ref, BACS ref, or cheque number" />
          </Field>
        </div>
      </Modal>
    </Page>
  );
}
