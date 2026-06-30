import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, ChevronRight, Sun, Moon, Star, BookOpen, AlertCircle, ThumbsUp } from 'lucide-react';

const STAGES = [
  {
    key: 'perimenopause',
    label: 'Perimenopause',
    emoji: '🌅',
    ages: 'Typically 40s–50s',
    desc: 'Periods becoming irregular; oestrogen beginning to fluctuate. Can last 4–10 years.',
    color: '#F59E0B',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
  {
    key: 'menopause',
    label: 'Menopause',
    emoji: '🌙',
    ages: 'Average age 51',
    desc: 'Defined as 12 consecutive months without a period. Hormone levels at their lowest.',
    color: '#7B52B8',
    bg: '#F0EBFF',
    border: '#DDD6FE',
  },
  {
    key: 'postmenopause',
    label: 'Post-menopause',
    emoji: '✨',
    ages: 'After the 12-month mark',
    desc: 'Symptoms often ease but cardiovascular and bone health need ongoing attention.',
    color: '#2D7A56',
    bg: '#D1F5E4',
    border: '#A0DBC0',
  },
  {
    key: 'early_surgical',
    label: 'Early / Surgical',
    emoji: '🩺',
    ages: '30s–40s',
    desc: 'Menopause before 45 due to surgery, cancer treatment, or premature ovarian insufficiency.',
    color: '#C83F6E',
    bg: 'var(--accent-light)',
    border: 'var(--accent-border)',
  },
] as const;

const SYMPTOM_GROUPS = [
  {
    label: 'Vasomotor',
    symptoms: ['Hot flashes', 'Night sweats', 'Chills', 'Palpitations'],
  },
  {
    label: 'Sleep & Energy',
    symptoms: ['Insomnia', 'Fatigue', 'Restless legs'],
  },
  {
    label: 'Mood & Mind',
    symptoms: ['Mood swings', 'Anxiety', 'Low mood', 'Brain fog', 'Memory issues', 'Irritability'],
  },
  {
    label: 'Physical',
    symptoms: ['Joint pain', 'Headaches', 'Hair thinning', 'Weight gain', 'Dry skin', 'Bloating'],
  },
  {
    label: 'Urogenital',
    symptoms: ['Vaginal dryness', 'Urinary urgency', 'Frequent UTIs', 'Low libido'],
  },
] as const;

const STAGE_STORE_KEY = 'luna_menopause_stage';
const LAST_PERIOD_KEY = 'luna_menopause_last_period';

export default function Menopause() {
  const [stage, setStage]         = useState<string>(() => localStorage.getItem(STAGE_STORE_KEY) || '');
  const [lastPeriod, setLastPeriod] = useState<string>(() => localStorage.getItem(LAST_PERIOD_KEY) || '');
  const [checked, setChecked]     = useState<Set<string>>(new Set());
  const [aiResult, setAiResult]   = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState<string | null>(null);

  useEffect(() => {
    if (stage) localStorage.setItem(STAGE_STORE_KEY, stage);
  }, [stage]);
  useEffect(() => {
    if (lastPeriod) localStorage.setItem(LAST_PERIOD_KEY, lastPeriod);
  }, [lastPeriod]);

  const toggleSymptom = (s: string) =>
    setChecked(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  const runAi = async () => {
    setAiLoading(true); setAiError(null);
    try {
      const res = await fetch('/api/ai/menopause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: stage || null, symptoms: [...checked], last_period: lastPeriod || null }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || 'Failed'); return; }
      setAiResult(data);
    } catch { setAiError('Could not reach the server.'); }
    finally   { setAiLoading(false); }
  };

  const a = aiResult?.analysis;

  return (
    <div style={{ maxWidth: 660, padding: '28px 24px 80px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sun size={16} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Menopause Guide</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
          Understand your stage, track symptoms, and get AI-powered personalised guidance for the menopause transition.
        </p>
      </div>

      {/* Stage selector */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: 20, marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Where are you in your journey?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STAGES.map(s => (
            <button key={s.key} onClick={() => setStage(s.key === stage ? '' : s.key)}
              style={{
                padding: '14px 14px 12px', borderRadius: 16, border: `2px solid ${stage === s.key ? s.color : 'var(--border)'}`,
                background: stage === s.key ? s.bg : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                {stage === s.key && (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: stage === s.key ? s.color : 'var(--text)', marginBottom: 3 }}>{s.label}</p>
              <p style={{ fontSize: 10, color: stage === s.key ? s.color : 'var(--text-3)', fontWeight: 500 }}>{s.ages}</p>
            </button>
          ))}
        </div>

        {/* Expandable stage description */}
        {stage && (() => {
          const s = STAGES.find(s => s.key === stage)!;
          return (
            <div style={{ marginTop: 12, padding: '12px 16px', background: s.bg, borderRadius: 14, border: `1px solid ${s.border}` }}>
              <p style={{ fontSize: 12, color: s.color, lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          );
        })()}

        {/* Last period date for perimenopause / unknown */}
        {(stage === 'perimenopause' || stage === '' || stage === 'early_surgical') && (
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
              Last period date <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — helps AI assess timing)</span>
            </label>
            <input type="date" value={lastPeriod} onChange={e => setLastPeriod(e.target.value)}
              style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '9px 12px', fontSize: 13, color: 'var(--text)', background: '#fff', width: '100%', boxSizing: 'border-box' }} />
          </div>
        )}
      </div>

      {/* Symptom checker */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Symptoms you're experiencing
          </p>
          {checked.size > 0 && (
            <button onClick={() => setChecked(new Set())}
              style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear all
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SYMPTOM_GROUPS.map(group => (
            <div key={group.label}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{group.label}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {group.symptoms.map(s => {
                  const on = checked.has(s);
                  return (
                    <button key={s} onClick={() => toggleSymptom(s)}
                      style={{
                        padding: '6px 13px', borderRadius: 99, border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                        background: on ? 'var(--accent-light)' : '#fff', color: on ? 'var(--accent)' : 'var(--text-2)',
                        fontSize: 12, fontWeight: on ? 600 : 400, cursor: 'pointer', transition: 'all 0.1s',
                      }}>
                      {on && '✓ '}{s}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {checked.size > 0 && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--accent-light)', borderRadius: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
              {checked.size} symptom{checked.size !== 1 ? 's' : ''} selected — included in AI analysis
            </p>
          </div>
        )}
      </div>

      {/* AI Button */}
      <button onClick={runAi} disabled={aiLoading}
        style={{ width: '100%', padding: '14px', borderRadius: 16, border: 'none', background: aiLoading ? 'var(--border)' : 'var(--accent)', color: aiLoading ? 'var(--text-3)' : '#fff', fontSize: 14, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        {aiLoading
          ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating your guide…</>
          : <><Sparkles size={15} /> {aiResult ? 'Regenerate Guide' : 'Get My Personalised Menopause Guide'}</>}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </button>

      {/* Error */}
      {aiError && (
        <div style={{ background: '#fff', border: '1px solid var(--accent-border)', borderRadius: 16, padding: '14px 18px', marginBottom: 14, display: 'flex', gap: 8 }}>
          <AlertCircle size={15} style={{ color: '#C83F6E', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#C83F6E' }}>{aiError}</p>
        </div>
      )}

      {/* AI Results */}
      {a && !aiLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Hero summary */}
          <div style={{ background: 'linear-gradient(135deg, #1A1020, #2D1040)', borderRadius: 24, padding: '24px 26px' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
              <Moon size={13} style={{ color: '#F5D0FE' }} />
              <p style={{ fontSize: 10, fontWeight: 700, color: '#F5D0FE', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Your Menopause Guide</p>
            </div>
            <p style={{ fontSize: 15, color: '#F9ECFF', lineHeight: 1.75, marginBottom: 12 }}>{a.summary}</p>
            {a.stage_insight && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.07)', borderRadius: 14 }}>
                <p style={{ fontSize: 12, color: '#E5D0FF', lineHeight: 1.7 }}>{a.stage_insight}</p>
              </div>
            )}
          </div>

          {/* Symptom insights */}
          {a.symptom_insights?.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Why it happens & what helps</p>
              </div>
              {a.symptom_insights.map((si: any, i: number) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: i < a.symptom_insights.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{si.symptom}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 6 }}>{si.why_it_happens}</p>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '8px 12px', background: '#D1F5E422', borderRadius: 10, border: '1px solid #D1F5E4' }}>
                    <ThumbsUp size={11} style={{ color: '#2D7A56', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: '#1A5C3E', fontWeight: 500, lineHeight: 1.5 }}>{si.management_tip}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lifestyle pillars */}
          {a.lifestyle_pillars?.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Lifestyle pillars</p>
              </div>
              <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {a.lifestyle_pillars.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 14 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      <Star size={13} style={{ color: '#F59E0B' }} fill="#F59E0B" />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{p.category}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 3 }}>{p.tip}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>{p.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical options */}
          {a.medical_options?.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={13} style={{ color: 'var(--text-3)' }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Medical options to discuss</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {a.medical_options.map((opt: any, i: number) => (
                  <div key={i} style={{ padding: '14px 20px', borderBottom: i < a.medical_options.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{opt.name}</p>
                      {opt.flag && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: opt.flag.toLowerCase().includes('caution') ? '#FEF3C7' : '#D1F5E4', color: opt.flag.toLowerCase().includes('caution') ? '#D97706' : '#2D7A56' }}>
                          {opt.flag}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 4 }}>{opt.description}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>Best for: {opt.suits_who}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Condition interactions + Lab notes side by side */}
          {(a.condition_interactions || a.lab_notes) && (
            <div style={{ display: 'grid', gridTemplateColumns: a.condition_interactions && a.lab_notes ? '1fr 1fr' : '1fr', gap: 12 }}>
              {a.condition_interactions && (
                <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 16, padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Your conditions</p>
                  <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.65 }}>{a.condition_interactions}</p>
                </div>
              )}
              {a.lab_notes && (
                <div style={{ background: '#DBEAFE22', border: '1px solid #DBEAFE', borderRadius: 16, padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Lab insights</p>
                  <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.65 }}>{a.lab_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Doctor questions + What to track */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {a.doctor_questions?.length > 0 && (
              <div style={{ background: '#F0EBFF', border: '1px solid #DDD6FE', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#7B52B8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Ask your doctor</p>
                <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {a.doctor_questions.map((q: string, i: number) => (
                    <li key={i} style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.55 }}>{q}</li>
                  ))}
                </ol>
              </div>
            )}
            {a.what_to_track?.length > 0 && (
              <div style={{ background: '#D1F5E422', border: '1px solid #D1F5E4', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#2D7A56', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Track in Luna</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {a.what_to_track.map((t: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <ChevronRight size={11} style={{ color: '#2D7A56', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.5 }}>{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generated time + disclaimer */}
          <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6, fontStyle: 'italic', padding: '2px 4px' }}>
            Generated {new Date(aiResult.generated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · For informational purposes only. Please consult a GP, gynaecologist, or menopause specialist for diagnosis and treatment decisions.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!a && !aiLoading && !aiError && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Sun size={22} style={{ color: '#D97706' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Ready when you are</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65, maxWidth: 360, margin: '0 auto' }}>
            Select your stage and tick any symptoms above, then tap the button to get a personalised guide with evidence-based advice.
          </p>
        </div>
      )}
    </div>
  );
}
