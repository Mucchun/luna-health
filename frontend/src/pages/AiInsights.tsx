import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle, Stethoscope, Lightbulb, Zap, Heart, ChevronRight } from 'lucide-react';

interface Analysis {
  summary: string;
  severity_trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
  trend_explanation: string;
  key_insights: string[];
  trigger_patterns: string[];
  recommendations: string[];
  doctor_questions: string[];
  cycle_insight: string | null;
  most_impactful_symptom: string;
  condition_note: string;
}

interface Result {
  analysis: Analysis;
  data_points: number;
  cycles_analyzed: number;
  generated_at: string;
}

const CACHE_KEY = 'luna_ai_analysis';

const TREND_CONFIG = {
  improving:         { color: '#2D7A56', bg: '#D1F5E4', icon: TrendingUp,   label: 'Improving' },
  stable:            { color: '#2563EB', bg: '#DBEAFE', icon: Minus,         label: 'Stable' },
  worsening:         { color: '#C83F6E', bg: '#FCE7EF', icon: TrendingDown,  label: 'Needs attention' },
  insufficient_data: { color: '#A85A20', bg: '#FEEBD8', icon: AlertCircle,   label: 'More data needed' },
};

function Section({ icon: Icon, color, title, children }: { icon: any; color: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color }} />
        </div>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.1px' }}>{title}</p>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

function BulletList({ items, color = 'var(--accent)' }: { items: string[]; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }} />
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

function Shimmer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[240, 180, 120, 200, 160].map((w, i) => (
        <div key={i} style={{ height: 16, borderRadius: 8, background: 'linear-gradient(90deg, var(--border) 25%, var(--bg-2) 50%, var(--border) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: `${w}px`, maxWidth: '100%' }} />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}

export default function AiInsights() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noKey, setNoKey] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try { setResult(JSON.parse(cached)); } catch {}
    }
  }, []);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/analyze', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes('GROQ_API_KEY')) { setNoKey(true); }
        else { setError(data.error || 'Something went wrong'); }
        return;
      }
      setResult(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      setError('Could not reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const a = result?.analysis;
  const trend = a ? TREND_CONFIG[a.severity_trend] : null;
  const TrendIcon = trend?.icon ?? Minus;

  const generatedAt = result?.generated_at
    ? new Date(result.generated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{ maxWidth: 680, padding: '28px 24px 80px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>AI Health Insights</h1>
            <span style={{ fontSize: 10, fontWeight: 700, background: 'linear-gradient(135deg, #f55036, #ff8c00)', color: '#fff', padding: '2px 8px', borderRadius: 99, letterSpacing: '0.3px' }}>GROQ</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {generatedAt ? `Last updated ${generatedAt} · ${result?.data_points} logs analysed` : 'Personalised analysis of your symptom patterns'}
          </p>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: 'none', background: loading ? 'var(--border)' : 'var(--accent)', color: loading ? 'var(--text-3)' : '#fff', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0, transition: 'all 0.1s' }}
        >
          {loading
            ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</>
            : <><Sparkles size={12} /> {result ? 'Re-analyse' : 'Analyse my health'}</>}
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </button>
      </div>

      {/* No API key state */}
      {noKey && (
        <div style={{ background: '#fff', border: '1.5px solid var(--amber)', borderRadius: 18, padding: '20px 22px', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)', marginBottom: 6 }}>API key not configured</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>
            To enable AI analysis, add your free Groq API key as an environment variable and restart the backend:
          </p>
          <code style={{ display: 'block', background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--text)', fontFamily: 'monospace' }}>
            GROQ_API_KEY=gsk_... node server.js
          </code>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
            Get your free key at <span style={{ color: 'var(--accent)', fontWeight: 600 }}>console.groq.com</span>
          </p>
        </div>
      )}

      {/* General error */}
      {error && !noKey && (
        <div style={{ background: 'var(--red-light)', border: '1px solid var(--accent-border)', borderRadius: 14, padding: '12px 16px', marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--red)' }}>{error}</p>
        </div>
      )}

      {/* Empty / prompt state */}
      {!result && !loading && !error && !noKey && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: '48px 28px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, var(--accent-light), var(--purple-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Sparkles size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Your personal health analyst</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65, maxWidth: 380, margin: '0 auto 24px' }}>
            Claude analyses your symptom logs, period patterns, triggers, and labs to give you personalised insights — not generic advice.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxWidth: 400, margin: '0 auto 28px', textAlign: 'left' }}>
            {[
              { icon: TrendingUp, label: 'Severity trends over time' },
              { icon: Zap, label: 'Trigger pattern recognition' },
              { icon: Heart, label: 'Condition-specific insights' },
              { icon: Stethoscope, label: 'Doctor visit question prep' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg)', borderRadius: 12 }}>
                <Icon size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</p>
              </div>
            ))}
          </div>
          <button onClick={analyze} style={{ padding: '12px 28px', borderRadius: 99, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Sparkles size={13} style={{ marginRight: 7, verticalAlign: 'middle' }} />
            Analyse my health
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12 }}>Needs at least a few symptom logs to work</p>
        </div>
      )}

      {/* Loading shimmer */}
      {loading && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: '28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-light), var(--purple-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={15} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Analysing your health data…</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Claude is reading your logs, patterns & triggers</p>
            </div>
          </div>
          <Shimmer />
        </div>
      )}

      {/* Results */}
      {a && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Hero summary card */}
          <div style={{ background: 'linear-gradient(135deg, #1A0810 0%, #2E1030 100%)', borderRadius: 22, padding: '24px 26px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Sparkles size={13} style={{ color: '#FFAEC8' }} />
              <p style={{ fontSize: 10, fontWeight: 700, color: '#FFAEC8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>AI Summary</p>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#F9D8E6', marginBottom: 18 }}>{a.summary}</p>
            {trend && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 99, background: trend.bg }}>
                <TrendIcon size={13} style={{ color: trend.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: trend.color }}>{trend.label}</span>
                <span style={{ fontSize: 11, color: trend.color, opacity: 0.8 }}>· {a.trend_explanation}</span>
              </div>
            )}
          </div>

          {/* Impactful symptom + condition spotlight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Top symptom</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>{a.most_impactful_symptom}</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 18px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Condition focus</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{a.condition_note}</p>
            </div>
          </div>

          {/* Key insights */}
          {a.key_insights.length > 0 && (
            <Section icon={Lightbulb} color="#A85A20" title="Key Insights from Your Data">
              <BulletList items={a.key_insights} color="#A85A20" />
            </Section>
          )}

          {/* Trigger patterns */}
          {a.trigger_patterns.length > 0 && (
            <Section icon={Zap} color="#C83F6E" title="Trigger Patterns">
              <BulletList items={a.trigger_patterns} color="#C83F6E" />
            </Section>
          )}

          {/* Cycle insight */}
          {a.cycle_insight && (
            <Section icon={Heart} color="#7B52B8" title="Period & Cycle">
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{a.cycle_insight}</p>
            </Section>
          )}

          {/* Recommendations */}
          {a.recommendations.length > 0 && (
            <Section icon={Sparkles} color="#2D7A56" title="Personalised Recommendations">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {a.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--sage-light)', borderRadius: 12 }}>
                    <ChevronRight size={14} style={{ color: 'var(--sage)', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{rec}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Doctor questions */}
          {a.doctor_questions.length > 0 && (
            <Section icon={Stethoscope} color="#2563EB" title="Questions to Ask Your Doctor">
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>These are specific to your data — bring this list to your next appointment.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {a.doctor_questions.map((q, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: '#DBEAFE22', border: '1px solid #DBEAFE', borderRadius: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', flexShrink: 0, paddingTop: 1 }}>{i + 1}.</span>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{q}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Disclaimer */}
          <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '13px 16px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
              This analysis is generated by Claude AI from your self-reported data. It is for informational purposes only and is not medical advice. Always consult a qualified healthcare provider for diagnosis and treatment decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
