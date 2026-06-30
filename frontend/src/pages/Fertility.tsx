import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw, Heart, Star, AlertCircle, ChevronRight as CR } from 'lucide-react';

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDays(date: string, n: number) {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m+1, 0).getDate(); }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay(); }

interface FertilityWindow {
  fertileStart: string; fertileEnd: string;
  ovulation: string;
  nextPeriod: string; nextPeriodEnd: string;
  cycleDay: number; daysToOvulation: number | null;
}

function calcWindow(cycles: any[], profile: any): FertilityWindow | null {
  if (!cycles.length) return null;
  const lastStart = cycles[0].start_date;
  const cycleLen  = profile?.cycle_length || 28;
  const periodLen = profile?.period_length || 5;

  const ovulation    = addDays(lastStart, cycleLen - 14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd   = addDays(ovulation, 1);
  const nextPeriod   = addDays(lastStart, cycleLen);
  const nextPeriodEnd= addDays(nextPeriod, periodLen - 1);

  const today = localToday();
  const cycleDay = Math.round((new Date(today).getTime() - new Date(lastStart + 'T00:00:00').getTime()) / 86400000) + 1;
  const ovDate   = new Date(ovulation + 'T00:00:00');
  const todayDate= new Date(today);
  const daysToOvulation = Math.round((ovDate.getTime() - todayDate.getTime()) / 86400000);

  return { fertileStart, fertileEnd, ovulation, nextPeriod, nextPeriodEnd, cycleDay, daysToOvulation };
}

export default function Fertility() {
  const [profile, setProfile]   = useState<any>(null);
  const [cycles, setCycles]     = useState<any[]>([]);
  const [view, setView]         = useState(new Date());
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]   = useState<string|null>(null);

  const today = localToday();

  useEffect(() => {
    fetch('/api/profile').then(r=>r.json()).then(setProfile);
    fetch('/api/cycles').then(r=>r.json()).then(setCycles);
  }, []);

  const win = profile && cycles.length ? calcWindow(cycles, profile) : null;

  const isPeriodDay = (ds: string) => {
    for (const c of cycles) {
      const end = c.end_date || c.start_date;
      if (ds >= c.start_date && ds <= end) return true;
    }
    return false;
  };
  const isFertile   = (ds: string) => win ? ds >= win.fertileStart && ds <= win.fertileEnd : false;
  const isOvulation = (ds: string) => win?.ovulation === ds;
  const isNextPeriod= (ds: string) => win ? ds >= win.nextPeriod && ds <= win.nextPeriodEnd : false;

  const runAi = async () => {
    setAiLoading(true); setAiError(null);
    try {
      const res  = await fetch('/api/ai/fertility', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || 'Failed'); return; }
      setAiResult(data);
    } catch { setAiError('Could not reach the server.'); }
    finally   { setAiLoading(false); }
  };

  const y = view.getFullYear();
  const m = view.getMonth();
  const daysInMonth = getDaysInMonth(y, m);
  const firstDay    = getFirstDay(y, m);
  const monthStr    = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const a = aiResult?.analysis;
  const COND_COLORS: Record<string, string> = { PCOS: '#7B52B8', Endometriosis: '#C83F6E', PMDD: '#A85A20' };

  if (!profile) return null;

  return (
    <div style={{ maxWidth: 660, padding: '28px 24px 80px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Fertility</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Ovulation predictions & AI conception insights</p>
        </div>
        <button onClick={runAi} disabled={aiLoading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: 'none', background: aiLoading ? 'var(--border)' : 'var(--accent)', color: aiLoading ? 'var(--text-3)' : '#fff', fontSize: 12, fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
          {aiLoading
            ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</>
            : <><Sparkles size={12} /> AI Insights</>}
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </button>
      </div>

      {/* Stats row */}
      {win ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
          {[
            {
              label: 'Cycle day',
              value: win.cycleDay,
              sub: `of ${profile.cycle_length} days`,
              color: 'var(--accent)',
            },
            {
              label: win.daysToOvulation !== null && win.daysToOvulation >= 0 ? 'Days to ovulation' : 'Ovulation was',
              value: win.daysToOvulation !== null ? Math.abs(win.daysToOvulation) : '—',
              sub: win.daysToOvulation !== null && win.daysToOvulation < 0 ? 'days ago' : win.daysToOvulation === 0 ? 'Today 🌟' : 'days away',
              color: '#2D7A56',
            },
            {
              label: 'Next period',
              value: new Date(win.nextPeriod + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              sub: (() => {
                const days = Math.round((new Date(win.nextPeriod+'T00:00:00').getTime() - new Date(today).getTime()) / 86400000);
                return days > 0 ? `in ${days} days` : days === 0 ? 'today' : `${Math.abs(days)}d late`;
              })(),
              color: 'var(--accent)',
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.8px', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{sub}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: '18px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Log at least one period in Cycle Tracker to see predictions.</p>
        </div>
      )}

      {/* Calendar */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: 22, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <button onClick={() => setView(d => new Date(d.getFullYear(), d.getMonth()-1))}
            style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-2)' }}>
            <ChevronLeft size={15} />
          </button>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>{monthStr}</p>
          <button onClick={() => setView(d => new Date(d.getFullYear(), d.getMonth()+1))}
            style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-2)' }}>
            <ChevronRight size={15} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', paddingBottom: 4 }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {Array.from({ length: firstDay }).map((_,i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_,i) => {
            const day = i + 1;
            const ds  = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const period    = isPeriodDay(ds);
            const fertile   = !period && isFertile(ds);
            const ovulation = !period && isOvulation(ds);
            const nextP     = !period && !fertile && isNextPeriod(ds);
            const isToday   = ds === today;

            return (
              <div key={day} title={ovulation ? 'Peak fertility / ovulation' : fertile ? 'Fertile window' : period ? 'Period day' : nextP ? 'Predicted period' : ''}
                style={{
                  height: 38, borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  fontWeight: isToday ? 700 : 400,
                  background: ovulation
                    ? 'linear-gradient(135deg, #2D7A56, #1A5C3E)'
                    : fertile
                    ? '#D1F5E4'
                    : period
                    ? 'var(--accent)'
                    : nextP
                    ? 'var(--accent-light)'
                    : isToday
                    ? 'var(--bg-2)'
                    : 'transparent',
                  color: ovulation
                    ? '#fff'
                    : fertile
                    ? '#1A5C3E'
                    : period
                    ? '#fff'
                    : nextP
                    ? 'var(--accent)'
                    : isToday
                    ? 'var(--accent)'
                    : 'var(--text-2)',
                  outline: isToday && !period && !ovulation && !fertile ? '2px solid var(--accent)' : 'none',
                  outlineOffset: -2,
                  cursor: 'default',
                }}>
                {ovulation ? '★' : day}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          {[
            { bg: 'var(--accent)', label: 'Period', text: '#fff' },
            { bg: 'linear-gradient(135deg,#2D7A56,#1A5C3E)', label: '★ Ovulation', text: '#fff' },
            { bg: '#D1F5E4', label: 'Fertile window', border: '#A0DBC0' },
            { bg: 'var(--accent-light)', label: 'Predicted period', border: 'var(--accent-border)' },
          ].map(({ bg, label, border }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
              <span style={{ width: 13, height: 13, borderRadius: 4, display: 'inline-block', background: bg, border: border ? `1.5px solid ${border}` : 'none', flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>

        {/* Irregularity note for PCOS */}
        {profile?.conditions?.includes('PCOS') && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#F0EBFF', borderRadius: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertCircle size={13} style={{ color: '#7B52B8', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 11, color: '#7B52B8', lineHeight: 1.55 }}>
              PCOS can cause irregular cycles. Ovulation predictions are estimates — consider LH strips for more accuracy.
            </p>
          </div>
        )}
      </div>

      {/* AI Result */}
      {aiError && (
        <div style={{ background: '#fff', border: '1px solid var(--accent-border)', borderRadius: 16, padding: '14px 18px', marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--amber)' }}>{aiError}</p>
        </div>
      )}

      {a && !aiLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Summary */}
          <div style={{ background: 'linear-gradient(135deg, #1A0810, #2E1030)', borderRadius: 22, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Heart size={13} style={{ color: '#FFAEC8' }} fill="#FFAEC8" />
              <p style={{ fontSize: 10, fontWeight: 700, color: '#FFAEC8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>AI Fertility Summary</p>
            </div>
            <p style={{ fontSize: 14, color: '#F9D8E6', lineHeight: 1.7, marginBottom: 14 }}>{a.summary}</p>
            <p style={{ fontSize: 12, color: 'rgba(249,216,230,0.7)', lineHeight: 1.6 }}>{a.cycle_assessment}</p>
          </div>

          {/* Condition impacts */}
          {a.condition_impacts?.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>How your conditions affect fertility</p>
              </div>
              {a.condition_impacts.map((ci: any, i: number) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: i < a.condition_impacts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: (COND_COLORS[ci.condition] || 'var(--accent)') + '18', color: COND_COLORS[ci.condition] || 'var(--accent)' }}>{ci.condition}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 5 }}>{ci.impact}</p>
                  <p style={{ fontSize: 12, color: '#2D7A56', fontWeight: 500 }}>✓ {ci.positive_note}</p>
                </div>
              ))}
            </div>
          )}

          {/* Conception tips */}
          {a.conception_tips?.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Conception tips for you</p>
              </div>
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {a.conception_tips.map((tip: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 12px', background: '#D1F5E422', borderRadius: 12, border: '1px solid #D1F5E4' }}>
                    <Star size={12} style={{ color: '#2D7A56', flexShrink: 0, marginTop: 2 }} fill="#2D7A56" />
                    <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab fertility notes */}
          {a.lab_fertility_notes && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Lab Insights</p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{a.lab_fertility_notes}</p>
            </div>
          )}

          {/* Tracking suggestions + lifestyle in 2 cols */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {a.tracking_suggestions?.length > 0 && (
              <div style={{ background: '#F0EBFF', border: '1px solid #DDD6FE', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#7B52B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Track to improve accuracy</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {a.tracking_suggestions.map((s: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <CR size={11} style={{ color: '#7B52B8', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 11, color: '#4C2D8F', lineHeight: 1.5 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {a.doctor_questions?.length > 0 && (
              <div style={{ background: '#DBEAFE22', border: '1px solid #DBEAFE', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Ask your doctor</p>
                <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {a.doctor_questions.map((q: string, i: number) => (
                    <li key={i} style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.5 }}>{q}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6, fontStyle: 'italic', padding: '2px 4px' }}>
            Predictions are estimates based on average cycle data. Consult a gynaecologist or fertility specialist for personalised medical advice.
          </p>
        </div>
      )}

      {/* Empty state for AI */}
      {!a && !aiLoading && !aiError && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #D1F5E4, var(--accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Heart size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>AI Fertility Insights</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65, maxWidth: 360, margin: '0 auto 20px' }}>
            Get personalised fertility analysis based on your cycle history, conditions, symptoms, and lab values.
          </p>
          <button onClick={runAi}
            style={{ padding: '11px 26px', borderRadius: 99, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Sparkles size={13} style={{ marginRight: 7, verticalAlign: 'middle' }} />
            Get Fertility Insights
          </button>
        </div>
      )}
    </div>
  );
}
