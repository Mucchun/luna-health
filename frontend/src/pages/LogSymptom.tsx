import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search, Plus, X } from 'lucide-react';
import { notifySuccess } from '../lib/haptics';
import { useI18n } from '../i18n';
import { trTerm } from '../i18n/medical';
import { localISO, addDays } from '../lib/date';

const CONDITION_SYMPTOMS: Record<string, string[]> = {
  PCOS: ['Pelvic cramping', 'Bloating', 'Acne / skin breakouts', 'Hair loss (scalp)', 'Excess facial/body hair', 'Weight gain / difficulty losing weight', 'Fatigue', 'Irregular bleeding', 'Mood swings', 'Brain fog', 'Low libido', 'Headache', 'Insulin resistance symptoms', 'Dark skin patches'],
  Endometriosis: ['Deep pelvic pain', 'Bladder pressure / pain', 'Bowel pain / cramping', 'Pain with sex (dyspareunia)', 'Lower back pain', 'Leg pain / sciatica', 'Shoulder/diaphragm pain', 'Nausea', 'Fatigue', 'Heavy bleeding', 'Clotting', 'Bloating ("endo belly")', 'Painful bowel movements', 'Urinary urgency / frequency', 'Spotting between periods'],
  PMDD: ['Severe irritability', 'Anxiety / tension', 'Depressed mood', 'Hopelessness', 'Mood swings', 'Rage / anger outbursts', 'Crying spells', 'Social withdrawal', 'Difficulty concentrating', 'Fatigue', 'Insomnia', 'Hypersomnia', 'Food cravings / binge eating', 'Breast tenderness', 'Joint/muscle pain'],
  General: ['Fatigue', 'Headache', 'Nausea', 'Bloating', 'Cramps', 'Back pain', 'Insomnia', 'Mood changes', 'Breast tenderness', 'Hot flashes'],
};

const BODY_LOCATIONS = ['Lower abdomen / pelvis', 'Lower back', 'Upper abdomen', 'Chest', 'Shoulders', 'Legs / thighs', 'Whole body', 'Head', 'Bladder', 'Bowel'];

const input: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 14,
  padding: '12px 14px', fontSize: 16, color: 'var(--text)', background: '#fff',
};
const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.6px' };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={'luna-chip' + (active ? ' on' : '')}>
      {active && <Check size={14} strokeWidth={2.6} />}
      {children}
    </button>
  );
}

const sevTone = (n: number) => n >= 7 ? '#C83F6E' : n >= 4 ? '#A85A20' : '#2D7A56';

export default function LogSymptom() {
  const { tr, lang } = useI18n();
  const navigate = useNavigate();
  const today = localISO();
  const yesterday = addDays(today, -1);
  const [profile, setProfile] = useState<any>(null);
  const [saved, setSaved] = useState(0);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(today);
  const [condition, setCondition] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [severity, setSeverity] = useState(5);
  const [bodyLocation, setBodyLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(p => {
      setProfile(p);
      setCondition(p.conditions[0] || 'General');
    });
  }, []);

  // Symptoms for the chosen condition, then the general list, without repeats.
  const symptoms = useMemo(() => [...new Set([
    ...(CONDITION_SYMPTOMS[condition] || []),
    ...(condition !== 'General' ? CONDITION_SYMPTOMS.General : []),
  ])], [condition]);

  const q = query.trim();
  const visible = q
    ? symptoms.filter(s => trTerm(s, lang).toLowerCase().includes(q.toLowerCase()) || s.toLowerCase().includes(q.toLowerCase()))
    : symptoms;
  // Anything selected that isn't in the current list (custom entries, or picks
  // made under another condition) stays visible so it can be un-selected.
  const extras = selected.filter(s => !visible.includes(s));
  const canAddCustom = q.length > 1 && !symptoms.some(s => s.toLowerCase() === q.toLowerCase() || trTerm(s, lang).toLowerCase() === q.toLowerCase()) && !selected.includes(q);

  const toggle = (s: string) => setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const addCustom = () => { setSelected(prev => [...prev, q]); setQuery(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected.length || saving) return;
    setSaving(true);
    for (const symptom of selected) {
      await fetch('/api/symptoms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, condition, symptom, severity, body_location: bodyLocation, notes }),
      });
    }
    notifySuccess();
    setSaving(false);
    setSaved(selected.length);
    window.scrollTo(0, 0);
  };

  const reset = () => { setSelected([]); setSeverity(5); setBodyLocation(''); setNotes(''); setQuery(''); setSaved(0); };

  if (!profile) return null;

  if (saved > 0) return (
    <div style={{ maxWidth: 520, padding: '28px 24px', margin: '0 auto', minHeight: '70dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} role="status">
      <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--sage-light)', color: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, animation: 'luna-pop-in 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
        <Check size={40} strokeWidth={2.6} />
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>{tr('log.saved')}</h1>
      <p style={{ fontSize: 15, color: 'var(--text-3)', marginBottom: 14 }}>{tr('log.savedSub')}</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
        {selected.map(s => (
          <span key={s} style={{ fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 99, background: '#fff', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            {trTerm(s, lang)} · <span style={{ color: sevTone(severity) }}>{severity}/10</span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 360 }}>
        <button type="button" onClick={reset} style={{ flex: 1, padding: '14px', borderRadius: 16, border: '1.5px solid var(--border)', background: '#fff', color: 'var(--text-2)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{tr('log.logAnother')}</button>
        <button type="button" onClick={() => navigate('/')} className="luna-btn-grad" style={{ flex: 1, padding: '14px', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{tr('common.done')}</button>
      </div>
    </div>
  );

  const sevWord = severity >= 7 ? tr('log.severe') : severity >= 4 ? tr('log.moderate') : tr('log.mild');

  return (
    <div style={{ maxWidth: 560, padding: '28px 24px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.6px', marginBottom: 4 }}>{tr('nav.logSymptom')}</h1>
      <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>{tr('log.subtitle')}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {/* When */}
        <div>
          <label style={label}>{tr('log.date')}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip active={date === today} onClick={() => setDate(today)}>{tr('log.today')}</Chip>
            <Chip active={date === yesterday} onClick={() => setDate(yesterday)}>{tr('log.yesterday')}</Chip>
            <input type="date" value={date} max={today} onChange={e => e.target.value && setDate(e.target.value)} aria-label={tr('log.date')}
              style={{ ...input, width: 'auto', flex: '1 1 150px', minHeight: 40, padding: '8px 12px', borderRadius: 99, fontSize: 14, borderColor: date !== today && date !== yesterday ? 'var(--accent)' : 'var(--border)' }} />
          </div>
        </div>

        {/* Condition */}
        {profile.conditions.length > 0 && (
          <div>
            <label style={label}>{tr('log.condition')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[...profile.conditions, 'General'].map((c: string) => (
                <Chip key={c} active={condition === c} onClick={() => setCondition(c)}>
                  {c === 'General' ? tr('log.general') : c}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Symptoms — pick as many as apply */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <label style={{ ...label, marginBottom: 0 }}>{tr('log.symptom')}</label>
            {selected.length > 0 && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{tr('log.selected', { n: selected.length })}</span>}
          </div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder={tr('log.search')} aria-label={tr('log.search')}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (canAddCustom) addCustom(); } }}
              style={{ ...input, paddingLeft: 40, paddingRight: 40 }} />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label={tr('common.close')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: 99, border: 'none', background: 'var(--bg-2)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={15} /></button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {extras.map(s => <Chip key={s} active onClick={() => toggle(s)}>{trTerm(s, lang)}</Chip>)}
            {visible.map(s => <Chip key={s} active={selected.includes(s)} onClick={() => toggle(s)}>{trTerm(s, lang)}</Chip>)}
            {canAddCustom && (
              <button type="button" onClick={addCustom} className="luna-chip" style={{ borderStyle: 'dashed', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 600 }}>
                <Plus size={14} strokeWidth={2.6} /> {tr('log.addCustom', { q })}
              </button>
            )}
          </div>
        </div>

        {/* Severity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <label style={{ ...label, marginBottom: 0 }}>{tr('log.severity')}</label>
            <span style={{ fontSize: 14, fontWeight: 700, color: sevTone(severity) }}>{severity}/10 · {sevWord}</span>
          </div>
          <div className="luna-sev" role="radiogroup" aria-label={tr('log.severity')}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
              const on = n === severity, filled = n <= severity, tone = sevTone(severity);
              return (
                <button key={n} type="button" role="radio" aria-checked={on} onClick={() => setSeverity(n)} style={{
                  background: on ? tone : filled ? `color-mix(in srgb, ${tone} 16%, white)` : '#fff',
                  borderColor: filled ? tone : 'var(--border)',
                  color: on ? '#fff' : filled ? tone : 'var(--text-3)',
                }}>{n}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <span>{tr('log.mild')}</span><span>{tr('log.moderate')}</span><span>{tr('log.severe')}</span>
          </div>
        </div>

        {/* Where */}
        <div>
          <label style={label}>{tr('log.bodyLocation')} <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>({tr('common.optional')})</span></label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {BODY_LOCATIONS.map(l => (
              <Chip key={l} active={bodyLocation === l} onClick={() => setBodyLocation(bodyLocation === l ? '' : l)}>{trTerm(l, lang)}</Chip>
            ))}
          </div>
        </div>

        <div>
          <label style={label}>{tr('log.notes')} <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>({tr('common.optional')})</span></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={tr('log.notesPlaceholder')} rows={3} style={{ ...input, resize: 'none', lineHeight: 1.5 }} />
        </div>

        {/* Save stays in reach while scrolling */}
        <div className="luna-sticky-save">
          <button type="submit" disabled={!selected.length || saving} className={selected.length ? 'luna-btn-grad' : undefined} style={{
            width: '100%', padding: '15px', borderRadius: 16, cursor: selected.length ? 'pointer' : 'default',
            fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
            ...(selected.length ? {} : { background: 'var(--bg-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }),
          }}>
            {selected.length > 1 ? tr('log.saveN', { n: selected.length }) : tr('log.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
