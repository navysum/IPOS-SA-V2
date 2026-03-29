import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Search, AlertTriangle } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Field, Select, Input } from '@/components/ui/Modal';
import { useAppData, calcDiscount } from '@/context/AppDataContext';
import type { TableColumn, OrderItem } from '@/types';

export function PlaceOrderPage() {
  const { merchants, catalogue, placeOrder } = useAppData();

  const [merchantId, setMerchantId] = useState(merchants[0]?.id ?? '');
  const [search, setSearch]         = useState('');
  const [orderLines, setOrderLines] = useState<OrderItem[]>([]);
  const [submittedId, setSubmittedId] = useState('');

  const merchant = merchants.find(m => m.id === merchantId);
  const activeCatalogue = catalogue.filter(c => c.isActive);

  const filteredCat = activeCatalogue.filter(item =>
    item.id.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = (item: typeof activeCatalogue[0]) => {
    setOrderLines(prev => {
      const existing = prev.find(l => l.itemId === item.id);
      if (existing) return prev.map(l => l.itemId === item.id
        ? { ...l, quantity: l.quantity + 1, totalCost: (l.quantity + 1) * l.unitCost } : l);
      return [...prev, { itemId: item.id, description: item.description, quantity: 1, unitCost: item.packageCost, totalCost: item.packageCost }];
    });
  };

  const updateQty = (itemId: string, qty: number) => {
    if (qty <= 0) setOrderLines(prev => prev.filter(l => l.itemId !== itemId));
    else setOrderLines(prev => prev.map(l => l.itemId === itemId
      ? { ...l, quantity: qty, totalCost: qty * l.unitCost } : l));
  };

  const subtotal = orderLines.reduce((s, l) => s + l.totalCost, 0);
  const discount = merchant ? calcDiscount(merchant.discountPlan, subtotal) : 0;
  const total    = subtotal - discount;

  // Credit check
  const creditRemaining = merchant ? merchant.creditLimit - merchant.currentBalance : 0;
  const creditExceeded  = total > creditRemaining;
  const accountBlocked  = merchant?.accountStatus !== 'normal';

  const handleSubmit = async () => {
    if (orderLines.length === 0) { alert('Please add at least one item.'); return; }
    if (!merchantId) return;
    if (accountBlocked) { alert('This merchant account is suspended or in default. Orders cannot be placed.'); return; }
    if (creditExceeded) { alert('Order total exceeds available credit limit.'); return; }
    const order = await placeOrder(merchantId, orderLines);
    setSubmittedId(order.id);
    setOrderLines([]);
  };

  if (submittedId) {
    return (
      <Page title="Order Submitted" subtitle={`Order ${submittedId} accepted`}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>✅</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-success)' }}>Order {submittedId} Accepted</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginTop: '8px' }}>
              Total: <strong className="mono">£{total.toFixed(2)}</strong> · Invoice generated.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px' }}>
              <Button variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>Print</Button>
              <Button onClick={() => setSubmittedId('')}>Place Another Order</Button>
            </div>
          </div>
        </Card>
      </Page>
    );
  }

  const catalogueCols: TableColumn<typeof activeCatalogue[0]>[] = [
    { key: 'id',          header: 'Item ID',     render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.id}</span> },
    { key: 'description', header: 'Description' },
    { key: 'unitsInPack', header: 'Pack',         align: 'right', render: r => <span className="mono">{r.unitsInPack} {r.unit}</span> },
    { key: 'packageCost', header: 'Cost',         align: 'right', render: r => <span className="mono">£{r.packageCost.toFixed(2)}</span> },
    { key: 'availability', header: 'Available',  align: 'right',
      render: r => <span className="mono" style={{ color: r.availability < r.stockLimit ? 'var(--color-warning)' : 'var(--color-success)' }}>{r.availability.toLocaleString()}</span> },
    { key: 'add', header: '',
      render: row => <Button size="sm" icon={<Plus size={13} />} onClick={e => { e.stopPropagation(); addItem(row); }}>Add</Button> },
  ];

  return (
    <Page title="Place New Order" subtitle="Select merchant and items from the catalogue">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card padding="16px">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Merchant" required>
                <Select value={merchantId} onChange={e => setMerchantId(e.target.value)}>
                  {merchants.map(m => (
                    <option key={m.id} value={m.id}
                      disabled={m.accountStatus !== 'normal'}>
                      {m.companyName} ({m.iposAccount}){m.accountStatus !== 'normal' ? ' — BLOCKED' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Order Date">
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} disabled />
              </Field>
            </div>
            {merchant && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', color: 'var(--color-text-2)' }}>
                <span>Credit limit: <strong className="mono">£{merchant.creditLimit.toLocaleString()}</strong></span>
                <span>Balance: <strong className="mono">£{merchant.currentBalance.toFixed(2)}</strong></span>
                <span style={{ color: creditRemaining < 500 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  Available: <strong className="mono">£{creditRemaining.toFixed(2)}</strong>
                </span>
              </div>
            )}
            {accountBlocked && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#991b1b', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <AlertTriangle size={13} /> Account is {merchant?.accountStatus}. Orders cannot be placed.
              </div>
            )}
          </Card>

          <Card padding="12px 16px">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Search size={15} color="var(--color-text-3)" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search catalogue by item ID or description…"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'var(--font-ui)', background: 'transparent' }} />
            </div>
          </Card>

          <Table columns={catalogueCols} data={filteredCat} keyField="id" emptyMessage="No catalogue items match your search." />
        </div>

        {/* Order basket */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '80px' }}>
          <Card padding="0">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={15} color="var(--color-primary)" />
              <p style={{ fontWeight: 700, fontSize: '13px' }}>Order for {merchant?.companyName}</p>
            </div>

            {orderLines.length === 0 ? (
              <p style={{ padding: '24px 16px', fontSize: '12px', color: 'var(--color-text-3)', textAlign: 'center' }}>
                No items added yet.
              </p>
            ) : (
              <div>
                {orderLines.map(line => (
                  <div key={line.itemId} style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.description}</p>
                        <p className="mono" style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>£{line.unitCost.toFixed(2)} ea</p>
                      </div>
                      <button onClick={() => updateQty(line.itemId, 0)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', flexShrink: 0 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => updateQty(line.itemId, line.quantity - 1)}
                          style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={11} />
                        </button>
                        <span className="mono" style={{ fontSize: '13px', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{line.quantity}</span>
                        <button onClick={() => updateQty(line.itemId, line.quantity + 1)}
                          style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={11} />
                        </button>
                      </div>
                      <span className="mono" style={{ fontSize: '13px', fontWeight: 700 }}>£{line.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Subtotal</span><span className="mono">£{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-success)' }}>
                      <span>Fixed discount</span><span className="mono">−£{discount.toFixed(2)}</span>
                    </div>
                  )}
                  {merchant?.discountPlan.type === 'flexible' && (
                    <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '2px' }}>Flexible discount resolved at month-end</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, borderTop: '1px solid var(--color-border)', paddingTop: '6px', marginTop: '4px' }}>
                    <span>Grand Total</span><span className="mono">£{total.toFixed(2)}</span>
                  </div>
                  {creditExceeded && (
                    <p style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 600, marginTop: '4px' }}>
                      ⚠ Exceeds credit limit by £{(total - creditRemaining).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div style={{ padding: '12px 14px' }}>
              <Button style={{ width: '100%' }} onClick={handleSubmit}
                disabled={orderLines.length === 0 || accountBlocked || creditExceeded}
                icon={<ShoppingCart size={14} />}>
                Submit Order
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
