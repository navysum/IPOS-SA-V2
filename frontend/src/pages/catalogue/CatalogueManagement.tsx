import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package } from 'lucide-react';
import { Page } from '@/components/Layout/Header';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, Field, Input, Select } from '@/components/ui/Modal';
import { useAppData } from '@/context/AppDataContext';
import type { CatalogueItem, TableColumn } from '@/types';

const EMPTY_ITEM: Omit<CatalogueItem, 'id'> = {
  description: '', packageType: 'box', unit: 'Caps',
  unitsInPack: 1, packageCost: 0, availability: 0,
  stockLimit: 0, bufferPercent: 10, isActive: true,
};

export function CatalogueManagementPage() {
  const { catalogue, addCatalogueItem, updateCatalogueItem, deleteCatalogueItem, restockItem, getLowStockItems } = useAppData();

  const [search, setSearch]             = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editItem, setEditItem]         = useState<CatalogueItem | null>(null);
  const [form, setForm]                 = useState<Omit<CatalogueItem, 'id'>>(EMPTY_ITEM);
  const [restockModal, setRestockModal] = useState<CatalogueItem | null>(null);
  const [restockQty, setRestockQty]     = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<CatalogueItem | null>(null);
  const [newItemId, setNewItemId]       = useState('');
  const [saving, setSaving]             = useState(false);

  const filtered = catalogue.filter(
    item => item.id.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = getLowStockItems();

  const openAdd = () => { setEditItem(null); setForm(EMPTY_ITEM); setNewItemId(''); setModalOpen(true); };

  const openEdit = (item: CatalogueItem) => {
    setEditItem(item);
    const { id, ...rest } = item; void id;
    setForm(rest);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateCatalogueItem(editItem.id, form);
      } else {
        await addCatalogueItem(form, newItemId.trim() || undefined);
      }
      setModalOpen(false);
    } catch (e) {
      alert(`Failed to save: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRestock = async () => {
    if (!restockModal) return;
    const qty = parseInt(restockQty);
    if (isNaN(qty) || qty <= 0) { alert('Enter a valid quantity.'); return; }
    try {
      await restockItem(restockModal.id, qty);
      setRestockModal(null);
      setRestockQty('');
    } catch (e) {
      alert(`Failed to restock: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const f = (key: keyof Omit<CatalogueItem, 'id'>, val: string | number | boolean) =>
    setForm(p => ({ ...p, [key]: val }));

  const columns: TableColumn<CatalogueItem>[] = [
    { key: 'id',          header: 'Item ID', width: '120px',
      render: r => <span className="mono" style={{ fontWeight: 700, fontSize: '12px' }}>{r.id}</span> },
    { key: 'description', header: 'Description' },
    { key: 'packageType', header: 'Type',   render: r => <span style={{ textTransform: 'capitalize' }}>{r.packageType}</span> },
    { key: 'unitsInPack', header: 'Pack',  align: 'right', render: r => <span className="mono">{r.unitsInPack} {r.unit}</span> },
    { key: 'packageCost', header: 'Cost',  align: 'right', render: r => <span className="mono">£{r.packageCost.toFixed(2)}</span> },
    { key: 'availability', header: 'Available', align: 'right',
      render: r => (
        <span className="mono" style={{ fontWeight: 600, color: r.availability < r.stockLimit ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {r.availability.toLocaleString()}
          {r.availability < r.stockLimit && <AlertTriangle size={11} style={{ marginLeft: 4, display: 'inline' }} />}
        </span>
      ) },
    { key: 'stockLimit',  header: 'Min Stock', align: 'right', render: r => <span className="mono">{r.stockLimit.toLocaleString()}</span> },
    { key: 'actions',     header: '',
      render: row => (
        <div style={{ display: 'flex', gap: '5px' }}>
          <Button size="sm" variant="ghost" icon={<Package size={13} />}
            onClick={e => { e.stopPropagation(); setRestockModal(row); setRestockQty(''); }}>Restock</Button>
          <Button size="sm" variant="ghost" icon={<Edit2 size={13} />}
            onClick={e => { e.stopPropagation(); openEdit(row); }}>Edit</Button>
          <Button size="sm" variant="danger" icon={<Trash2 size={13} />}
            onClick={e => { e.stopPropagation(); setDeleteConfirm(row); }} />
        </div>
      ) },
  ];

  return (
    <Page title="Catalogue Management" subtitle={`${catalogue.length} items · ${lowStockItems.length} below minimum stock`}
      actions={<Button size="sm" icon={<Plus size={14} />} onClick={openAdd}>Add Item</Button>}
    >
      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'var(--color-warning-bg)', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={16} color="#92400e" />
          <p style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
            ⚠ <strong>{lowStockItems.length} item{lowStockItems.length > 1 ? 's are' : ' is'} below minimum stock level:</strong>{' '}
            {lowStockItems.map(i => i.description).join(', ')}
          </p>
        </div>
      )}

      <Card padding="12px 16px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color="var(--color-text-3)" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by item ID or description…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'var(--font-ui)', background: 'transparent' }} />
        </div>
      </Card>

      <Table columns={columns} data={filtered} keyField="id" emptyMessage="No catalogue items found." />

      {/* Restock Modal */}
      <Modal open={!!restockModal} onClose={() => setRestockModal(null)}
        title={`Restock: ${restockModal?.description}`} width={400}
        footer={<>
          <Button variant="ghost" onClick={() => setRestockModal(null)}>Cancel</Button>
          <Button icon={<Package size={14} />} onClick={handleRestock}>Add Stock</Button>
        </>}
      >
        {restockModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
              <p>Item: <strong>{restockModal.description}</strong> ({restockModal.id})</p>
              <p>Current availability: <strong className="mono">{restockModal.availability.toLocaleString()}</strong></p>
              <p style={{ color: restockModal.availability < restockModal.stockLimit ? 'var(--color-danger)' : 'var(--color-text-2)' }}>
                Minimum stock level: <strong className="mono">{restockModal.stockLimit.toLocaleString()}</strong>
              </p>
            </div>
            <Field label="Packs to Add" required>
              <Input type="number" min={1} value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="e.g. 500" autoFocus />
            </Field>
            {restockQty && !isNaN(parseInt(restockQty)) && (
              <p style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>
                New availability: <strong className="mono">{(restockModal.availability + parseInt(restockQty)).toLocaleString()}</strong>
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Catalogue Item" width={380}
        footer={<>
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" icon={<Trash2 size={14} />} onClick={async () => { if (deleteConfirm) { try { await deleteCatalogueItem(deleteConfirm.id); setDeleteConfirm(null); } catch (e) { alert(`Failed to delete: ${e instanceof Error ? e.message : String(e)}`); } } }}>Delete</Button>
        </>}
      >
        {deleteConfirm && (
          <p style={{ fontSize: '13px' }}>
            Remove <strong>{deleteConfirm.description}</strong> ({deleteConfirm.id}) from the catalogue? This cannot be undone.
          </p>
        )}
      </Modal>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? `Edit: ${editItem.description}` : 'Add Catalogue Item'} width={560}
        footer={<>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Item'}</Button>
        </>}
      >
        {editItem && editItem.availability < editItem.stockLimit && (
          <div style={{ padding: '8px 12px', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#92400e', marginBottom: '14px', display: 'flex', gap: '6px' }}>
            <AlertTriangle size={13} /> This item is currently below its minimum stock level.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {!editItem && (
            <Field label="Item ID" hint="Leave blank for auto-generated">
              <Input value={newItemId} onChange={e => setNewItemId(e.target.value)} placeholder="e.g. 100 00009" />
            </Field>
          )}
          <Field label="Description" required>
            <Input value={form.description} onChange={e => f('description', e.target.value)} placeholder="e.g. Paracetamol" />
          </Field>
          <Field label="Package Type">
            <Select value={form.packageType} onChange={e => f('packageType', e.target.value)}>
              <option value="box">Box</option>
              <option value="bottle">Bottle</option>
              <option value="tube">Tube</option>
              <option value="sachet">Sachet</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Unit">
            <Select value={form.unit} onChange={e => f('unit', e.target.value)}>
              <option value="Caps">Caps</option>
              <option value="ml">ml</option>
              <option value="g">g</option>
              <option value="tabs">Tabs</option>
              <option value="units">Units</option>
            </Select>
          </Field>
          <Field label="Units in Pack">
            <Input type="number" min={1} value={form.unitsInPack} onChange={e => f('unitsInPack', parseInt(e.target.value))} />
          </Field>
          <Field label="Package Cost (£)">
            <Input type="number" step="0.01" min={0} value={form.packageCost} onChange={e => f('packageCost', parseFloat(e.target.value))} />
          </Field>
          <Field label="Initial Availability (packs)">
            <Input type="number" min={0} value={form.availability} onChange={e => f('availability', parseInt(e.target.value))} />
          </Field>
          <Field label="Minimum Stock Level (packs)">
            <Input type="number" min={0} value={form.stockLimit} onChange={e => f('stockLimit', parseInt(e.target.value))} />
          </Field>
          <Field label="Buffer % (reorder recommendation)">
            <Input type="number" min={10} max={50} value={form.bufferPercent} onChange={e => f('bufferPercent', parseInt(e.target.value))} />
          </Field>
        </div>
      </Modal>
    </Page>
  );
}
