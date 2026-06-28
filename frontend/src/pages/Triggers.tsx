import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';

const CATS = [
  { label: 'Food', options: ['Dairy', 'Gluten', 'Sugar', 'Alcohol', 'Caffeine', 'Processed food', 'Red meat', 'Soy'] },
  { label: 'Stress', options: ['High stress', 'Work stress', 'Relationship stress', 'Poor sleep', 'Sleep < 6h', 'Anxiety episode'] },
  { label: 'Activity', options: ['No exercise', 'High intensity workout', 'Sedentary day', 'Walking', 'Yoga / stretching'] },
  { label: 'Environment', options: ['Cold weather', 'Hot weather', 'Forgot medication', 'Travel / disrupted routine'] },
  { label: 'Cycle', options: ['Day 1–3', 'Ovulation day', 'Late luteal phase', 'Post-period'] },
];

const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--text)', background: '#fff' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: active ? 500 : 400, cursor: 'pointer',
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent-light)' : '#fff',
      color: active ? 'var(--accent)' : 'var(--text-2)', transition: 'all 0.1s',
    }}>{children}</button>
  );
}

export default function Triggers() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: '', value: '', notes: '' });
  const [customVal, setCustomVal] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    fetch('/api/triggers?days=90').then(r => r.json()).then(setTriggers);
    fetch('/api/correlations').then(r => r.json()).then(setCorrelations);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = useCustom ? customVal : form.value;
    if (!form.category || !value) return;
    await fetch('/api/triggers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, value }) });
    const [t, c] = await Promise.all([fetch('/api/triggers?days=90').then(r => r.json()), fetch('/api/correlations').then(r => r.json())]);
    setTriggers(t); setCorrelations(c);
    setShowForm(false); setForm(f => ({ ...f, category: '', value: '', notes: '' })); setCustomVal(''); setUseCustom(false);
  };

  const card: React.CSSProperties = { background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 22px' };

  return (
    <div style={{ maxWidth: 760, padding: '28px 24px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Trigger Journal</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>See what correlates with worse symptom days</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={13} /> Log Trigger
        </button>
      </div>

      {correlations.length > 0 && (
        <div style={{ ...card, marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Correlations</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 18 }}>Avg severity on trigger days vs. non-trigger days</p>
          {correlations.map(c => {
            const worse = c.impact > 0.3; const better = c.impact < -0.3;
            return (
              <div key={`${c.category}-${c.value}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }} className="[&:last-child]:border-0">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c.value}</p>
                    <span style={{ fontSize: 10, background: 'var(--border)', color: 'var(--text-3)', borderRadius: 4, padding: '1px 6px' }}>{c.category}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    Trigger: <strong style={{ color: worse ? 'var(--accent)' : better ? 'var(--sage)' : 'var(--text-2)' }}>{c.on_avg}</strong> · Off: <strong style={{ color: 'var(--text-2)' }}>{c.off_avg}</strong> · {c.days_tracked} days
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, flexShrink: 0, background: worse ? 'var(--accent-light)' : better ? 'var(--sage-light)' : 'var(--border)', color: worse ? 'var(--accent)' : better ? 'var(--sage)' : 'var(--text-3)' }}>
                  {c.impact > 0 ? '+' : ''}{c.impact}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={card}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Recent logs</p>
        {triggers.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '24px 0' }}>Log food, stress, activity, and other potential triggers</p>
        ) : triggers.slice(0, 20).map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < triggers.slice(0, 20).length - 1 ? '1px solid var(--border)' : 'none' }} className="group">
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                <span style={{ background: 'var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 10, marginRight: 6 }}>{t.category}</span>
                {new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {t.notes && ` · ${t.notes}`}
              </p>
            </div>
            <button onClick={() => { fetch(`/api/triggers/${t.id}`, { method: 'DELETE' }); setTriggers(ts => ts.filter(x => x.id !== t.id)); }}
              style={{ opacity: 0.3, cursor: 'pointer', border: 'none', background: 'none', color: 'var(--text-3)', padding: 4 }}
              className="hover:opacity-100 transition-opacity">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(28,10,18,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 420, padding: 24, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>Log a Trigger</h3>
              <button onClick={() => setShowForm(false)} style={{ cursor: 'pointer', border: 'none', background: 'none', color: 'var(--text-3)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={lbl}>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} /></div>
              <div>
                <label style={lbl}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATS.map(c => <Chip key={c.label} active={form.category === c.label} onClick={() => { setForm(f => ({ ...f, category: c.label, value: '' })); setUseCustom(false); }}>{c.label}</Chip>)}
                </div>
              </div>
              {form.category && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Trigger</label>
                    <button type="button" onClick={() => setUseCustom(v => !v)} style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer' }}>{useCustom ? 'From list' : 'Custom'}</button>
                  </div>
                  {useCustom ? <input type="text" value={customVal} onChange={e => setCustomVal(e.target.value)} placeholder="Describe trigger…" style={inp} /> : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {CATS.find(c => c.label === form.category)?.options.map(o => <Chip key={o} active={form.value === o} onClick={() => setForm(f => ({ ...f, value: o }))}>{o}</Chip>)}
                    </div>
                  )}
                </div>
              )}
              <div><label style={lbl}>Notes (optional)</label><input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any context…" style={inp} /></div>
              <button type="submit" disabled={!form.category || (useCustom ? !customVal : !form.value)} style={{ padding: '11px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, opacity: (!form.category || (useCustom ? !customVal : !form.value)) ? 0.4 : 1 }}>
                Save Trigger
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
