import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Shield, Edit2, Loader, AlertCircle } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal, Field, Input, Select } from '@/components/ui/Modal';
import { accountsApi } from '@/api/endpoints';
import type { UserRole, TableColumn } from '@/types';

interface StaffAccount {
  accountId: number;
  username: string;
  accountType: 'ADMIN' | 'MANAGER';
  accountStatus: string;
  email: string;
  phone: string;
}

// Frontend display roles that map to backend AccountType
type DisplayRole = 'admin' | 'manager' | 'clerk' | 'warehouse' | 'delivery';

const DISPLAY_ROLES: { value: DisplayRole; label: string; backendType: 'ADMIN' | 'MANAGER' }[] = [
  { value: 'admin',     label: 'Administrator (full access)',     backendType: 'ADMIN'   },
  { value: 'manager',   label: 'Manager / Director of Operations', backendType: 'MANAGER' },
  { value: 'clerk',     label: 'Accountant / Clerk',               backendType: 'MANAGER' },
  { value: 'warehouse', label: 'Warehouse Employee',               backendType: 'MANAGER' },
  { value: 'delivery',  label: 'Delivery Department',              backendType: 'MANAGER' },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN:   'var(--color-danger)',
  MANAGER: 'var(--color-warning)',
};

const TYPE_LABEL: Record<string, string> = {
  ADMIN:   'Administrator',
  MANAGER: 'Manager / Staff',
};

type FormData = { username: string; password: string; role: DisplayRole; email: string; phone: string };
const EMPTY_FORM: FormData = { username: '', password: '', role: 'manager', email: '', phone: '000' };

export function UserManagementPage() {
  const [accounts,  setAccounts]   = useState<StaffAccount[]>([]);
  const [loading,   setLoading]    = useState(true);
  const [err,       setErr]        = useState('');
  const [modalOpen, setModalOpen]  = useState(false);
  const [editAcc,   setEditAcc]    = useState<StaffAccount | null>(null);
  const [form,      setForm]       = useState<FormData>(EMPTY_FORM);
  const [saving,    setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await accountsApi.getAll();
      setAccounts(
        (all as any[])
          .filter(a => a.accountType === 'ADMIN' || a.accountType === 'MANAGER')
          .map(a => ({
            accountId:     a.accountId,
            username:      a.username,
            accountType:   a.accountType,
            accountStatus: a.accountStatus,
            email:         a.email ?? '',
            phone:         a.phone ?? '',
          }))
      );
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditAcc(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (a: StaffAccount) => {
    setEditAcc(a);
    setForm({ username: a.username, password: '', role: a.accountType === 'ADMIN' ? 'admin' : 'manager', email: a.email, phone: a.phone });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.username.trim()) return;
    setSaving(true);
    try {
      const backendType = DISPLAY_ROLES.find(r => r.value === form.role)?.backendType ?? 'MANAGER';
      if (editAcc) {
        // Promote / demote role
        await accountsApi.updateDetails(editAcc.accountId, { accountType: backendType });
        // Update password if provided
        if (form.password.trim()) {
          await accountsApi.updateContact(editAcc.accountId, {
            email: form.email || editAcc.email,
            phone: form.phone || editAcc.phone,
          });
        }
      } else {
        if (!form.password.trim()) { setSaving(false); return; }
        await accountsApi.create({
          username:      form.username.trim(),
          password:      form.password.trim(),
          accountType:   backendType,
          accountStatus: 'NORMAL',
          email:         form.email.trim() || `${form.username}@infopharma.co.uk`,
          phone:         form.phone.trim() || '000',
        });
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: StaffAccount) => {
    if (!confirm(`Remove user account "${a.username}"? This cannot be undone.`)) return;
    try {
      await accountsApi.delete(a.accountId);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const cols: TableColumn<StaffAccount>[] = [
    { key: 'username',    header: 'Username',
      render: r => <span className="mono" style={{ fontWeight: 600 }}>{r.username}</span> },
    { key: 'accountType', header: 'Role',
      render: r => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
          background: (ROLE_COLORS[r.accountType] ?? 'var(--color-primary)') + '18',
          color: ROLE_COLORS[r.accountType] ?? 'var(--color-primary)',
        }}>
          <Shield size={10} />
          {TYPE_LABEL[r.accountType] ?? r.accountType}
        </span>
      ) },
    { key: 'email', header: 'Email',
      render: r => <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>{r.email || '—'}</span> },
    { key: 'accountStatus', header: 'Status',
      render: r => <span style={{ fontSize: '11px', color: r.accountStatus === 'NORMAL' ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>{r.accountStatus}</span> },
    { key: 'actions', header: '',
      render: row => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button size="sm" variant="ghost" icon={<Edit2 size={13} />}
            onClick={e => { e.stopPropagation(); openEdit(row); }}>
            Edit / Promote
          </Button>
          {row.username !== 'Sysdba' && (
            <Button size="sm" variant="danger" icon={<Trash2 size={13} />}
              onClick={e => { e.stopPropagation(); handleDelete(row); }}>
              Remove
            </Button>
          )}
        </div>
      ) },
  ];

  return (
    <Page title="User Management" subtitle="Manage IPOS-SA system user accounts"
      actions={<Button size="sm" icon={<Plus size={14} />} onClick={openAdd}>Create User</Button>}
    >
      {err && (
        <div style={{ padding: '10px 14px', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#991b1b', display: 'flex', gap: '8px' }}>
          <AlertCircle size={14} /> {err}
        </div>
      )}

      {loading
        ? <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>Loading accounts…</p>
        : <Table columns={cols} data={accounts} keyField="accountId" emptyMessage="No user accounts found." />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editAcc ? `Edit User: ${editAcc.username}` : 'Create User Account'} width={460}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editAcc ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Username" required>
            <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
              disabled={!!editAcc} placeholder="e.g. j.smith" />
          </Field>
          <Field label={editAcc ? 'New Password (leave blank to keep)' : 'Password'} required={!editAcc}>
            <Input type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </Field>
          {!editAcc && (
            <Field label="Email">
              <Input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="user@infopharma.co.uk" />
            </Field>
          )}
          <Field label="Role / Access Level" required
            hint="This determines what the user can access in IPOS-SA">
            <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as DisplayRole })}>
              {DISPLAY_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </Field>
          {editAcc && (
            <div style={{ padding: '10px 12px', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--color-primary-dk)' }}>
              Changing the role will immediately update what this user can access (promote or demote).
            </div>
          )}
        </div>
      </Modal>
    </Page>
  );
}
