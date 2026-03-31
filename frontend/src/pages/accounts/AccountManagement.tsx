import React, { useState } from 'react';
import { Plus, Search, Edit2, Eye, ShieldAlert, ShieldCheck, ShieldOff, Trash2, Printer } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { AccountStatusBadge } from '@/components/ui/Badge';
import { Modal, Field, Input, Select } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import type { Merchant, TableColumn, AccountStatus, DiscountPlan } from '@/types';

type FormData = {
  companyName: string; contactName: string; address: string; city: string;
  postcode: string; phone: string; fax: string; email: string; creditLimit: string;
  loginUsername: string; loginPassword: string;
  discountType: 'fixed' | 'flexible' | 'none';
  fixedRate: string;
  tier1Max: string; tier1Rate: string;
  tier2Max: string; tier2Rate: string;
  tier3Rate: string;
};

const EMPTY_FORM: FormData = {
  companyName: '', contactName: '', address: '', city: '', postcode: '',
  phone: '', fax: '', email: '', creditLimit: '5000',
  loginUsername: '', loginPassword: '',
  discountType: 'fixed', fixedRate: '2',
  tier1Max: '1000', tier1Rate: '0',
  tier2Max: '2000', tier2Rate: '1',
  tier3Rate: '2',
};

function formToDiscountPlan(form: FormData): DiscountPlan {
  if (form.discountType === 'fixed' || form.discountType === 'none')
    return { type: 'fixed', rate: form.discountType === 'none' ? 0 : parseFloat(form.fixedRate) / 100 };
  return {
    type: 'flexible',
    tiers: [
      { minValue: 0,                        maxValue: parseFloat(form.tier1Max), rate: parseFloat(form.tier1Rate) / 100 },
      { minValue: parseFloat(form.tier1Max), maxValue: parseFloat(form.tier2Max), rate: parseFloat(form.tier2Rate) / 100 },
      { minValue: parseFloat(form.tier2Max), maxValue: null,                      rate: parseFloat(form.tier3Rate) / 100 },
    ],
  };
}

function merchantToForm(m: Merchant): FormData {
  const base: FormData = {
    companyName: m.companyName, contactName: m.contactName, address: m.address,
    city: m.city, postcode: m.postcode, phone: m.phone, fax: m.fax ?? '',
    email: m.email, creditLimit: String(m.creditLimit),
    loginUsername: m.loginUsername ?? '', loginPassword: '',
    discountType: m.discountPlan.type === 'flexible' ? 'flexible' : (m.discountPlan.rate === 0 ? 'none' : 'fixed'),
    fixedRate: m.discountPlan.type === 'fixed' ? String(m.discountPlan.rate * 100) : '2',
    tier1Max: '1000', tier1Rate: '0', tier2Max: '2000', tier2Rate: '1', tier3Rate: '2',
  };
  if (m.discountPlan.type === 'flexible' && m.discountPlan.tiers.length >= 3) {
    base.tier1Max  = String(m.discountPlan.tiers[0].maxValue ?? 1000);
    base.tier1Rate = String(m.discountPlan.tiers[0].rate * 100);
    base.tier2Max  = String(m.discountPlan.tiers[1].maxValue ?? 2000);
    base.tier2Rate = String(m.discountPlan.tiers[1].rate * 100);
    base.tier3Rate = String(m.discountPlan.tiers[2].rate * 100);
  }
  return base;
}

export function AccountManagementPage() {
  const { user, hasRole } = useAuth();
  const {
    merchants, addMerchant, updateMerchant, deleteMerchant,
    setMerchantStatus, recordPayment, getMerchantInvoices,
  } = useAppData();
  const isManager = hasRole('admin', 'manager');

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editMerchant, setEditMerchant] = useState<Merchant | null>(null);
  const [viewId, setViewId]             = useState<string | null>(null);
  const [form, setForm]                 = useState<FormData>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<Merchant | null>(null);
  const [payAmount, setPayAmount]       = useState('');
  const [payMethod, setPayMethod]       = useState<'bank_transfer' | 'card' | 'cheque'>('bank_transfer');
  const [payRef, setPayRef]             = useState('');

  // Always get live merchant from context
  const liveView = viewId ? merchants.find(m => m.id === viewId) ?? null : null;

  const filtered = merchants.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.companyName.toLowerCase().includes(q) ||
      m.iposAccount.toLowerCase().includes(q) ||
      m.contactName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.includes(q);
    const matchStatus = statusFilter === 'all' || m.accountStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd  = () => { setEditMerchant(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (m: Merchant) => { setEditMerchant(m); setForm(merchantToForm(m)); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.companyName.trim() || !form.email.trim()) return;
    const plan = formToDiscountPlan(form);
    const nextAcct = `ACC${String(merchants.length + 4).padStart(4, '0')}`;
    try {
      if (editMerchant) {
        await updateMerchant(editMerchant.id, {
          companyName: form.companyName, contactName: form.contactName,
          address: form.address, city: form.city, postcode: form.postcode,
          phone: form.phone, fax: form.fax, email: form.email,
          creditLimit: parseFloat(form.creditLimit), discountPlan: plan,
          loginUsername: form.loginUsername,
        });
      } else {
        await addMerchant({
          companyName: form.companyName, contactName: form.contactName,
          address: form.address, city: form.city, postcode: form.postcode,
          phone: form.phone, fax: form.fax, email: form.email,
          iposAccount: nextAcct, creditLimit: parseFloat(form.creditLimit),
          currentBalance: 0, accountStatus: 'normal', discountPlan: plan,
          createdAt: new Date().toISOString().split('T')[0], paymentDueDays: 30,
          loginUsername: form.loginUsername,
        });
      }
      setModalOpen(false);
    } catch (e) {
      alert(`Failed to save: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleDelete = async (m: Merchant) => {
    try {
      await deleteMerchant(m.id);
      setDeleteConfirm(null);
      setViewId(null);
    } catch (e) {
      alert(`Failed to delete: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const changeStatus = async (id: string, newStatus: AccountStatus) => {
    const merchant = merchants.find(m => m.id === id);
    if (!merchant) return;
    if (merchant.accountStatus === 'in_default' && newStatus === 'normal' && !isManager) {
      alert('Only the Director of Operations (Manager) can restore an In Default account.');
      return;
    }
    try {
      await setMerchantStatus(id, newStatus);
    } catch (e) {
      alert(`Failed to update status: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleRecordPayment = async () => {
    if (!liveView) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) { alert('Enter a valid amount.'); return; }
    const unpaid = getMerchantInvoices(liveView.id)
      .filter(i => i.paymentStatus !== 'received')
      .sort((a, b) => a.issuedAt.localeCompare(b.issuedAt));
    try {
      await recordPayment({
        merchantId: liveView.id,
        invoiceId: unpaid[0]?.id ?? '',
        amount: amt,
        method: payMethod,
        receivedAt: new Date().toISOString().split('T')[0],
        enteredBy: user?.username ?? 'accountant',
        ref: payRef,
      });
      setPayAmount('');
      setPayRef('');
    } catch (e) {
      alert(`Failed to record payment: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const columns: TableColumn<Merchant>[] = [
    { key: 'iposAccount', header: 'Account No.', width: '110px',
      render: (r) => <span className="mono" style={{ fontWeight: 700, fontSize: '12px' }}>{r.iposAccount}</span> },
    { key: 'companyName', header: 'Company' },
    { key: 'contactName', header: 'Contact' },
    { key: 'creditLimit', header: 'Credit Limit', align: 'right',
      render: (r) => <span className="mono">£{r.creditLimit.toLocaleString()}</span> },
    { key: 'currentBalance', header: 'Balance', align: 'right',
      render: (r) => (
        <span className="mono" style={{ fontWeight: 600,
          color: r.currentBalance > 0 ? 'var(--color-warning)' : 'var(--color-text-2)' }}>
          £{r.currentBalance.toFixed(2)}
        </span>
      ) },
    { key: 'discountPlan', header: 'Discount',
      render: (r) => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>
          {r.discountPlan.type === 'fixed'
            ? r.discountPlan.rate === 0 ? 'None' : `Fixed ${(r.discountPlan.rate * 100).toFixed(0)}%`
            : 'Flexible (tiered)'}
        </span>
      ) },
    { key: 'accountStatus', header: 'Status', render: (r) => <AccountStatusBadge status={r.accountStatus} /> },
    { key: 'actions', header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: '5px' }}>
          <Button size="sm" variant="ghost" icon={<Eye size={13} />}
            onClick={(e) => { e.stopPropagation(); setViewId(row.id); setPayAmount(row.currentBalance.toFixed(2)); }}>View</Button>
          <Button size="sm" variant="ghost" icon={<Edit2 size={13} />}
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Edit</Button>
          <Button size="sm" variant="danger" icon={<Trash2 size={13} />}
            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row); }} />
        </div>
      ) },
  ];

  const f = (key: keyof FormData, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <Page title="Merchant Accounts" subtitle={`${merchants.length} registered merchants`}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>Print</Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={openAdd}>New Account</Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        {[
          { label: 'Total',      count: merchants.length,                                            color: 'var(--color-primary)', filter: 'all' },
          { label: 'Normal',     count: merchants.filter(m => m.accountStatus === 'normal').length,     color: 'var(--color-success)', filter: 'normal' },
          { label: 'Suspended',  count: merchants.filter(m => m.accountStatus === 'suspended').length,  color: 'var(--color-warning)', filter: 'suspended' },
          { label: 'In Default', count: merchants.filter(m => m.accountStatus === 'in_default').length, color: 'var(--color-danger)',  filter: 'in_default' },
        ].map(({ label, count, color, filter }) => (
          <button key={label} onClick={() => setStatusFilter(filter as AccountStatus | 'all')}
            style={{ background: 'var(--color-surface)',
              border: `1px solid ${statusFilter === filter ? color : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)', padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}>
            <p style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{count}</p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginTop: '2px', fontWeight: 500 }}>{label}</p>
          </button>
        ))}
      </div>

      <Card padding="12px 16px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color="var(--color-text-3)" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, contact, email, account number, or phone…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'var(--font-ui)', background: 'transparent' }} />
        </div>
      </Card>

      <Table columns={columns} data={filtered} keyField="id"
        onRowClick={(row) => { setViewId(row.id); setPayAmount(row.currentBalance.toFixed(2)); }}
        emptyMessage="No merchant accounts match your search." />

      {/* View Detail Modal */}
      <Modal open={!!liveView} onClose={() => setViewId(null)}
        title={liveView?.companyName ?? ''} width={640}
        footer={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {liveView?.accountStatus === 'suspended' && (
              <Button variant="secondary" size="sm" icon={<ShieldCheck size={13} />}
                onClick={() => changeStatus(liveView!.id, 'normal')}>Restore to Normal</Button>
            )}
            {liveView?.accountStatus === 'in_default' && isManager && liveView.currentBalance <= 0 && (
              <Button variant="secondary" size="sm" icon={<ShieldCheck size={13} />}
                onClick={() => changeStatus(liveView!.id, 'normal')}>Restore (Manager Auth)</Button>
            )}
            {liveView?.accountStatus === 'in_default' && isManager && liveView.currentBalance > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--color-danger)', padding: '6px 8px', fontWeight: 500 }}>
                ⚠ Record full payment before restoring from In Default
              </span>
            )}
            {liveView?.accountStatus === 'in_default' && !isManager && (
              <span style={{ fontSize: '12px', color: 'var(--color-danger)', padding: '6px 8px', fontWeight: 500 }}>
                ⚠ Manager authorisation required
              </span>
            )}
            {liveView?.accountStatus === 'normal' && (
              <Button variant="ghost" size="sm" icon={<ShieldOff size={13} />}
                onClick={() => changeStatus(liveView!.id, 'suspended')}>Suspend</Button>
            )}
            {liveView?.accountStatus === 'suspended' && (
              <Button variant="danger" size="sm" icon={<ShieldAlert size={13} />}
                onClick={() => changeStatus(liveView!.id, 'in_default')}>Mark In Default</Button>
            )}
            {liveView?.discountPlan.type !== 'fixed' || (liveView.discountPlan.type === 'fixed' && liveView.discountPlan.rate > 0) ? (
              <Button variant="ghost" size="sm"
                onClick={async () => {
                  await updateMerchant(liveView!.id, { discountPlan: { type: 'fixed', rate: 0 } });
                }}>Remove Discount Plan</Button>
            ) : null}
            <Button size="sm" icon={<Edit2 size={13} />}
              onClick={() => { setViewId(null); openEdit(liveView!); }}>Edit</Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={13} />}
              onClick={() => { setDeleteConfirm(liveView); setViewId(null); }}>Delete</Button>
            <Button variant="ghost" size="sm" onClick={() => setViewId(null)}>Close</Button>
          </div>
        }
      >
        {liveView && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="mono" style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '4px' }}>
                  IPOS Account: <strong>{liveView.iposAccount}</strong>
                  {liveView.loginUsername && <span style={{ marginLeft: 12 }}>Login: <strong>{liveView.loginUsername}</strong></span>}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                  {liveView.contactName} · {liveView.address}, {liveView.city} {liveView.postcode}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>Tel: {liveView.phone} · {liveView.email}</p>
              </div>
              <AccountStatusBadge status={liveView.accountStatus} />
            </div>

            {liveView.accountStatus !== 'normal' && (
              <div style={{ padding: '10px 14px', background: 'var(--color-danger-bg)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#991b1b' }}>
                ⚠ Account overdue by <strong>{liveView.paymentOverdueDays ?? '?'} days</strong>.
                {liveView.accountStatus === 'in_default'
                  ? ' Director of Operations authorisation required to restore. New orders blocked.'
                  : ' No further orders accepted until balance is cleared.'}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Credit Limit',    value: `£${liveView.creditLimit.toLocaleString()}` },
                { label: 'Current Balance', value: `£${liveView.currentBalance.toFixed(2)}` },
                { label: 'Discount Plan',   value: liveView.discountPlan.type === 'fixed'
                    ? liveView.discountPlan.rate === 0 ? 'None' : `Fixed ${(liveView.discountPlan.rate * 100).toFixed(0)}%`
                    : 'Flexible (tiered)' },
                { label: 'Member Since',    value: liveView.createdAt },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</p>
                  <p className="mono" style={{ fontWeight: 600, marginTop: '4px' }}>{value}</p>
                </div>
              ))}
            </div>

            {liveView.discountPlan.type === 'flexible' && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: '8px' }}>Flexible Discount Tiers (resolved end of calendar month)</p>
                <Table
                  columns={[
                    { key: 'minValue', header: 'Min Order (£)', render: (r) => <span className="mono">£{r.minValue.toLocaleString()}</span> },
                    { key: 'maxValue', header: 'Max Order (£)', render: (r) => <span className="mono">{r.maxValue ? `£${r.maxValue.toLocaleString()}` : '∞'}</span> },
                    { key: 'rate',     header: 'Discount',      render: (r) => <strong className="mono">{(r.rate * 100).toFixed(0)}%</strong> },
                  ]}
                  data={liveView.discountPlan.tiers} keyField="minValue"
                />
                <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '6px' }}>
                  Paid back by cheque or deducted from next order at month-end.
                </p>
              </div>
            )}

            {/* Payment recording panel */}
            <div style={{ padding: '14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>
                Record Payment (Accounting Department)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <Field label="Amount (£)" required>
                  <Input type="number" step="0.01" min="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                </Field>
                <Field label="Payment Method">
                  <Select value={payMethod} onChange={e => setPayMethod(e.target.value as typeof payMethod)}>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="cheque">Cheque</option>
                  </Select>
                </Field>
                <Field label="Reference / Note">
                  <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transaction ref or cheque no." />
                </Field>
              </div>
              <Button size="sm" onClick={handleRecordPayment}>Record Payment</Button>
              {liveView.accountStatus === 'suspended' && liveView.currentBalance > 0 && (
                <p style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '6px', fontWeight: 500 }}>
                  ✓ Full payment will automatically restore account to Normal status.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Merchant Account" width={420}
        footer={<>
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => handleDelete(deleteConfirm!)}>Permanently Delete</Button>
        </>}
      >
        {deleteConfirm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px 14px', background: 'var(--color-danger-bg)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#991b1b' }}>
              <p><strong>Cascaded delete — permanently removes:</strong></p>
              <ul style={{ marginTop: '6px', paddingLeft: '18px', lineHeight: 1.9 }}>
                <li>Merchant: <strong>{deleteConfirm.companyName}</strong> ({deleteConfirm.iposAccount})</li>
                <li>All associated orders and invoices</li>
                <li>Login: <strong>{deleteConfirm.loginUsername}</strong></li>
                <li>All payment history</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editMerchant ? `Edit: ${editMerchant.companyName}` : 'Create Merchant Account'} width={640}
        footer={<>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editMerchant ? 'Save Changes' : 'Create Account'}</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Contact Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Company Name" required><Input value={form.companyName} onChange={(e) => f('companyName', e.target.value)} /></Field>
              <Field label="Contact Name" required><Input value={form.contactName} onChange={(e) => f('contactName', e.target.value)} /></Field>
              <Field label="Email" required><Input type="email" value={form.email} onChange={(e) => f('email', e.target.value)} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => f('phone', e.target.value)} /></Field>
              <Field label="Address"><Input value={form.address} onChange={(e) => f('address', e.target.value)} /></Field>
              <Field label="City"><Input value={form.city} onChange={(e) => f('city', e.target.value)} /></Field>
              <Field label="Postcode"><Input value={form.postcode} onChange={(e) => f('postcode', e.target.value)} /></Field>
              <Field label="Fax"><Input value={form.fax} onChange={(e) => f('fax', e.target.value)} /></Field>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Login Credentials</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Username"><Input value={form.loginUsername} onChange={(e) => f('loginUsername', e.target.value)} /></Field>
              <Field label={editMerchant ? 'New Password (blank = keep current)' : 'Password'} required={!editMerchant}>
                <Input type="password" value={form.loginPassword} onChange={(e) => f('loginPassword', e.target.value)} />
              </Field>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Credit &amp; Discount</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <Field label="Credit Limit (£)" required>
                <Input type="number" min={0} step={500} value={form.creditLimit} onChange={(e) => f('creditLimit', e.target.value)} />
              </Field>
              <Field label="Discount Plan">
                <Select value={form.discountType} onChange={(e) => f('discountType', e.target.value as FormData['discountType'])}>
                  <option value="none">None (0%)</option>
                  <option value="fixed">Fixed Rate (at order time)</option>
                  <option value="flexible">Flexible Tiered (month-end)</option>
                </Select>
              </Field>
            </div>
            {form.discountType === 'fixed' && (
              <Field label="Discount Rate (%)">
                <Input type="number" min={0} max={100} step={0.5} value={form.fixedRate} onChange={(e) => f('fixedRate', e.target.value)} style={{ width: '120px' }} />
              </Field>
            )}
            {form.discountType === 'flexible' && (
              <div style={{ padding: '14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginBottom: '10px', fontWeight: 500 }}>
                  Discount calculated at end of each calendar month.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <Field label="Tier 1 max (£)"><Input type="number" value={form.tier1Max} onChange={(e) => f('tier1Max', e.target.value)} /></Field>
                  <Field label="Tier 1 rate (%)"><Input type="number" value={form.tier1Rate} onChange={(e) => f('tier1Rate', e.target.value)} /></Field>
                  <div />
                  <Field label="Tier 2 max (£)"><Input type="number" value={form.tier2Max} onChange={(e) => f('tier2Max', e.target.value)} /></Field>
                  <Field label="Tier 2 rate (%)"><Input type="number" value={form.tier2Rate} onChange={(e) => f('tier2Rate', e.target.value)} /></Field>
                  <div />
                  <Field label="Tier 3 rate (%)" hint="No upper bound"><Input type="number" value={form.tier3Rate} onChange={(e) => f('tier3Rate', e.target.value)} /></Field>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </Page>
  );
}
