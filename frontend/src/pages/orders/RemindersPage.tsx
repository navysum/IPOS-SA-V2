import React, { useState } from 'react';
import { Mail, Printer, AlertTriangle, CheckCircle } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AccountStatusBadge } from '@/components/ui/Badge';
import { useAppData } from '@/context/AppDataContext';
import type { TableColumn } from '@/types';

type ReminderStatus = 'no_need' | 'due' | 'sent';

interface DebtorState {
  merchantId: string;
  status1stReminder: ReminderStatus;
  status2ndReminder: ReminderStatus;
  date1stReminder: string;
  date2ndReminder: string;
}

interface ReminderPreview {
  merchantId: string;
  merchantName: string;
  address: string;
  iposAccount: string;
  balance: number;
  invoiceId: string;
  invoiceDate: string;
  type: '1st' | '2nd';
  paymentDue: string;
  generated: string;
}

const addDays = (d: Date, n: number) => {
  const r = new Date(d); r.setDate(r.getDate() + n); return r.toLocaleDateString('en-GB');
};

export function RemindersPage() {
  const { merchants, invoices } = useAppData();
  const today = new Date();

  // Only merchants with overdue invoices are debtors
  const debtorMerchants = merchants.filter(m =>
    m.accountStatus === 'suspended' || m.accountStatus === 'in_default'
  );

  const [reminderStates, setReminderStates] = useState<Record<string, DebtorState>>(() => {
    const init: Record<string, DebtorState> = {};
    debtorMerchants.forEach(m => {
      init[m.id] = {
        merchantId: m.id,
        status1stReminder: m.accountStatus === 'suspended' ? 'due' : 'sent',
        status2ndReminder: m.accountStatus === 'in_default' ? 'due' : 'no_need',
        date1stReminder: 'now',
        date2ndReminder: m.accountStatus === 'in_default' ? 'now' : '',
      };
    });
    return init;
  });

  const [preview, setPreview] = useState<ReminderPreview | null>(null);

  const getUnpaidInvoice = (merchantId: string) =>
    invoices.filter(i => i.merchantId === merchantId && i.paymentStatus !== 'received')
      .sort((a, b) => a.issuedAt.localeCompare(b.issuedAt))[0];

  const generateReminder = (m: typeof debtorMerchants[0]) => {
    const state = reminderStates[m.id];
    if (!state) return;
    const inv = getUnpaidInvoice(m.id);
    let type: '1st' | '2nd' | null = null;
    const updated = { ...state };

    if (state.status1stReminder === 'due') {
      type = '1st';
      updated.status1stReminder = 'sent';
      updated.date2ndReminder = addDays(today, 15);
      updated.status2ndReminder = 'due';
    } else if (state.status2ndReminder === 'due') {
      const dueD = state.date2ndReminder === 'now' ? today : new Date(state.date2ndReminder.split('/').reverse().join('-'));
      if (dueD <= today) {
        type = '2nd';
        updated.status2ndReminder = 'sent';
      }
    }
    if (!type) return;
    setReminderStates(prev => ({ ...prev, [m.id]: updated }));
    setPreview({
      merchantId: m.id,
      merchantName: m.companyName,
      address: `${m.address}, ${m.city} ${m.postcode}`,
      iposAccount: m.iposAccount,
      balance: m.currentBalance,
      invoiceId: inv?.id ?? '—',
      invoiceDate: inv?.issuedAt ?? '—',
      type,
      paymentDue: addDays(today, 7),
      generated: today.toLocaleDateString('en-GB'),
    });
  };

  const formatReminder = (p: ReminderPreview) => {
    const body = p.type === '1st'
      ? `According to our records, it appears that we have not yet received payment of the above invoice, which was raised against ${p.merchantName} on ${p.invoiceDate}, for ordering pharmaceutical goods from InfoPharma Ltd.\n\nWe would appreciate payment at your earliest convenience.`
      : `It appears that we still have not yet received payment of the above invoice, which was raised against ${p.merchantName} on ${p.invoiceDate}, for ordering pharmaceutical goods from InfoPharma Ltd, despite the reminder sent previously.\n\nWe would appreciate it if you would settle this invoice in full by return.`;
    return `Client: ${p.merchantName}               InfoPharma Ltd.,
${p.address}                  19 High St.,
                                             Ashford, Kent

${p.generated}

Dear Client,

${p.type === '1st' ? 'REMINDER' : 'SECOND REMINDER'} - INVOICE NO.: ${p.invoiceId}
IPOS Account: ${p.iposAccount}           Total Amount: £${p.balance.toFixed(2)}

${body}

If you have already sent a payment to us recently, please accept our apologies.

Payment due by: ${p.paymentDue}

    Yours sincerely,
    Director of Operations, InfoPharma Ltd.`.trim();
  };

  interface Row { merchantId: string; merchant: typeof debtorMerchants[0]; state: DebtorState }
  const rows: Row[] = debtorMerchants.map(m => ({ merchantId: m.id, merchant: m, state: reminderStates[m.id] ?? { merchantId: m.id, status1stReminder: 'no_need', status2ndReminder: 'no_need', date1stReminder: '', date2ndReminder: '' } }));

  const cols: TableColumn<Row>[] = [
    { key: 'merchant', header: 'Merchant',     render: r => r.merchant.companyName },
    { key: 'iposAccount', header: 'Account',   render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.merchant.iposAccount}</span> },
    { key: 'balance',     header: 'Amount Owed', align: 'right',
      render: r => <span className="mono" style={{ fontWeight: 700, color: 'var(--color-danger)' }}>£{r.merchant.currentBalance.toFixed(2)}</span> },
    { key: 'status',      header: 'Status',    render: r => <AccountStatusBadge status={r.merchant.accountStatus} /> },
    { key: 'r1',          header: '1st Reminder',
      render: r => <span style={{ fontSize: '12px', fontWeight: 600, color: r.state.status1stReminder === 'due' ? 'var(--color-warning)' : r.state.status1stReminder === 'sent' ? 'var(--color-success)' : 'var(--color-text-3)' }}>
        {r.state.status1stReminder.replace('_', ' ')}
      </span> },
    { key: 'r2',          header: '2nd Reminder',
      render: r => <span style={{ fontSize: '12px', fontWeight: 600, color: r.state.status2ndReminder === 'due' ? 'var(--color-warning)' : r.state.status2ndReminder === 'sent' ? 'var(--color-success)' : 'var(--color-text-3)' }}>
        {r.state.status2ndReminder.replace('_', ' ')}
      </span> },
    { key: 'actions', header: '',
      render: r => {
        const s = r.state;
        const can1st = s.status1stReminder === 'due';
        const can2nd = s.status2ndReminder === 'due';
        return (
          <div style={{ display: 'flex', gap: '6px' }}>
            {can1st && (
              <Button size="sm" icon={<Mail size={13} />}
                onClick={(e) => { e.stopPropagation(); generateReminder(r.merchant); }}>
                Generate 1st
              </Button>
            )}
            {!can1st && can2nd && (
              <Button size="sm" icon={<Mail size={13} />}
                onClick={(e) => { e.stopPropagation(); generateReminder(r.merchant); }}>
                Generate 2nd
              </Button>
            )}
            {!can1st && !can2nd && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                {s.status1stReminder === 'sent' && s.status2ndReminder === 'sent' ? 'Both sent' : 'No action needed'}
              </span>
            )}
          </div>
        );
      } },
  ];

  return (
    <Page title="Debtor Reminders" subtitle="Generate on-demand payment reminders to overdue merchant accounts">
      <Card padding="12px 16px" style={{ borderLeft: '4px solid var(--color-warning)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={16} color="var(--color-warning)" />
          <p style={{ fontSize: '13px', color: 'var(--color-text-2)', fontWeight: 500 }}>
            Reminders are generated on demand. 1st reminder when account suspended.
            2nd reminder 15 days after 1st, if balance remains unpaid. Payment due date = today + 7 days.
          </p>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-3)', fontSize: '13px' }}>
            No debtors requiring reminders at this time.
          </p>
        </Card>
      ) : (
        <Table columns={cols} data={rows} keyField="merchantId" emptyMessage="No debtors." />
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)}
        title={`${preview?.type === '1st' ? 'First' : 'Second'} Reminder — ${preview?.merchantName}`}
        width={620}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" icon={<Printer size={13} />} onClick={() => window.print()}>Print</Button>
            <Button size="sm" icon={<CheckCircle size={13} />} onClick={() => setPreview(null)}>Mark as Sent & Close</Button>
            <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>Close</Button>
          </div>
        }
      >
        {preview && (
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: '12px',
            background: 'var(--color-surface-2)', padding: '16px',
            borderRadius: 'var(--radius-sm)', whiteSpace: 'pre-wrap',
            lineHeight: 1.7, color: 'var(--color-text-1)', border: '1px solid var(--color-border)',
          }}>
            {formatReminder(preview)}
          </pre>
        )}
      </Modal>
    </Page>
  );
}
