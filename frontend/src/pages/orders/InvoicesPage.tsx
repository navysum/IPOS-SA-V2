import React, { useState } from 'react';
import { Eye, Printer, Search } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal, Field, Select } from '@/components/ui/Modal';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import { useAppData } from '@/context/AppDataContext';
import type { Invoice, TableColumn } from '@/types';

export function InvoicesPage() {
  const { invoices, merchants } = useAppData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [merchantFilter, setMerchantFilter] = useState('all');

  const selectedInvoice = selectedId ? invoices.find(i => i.id === selectedId) ?? null : null;

  const filtered = invoices.filter(inv => {
    const matchSearch =
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.merchantName.toLowerCase().includes(search.toLowerCase()) ||
      inv.orderId.toLowerCase().includes(search.toLowerCase());
    const matchMerchant = merchantFilter === 'all' || inv.merchantId === merchantFilter;
    return matchSearch && matchMerchant;
  });

  const totalOutstanding = invoices.filter(i => i.paymentStatus !== 'received').reduce((s, i) => s + i.totalAmount, 0);

  const cols: TableColumn<Invoice>[] = [
    { key: 'id',           header: 'Invoice No.', render: (r) => <span className="mono" style={{ fontWeight: 700 }}>{r.id}</span> },
    { key: 'orderId',      header: 'Order',       render: (r) => <span className="mono" style={{ fontSize: '12px' }}>{r.orderId}</span> },
    { key: 'merchantName', header: 'Merchant' },
    { key: 'issuedAt',     header: 'Issued',      render: (r) => <span className="mono" style={{ fontSize: '12px' }}>{r.issuedAt}</span> },
    { key: 'dueDate',      header: 'Due',         render: (r) => <span className="mono" style={{ fontSize: '12px' }}>{r.dueDate}</span> },
    { key: 'totalAmount',  header: 'Amount', align: 'right', render: (r) => <span className="mono" style={{ fontWeight: 600 }}>£{r.totalAmount.toFixed(2)}</span> },
    { key: 'paymentStatus', header: 'Payment',    render: (r) => <PaymentStatusBadge status={r.paymentStatus} /> },
    { key: 'actions', header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button size="sm" variant="ghost" icon={<Eye size={13} />}
            onClick={(e) => { e.stopPropagation(); setSelectedId(row.id); }}>View</Button>
          <Button size="sm" variant="ghost" icon={<Printer size={13} />}
            onClick={(e) => { e.stopPropagation(); setSelectedId(row.id); setTimeout(() => window.print(), 300); }}>Print</Button>
        </div>
      ) },
  ];

  return (
    <Page title="Invoices" subtitle={`${invoices.length} invoices · £${totalOutstanding.toFixed(2)} outstanding`}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
        padding: '10px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
        <Search size={15} color="var(--color-text-3)" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by invoice number, order ID, or merchant…"
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'var(--font-ui)', background: 'transparent' }} />
        <Field label="">
          <Select value={merchantFilter} onChange={e => setMerchantFilter(e.target.value)} style={{ width: '220px' }}>
            <option value="all">All Merchants</option>
            {merchants.map(m => <option key={m.id} value={m.id}>{m.companyName}</option>)}
          </Select>
        </Field>
      </div>

      <Table columns={cols} data={filtered} keyField="id"
        onRowClick={(row) => setSelectedId(row.id)}
        emptyMessage="No invoices found." />

      {/* Invoice detail modal */}
      <Modal open={!!selectedInvoice} onClose={() => setSelectedId(null)}
        title={`Invoice ${selectedInvoice?.id}`} width={600}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" icon={<Printer size={13} />} onClick={() => window.print()}>Print Invoice</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>Close</Button>
          </div>
        }
      >
        {selectedInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '15px' }}>{selectedInvoice.merchantName}</p>
                <p style={{ color: 'var(--color-text-2)', fontSize: '12px', marginTop: '2px' }}>
                  IPOS Account: {selectedInvoice.merchantId}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700 }}>InfoPharma Ltd</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>19 High St, Ashford, Kent</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0',
              borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <p className="mono" style={{ fontWeight: 700 }}>INVOICE NO: {selectedInvoice.id}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>Order: {selectedInvoice.orderId}</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-text-2)' }}>
                <p>Issued: {selectedInvoice.issuedAt}</p>
                <p>Due: {selectedInvoice.dueDate}</p>
              </div>
            </div>

            <Table
              columns={[
                { key: 'itemId',      header: 'Item ID',     render: (r) => <span className="mono" style={{ fontSize: '11px' }}>{r.itemId}</span> },
                { key: 'description', header: 'Description' },
                { key: 'quantity',    header: 'Qty',   align: 'right', render: (r) => <span className="mono">{r.quantity}</span> },
                { key: 'unitCost',    header: 'Unit £', align: 'right', render: (r) => <span className="mono">£{r.unitCost.toFixed(2)}</span> },
                { key: 'totalCost',   header: 'Total £', align: 'right', render: (r) => <strong className="mono">£{r.totalCost.toFixed(2)}</strong> },
              ]}
              data={selectedInvoice.items} keyField="itemId"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end',
              paddingTop: '10px', borderTop: '2px solid var(--color-border)' }}>
              <p className="mono">Subtotal: £{selectedInvoice.subtotal.toFixed(2)}</p>
              {selectedInvoice.discountApplied > 0 && (
                <p className="mono" style={{ color: 'var(--color-success)' }}>Discount: −£{selectedInvoice.discountApplied.toFixed(2)}</p>
              )}
              <p className="mono" style={{ fontSize: '16px', fontWeight: 700 }}>
                Amount Due: £{selectedInvoice.totalAmount.toFixed(2)}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <PaymentStatusBadge status={selectedInvoice.paymentStatus} />
              {selectedInvoice.paymentReceivedAt && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
                  Paid {selectedInvoice.paymentReceivedAt} via {selectedInvoice.paymentMethod?.replace('_', ' ')}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
