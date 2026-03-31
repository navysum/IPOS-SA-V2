import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, Globe } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, Field, Input } from '@/components/ui/Modal';
import { useAppData } from '@/context/AppDataContext';
import { useAuth } from '@/context/AuthContext';
import type { PUApplication, TableColumn } from '@/types';

export function PUApplicationsPage() {
  const { puApps, processPUApp } = useAppData();
  const { user } = useAuth();
  const [viewApp, setViewApp] = useState<PUApplication | null>(null);
  const [notes, setNotes]     = useState('');

  // Keep viewApp in sync with live state
  const liveView = viewApp ? puApps.find(a => a.id === viewApp.id) ?? null : null;

  const pending  = puApps.filter(a => a.status === 'pending').length;
  const approved = puApps.filter(a => a.status === 'approved').length;
  const rejected = puApps.filter(a => a.status === 'rejected').length;

  const makeDecision = async (app: PUApplication, status: 'approved' | 'rejected') => {
    await processPUApp(app.id, status, notes, user?.username ?? 'manager');
    setViewApp(null);
    setNotes('');
  };

  const statusBadge = (status: PUApplication['status']) => {
    const map = {
      pending:  { label: 'Pending',  variant: 'warning' as const },
      approved: { label: 'Approved', variant: 'success' as const },
      rejected: { label: 'Rejected', variant: 'danger'  as const },
    };
    const { label, variant } = map[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const cols: TableColumn<PUApplication>[] = [
    { key: 'id',          header: 'Application ID', render: r => <span className="mono" style={{ fontSize: '12px', fontWeight: 700 }}>{r.id}</span> },
    { key: 'companyName', header: 'Company',         render: r => <span>{r.companyName ?? '—'}</span> },
    { key: 'email',       header: 'Email',           render: r => <span style={{ fontSize: '12px' }}>{r.email}</span> },
    { key: 'companyHouseReg', header: 'Companies House', render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.companyHouseReg ?? '—'}</span> },
    { key: 'submittedAt', header: 'Submitted',       render: r => <span className="mono" style={{ fontSize: '12px' }}>{r.submittedAt}</span> },
    { key: 'status',      header: 'Status',          render: r => statusBadge(r.status) },
    { key: 'actions',     header: '',
      render: row => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button size="sm" variant="ghost" icon={<Eye size={13} />}
            onClick={e => { e.stopPropagation(); setViewApp(row); setNotes(row.notes ?? ''); }}>
            Review
          </Button>
          {row.status === 'pending' && (
            <>
              <Button size="sm" icon={<CheckCircle size={13} />}
                onClick={e => { e.stopPropagation(); processPUApp(row.id, 'approved', notes, user?.username ?? 'manager'); }}>
                Approve
              </Button>
              <Button size="sm" variant="danger" icon={<XCircle size={13} />}
                onClick={e => { e.stopPropagation(); processPUApp(row.id, 'rejected', notes, user?.username ?? 'manager'); }}>
                Reject
              </Button>
            </>
          )}
        </div>
      ) },
  ];

  return (
    <Page title="PU Commercial Applications"
      subtitle="Commercial membership applications received from IPOS-PU portal">

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
        {[
          { label: 'Pending',  count: pending,  color: 'var(--color-warning)' },
          { label: 'Approved', count: approved, color: 'var(--color-success)' },
          { label: 'Rejected', count: rejected, color: 'var(--color-danger)'  },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <p style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{count}</p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginTop: '2px', fontWeight: 500 }}>{label}</p>
          </div>
        ))}
      </div>

      <Card padding="12px 16px" style={{ borderLeft: '4px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={15} color="var(--color-primary)" />
          <p style={{ fontSize: '13px', color: 'var(--color-text-2)', fontWeight: 500 }}>
            Commercial applications forwarded from IPOS-PU for due diligence. On approval, the applicant
            receives IPOS-SA access credentials by email. Non-commercial applications are handled
            automatically by IPOS-PU.
          </p>
        </div>
      </Card>

      <Table columns={cols} data={puApps} keyField="id"
        onRowClick={row => { setViewApp(row); setNotes(row.notes ?? ''); }}
        emptyMessage="No commercial applications received." />

      {/* Review Modal */}
      <Modal open={!!liveView} onClose={() => { setViewApp(null); setNotes(''); }}
        title={`Application: ${liveView?.companyName ?? liveView?.id}`} width={560}
        footer={
          liveView?.status === 'pending' ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" onClick={() => { setViewApp(null); setNotes(''); }}>Close</Button>
              <Button variant="danger" icon={<XCircle size={14} />} onClick={() => makeDecision(liveView!, 'rejected')}>
                Reject
              </Button>
              <Button icon={<CheckCircle size={14} />} onClick={() => makeDecision(liveView!, 'approved')}>
                Approve &amp; Notify
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => { setViewApp(null); setNotes(''); }}>Close</Button>
          )
        }
      >
        {liveView && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '15px' }}>{liveView.companyName}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginTop: '2px' }}>{liveView.email}</p>
              </div>
              {statusBadge(liveView.status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {([
                ['Application ID',       liveView.id],
                ['Submitted',            liveView.submittedAt],
                ['Companies House Reg.', liveView.companyHouseReg ?? '—'],
                ['Director',             liveView.directorName ?? '—'],
                ['Business Type',        liveView.businessType ?? '—'],
                ['Address',              liveView.address ?? '—'],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</p>
                  <p className="mono" style={{ fontWeight: 500, marginTop: '3px', fontSize: '12px' }}>{value}</p>
                </div>
              ))}
            </div>

            {liveView.status === 'pending' && (
              <Field label="Notes / Due Diligence Comments">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Record any findings from Companies House checks or other due diligence…"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-2)',
                    borderRadius: 'var(--radius-sm)', fontSize: '13px', fontFamily: 'var(--font-ui)',
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
              </Field>
            )}

            {liveView.status !== 'pending' && (
              <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                <p><strong>Decision:</strong> {liveView.status} on {liveView.processedAt} by {liveView.processedBy}</p>
                {liveView.notes && <p style={{ marginTop: '4px', color: 'var(--color-text-2)' }}>{liveView.notes}</p>}
                {liveView.status === 'approved' && (
                  <p style={{ marginTop: '8px', color: 'var(--color-success)', fontWeight: 600 }}>
                    ✓ Applicant notified by email with IPOS-SA access credentials.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Page>
  );
}
