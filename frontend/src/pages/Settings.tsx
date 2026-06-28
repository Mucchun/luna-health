import { useEffect, useState } from 'react';
import { Check, Trash2, AlertTriangle } from 'lucide-react';

const CONDITIONS = ['PCOS', 'Endometriosis', 'PMDD'];
const COND_STYLE: Record<string, [string, string, string]> = {
  PCOS:           ['#7B52B8', '#F0EBFF', '#DDD6FE'],
  Endometriosis:  ['#C83F6E', '#FCE7EF', '#F4B8CC'],
  PMDD:           ['#A85A20', '#FFF5ED', '#F4C8A0'],
};
const COND_DESC: Record<string, string> = {
  PCOS: 'Androgen symptoms, insulin resistance, irregular cycles, LH:FSH ratio, AMH, testosterone',
  Endometriosis: 'Pelvic & deep pain, bladder/bowel symptoms, dyspareunia, CA-125, CRP inflammation',
  PMDD: 'Mood changes mapped to luteal phase — severe irritability, depression, anxiety',
};

const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--text)', background: '#fff' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' };
const section: React.CSSProperties = { background: '#fff', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', marginBottom: 12 };
const sHead: React.CSSProperties = { padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' };

const DATA_SECTIONS = [
  { key: 'symptoms',    label: 'Symptoms',    desc: 'All logged symptoms and severity entries' },
  { key: 'cycles',      label: 'Periods',     desc: 'All cycle and period dates' },
  { key: 'triggers',    label: 'Triggers',    desc: 'All trigger journal entries' },
  { key: 'labs',        label: 'Lab Results', desc: 'All lab values and test results' },
  { key: 'medications', label: 'Medications', desc: 'All medications and dose logs' },
];

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState<string | null>(null);
  const [nuking, setNuking] = useState(false);
  const [clearDone, setClearDone] = useState<string | null>(null);

  useEffect(() => { fetch('/api/profile').then(r => r.json()).then(setProfile); }, []);
  if (!profile) return null;

  const clearSection = async (key: string, label: string) => {
    if (!window.confirm(`Delete all ${label} data? This cannot be undone.`)) return;
    setClearing(key);
    await fetch(`/api/data/${key}`, { method: 'DELETE' });
    setClearing(null);
    setClearDone(key);
    setTimeout(() => setClearDone(null), 2000);
  };

  const nukeAll = async () => {
    if (!window.confirm('Delete ALL your health data and reset the app? This cannot be undone.')) return;
    if (!window.confirm('Are you sure? Every symptom, cycle, trigger, lab, and medication will be permanently deleted.')) return;
    setNuking(true);
    await fetch('/api/data/all/confirm', { method: 'DELETE' });
    localStorage.removeItem('luna_community_id');
    localStorage.removeItem('luna_liked_posts');
    localStorage.removeItem('luna_ai_analysis');
    setNuking(false);
    window.location.reload();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
  const toggle = (c: string) => setProfile((p: any) => ({ ...p, conditions: p.conditions.includes(c) ? p.conditions.filter((x: string) => x !== c) : [...p.conditions, c] }));

  return (
    <div style={{ maxWidth: 500, padding: '28px 24px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 4 }}>Settings</h1>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 28 }}>Your profile powers phase detection and symptom suggestions</p>

      {saved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--sage-light)', color: 'var(--sage)', border: '1px solid #A0DBC0', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
          <Check size={15} /> Saved
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={section}>
          <p style={sHead}>Profile</p>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={lbl}>Your name</label>
              <input type="text" value={profile.name} onChange={e => setProfile((p: any) => ({ ...p, name: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Conditions</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CONDITIONS.map(c => {
                  const [color, bg, border] = COND_STYLE[c];
                  const active = profile.conditions.includes(c);
                  return (
                    <button key={c} type="button" onClick={() => toggle(c)} style={{
                      padding: '7px 16px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      border: `1.5px solid ${active ? border : 'var(--border)'}`,
                      background: active ? bg : '#fff',
                      color: active ? color : 'var(--text-3)',
                      transition: 'all 0.1s',
                    }}>{c}</button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>Customizes symptom vocabulary and report context</p>
            </div>
          </div>
        </div>

        <div style={section}>
          <p style={sHead}>Cycle</p>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Cycle length</label>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px' }}>{profile.cycle_length}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-3)' }}> days</span></span>
              </div>
              <input type="range" min={21} max={45} value={profile.cycle_length} onChange={e => setProfile((p: any) => ({ ...p, cycle_length: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {['21 days', '28 avg', '45 days'].map(l => <span key={l} style={{ fontSize: 10, color: 'var(--text-3)' }}>{l}</span>)}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>If you have PCOS with irregular cycles, use your most common length</p>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Period length</label>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#C83F6E', letterSpacing: '-0.5px' }}>{profile.period_length}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-3)' }}> days</span></span>
              </div>
              <input type="range" min={2} max={10} value={profile.period_length} onChange={e => setProfile((p: any) => ({ ...p, period_length: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: '#C83F6E', cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        <div style={section}>
          <p style={sHead}>What Luna tracks per condition</p>
          {CONDITIONS.map((c, i) => {
            const [color] = COND_STYLE[c];
            return (
              <div key={c} style={{ padding: '14px 20px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{c}</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{COND_DESC[c]}</p>
              </div>
            );
          })}
        </div>

        <button type="submit" style={{
          width: '100%', padding: '12px', borderRadius: 14, border: 'none', cursor: 'pointer',
          background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.1px',
        }}>
          Save Settings
        </button>
      </form>

      {/* Data Management */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <Trash2 size={14} style={{ color: 'var(--text-3)' }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Data Management</p>
        </div>

        <div style={{ ...section, marginBottom: 12 }}>
          <p style={sHead}>Clear specific data</p>
          <div style={{ padding: '8px 0' }}>
            {DATA_SECTIONS.map(({ key, label, desc }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}
                className="[&:last-child]:border-0">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{desc}</p>
                </div>
                <button
                  onClick={() => clearSection(key, label)}
                  disabled={clearing === key}
                  style={{ padding: '6px 14px', borderRadius: 99, border: '1px solid var(--border)', background: clearDone === key ? 'var(--sage-light)' : '#fff', color: clearDone === key ? 'var(--sage)' : 'var(--text-3)', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 0.1s', opacity: clearing === key ? 0.5 : 1 }}
                >
                  {clearing === key ? 'Clearing…' : clearDone === key ? '✓ Cleared' : 'Clear'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Nuclear option */}
        <div style={{ background: '#fff', border: '1.5px solid #FECDD3', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #FECDD3', display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle size={13} style={{ color: '#E11D48' }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: '#E11D48', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Danger Zone</p>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Delete all data & reset app</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.55 }}>
              Permanently deletes all symptoms, cycles, triggers, labs, medications, community posts, and resets your profile. This cannot be undone.
            </p>
            <button
              onClick={nukeAll}
              disabled={nuking}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: 'none', background: nuking ? '#FECDD3' : '#E11D48', color: '#fff', fontSize: 13, fontWeight: 700, cursor: nuking ? 'not-allowed' : 'pointer', transition: 'all 0.1s' }}
            >
              <Trash2 size={14} />
              {nuking ? 'Deleting everything…' : 'Delete all my data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
