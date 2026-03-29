import React from 'react';
import type { TableColumn } from '@/types';

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
}

export function Table<T>({
  columns, data, keyField, loading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  stickyHeader = false,
}: TableProps<T>) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead style={{ position: stickyHeader ? 'sticky' : 'static', top: 0, zIndex: 1 }}>
          <tr style={{ background: 'var(--color-surface-2)' }}>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{
                  padding: '10px 14px',
                  textAlign: col.align || 'left',
                  fontWeight: 600,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  color: 'var(--color-text-2)',
                  borderBottom: '1px solid var(--color-border)',
                  whiteSpace: 'nowrap',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center' }}>
                <span className="spinner" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-3)', fontStyle: 'italic' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={String(row[keyField])}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background .12s',
                }}
                onMouseEnter={(e) => { if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-surface-2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    style={{
                      padding: '11px 14px',
                      textAlign: col.align || 'left',
                      color: 'var(--color-text-1)',
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
