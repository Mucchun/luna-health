import { useEffect, useState } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const MARKERS = [
  { name: 'Testosterone (total)', unit: 'ng/dL', min: 15, max: 70, cond: 'PCOS', note: 'Elevated in PCOS — above 70 ng/dL warrants investigation' },
  { name: 'DHEA-S', unit: 'μg/dL', min: 35, max: 430, cond: 'PCOS', note: 'Adrenal androgen — elevated in PCOS' },
  { name: 'LH', unit: 'mIU/mL', min: 2, max: 15, cond: 'PCOS', note: 'LH:FSH ratio >2 suggests PCOS' },
  { name: 'FSH', unit: 'mIU/mL', min: 3, max: 10, cond: 'PCOS', note: 'Follicle stimulating hormone' },
  { name: 'AMH', unit: 'ng/mL', min: 1, max: 3.5, cond: 'PCOS', note: 'Elevated (>3.5) in PCOS — also a fertility marker' },
  { name: 'Fasting insulin', unit: 'μIU/mL', min: 2, max: 25, cond: 'PCOS', note: 'Insulin resistance is common in PCOS' },
  { name: 'Fasting glucose', unit: 'mg/dL', min: 70, max: 99, cond: 'PCOS', note: 'Metabolic panel' },
  { name: 'Estradiol (E2)', unit: 'pg/mL', min: 30, max: 400, cond: 'General', note: 'Varies widely by cycle phase' },
  { name: 'Progesterone', unit: 'ng/mL', min: 0.1, max: 25, cond: 'General', note: 'Low in luteal phase → PMDD/endo connection' },
  { name: 'CA-125', unit: 'U/mL', min: 0, max: 35, cond: 'Endo', note: 'Elevated in many endo cases — not diagnostic alone' },
  { name: 'CRP (inflammatory)', unit: 'mg/L', min: 0, max: 3, cond: 'Endo', note: 'Systemic inflammation, often elevated in endo' },
  { name: 'Ferritin', unit: 'ng/mL', min: 12, max: 150, cond: 'General', note: 'Iron stores — low with heavy bleeding' },
  { name: 'Vitamin D', unit: 'ng/mL', min: 30, max: 100, cond: 'General', note: 'Deficiency worsens PCOS/endo symptoms' },
  { name: 'Thyroid (TSH)', unit: 'mIU/L', min: 0.4, max: 4.5, cond: 'General', note: 'Thyroid issues can mimic hormonal conditions' },
];

function rangeStatus(m: typeof MARKERS[0], v: number) {
  if (v < m.min) return 'low';
  if (v > m.max) return 'high';
  return 'normal';
}

const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--text)', background: '#fff' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' };
const card: React.CSSProperties = { background: '#fff', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' };

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 16px rgba(200,63,110,0.08)' }}>
      <p style={{ color: 'var(--text-3)', marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 700, color: 'var(--accent)' }}>{payload[0].value}</p>
    </div>
  );
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  normal:           { bg: '#D1F5E4', color: '#2D7A56', label: 'Normal' },
  high:             { bg: '#FCE7EF', color: '#C83F6E', label: 'High' },
  low:              { bg: '#DBEAFE', color: '#2563EB', label: 'Low' },
  borderline_high:  { bg: '#FEF3C7', color: '#D97706', label: 'Borderline high' },
  borderline_low:   { bg: '#FEF3C7', color: '#D97706', label: 'Borderline low' },
  unknown:          { bg: 'var(--border)', color: 'var(--text-3)', label: 'No range' },
};
const TREND_ICON: Record<string, any> = {
  rising: TrendingUp, falling: TrendingDown, stable: Minus, single_reading: Minus,
};

export default function Labs() {
  const [labs, setLabs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], marker: '', value: '', unit: '', lab: '', notes: '' });
  const [chartMarker, setChartMarker] = useState<string | null>(null);
  const [aiResult, setAiResult]   = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState<string | null>(null);

  useEffect(() => { fetch('/api/labs').then(r => r.json()).then(setLabs); }, []);

  const analyzeWithAi = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/analyze-labs', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || 'Analysis failed.'); return; }
      setAiResult(data);
    } catch {
      setAiError('Could not reach the server.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/labs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, value: parseFloat(form.value) }) });
    setLabs(await fetch('/api/labs').then(r => r.json()));
    setShowForm(false);
    setForm(f => ({ ...f, marker: '', value: '', unit: '', lab: '', notes: '' }));
  };

  const selDef = MARKERS.find(m => m.name === form.marker);
  const chartData = labs.filter(l => l.marker === chartMarker).sort((a, b) => a.date.localeCompare(b.date)).map(l => ({ date: l.date.slice(5), value: l.value }));
  const markerDef = chartMarker ? MARKERS.find(m => m.name === chartMarker) : null;

  const latest: Record<string, any> = {};
  for (const l of [...labs].sort((a, b) => b.date.localeCompare(a.date))) if (!latest[l.marker]) latest[l.marker] = l;

  const statusStyle = (s: 'normal' | 'high' | 'low' | null) => ({
    color: s === 'normal' ? 'var(--sage)' : s ? 'var(--amber)' : 'var(--text-3)',
  });

  const StatusIcon = ({ s }: { s: string | null }) => {
    if (s === 'high') return <TrendingUp size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} />;
    if (s === 'low') return <TrendingDown size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} />;
    if (s === 'normal') return <Minus size={12} style={{ color: 'var(--sage)', flexShrink: 0 }} />;
    return null;
  };

  return (
    <div style={{ maxWidth: 760, padding: '28px 24px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Lab Values</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Track hormones and biomarkers relevant to your conditions</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={13} /> Add Result
        </button>
      </div>

      {/* AI Analysis panel */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: aiResult ? '1px solid var(--border)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-light), var(--purple-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={13} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>AI Lab Analysis</p>
              {aiResult && <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                {new Date(aiResult.generated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>}
            </div>
          </div>
          <button onClick={analyzeWithAi} disabled={aiLoading || labs.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, border: 'none', background: aiLoading || labs.length === 0 ? 'var(--border)' : 'var(--accent)', color: aiLoading || labs.length === 0 ? 'var(--text-3)' : '#fff', fontSize: 12, fontWeight: 600, cursor: aiLoading || labs.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.1s' }}>
            {aiLoading
              ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</>
              : <><Sparkles size={11} /> {aiResult ? 'Re-analyse' : 'Analyse results'}</>}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>

        {aiError && (
          <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--amber)' }}>{aiError}</div>
        )}

        {aiResult && !aiLoading && (() => {
          const a = aiResult.analysis;
          return (
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary */}
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{a.summary}</p>

              {/* Marker chips */}
              {a.markers?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Marker Status</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {a.markers.map((m: any) => {
                      const st = STATUS_STYLE[m.status] || STATUS_STYLE.unknown;
                      const TIcon = TREND_ICON[m.trend] || Minus;
                      return (
                        <div key={m.name} title={m.observation}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 99, background: st.bg, fontSize: 11, fontWeight: 600, color: st.color, cursor: 'default' }}>
                          <TIcon size={10} />
                          {m.name.split('(')[0].trim()} · {st.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Marker observations */}
              {a.markers?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {a.markers.map((m: any) => {
                    const st = STATUS_STYLE[m.status] || STATUS_STYLE.unknown;
                    return (
                      <div key={m.name} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 12px', background: st.bg + '55', borderRadius: 10, border: `1px solid ${st.bg}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: st.color, flexShrink: 0, paddingTop: 1, minWidth: 36 }}>{m.latest_value} {m.unit}</div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{m.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.5 }}>{m.observation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Key findings */}
              {a.key_findings?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Key Findings</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {a.key_findings.map((f: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <ChevronRight size={13} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55 }}>{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor questions + follow-up tests */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {a.doctor_questions?.length > 0 && (
                  <div style={{ background: '#DBEAFE22', border: '1px solid #DBEAFE', borderRadius: 12, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Ask your doctor</p>
                    <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {a.doctor_questions.map((q: string, i: number) => (
                        <li key={i} style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.5 }}>{q}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {a.follow_up_tests?.length > 0 && (
                  <div style={{ background: 'var(--purple-light)', border: '1px solid #DDD6FE', borderRadius: 12, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Consider testing</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {a.follow_up_tests.map((t: string, i: number) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'white', color: 'var(--purple)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.5, fontStyle: 'italic' }}>
                AI analysis is for informational purposes only. Always discuss your lab results with a qualified healthcare provider.
              </p>
            </div>
          );
        })()}
      </div>

      {/* Trend chart */}
      {chartMarker && chartData.length > 1 && (
        <div style={{ ...card, padding: '20px 22px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{chartMarker}</p>
              {markerDef && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Normal: {markerDef.min}–{markerDef.max} {markerDef.unit}</p>}
            </div>
            <button onClick={() => setChartMarker(null)} style={{ fontSize: 11, color: 'var(--text-3)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: 'var(--border)' }}>
              Close
            </button>
          </div>
          <ResponsiveContainer width="100%" height={140} style={{ marginTop: 12 }}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -28 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              {markerDef && <ReferenceLine y={markerDef.min} stroke="#F4B8CC" strokeDasharray="3 3" />}
              {markerDef && <ReferenceLine y={markerDef.max} stroke="#F4B8CC" strokeDasharray="3 3" />}
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Latest results grid */}
      {Object.keys(latest).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Latest Results</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {Object.values(latest).map((l: any) => {
              const def = MARKERS.find(m => m.name === l.marker);
              const s = def ? rangeStatus(def, l.value) : null;
              return (
                <div key={l.marker} onClick={() => setChartMarker(l.marker === chartMarker ? null : l.marker)}
                  style={{ background: '#fff', border: `1.5px solid ${l.marker === chartMarker ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 16, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.1s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', flex: 1, lineHeight: 1.3 }}>{l.marker}</p>
                    <StatusIcon s={s} />
                  </div>
                  <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1, marginTop: 8, ...statusStyle(s) }}>
                    {l.value}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>
                    {l.unit}{def ? ` · ref ${def.min}–${def.max}` : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All records */}
      <div style={card}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>All Records</p>
        </div>
        <div style={{ padding: '0 22px' }}>
          {labs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '28px 0' }}>
              No lab results yet. Add blood test results to track trends over time.
            </p>
          ) : labs.map((l, i) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < labs.length - 1 ? '1px solid var(--border)' : 'none' }} className="group">
              <div>
                <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{l.marker}: <strong>{l.value} {l.unit}</strong></p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {new Date(l.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {l.lab && ` · ${l.lab}`}
                </p>
              </div>
              <button onClick={() => { fetch(`/api/labs/${l.id}`, { method: 'DELETE' }); setLabs(ls => ls.filter(x => x.id !== l.id)); }}
                style={{ opacity: 0.3, cursor: 'pointer', border: 'none', background: 'none', color: 'var(--text-3)', padding: 4 }}
                className="group-hover:opacity-100 transition-opacity hover:text-red-500">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(28,10,18,0.45)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 440, padding: 26, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>Add Lab Result</h3>
              <button onClick={() => setShowForm(false)} style={{ cursor: 'pointer', border: 'none', background: 'var(--border)', borderRadius: 99, padding: '5px 6px', color: 'var(--text-2)', display: 'flex' }}><X size={14} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={lbl}>Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} /></div>
              <div>
                <label style={lbl}>Marker</label>
                <select value={form.marker} onChange={e => { const d = MARKERS.find(m => m.name === e.target.value); setForm(f => ({ ...f, marker: e.target.value, unit: d?.unit || '' })); }} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Select a marker…</option>
                  {MARKERS.map(m => <option key={m.name} value={m.name}>{m.name} ({m.unit}) — {m.cond}</option>)}
                  <option value="__custom">Other / custom</option>
                </select>
                {selDef && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>ℹ {selDef.note}</p>}
              </div>
              {form.marker === '__custom' && (
                <div><label style={lbl}>Marker name</label><input type="text" placeholder="e.g. Cortisol" onChange={e => setForm(f => ({ ...f, marker: e.target.value }))} style={inp} /></div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Value</label><input type="number" step="any" required value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} style={inp} /></div>
                <div><label style={lbl}>Unit</label><input type="text" required value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="ng/dL, U/mL…" style={inp} /></div>
              </div>
              <div><label style={lbl}>Lab / clinic <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label><input type="text" value={form.lab} onChange={e => setForm(f => ({ ...f, lab: e.target.value }))} placeholder="e.g. Quest Diagnostics" style={inp} /></div>
              <button type="submit" disabled={!form.marker || !form.value || !form.unit} style={{ padding: '12px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, opacity: (!form.marker || !form.value || !form.unit) ? 0.4 : 1, marginTop: 4 }}>
                Save Result
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
