import React from 'react';
import { Printer } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useAppData } from '@/context/AppDataContext';
import type { TableColumn } from '@/types';

export function LowStockPage() {
  const { getLowStockItems } = useAppData();
  const lowStock = getLowStockItems();

  const rows = lowStock.map(item => ({
    ...item,
    recommendedMinOrder: Math.ceil(item.stockLimit * (1 + item.bufferPercent / 100)) - item.availability,
  }));

  const cols: TableColumn<typeof rows[0]>[] = [
    { key: 'id',          header: 'Item ID',      render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.id}</span> },
    { key: 'description', header: 'Description' },
    { key: 'availability', header: 'Availability', align: 'right',
      render: r => <span className="mono" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{r.availability.toLocaleString()}</span> },
    { key: 'stockLimit',  header: 'Stock Limit',  align: 'right', render: r => <span className="mono">{r.stockLimit.toLocaleString()}</span> },
    { key: 'recommendedMinOrder', header: 'Rec. Min Order', align: 'right',
      render: r => <span className="mono" style={{ fontWeight: 700, color: 'var(--color-warning)' }}>{r.recommendedMinOrder.toLocaleString()}</span> },
  ];

  return (
    <Page title="Low Stock Level Report"
      subtitle={`${lowStock.length} item${lowStock.length !== 1 ? 's' : ''} below minimum stock`}
      actions={<Button size="sm" variant="ghost" icon={<Printer size={14} />} onClick={() => window.print()}>Print Report</Button>}
    >
      {lowStock.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-3)' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>✅</p>
          <p style={{ fontWeight: 600 }}>All items are above their minimum stock levels.</p>
        </div>
      ) : (
        <>
          <div style={{ padding: '10px 14px', background: 'var(--color-warning-bg)', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
            ⚠ {lowStock.length} item{lowStock.length > 1 ? 's are' : ' is'} below minimum stock level. Recommended Min Order = stock limit + {rows[0]?.bufferPercent ?? 10}% buffer.
          </div>
          <Table columns={cols} data={rows} keyField="id" />
          <p style={{ fontSize: '11px', color: 'var(--color-text-3)', textAlign: 'right' }}>
            Generated: {new Date().toLocaleDateString('en-GB')} · By: Director of Operations
          </p>
        </>
      )}
    </Page>
  );
}
