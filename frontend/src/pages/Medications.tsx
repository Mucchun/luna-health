import { useEffect, useState } from 'react';
import { localISO } from '../lib/date';
import { Plus, X, Check } from 'lucide-react';

const MED_TYPES = ['Prescription', 'OTC medication', 'Supplement', 'Hormonal contraceptive', 'GLP-1 / metabolic', 'Other'];
const FREQS = ['Daily', 'Twice daily', 'Every other day', 'Weekly', 'As needed', 'Monthly injection'];

const TYPE_BADGE: Record<string, [string, string]> = {
  'Prescription':           ['#7B52B8', '#F0EBFF'],
  'OTC medication':         ['#2563EB', '#DBEAFE'],
  'Supplement':             ['#2D7A56', '#D1F5E4'],
  'Hormonal contraceptive': ['#C83F6E', '#FCE7EF'],
  'GLP-1 / metabolic':      ['#A85A20', '#FFF5ED'],
  'Other':                  ['#6B5A5F', '#F5F0F2'],
};

const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: 'var(--text)', background: '#fff' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 99, fontSize: 13, fontWeight: active ? 500 : 400, cursor: 'pointer',
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent-light)' : '#fff',
      color: active ? 'var(--accent)' : 'var(--text-2)', transition: 'all 0.1s',
    }}>{children}</button>
  );
}

import { useI18n } from '../i18n';

export default function Medications() {
  const { tr } = useI18n();
  const [meds, setMeds] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: '', dose: '', frequency: '', start_date: '', notes: '' });
  const [logDate] = useState(localISO());
  const [loggedIds, setLoggedIds] = useState<Set<number>>(new Set());

  useEffect(() => { fetch('/api/medications').then(r => r.json()).then(setMeds); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/medications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setMeds(await fetch('/api/medications').then(r => r.json()));
    setShowForm(false);
    setForm({ name: '', type: '', dose: '', frequency: '', start_date: '', notes: '' });
  };

  const handleLog = async (id: number, taken: boolean) => {
    await fetch(`/api/medications/${id}/log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: logDate, taken }) });
    setLoggedIds(s => new Set([...s, id]));
  };

  const handleToggle = async (id: number, active: boolean) => {
    await fetch(`/api/medications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) });
    setMeds(ms => ms.map(m => m.id === id ? { ...m, active: active ? 0 : 1 } : m));
  };

  const active = meds.filter(m => m.active);
  const inactive = meds.filter(m => !m.active);

  return (
    <div style={{ maxWidth: 620, padding: '28px 24px', margin: '0 auto' }}>
      <div className="luna-head" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>{tr('page.medications')}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{tr('meds.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Daily check-in */}
      {active.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{tr('meds.checkin')}</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>
          <div style={{ padding: '0 22px' }}>
            {active.map((m, i) => {
              const logged = loggedIds.has(m.id);
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{m.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{[m.dose, m.frequency].filter(Boolean).join(' · ')}</p>
                  </div>
                  {logged ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--sage)', fontWeight: 500 }}>
                      <Check size={13} /> Logged
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleLog(m.id, true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, border: '1.5px solid #A0DBC0', background: 'var(--sage-light)', color: 'var(--sage)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <Check size={11} /> Taken
                      </button>
                      <button onClick={() => handleLog(m.id, false)} style={{ padding: '5px 12px', borderRadius: 99, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer' }}>
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active list */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Active · {active.length}</p>
        </div>
        <div style={{ padding: '0 22px' }}>
          {active.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-3)', textAlign: 'center', padding: '24px 0' }}>{tr('meds.noActive')}</p>
          ) : active.map((m, i) => {
            const [color, bg] = TYPE_BADGE[m.type] || TYPE_BADGE.Other;
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{m.name}</p>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: bg, color, letterSpacing: '0.2px' }}>{m.type}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {[m.dose, m.frequency, m.start_date && `Since ${new Date(m.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`].filter(Boolean).join(' · ')}
                  </p>
                  {m.notes && <p style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', marginTop: 3 }}>{m.notes}</p>}
                </div>
                <button onClick={() => handleToggle(m.id, true)} style={{ fontSize: 12, color: 'var(--text-3)', border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0, paddingTop: 2 }}>
                  Discontinue
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inactive */}
      {inactive.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.6 }}>Discontinued · {inactive.length}</p>
          </div>
          <div style={{ padding: '0 22px' }}>
            {inactive.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < inactive.length - 1 ? '1px solid var(--border)' : 'none', opacity: 0.5 }}>
                <div>
                  <p style={{ fontSize: 14, textDecoration: 'line-through', color: 'var(--text-2)' }}>{m.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.type}</p>
                </div>
                <button onClick={() => handleToggle(m.id, false)} style={{ fontSize: 12, color: 'var(--accent)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  Reactivate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(28,10,18,0.45)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 440, padding: 26, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>{tr('meds.add')}</h3>
              <button onClick={() => setShowForm(false)} style={{ cursor: 'pointer', border: 'none', background: 'var(--border)', borderRadius: 99, padding: '5px 6px', color: 'var(--text-2)', display: 'flex' }}><X size={14} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>{tr('meds.name')}</label>
                <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={tr('meds.namePlaceholder')} style={inp} />
              </div>
              <div>
                <label style={lbl}>{tr('meds.type')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {MED_TYPES.map(t => <Chip key={t} active={form.type === t} onClick={() => setForm(f => ({ ...f, type: t }))}>{t}</Chip>)}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>{tr('meds.dose')}</label><input type="text" value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} placeholder="500mg" style={inp} /></div>
                <div>
                  <label style={lbl}>{tr('meds.frequency')}</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">{tr('meds.select')}</option>
                    {FREQS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={lbl}>{tr('meds.startDate')}</label><input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inp} /></div>
              <div><label style={lbl}>{tr('log.notes')} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({tr('common.optional')})</span></label><input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={tr('meds.notesPlaceholder')} style={inp} /></div>
              <button type="submit" disabled={!form.name || !form.type} style={{ padding: '12px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, opacity: (!form.name || !form.type) ? 0.4 : 1, marginTop: 4 }}>
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
