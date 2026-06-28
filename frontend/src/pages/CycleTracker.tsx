import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const inp: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 12,
  padding: '10px 14px', fontSize: 14, color: 'var(--text)', background: '#fff',
  fontFamily: 'inherit', outline: 'none',
};
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block',
  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px',
};

export default function CycleTracker() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ start_date: '', end_date: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const today = localToday();

  const reload = () =>
    fetch('/api/cycles').then(r => r.json()).then(setCycles);

  useEffect(() => {
    reload();
    fetch('/api/profile').then(r => r.json()).then(setProfile);
  }, []);

  // Open modal pre-filled with a specific date
  const openFor = (date: string) => {
    setForm({ start_date: date, end_date: '', notes: '' });
    setShowForm(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_date) return;
    setSaving(true);
    try {
      const res = await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: form.start_date,
          end_date: form.end_date || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      await reload();
      setShowForm(false);
      setForm({ start_date: '', end_date: '', notes: '' });
    } catch (err) {
      alert('Could not save — is the server running?');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    await fetch(`/api/cycles/${id}`, { method: 'DELETE' });
    await reload();
    setDeleting(null);
  };

  // Which dates are period days
  function isPeriodDay(ds: string) {
    for (const c of cycles) {
      const end = c.end_date || c.start_date;
      if (ds >= c.start_date && ds <= end) return true;
    }
    return false;
  }

  // Predicted next period
  let predictedStart: string | null = null;
  if (cycles[0] && profile) {
    const d = new Date(cycles[0].start_date + 'T00:00:00');
    d.setDate(d.getDate() + (profile.cycle_length || 28));
    predictedStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function isPredictedDay(ds: string) {
    if (!predictedStart || !profile) return false;
    const s = new Date(predictedStart + 'T00:00:00');
    const e = new Date(predictedStart + 'T00:00:00');
    e.setDate(e.getDate() + (profile.period_length || 5) - 1);
    const d = new Date(ds + 'T00:00:00');
    return d >= s && d <= e;
  }

  const y = view.getFullYear();
  const m = view.getMonth();
  const daysInMonth = getDaysInMonth(y, m);
  const firstDay = getFirstDay(y, m);
  const monthStr = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: 620, padding: '28px 24px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Cycle Tracker</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Tap any day on the calendar to log a period</p>
        </div>
        <button
          onClick={() => openFor(today)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={13} /> Log Period
        </button>
      </div>

      {/* Calendar card */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: '22px', marginBottom: 14 }}>
        {/* Month nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <button onClick={() => setView(d => new Date(d.getFullYear(), d.getMonth() - 1))}
            style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={15} />
          </button>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>{monthStr}</p>
          <button onClick={() => setView(d => new Date(d.getFullYear(), d.getMonth() + 1))}
            style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', paddingBottom: 4 }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const period = isPeriodDay(ds);
            const predicted = !period && isPredictedDay(ds);
            const isToday = ds === today;

            return (
              <button
                key={day}
                onClick={() => openFor(ds)}
                title={period ? 'Period day (tap to edit)' : 'Tap to log period starting here'}
                style={{
                  height: 38, borderRadius: 10, fontSize: 13, border: 'none',
                  cursor: 'pointer', transition: 'all 0.1s',
                  fontWeight: isToday ? 700 : 400,
                  background: period
                    ? 'var(--accent)'
                    : predicted
                    ? 'var(--accent-light)'
                    : isToday
                    ? 'var(--bg-2)'
                    : 'transparent',
                  color: period ? '#fff' : isToday ? 'var(--accent)' : 'var(--text-2)',
                  outline: isToday && !period ? '2px solid var(--accent)' : 'none',
                  outlineOffset: -2,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          {[
            { bg: 'var(--accent)', label: 'Period' },
            { bg: 'var(--accent-light)', border: 'var(--accent-border)', label: 'Predicted' },
            { bg: 'var(--bg-2)', outline: 'var(--accent)', label: 'Today' },
          ].map(({ bg, border, outline, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, display: 'inline-block', background: bg, border: border ? `1.5px solid ${border}` : outline ? `2px solid ${outline}` : 'none', flexShrink: 0 }} />
              {label}
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto', fontStyle: 'italic' }}>Tap any day to log</p>
        </div>
      </div>

      {/* Logged cycles */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, overflow: 'hidden' }}>
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Logged Periods</p>
          {predictedStart && (
            <p style={{ fontSize: 12 }}>
              Next: <strong style={{ color: 'var(--accent)' }}>
                {new Date(predictedStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </strong>
            </p>
          )}
        </div>
        <div style={{ padding: '0 22px' }}>
          {cycles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No periods logged yet</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Tap a day on the calendar above to get started</p>
            </div>
          ) : cycles.slice(0, 8).map((c, i) => {
            const dur = c.end_date
              ? Math.round((new Date(c.end_date + 'T00:00:00').getTime() - new Date(c.start_date + 'T00:00:00').getTime()) / 86400000) + 1
              : null;
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < Math.min(cycles.length, 8) - 1 ? '1px solid var(--border)' : 'none', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {new Date(c.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {dur ? `${dur} day${dur !== 1 ? 's' : ''}` : 'End date not set'}
                    {i === 0 && <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 600 }}>← Most recent</span>}
                    {c.notes && <span style={{ marginLeft: 6 }}>· {c.notes}</span>}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deleting === c.id}
                  style={{ padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)', opacity: deleting === c.id ? 0.4 : 0.5, flexShrink: 0, borderRadius: 8, display: 'flex' }}
                  title="Delete this entry"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log period modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(28,10,18,0.5)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 400, padding: 26, boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>Log Period</h3>
              <button onClick={() => setShowForm(false)} style={{ cursor: 'pointer', border: 'none', background: 'var(--border)', borderRadius: 99, padding: '5px 6px', color: 'var(--text-2)', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Period started <span style={{ color: 'var(--accent)' }}>*</span></label>
                <input
                  type="date"
                  required
                  value={form.start_date}
                  max={today}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Period ended <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)' }}>(optional)</span></label>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  max={today}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)' }}>(optional)</span></label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Flow, colour, anything notable…"
                  style={inp}
                />
              </div>
              <button
                type="submit"
                disabled={!form.start_date || saving}
                style={{ padding: '13px', borderRadius: 14, border: 'none', cursor: form.start_date ? 'pointer' : 'not-allowed', background: form.start_date ? 'var(--accent)' : 'var(--border)', color: form.start_date ? '#fff' : 'var(--text-3)', fontSize: 14, fontWeight: 700, marginTop: 4, transition: 'all 0.1s' }}
              >
                {saving ? 'Saving…' : 'Save Period'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
