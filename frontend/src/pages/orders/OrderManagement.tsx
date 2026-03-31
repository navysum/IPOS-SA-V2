import React, { useState } from 'react';
import { Search, Eye, Truck, CreditCard, Clock, FileText, CheckCircle } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { Modal, Field, Input, Select } from '@/components/ui/Modal';
import { useAppData } from '@/context/AppDataContext';
import { useAuth } from '@/context/AuthContext';
import type { Order, TableColumn, OrderStatus } from '@/types';

const STATUS_TABS: { label: string; value: OrderStatus | 'all' | 'incomplete' }[] = [
  { label: 'All',               value: 'all' },
  { label: 'Not Completed',     value: 'incomplete' },
  { label: 'Submitted',         value: 'submitted' },
  { label: 'Accepted',          value: 'accepted' },
  { label: 'Ready to Dispatch', value: 'ready_to_dispatch' },
  { label: 'Dispatched',        value: 'dispatched' },
  { label: 'Delivered',         value: 'delivered' },
];

const INCOMPLETE_STATUSES: OrderStatus[] = ['submitted', 'accepted', 'ready_to_dispatch', 'dispatched'];

export function OrderManagementPage() {
  const { orders, updateOrderStatus, markDelivered, recordPayment, getMerchantById } = useAppData();
  const { user } = useAuth();

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [dispatchModal, setDispatchModal] = useState<Order | null>(null);
  const [paymentModal, setPaymentModal]   = useState<Order | null>(null);
  const [dispatchForm, setDispatchForm]   = useState({ dispatchedBy: '', courier: '', courierRef: '', expectedDelivery: '' });
  const [paymentForm, setPaymentForm]     = useState({ method: 'bank_transfer', ref: '', amount: '' });

  const selectedOrder = selectedId ? orders.find(o => o.id === selectedId) ?? null : null;

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.merchantName.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all'        ? true :
      statusFilter === 'incomplete' ? INCOMPLETE_STATUSES.includes(o.status) :
      o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const incompleteCount = orders.filter(o => INCOMPLETE_STATUSES.includes(o.status)).length;

  const handleDispatch = async () => {
    if (!dispatchModal) return;
    try {
      await updateOrderStatus(dispatchModal.id, 'dispatched', {
        dispatchedBy: dispatchForm.dispatchedBy,
        dispatchedAt: new Date().toISOString().split('T')[0],
        courier: dispatchForm.courier,
        courierRef: dispatchForm.courierRef,
        expectedDelivery: dispatchForm.expectedDelivery,
      });
      setDispatchModal(null);
    } catch (e) {
      alert(`Failed to dispatch: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handlePayment = async () => {
    if (!paymentModal) return;
    try {
      await recordPayment({
        merchantId: paymentModal.merchantId,
        invoiceId: paymentModal.invoiceId ?? '',
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method as 'bank_transfer' | 'card' | 'cheque',
        receivedAt: new Date().toISOString().split('T')[0],
        enteredBy: user?.username ?? 'accountant',
        ref: paymentForm.ref,
      });
      setPaymentModal(null);
    } catch (e) {
      alert(`Failed to record payment: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const cols: TableColumn<Order>[] = [
    { key: 'id', header: 'Order ID', width: '100px',
      render: (r) => <span className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>{r.id}</span> },
    { key: 'merchantName', header: 'Merchant' },
    { key: 'orderedAt', header: 'Ordered',
      render: (r) => <span className="mono" style={{ fontSize: '12px' }}>{r.orderedAt}</span> },
    { key: 'totalAmount', header: 'Amount', align: 'right',
      render: (r) => <span className="mono" style={{ fontWeight: 600 }}>£{r.totalAmount.toFixed(2)}</span> },
    { key: 'status',        header: 'Status',  render: (r) => <OrderStatusBadge  status={r.status} /> },
    { key: 'paymentStatus', header: 'Payment', render: (r) => <PaymentStatusBadge status={r.paymentStatus} /> },
    { key: 'actions', header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: '5px' }}>
          <Button size="sm" variant="ghost" icon={<Eye size={13} />}
            onClick={(e) => { e.stopPropagation(); setSelectedId(row.id); }}>View</Button>
          {row.status === 'accepted' && (
            <Button size="sm" variant="ghost" icon={<Clock size={13} />}
              onClick={(e) => { e.stopPropagation(); updateOrderStatus(row.id, 'ready_to_dispatch'); }}>Process</Button>
          )}
          {row.status === 'ready_to_dispatch' && (
            <Button size="sm" variant="ghost" icon={<Truck size={13} />}
              onClick={(e) => { e.stopPropagation(); setDispatchModal(row); setDispatchForm({ dispatchedBy: '', courier: '', courierRef: '', expectedDelivery: '' }); }}>Dispatch</Button>
          )}
          {row.status === 'dispatched' && (
            <Button size="sm" variant="ghost" icon={<CheckCircle size={13} />}
              onClick={async (e) => { e.stopPropagation(); try { await markDelivered(row.id); } catch (err) { alert(`Failed: ${err instanceof Error ? err.message : String(err)}`); } }}>Delivered</Button>
          )}
          {row.paymentStatus !== 'received' && (row.status === 'delivered' || row.status === 'dispatched') && (
            <Button size="sm" icon={<CreditCard size={13} />}
              onClick={(e) => { e.stopPropagation(); setPaymentModal(row); setPaymentForm({ method: 'bank_transfer', ref: '', amount: String(row.totalAmount) }); }}>
              Pay
            </Button>
          )}
        </div>
      ) },
  ];

  return (
    <Page title="Order Management" subtitle={`${orders.length} total · ${incompleteCount} not completed`}>
      <Card padding="12px 16px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
            <Search size={15} color="var(--color-text-3)" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or merchant…"
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: '13px', fontFamily: 'var(--font-ui)', background: 'transparent' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STATUS_TABS.map((opt) => (
              <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
                style={{
                  padding: '4px 12px', borderRadius: '99px',
                  border: `1px solid ${statusFilter === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: statusFilter === opt.value ? 'var(--color-primary-bg)' : 'transparent',
                  color: statusFilter === opt.value ? 'var(--color-primary-dk)' : 'var(--color-text-2)',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                {opt.value === 'incomplete' && <Clock size={11} />}
                {opt.label}
                {opt.value === 'incomplete' && incompleteCount > 0 && (
                  <span style={{ background: 'var(--color-warning)', color: '#fff', borderRadius: '99px', padding: '0 5px', fontSize: '10px', fontWeight: 700 }}>
                    {incompleteCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Table columns={cols} data={filtered} keyField="id"
        onRowClick={(row) => setSelectedId(row.id)}
        emptyMessage="No orders match your filters." />

      {/* Order Detail */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedId(null)}
        title={`Order ${selectedOrder?.id}`} width={660}
        footer={<Button variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>}
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                ['Merchant', selectedOrder.merchantName],
                ['Ordered',  selectedOrder.orderedAt],
                ['Delivered',selectedOrder.deliveredAt ?? 'Pending'],
                ['Invoice',  selectedOrder.invoiceId ?? 'Not generated'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '13px', fontWeight: 500 }}>{String(value)}</p>
                </div>
              ))}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Status</p>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Payment</p>
                <PaymentStatusBadge status={selectedOrder.paymentStatus} />
              </div>
            </div>

            <Table
              columns={[
                { key: 'itemId',      header: 'Item ID',     render: (r) => <span className="mono" style={{ fontSize: '12px' }}>{r.itemId}</span> },
                { key: 'description', header: 'Description' },
                { key: 'quantity',    header: 'Qty',  align: 'right', render: (r) => <span className="mono">{r.quantity}</span> },
                { key: 'unitCost',    header: 'Unit £', align: 'right', render: (r) => <span className="mono">£{r.unitCost.toFixed(2)}</span> },
                { key: 'totalCost',   header: 'Total £', align: 'right', render: (r) => <strong className="mono">£{r.totalCost.toFixed(2)}</strong> },
              ]}
              data={selectedOrder.items} keyField="itemId" />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
              {selectedOrder.discountApplied > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>Discount</p>
                  <p className="mono" style={{ fontWeight: 600, color: 'var(--color-success)' }}>−£{selectedOrder.discountApplied.toFixed(2)}</p>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>Grand Total</p>
                <p className="mono" style={{ fontWeight: 700, fontSize: '18px' }}>£{selectedOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {selectedOrder.dispatch && (
              <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                <p style={{ fontWeight: 600, marginBottom: '6px' }}>Dispatch Details</p>
                <p>Dispatched by: <strong>{selectedOrder.dispatch.dispatchedBy}</strong> on {selectedOrder.dispatch.dispatchedAt}</p>
                <p>Courier: <strong>{selectedOrder.dispatch.courier}</strong> · Ref: <span className="mono">{selectedOrder.dispatch.courierRef}</span></p>
                <p>Expected delivery: <strong>{selectedOrder.dispatch.expectedDelivery}</strong></p>
              </div>
            )}

            {/* Status progression */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedOrder.status === 'submitted' && (
                <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, 'accepted')}>Accept Order</Button>
              )}
              {selectedOrder.status === 'accepted' && (
                <Button size="sm" variant="ghost" icon={<FileText size={13} />}
                  onClick={() => updateOrderStatus(selectedOrder.id, 'ready_to_dispatch')}>
                  Mark Ready to Dispatch
                </Button>
              )}
              {selectedOrder.status === 'ready_to_dispatch' && (
                <Button size="sm" variant="ghost" icon={<Truck size={13} />}
                  onClick={() => { setDispatchModal(selectedOrder); setSelectedId(null); setDispatchForm({ dispatchedBy: '', courier: '', courierRef: '', expectedDelivery: '' }); }}>
                  Enter Dispatch Details
                </Button>
              )}
              {selectedOrder.status === 'dispatched' && (
                <Button size="sm" variant="ghost" icon={<CheckCircle size={13} />}
                  onClick={async () => { try { await markDelivered(selectedOrder.id); } catch (err) { alert(`Failed: ${err instanceof Error ? err.message : String(err)}`); } }}>
                  Mark Delivered
                </Button>
              )}
              {selectedOrder.paymentStatus !== 'received' && selectedOrder.status === 'delivered' && (
                <Button size="sm" icon={<CreditCard size={14} />}
                  onClick={() => { setPaymentModal(selectedOrder); setSelectedId(null); setPaymentForm({ method: 'bank_transfer', ref: '', amount: String(selectedOrder.totalAmount) }); }}>
                  Record Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Dispatch Modal */}
      <Modal open={!!dispatchModal} onClose={() => setDispatchModal(null)}
        title={`Dispatch Order ${dispatchModal?.id}`} width={480}
        footer={<>
          <Button variant="ghost" onClick={() => setDispatchModal(null)}>Cancel</Button>
          <Button icon={<Truck size={14} />} onClick={handleDispatch}>Confirm Dispatch</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Dispatched By" required>
            <Input value={dispatchForm.dispatchedBy} onChange={(e) => setDispatchForm({ ...dispatchForm, dispatchedBy: e.target.value })} placeholder="Staff member name or username" />
          </Field>
          <Field label="Courier" required>
            <Input value={dispatchForm.courier} onChange={(e) => setDispatchForm({ ...dispatchForm, courier: e.target.value })} placeholder="e.g. DHL, InfoPharma own courier" />
          </Field>
          <Field label="Courier Reference No." required>
            <Input value={dispatchForm.courierRef} onChange={(e) => setDispatchForm({ ...dispatchForm, courierRef: e.target.value })} placeholder="Tracking reference" />
          </Field>
          <Field label="Expected Delivery Date" required>
            <Input type="date" value={dispatchForm.expectedDelivery} onChange={(e) => setDispatchForm({ ...dispatchForm, expectedDelivery: e.target.value })} />
          </Field>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)}
        title={`Record Payment — ${paymentModal?.id}`} width={420}
        footer={<>
          <Button variant="ghost" onClick={() => setPaymentModal(null)}>Cancel</Button>
          <Button icon={<CreditCard size={14} />} onClick={handlePayment}>Record Payment</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            <p>Recording payment for <strong>{paymentModal?.merchantName}</strong></p>
            <p style={{ marginTop: '2px', color: 'var(--color-text-2)' }}>This will update the merchant's account balance accordingly.</p>
          </div>
          <Field label="Amount Received (£)" required>
            <Input type="number" step="0.01" value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
          </Field>
          <Field label="Payment Method" required>
            <Select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Credit/Debit Card</option>
              <option value="cheque">Cheque</option>
            </Select>
          </Field>
          <Field label="Reference / Note">
            <Input value={paymentForm.ref} onChange={(e) => setPaymentForm({ ...paymentForm, ref: e.target.value })} placeholder="Transaction reference or cheque number" />
          </Field>
        </div>
      </Modal>
    </Page>
  );
}
