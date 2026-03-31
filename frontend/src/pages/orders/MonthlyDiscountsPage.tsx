/**
 * Monthly Discount Settlement — FLEXIBLE plan merchants only.
 * End-of-month: calculate discount earned, then settle via cheque or order deduction.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal, Field, Select } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { monthlyDiscountsApi } from '@/api/endpoints';
import type { TableColumn } from '@/types';

interface MonthlyDiscount {
  monthlyDiscountId: number;
  account: { accountId: number; companyName: string; iposAccount?: string };
  monthYear: string;
  totalOrdersValue: number;
  discountRateApplied: number;
  discountAmount: number;
  settlementMethod: 'CHEQUE' | 'ORDER_DEDUCTION';
  settled: boolean;
}

export function MonthlyDiscountsPage() {
  const [records,     setRecords]    = useState<MonthlyDiscount[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [err,         setErr]        = useState('');
  const [calcMonth,   setCalcMonth]  = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [calcBusy,    setCalcBusy]   = useState(false);
  const [settling,    setSettling]   = useState<MonthlyDiscount | null>(null);
  const [settleMethod,setSettleMethod]= useState<'CHEQUE' | 'ORDER_DEDUCTION'>('CHEQUE');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await monthlyDiscountsApi.getAll());
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const calculate = async () => {
    setCalcBusy(true);
    try {
      await monthlyDiscountsApi.calculate(calcMonth);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCalcBusy(false);
    }
  };

  const settle = async () => {
    if (!settling) return;
    try {
      await monthlyDiscountsApi.settle(settling.monthlyDiscountId, { settlementMethod: settleMethod });
      setSettling(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const cols: TableColumn<MonthlyDiscount>[] = [
    { key: 'account',            header: 'Merchant',      render: r => <span style={{ fontWeight: 600 }}>{r.account?.companyName ?? '—'}</span> },
    { key: 'monthYear',          header: 'Month',         render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.monthYear?.substring(0, 7)}</span> },
    { key: 'totalOrdersValue',   header: 'Orders Total',  align: 'right', render: r => <span className="mono">£{Number(r.totalOrdersValue).toFixed(2)}</span> },
    { key: 'discountRateApplied',header: 'Rate',          align: 'right', render: r => <span className="mono">{Number(r.discountRateApplied).toFixed(1)}%</span> },
    { key: 'discountAmount',     header: 'Discount Due',  align: 'right', render: r => <strong className="mono" style={{ color: 'var(--color-success)' }}>£{Number(r.discountAmount).toFixed(2)}</strong> },
    { key: 'settlementMethod',   header: 'Method',        render: r => <span style={{ fontSize: '12px' }}>{r.settlementMethod === 'CHEQUE' ? 'Cheque' : 'Order Deduction'}</span> },
    { key: 'settled',            header: 'Status',        render: r => r.settled
        ? <Badge variant="success">Settled</Badge>
        : <Badge variant="warning">Pending</Badge> },
    { key: 'actions', header: '',
      render: r => !r.settled ? (
        <Button size="sm" icon={<CheckCircle size={13} />}
          onClick={e => { e.stopPropagation(); setSettling(r); setSettleMethod(r.settlementMethod); }}>
          Settle
        </Button>
      ) : null },
  ];

  return (
    <Page title="Monthly Flexible Discounts"
      subtitle="End-of-month discount calculation and settlement for FLEXIBLE plan merchants">

      <Card padding="14px 16px">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-3)', marginBottom: '4px', textTransform: 'uppercase' }}>Month to Calculate</p>
            <input type="month" value={calcMonth.substring(0, 7)}
              onChange={e => setCalcMonth(e.target.value + '-01')}
              style={{ padding: '7px 10px', border: '1px solid var(--color-border-2)', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontFamily: 'var(--font-ui)' }}
            />
          </div>
          <Button icon={calcBusy ? <Loader size={14} /> : <Calculator size={14} />}
            onClick={calculate} disabled={calcBusy}>
            {calcBusy ? 'Calculating…' : 'Calculate Discounts'}
          </Button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '8px' }}>
          Totals all FLEXIBLE plan orders for the selected month, applies the tier discount rate, and records a pending settlement.
        </p>
      </Card>

      {err && (
        <div style={{ padding: '10px 14px', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#991b1b', display: 'flex', gap: '8px' }}>
          <AlertCircle size={14} /> {err}
        </div>
      )}

      {loading
        ? <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>Loading…</p>
        : <Table columns={cols} data={records} keyField="monthlyDiscountId"
            emptyMessage="No monthly discounts calculated yet. Select a month and click Calculate." />}

      <Modal open={!!settling} onClose={() => setSettling(null)}
        title={`Settle Discount — ${settling?.account?.companyName}`}
        width={440}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setSettling(null)}>Cancel</Button>
            <Button icon={<CheckCircle size={14} />} onClick={settle}>Confirm Settlement</Button>
          </div>
        }
      >
        {settling && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
              <p>Month: <strong>{settling.monthYear?.substring(0, 7)}</strong></p>
              <p>Orders Total: <strong className="mono">£{Number(settling.totalOrdersValue).toFixed(2)}</strong></p>
              <p>Rate Applied: <strong className="mono">{Number(settling.discountRateApplied).toFixed(1)}%</strong></p>
              <p style={{ marginTop: '8px', fontSize: '15px' }}>
                Discount Due: <strong className="mono" style={{ color: 'var(--color-success)' }}>£{Number(settling.discountAmount).toFixed(2)}</strong>
              </p>
            </div>
            <Field label="Settlement Method">
              <Select value={settleMethod} onChange={e => setSettleMethod(e.target.value as any)}>
                <option value="CHEQUE">Cheque (pay merchant by cheque)</option>
                <option value="ORDER_DEDUCTION">Order Deduction (deduct from merchant balance)</option>
              </Select>
            </Field>
          </div>
        )}
      </Modal>
    </Page>
  );
}
