import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const CONDITION_SYMPTOMS: Record<string, string[]> = {
  PCOS: ['Pelvic cramping', 'Bloating', 'Acne / skin breakouts', 'Hair loss (scalp)', 'Excess facial/body hair', 'Weight gain / difficulty losing weight', 'Fatigue', 'Irregular bleeding', 'Mood swings', 'Brain fog', 'Low libido', 'Headache', 'Insulin resistance symptoms', 'Dark skin patches'],
  Endometriosis: ['Deep pelvic pain', 'Bladder pressure / pain', 'Bowel pain / cramping', 'Pain with sex (dyspareunia)', 'Lower back pain', 'Leg pain / sciatica', 'Shoulder/diaphragm pain', 'Nausea', 'Fatigue', 'Heavy bleeding', 'Clotting', 'Bloating ("endo belly")', 'Painful bowel movements', 'Urinary urgency / frequency', 'Spotting between periods'],
  PMDD: ['Severe irritability', 'Anxiety / tension', 'Depressed mood', 'Hopelessness', 'Mood swings', 'Rage / anger outbursts', 'Crying spells', 'Social withdrawal', 'Difficulty concentrating', 'Fatigue', 'Insomnia', 'Hypersomnia', 'Food cravings / binge eating', 'Breast tenderness', 'Joint/muscle pain'],
  General: ['Fatigue', 'Headache', 'Nausea', 'Bloating', 'Cramps', 'Back pain', 'Insomnia', 'Mood changes', 'Breast tenderness', 'Hot flashes'],
};

const BODY_LOCATIONS = ['Lower abdomen / pelvis', 'Lower back', 'Upper abdomen', 'Chest', 'Shoulders', 'Legs / thighs', 'Whole body', 'Head', 'Bladder', 'Bowel'];

const input: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 12,
  padding: '10px 14px', fontSize: 13, color: 'var(--text)', background: '#fff',
};
const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: active ? 500 : 400, cursor: 'pointer',
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent-light)' : '#fff',
      color: active ? 'var(--accent)' : 'var(--text-2)',
      transition: 'all 0.1s',
    }}>
      {children}
    </button>
  );
}

export default function LogSymptom() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], condition: '', symptom: '', severity: 5, body_location: '', notes: '' });
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(p => {
      setProfile(p);
      setForm(f => ({ ...f, condition: p.conditions[0] || 'General' }));
    });
  }, []);

  const symptoms = [...(CONDITION_SYMPTOMS[form.condition] || []), ...(form.condition !== 'General' ? CONDITION_SYMPTOMS.General : [])];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const symptomName = useCustom ? custom : form.symptom;
    if (!symptomName) return;
    await fetch('/api/symptoms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, symptom: symptomName }) });
    setSaved(true);
    setTimeout(() => { setSaved(false); navigate('/'); }, 1200);
  };

  if (!profile) return null;

  const sevColor = form.severity >= 7 ? 'var(--accent)' : form.severity >= 5 ? 'var(--amber)' : 'var(--sage)';

  return (
    <div style={{ maxWidth: 500, padding: '28px 24px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 4 }}>Log Symptom</h1>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 28 }}>Track what you're feeling for better pattern detection</p>

      {saved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--sage-light)', color: 'var(--sage)', border: '1px solid #A0DBC0', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 20 }}>
          <Check size={15} /> Saved!
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <label style={label}>Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={input} />
        </div>

        <div>
          <label style={label}>Condition</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[...profile.conditions, 'General'].map((c: string) => (
              <Chip key={c} active={form.condition === c} onClick={() => { setForm(f => ({ ...f, condition: c, symptom: '' })); setUseCustom(false); }}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...label, marginBottom: 0 }}>Symptom</label>
            <button type="button" onClick={() => setUseCustom(v => !v)} style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer' }}>
              {useCustom ? 'From list' : 'Type custom'}
            </button>
          </div>
          {useCustom ? (
            <input type="text" placeholder="Describe your symptom…" value={custom} onChange={e => setCustom(e.target.value)} style={input} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 210, overflowY: 'auto' }}>
              {symptoms.map(s => (
                <Chip key={s} active={form.symptom === s} onClick={() => setForm(f => ({ ...f, symptom: s }))}>{s}</Chip>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...label, marginBottom: 0 }}>Severity</label>
            <span style={{ fontSize: 14, fontWeight: 800, color: sevColor }}>{form.severity}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-3)' }}>/10</span></span>
          </div>
          <input type="range" min={1} max={10} value={form.severity} onChange={e => setForm(f => ({ ...f, severity: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: 4 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            {['Mild', 'Moderate', 'Severe'].map(l => <span key={l} style={{ fontSize: 10, color: 'var(--text-3)' }}>{l}</span>)}
          </div>
        </div>

        <div>
          <label style={label}>Body location <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(optional)</span></label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {BODY_LOCATIONS.map(l => (
              <Chip key={l} active={form.body_location === l} onClick={() => setForm(f => ({ ...f, body_location: f.body_location === l ? '' : l }))}>{l}</Chip>
            ))}
          </div>
        </div>

        <div>
          <label style={label}>Notes <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(optional)</span></label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any context about this symptom…" rows={3} style={{ ...input, resize: 'none', lineHeight: 1.6 }} />
        </div>

        <button type="submit" disabled={useCustom ? !custom : !form.symptom} style={{
          padding: '12px', borderRadius: 14, border: 'none', cursor: 'pointer',
          background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700,
          opacity: (useCustom ? !custom : !form.symptom) ? 0.4 : 1,
          letterSpacing: '0.1px',
        }}>
          Save Symptom
        </button>
      </form>
    </div>
  );
}
