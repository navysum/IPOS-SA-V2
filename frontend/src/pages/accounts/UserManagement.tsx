import React, { useState } from 'react';
import { Plus, Trash2, Shield, Edit2 } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal, Field, Input, Select } from '@/components/ui/Modal';
import type { User, UserRole, TableColumn } from '@/types';

type UserWithPass = User & { password: string; createdAt: string };

// ── Exact credentials from IPOS_SA.pdf sample data ───────────────────────────
const INITIAL_USERS: UserWithPass[] = [
  { id:'1', username:'Sysdba',     password:'London_weighting', role:'admin',     createdAt:'2025-01-01' },
  { id:'2', username:'manager',    password:'Get_it_done',      role:'manager',   createdAt:'2025-01-01' },
  { id:'3', username:'accountant', password:'Count_money',      role:'manager',   createdAt:'2025-01-01' },
  { id:'4', username:'clerk',      password:'Paperwork',        role:'clerk',     createdAt:'2025-01-01' },
  { id:'5', username:'warehouse1', password:'Get_a_beer',       role:'warehouse', createdAt:'2025-01-01' },
  { id:'6', username:'warehouse2', password:'Lot_smell',        role:'warehouse', createdAt:'2025-01-01' },
  { id:'7', username:'delivery',   password:'Too_dark',         role:'delivery',  createdAt:'2025-01-01' },
  { id:'8', username:'city',       password:'northampton',      role:'merchant',  merchantId:'ACC0001', createdAt:'2025-01-01' },
  { id:'9', username:'cosymed',    password:'bondstreet',       role:'merchant',  merchantId:'ACC0002', createdAt:'2025-01-01' },
  { id:'10',username:'hello',      password:'there',            role:'merchant',  merchantId:'ACC0003', createdAt:'2025-01-01' },
];

// Must cover every value of UserRole — no missing keys
const ROLE_COLORS: Record<UserRole, string> = {
  admin:     'var(--color-danger)',
  manager:   'var(--color-warning)',
  merchant:  'var(--color-primary)',
  clerk:     'var(--color-success)',
  warehouse: '#8b5cf6',
  delivery:  '#06b6d4',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin:     'Administrator',
  manager:   'Manager / Director',
  merchant:  'Merchant',
  clerk:     'Accountant / Clerk',
  warehouse: 'Warehouse',
  delivery:  'Delivery',
};

type FormData = {
  username: string; password: string;
  role: UserRole; merchantId: string;
};

const EMPTY_FORM: FormData = { username:'', password:'', role:'merchant', merchantId:'' };

export function UserManagementPage() {
  const [users, setUsers]         = useState<UserWithPass[]>(INITIAL_USERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser]   = useState<UserWithPass | null>(null);
  const [form, setForm]           = useState<FormData>(EMPTY_FORM);

  const openAdd = () => { setEditUser(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (u: UserWithPass) => {
    setEditUser(u);
    setForm({ username: u.username, password: '', role: u.role, merchantId: u.merchantId ?? '' });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.username.trim()) return;
    if (editUser) {
      // Promote / demote role, update password if provided
      setUsers(prev => prev.map(u => u.id === editUser.id ? {
        ...u,
        role: form.role,
        merchantId: form.role === 'merchant' ? form.merchantId : undefined,
        password: form.password.trim() ? form.password : u.password,
      } : u));
    } else {
      if (!form.password.trim()) return;
      setUsers(prev => [...prev, {
        id: String(Date.now()), username: form.username, password: form.password,
        role: form.role, merchantId: form.role === 'merchant' ? form.merchantId : undefined,
        createdAt: new Date().toISOString().split('T')[0],
      }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this user account? This cannot be undone.')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const cols: TableColumn<UserWithPass>[] = [
    { key:'username', header:'Username',
      render: r => <span className="mono" style={{ fontWeight:600 }}>{r.username}</span> },
    { key:'role', header:'Role',
      render: r => (
        <span style={{
          display:'inline-flex', alignItems:'center', gap:'5px',
          padding:'2px 10px', borderRadius:'99px', fontSize:'11px', fontWeight:600,
          background: ROLE_COLORS[r.role] + '18', color: ROLE_COLORS[r.role],
        }}>
          <Shield size={10} />
          {ROLE_LABELS[r.role]}
        </span>
      ) },
    { key:'merchantId', header:'Linked Merchant Account',
      render: r => r.merchantId
        ? <span className="mono" style={{ fontSize:'12px' }}>{r.merchantId}</span>
        : <span style={{ color:'var(--color-text-3)' }}>—</span> },
    { key:'createdAt', header:'Created',
      render: r => <span className="mono" style={{ fontSize:'12px' }}>{r.createdAt}</span> },
    { key:'actions', header:'',
      render: row => (
        <div style={{ display:'flex', gap:'6px' }}>
          <Button size="sm" variant="ghost" icon={<Edit2 size={13} />}
            onClick={e => { e.stopPropagation(); openEdit(row); }}>
            Edit / Promote
          </Button>
          {row.username !== 'Sysdba' && (
            <Button size="sm" variant="danger" icon={<Trash2 size={13} />}
              onClick={e => { e.stopPropagation(); handleDelete(row.id); }}>
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
      <Table columns={cols} data={users} keyField="id" emptyMessage="No user accounts found." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editUser ? `Edit User: ${editUser.username}` : 'Create User Account'} width={460}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editUser ? 'Save Changes' : 'Create Account'}</Button>
          </>
        }
      >
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <Field label="Username" required>
            <Input value={form.username} onChange={e => setForm({...form, username:e.target.value})}
              disabled={!!editUser} placeholder="e.g. j.smith" />
          </Field>
          <Field label={editUser ? 'New Password (leave blank to keep current)' : 'Password'} required={!editUser}>
            <Input type="password" value={form.password}
              onChange={e => setForm({...form, password:e.target.value})} />
          </Field>
          <Field label="Role / Access Level" required hint="This determines what the user can access in IPOS-SA">
            <Select value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}>
              <option value="admin">Administrator (full access)</option>
              <option value="manager">Manager / Director of Operations</option>
              <option value="clerk">Accountant / Clerk</option>
              <option value="warehouse">Warehouse Employee</option>
              <option value="delivery">Delivery Department</option>
              <option value="merchant">Merchant (external)</option>
            </Select>
          </Field>
          {form.role === 'merchant' && (
            <Field label="Linked Merchant Account" hint="e.g. ACC0001">
              <Input value={form.merchantId}
                onChange={e => setForm({...form, merchantId:e.target.value})}
                placeholder="e.g. ACC0001" />
            </Field>
          )}
          {editUser && (
            <div style={{ padding:'10px 12px', background:'var(--color-primary-bg)', borderRadius:'var(--radius-sm)', fontSize:'12px', color:'var(--color-primary-dk)' }}>
              Changing the role will immediately update what this user can access (promote or demote).
            </div>
          )}
        </div>
      </Modal>
    </Page>
  );
}
