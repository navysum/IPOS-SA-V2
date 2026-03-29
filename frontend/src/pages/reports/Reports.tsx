/**
 * Reports page — uses dedicated /api/reports/* endpoints for accurate,
 * server-computed data. Falls back to context data where the API
 * doesn't have a dedicated endpoint (low stock is from /api/catalogue/low-stock
 * which is already in the context via getLowStockItems()).
 */
import React, { useState, useCallback } from 'react';
import { FileText, BarChart2, Package, Users, ShoppingCart, Printer, AlertCircle, Loader } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Modal';
import { useAppData } from '@/context/AppDataContext';
import { reportsApi } from '@/api/endpoints';
import type {
  ApiTurnoverReport, ApiMerchantOrdersSummary, ApiDetailedOrderReport,
  ApiInvoice, ApiStockTurnoverReport,
} from '@/api/types';
import type { TableColumn } from '@/types';

// ─────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────

function DateRange({ start, end, onStart, onEnd }: {
  start: string; end: string; onStart: (v: string) => void; onEnd: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
      <Field label="From"><Input type="date" value={start} onChange={e => onStart(e.target.value)} style={{ width: '160px' }} /></Field>
      <Field label="To">  <Input type="date" value={end}   onChange={e => onEnd(e.target.value)}   style={{ width: '160px' }} /></Field>
    </div>
  );
}

function ReportSection({ title, icon, description, children }: {
  title: string; icon: React.ReactNode; description: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card padding="0">
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
        padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-bg)',
          color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: '14px' }}>{title}</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '2px' }}>{description}</p>
        </div>
        <span style={{ fontSize: '20px', color: 'var(--color-text-3)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ paddingTop: '20px' }}>{children}</div>
        </div>
      )}
    </Card>
  );
}

function ReportError({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '12px 14px', background: 'var(--color-danger-bg)', border: '1px solid #fca5a5',
      borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#991b1b', display: 'flex', gap: '8px', alignItems: 'center' }}>
      <AlertCircle size={14} /> {msg}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-3)' }}>
      <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
      Generating report…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// i) TURNOVER REPORT
// ─────────────────────────────────────────────────────────────
function TurnoverReport() {
  const [start, setStart] = useState('2026-01-01');
  const [end,   setEnd]   = useState('2026-12-31');
  const [data,  setData]  = useState<ApiTurnoverReport | null>(null);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  const generate = async () => {
    setBusy(true); setErr(''); setData(null);
    try {
      setData(await reportsApi.turnover(start, end));
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  type Row = ApiTurnoverReport['rows'][0];
  const cols: TableColumn<Row>[] = [
    { key: 'orderId',     header: 'Order ID',   render: r => <span className="mono" style={{ fontWeight: 700 }}>{r.orderId}</span> },
    { key: 'companyName', header: 'Merchant' },
    { key: 'orderDate',   header: 'Date',       render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.orderDate}</span> },
    { key: 'totalValue',  header: 'Amount', align: 'right', render: r => <strong className="mono">£{Number(r.totalValue).toFixed(2)}</strong> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <Button icon={<BarChart2 size={14} />} onClick={generate}>Generate</Button>
        {data && <Button variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>Print</Button>}
      </div>
      {busy && <Spinner />}
      {err  && <ReportError msg={err} />}
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '14px', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: '11px', color: 'var(--color-primary-dk)', fontWeight: 600, textTransform: 'uppercase' }}>Total Orders</p>
              <p className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary-dk)', marginTop: '4px' }}>{data.totalOrders}</p>
            </div>
            <div style={{ padding: '14px', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: '11px', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>Total Revenue</p>
              <p className="mono" style={{ fontSize: '24px', fontWeight: 700, color: '#065f46', marginTop: '4px' }}>£{Number(data.totalRevenue).toFixed(2)}</p>
            </div>
          </div>
          {data.rows.length === 0
            ? <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>No orders in this period.</p>
            : <Table columns={cols} data={data.rows} keyField="orderId" />}
          <p style={{ fontSize: '11px', color: 'var(--color-text-3)', textAlign: 'right' }}>
            Generated: {new Date().toLocaleDateString('en-GB')} · Period: {start} to {end}
          </p>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ii) MERCHANT ORDERS SUMMARY (Appendix 4)
// ─────────────────────────────────────────────────────────────
function MerchantSummaryReport() {
  const { merchants } = useAppData();
  const [merchantId, setMerchantId] = useState('');
  const [start, setStart] = useState('2026-01-01');
  const [end,   setEnd]   = useState('2026-12-31');
  const [data,  setData]  = useState<ApiMerchantOrdersSummary | null>(null);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  const generate = async () => {
    if (!merchantId) { setErr('Please select a merchant.'); return; }
    setBusy(true); setErr(''); setData(null);
    try {
      setData(await reportsApi.merchantSummary(parseInt(merchantId, 10), start, end));
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  type Row = ApiMerchantOrdersSummary['orders'][0];
  const cols: TableColumn<Row>[] = [
    { key: 'orderId',      header: 'Order ID',   render: r => <span className="mono" style={{ fontWeight: 700 }}>{r.orderId}</span> },
    { key: 'orderDate',    header: 'Ordered',    render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.orderDate}</span> },
    { key: 'totalValue',   header: 'Amount (£)', align: 'right', render: r => <span className="mono">£{Number(r.totalValue).toFixed(2)}</span> },
    { key: 'dispatchDate', header: 'Dispatched', render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.dispatchDate ?? 'Pending'}</span> },
    { key: 'deliveryDate', header: 'Delivered',  render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.deliveryDate ?? 'Pending'}</span> },
    { key: 'paymentStatus',header: 'Paid',       render: r => <span className="mono" style={{ fontSize: '12px', color: r.paymentStatus === 'PAID' ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>{r.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}</span> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Field label="Merchant">
          <Select value={merchantId} onChange={e => { setMerchantId(e.target.value); setData(null); }} style={{ width: '260px' }}>
            <option value="">— Select merchant —</option>
            {merchants.map(m => <option key={m.id} value={m.id}>{m.companyName} ({m.iposAccount})</option>)}
          </Select>
        </Field>
        <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <Button icon={<FileText size={14} />} onClick={generate}>Generate</Button>
        {data && <Button variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>Print</Button>}
      </div>
      {busy && <Spinner />}
      {err  && <ReportError msg={err} />}
      {data && (
        <>
          <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            <p style={{ fontWeight: 700 }}>{data.companyName}</p>
            <p style={{ color: 'var(--color-text-3)', fontSize: '11px', marginTop: '4px' }}>Period: {start} to {end}</p>
          </div>
          {data.orders.length === 0
            ? <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>No orders in this period.</p>
            : <Table columns={cols} data={data.orders} keyField="orderId" />}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '32px', padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontSize: '13px' }}>Total Orders: <strong className="mono">{data.orders.length}</strong></p>
            <p style={{ fontSize: '13px' }}>Total Value: <strong className="mono">£{Number(data.totalValue).toFixed(2)}</strong></p>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-3)', textAlign: 'right' }}>Generated: {new Date().toLocaleDateString('en-GB')}</p>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// iii) MERCHANT DETAILED REPORT (Appendix 5)
// ─────────────────────────────────────────────────────────────
function MerchantDetailedReport() {
  const { merchants } = useAppData();
  const [merchantId, setMerchantId] = useState('');
  const [start, setStart] = useState('2026-01-01');
  const [end,   setEnd]   = useState('2026-12-31');
  const [data,  setData]  = useState<ApiDetailedOrderReport | null>(null);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  const generate = async () => {
    if (!merchantId) { setErr('Please select a merchant.'); return; }
    setBusy(true); setErr(''); setData(null);
    try {
      setData(await reportsApi.merchantDetailed(parseInt(merchantId, 10), start, end));
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  type ItemRow = ApiDetailedOrderReport['orders'][0]['items'][0];
  const itemCols: TableColumn<ItemRow>[] = [
    { key: 'itemId',      header: 'Item ID',     render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.itemId}</span> },
    { key: 'description', header: 'Description' },
    { key: 'quantity',    header: 'Qty',     align: 'right', render: r => <span className="mono">{r.quantity}</span> },
    { key: 'unitCost',    header: 'Unit (£)', align: 'right', render: r => <span className="mono">£{Number(r.unitCost).toFixed(2)}</span> },
    { key: 'totalCost',   header: 'Amount',   align: 'right', render: r => <strong className="mono">£{Number(r.totalCost).toFixed(2)}</strong> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Field label="Merchant">
          <Select value={merchantId} onChange={e => { setMerchantId(e.target.value); setData(null); }} style={{ width: '260px' }}>
            <option value="">— Select merchant —</option>
            {merchants.map(m => <option key={m.id} value={m.id}>{m.companyName} ({m.iposAccount})</option>)}
          </Select>
        </Field>
        <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <Button icon={<FileText size={14} />} onClick={generate}>Generate</Button>
        {data && <Button variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>Print</Button>}
      </div>
      {busy && <Spinner />}
      {err  && <ReportError msg={err} />}
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '14px 16px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            <p style={{ fontWeight: 700, fontSize: '14px' }}>{data.companyName}</p>
            <p style={{ color: 'var(--color-text-3)', fontSize: '11px', marginTop: '4px' }}>Period: {start} to {end}</p>
          </div>
          {data.orders.length === 0
            ? <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>No orders in this period.</p>
            : data.orders.map(order => (
              <Card key={order.orderId} padding="0">
                <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span className="mono" style={{ fontWeight: 700 }}>{order.orderId}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-2)', marginLeft: '12px' }}>Ordered: {order.orderDate}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <span>Total: <strong className="mono">£{Number(order.totalValue).toFixed(2)}</strong></span>
                    {Number(order.discountApplied) > 0 && (
                      <span style={{ color: 'var(--color-success)' }}>Discount: −£{Number(order.discountApplied).toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <Table columns={itemCols} data={order.items} keyField="itemId" />
              </Card>
            ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '32px', padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontSize: '13px' }}>Total Orders: <strong className="mono">{data.orders.length}</strong></p>
            <p style={{ fontSize: '13px' }}>Grand Total: <strong className="mono">£{Number(data.grandTotal).toFixed(2)}</strong></p>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-3)', textAlign: 'right' }}>Generated: {new Date().toLocaleDateString('en-GB')} · By: Director of Operations</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// iv–v) INVOICE REPORTS
// ─────────────────────────────────────────────────────────────
function InvoiceReport() {
  const { merchants } = useAppData();
  const [merchantId, setMerchantId] = useState('all');
  const [start, setStart] = useState('2026-01-01');
  const [end,   setEnd]   = useState('2026-12-31');
  const [data,  setData]  = useState<ApiInvoice[] | null>(null);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  const generate = async () => {
    setBusy(true); setErr(''); setData(null);
    try {
      const result = merchantId === 'all'
        ? await reportsApi.allInvoices(start, end)
        : await reportsApi.merchantInvoices(parseInt(merchantId, 10), start, end);
      setData(result);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const total = data?.reduce((s, i) => s + Number(i.amountDue), 0) ?? 0;

  const cols: TableColumn<ApiInvoice>[] = [
    { key: 'invoiceId',   header: 'Invoice',    render: r => <span className="mono" style={{ fontWeight: 700 }}>{r.invoiceId}</span> },
    { key: 'account',     header: 'Merchant',   render: r => <span>{r.account?.companyName ?? '—'}</span> },
    { key: 'invoiceDate', header: 'Issued',     render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.invoiceDate}</span> },
    { key: 'amountDue',   header: 'Amount (£)', align: 'right', render: r => <span className="mono" style={{ fontWeight: 600 }}>£{Number(r.amountDue).toFixed(2)}</span> },
    { key: 'order',       header: 'Status',     render: r => {
        const paid = r.order?.paymentStatus === 'PAID';
        return <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
          background: paid ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
          color: paid ? '#065f46' : '#92400e' }}>{paid ? 'Paid' : 'Pending'}</span>;
      } },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Field label="Merchant">
          <Select value={merchantId} onChange={e => { setMerchantId(e.target.value); setData(null); }} style={{ width: '220px' }}>
            <option value="all">All Merchants</option>
            {merchants.map(m => <option key={m.id} value={m.id}>{m.companyName}</option>)}
          </Select>
        </Field>
        <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <Button icon={<FileText size={14} />} onClick={generate}>Generate</Button>
        {data && <Button variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>Print</Button>}
      </div>
      {busy && <Spinner />}
      {err  && <ReportError msg={err} />}
      {data && (
        <>
          {data.length === 0
            ? <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>No invoices in this period.</p>
            : <Table columns={cols} data={data} keyField="invoiceId" />}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontSize: '13px' }}>Total Invoiced: <strong className="mono">£{total.toFixed(2)}</strong></p>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// vi) STOCK TURNOVER
// ─────────────────────────────────────────────────────────────
function StockTurnoverReport() {
  const [start, setStart] = useState('2026-01-01');
  const [end,   setEnd]   = useState('2026-12-31');
  const [data,  setData]  = useState<ApiStockTurnoverReport | null>(null);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  const generate = async () => {
    setBusy(true); setErr(''); setData(null);
    try { setData(await reportsApi.stockTurnover(start, end)); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  type Row = ApiStockTurnoverReport['rows'][0];
  const cols: TableColumn<Row>[] = [
    { key: 'itemId',            header: 'Item ID',          render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.itemId}</span> },
    { key: 'description',       header: 'Description' },
    { key: 'quantityDelivered', header: 'Received', align: 'right', render: r => <span className="mono" style={{ color: 'var(--color-success)', fontWeight: 600 }}>+{r.quantityDelivered}</span> },
    { key: 'quantitySold',      header: 'Sold',     align: 'right', render: r => <span className="mono" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>−{r.quantitySold}</span> },
    { key: 'netChange',         header: 'Net',      align: 'right', render: r => <strong className="mono" style={{ color: r.netChange >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{r.netChange >= 0 ? `+${r.netChange}` : r.netChange}</strong> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
        <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <Button icon={<BarChart2 size={14} />} onClick={generate}>Generate</Button>
        {data && <Button variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>Print</Button>}
      </div>
      {busy && <Spinner />}
      {err  && <ReportError msg={err} />}
      {data && (
        data.rows.length === 0
          ? <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>No stock movements in this period.</p>
          : <Table columns={cols} data={data.rows} keyField="itemId" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOW STOCK (Appendix 3)
// ─────────────────────────────────────────────────────────────
function LowStockReport() {
  const { getLowStockItems } = useAppData();
  const [generated, setGenerated] = useState(false);
  const items = getLowStockItems();
  const rows = items.map(i => ({
    ...i,
    recommendedMinOrder: Math.ceil(i.stockLimit * (1 + i.bufferPercent / 100)) - i.availability,
  }));

  const cols: TableColumn<typeof rows[0]>[] = [
    { key: 'id',          header: 'Item ID',          render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.id}</span> },
    { key: 'description', header: 'Description' },
    { key: 'availability', header: 'Availability',    align: 'right', render: r => <span className="mono" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{r.availability}</span> },
    { key: 'stockLimit',  header: 'Min Stock Level',  align: 'right', render: r => <span className="mono">{r.stockLimit}</span> },
    { key: 'recommendedMinOrder', header: 'Rec. Min Order', align: 'right', render: r => <strong className="mono" style={{ color: 'var(--color-warning)' }}>{r.recommendedMinOrder}</strong> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button icon={<Package size={14} />} onClick={() => setGenerated(true)}>Generate Now</Button>
        {generated && <Button variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>Print</Button>}
      </div>
      {generated && (
        rows.length === 0
          ? <p style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 500 }}>✅ All items are above minimum stock levels.</p>
          : <>
            <div style={{ padding: '10px 14px', background: 'var(--color-warning-bg)', border: '1px solid #fde68a',
              borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
              ⚠ {rows.length} item{rows.length > 1 ? 's' : ''} below minimum stock level.
            </div>
            <Table columns={cols} data={rows} keyField="id" />
            <p style={{ fontSize: '11px', color: 'var(--color-text-3)', textAlign: 'right' }}>
              Generated: {new Date().toLocaleDateString('en-GB')} · Rec. Min Order = stock limit + {rows[0]?.bufferPercent ?? 10}% buffer
            </p>
          </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export function ReportsPage() {
  return (
    <Page title="Reports" subtitle="Generate and print system reports"
      actions={<Button variant="ghost" size="sm" icon={<Printer size={14} />} onClick={() => window.print()}>Print Page</Button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <ReportSection title="i) Turnover Report" icon={<BarChart2 size={18} />}
          description="Quantities sold and revenue received by InfoPharma for a given period">
          <TurnoverReport />
        </ReportSection>
        <ReportSection title="ii) Merchant Orders Summary (Appendix 4)" icon={<Users size={18} />}
          description="Order ID, date, value, dispatch date, delivery date, payment status per merchant">
          <MerchantSummaryReport />
        </ReportSection>
        <ReportSection title="iii) Merchant Orders Detailed (Appendix 5)" icon={<FileText size={18} />}
          description="Full activity with individual items, quantities, costs, discounts per order">
          <MerchantDetailedReport />
        </ReportSection>
        <ReportSection title="iv–v) Invoice Reports" icon={<FileText size={18} />}
          description="Invoices for a specific merchant or all invoices for a given period">
          <InvoiceReport />
        </ReportSection>
        <ReportSection title="vi) Stock Turnover" icon={<ShoppingCart size={18} />}
          description="Stock received vs goods sold within a given period">
          <StockTurnoverReport />
        </ReportSection>
        <ReportSection title="Low Stock Level Report (Appendix 3)" icon={<Package size={18} />}
          description="All items below minimum stock limit with recommended order quantities">
          <LowStockReport />
        </ReportSection>
      </div>
    </Page>
  );
}
