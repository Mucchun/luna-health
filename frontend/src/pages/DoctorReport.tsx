import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function DoctorReport() {
  const [report, setReport] = useState<any>(null);
  const [days, setDays] = useState(90);

  useEffect(() => { fetch(`/api/report?days=${days}`).then(r => r.json()).then(setReport); }, [days]);

  if (!report) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  const startDate = new Date(new Date().setDate(new Date().getDate() - days)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const endDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const sec: React.CSSProperties = { marginBottom: 28 };
  const secLbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' };
  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 };

  return (
    <div style={{ maxWidth: 700, padding: '28px 24px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Doctor Visit Report</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Auto-generated summary — bring this to your appointment</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={days} onChange={e => setDays(parseInt(e.target.value))} style={{ border: '1px solid var(--border)', borderRadius: 99, padding: '7px 14px', fontSize: 12, background: '#fff', color: 'var(--text-2)', cursor: 'pointer' }}>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={13} /> Print
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, overflow: 'hidden' }}>
        {/* Header strip */}
        <div style={{ background: 'var(--accent)', padding: '24px 28px', color: '#fff' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', opacity: 0.7, marginBottom: 8 }}>Health Summary Report</p>
          <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1 }}>{report.profile.name}</p>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{report.profile.conditions.join(' · ')}</p>
          <p style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{startDate} — {endDate}</p>
        </div>

        <div style={{ padding: '28px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Symptom logs', value: report.total_symptom_logs, color: 'var(--accent)' },
              { label: 'High severity days', value: report.high_severity_days, color: '#C83F6E' },
              { label: 'Triggers logged', value: report.trigger_count, color: 'var(--amber)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '16px 12px', background: 'var(--bg)', borderRadius: 16 }}>
                <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1, color }}>{value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 5, fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Conditions */}
          <div style={sec}>
            <p style={secLbl}>Conditions</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {report.profile.conditions.map((c: string) => (
                <span key={c} style={{ fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 99, background: 'var(--accent-light)', color: 'var(--accent)', border: '1.5px solid var(--accent-border)' }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Top symptoms */}
          {report.top_symptoms.length > 0 && (
            <div style={sec}>
              <p style={secLbl}>Most Frequent Symptoms</p>
              {report.top_symptoms.map((s: any, i: number) => (
                <div key={s.symptom} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', width: 16 }}>{i + 1}.</span>
                      <span style={{ fontSize: 13, fontWeight: i < 3 ? 600 : 400, color: 'var(--text)' }}>{s.symptom}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.count}×</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
                        background: s.avg_severity >= 7 ? 'var(--accent-light)' : s.avg_severity >= 5 ? 'var(--amber-light)' : 'var(--sage-light)',
                        color: s.avg_severity >= 7 ? 'var(--accent)' : s.avg_severity >= 5 ? 'var(--amber)' : 'var(--sage)',
                      }}>
                        {s.avg_severity}/10
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, marginLeft: 26 }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${(s.count / (report.top_symptoms[0]?.count || 1)) * 100}%`, background: i === 0 ? 'var(--accent)' : 'var(--border-strong)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cycles */}
          {report.cycles.length > 0 && (
            <div style={sec}>
              <p style={secLbl}>Recent Cycles</p>
              {report.cycles.map((c: any, i: number) => {
                const dur = c.end_date ? Math.round((new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / 86400000) + 1 : null;
                return (
                  <div key={c.id} style={{ ...row, borderBottom: i < report.cycles.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{new Date(c.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span style={{ color: 'var(--text-3)' }}>{dur ? `${dur} days` : 'End not recorded'}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Medications */}
          {report.active_medications.length > 0 && (
            <div style={sec}>
              <p style={secLbl}>Current Medications & Supplements</p>
              {report.active_medications.map((m: any, i: number) => (
                <div key={m.id} style={{ ...row, borderBottom: i < report.active_medications.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{m.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>({m.type})</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{[m.dose, m.frequency].filter(Boolean).join(' · ')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Labs */}
          {report.labs.length > 0 && (
            <div style={sec}>
              <p style={secLbl}>Lab Results</p>
              {report.labs.slice(0, 10).map((l: any, i: number) => (
                <div key={l.id} style={{ ...row, borderBottom: i < Math.min(report.labs.length, 10) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ color: 'var(--text)' }}>{l.marker}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                    {l.value} {l.unit}
                    <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-3)', marginLeft: 8 }}>
                      {new Date(l.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', marginTop: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
              This report is generated from self-reported symptom data for informational purposes only. It is not a medical diagnosis. Please share with a qualified healthcare provider for interpretation.
            </p>
          </div>

          <p style={{ fontSize: 10, color: 'var(--border-strong)', textAlign: 'right', marginTop: 16 }}>
            Generated by Luna Health · {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
