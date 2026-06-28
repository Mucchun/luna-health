import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#C83F6E', '#7B52B8', '#A85A20', '#2D7A56', '#2563EB'];

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 16px rgba(200,63,110,0.08)' }}>
      <p style={{ color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ fontWeight: 600, color: p.fill || 'var(--text)' }}>{p.value} <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>{p.name}</span></p>)}
    </div>
  );
};

const card: React.CSSProperties = { background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 22px' };

export default function Patterns() {
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [days, setDays] = useState(90);

  useEffect(() => { fetch(`/api/symptoms?days=${days}`).then(r => r.json()).then(setSymptoms); }, [days]);

  const freq: Record<string, { count: number; totalSev: number }> = {};
  for (const s of symptoms) {
    if (!freq[s.symptom]) freq[s.symptom] = { count: 0, totalSev: 0 };
    freq[s.symptom].count++; freq[s.symptom].totalSev += s.severity;
  }
  const freqData = Object.entries(freq)
    .map(([symptom, { count, totalSev }]) => ({ symptom: symptom.length > 20 ? symptom.slice(0, 19) + '…' : symptom, count, avg: Math.round(totalSev / count * 10) / 10 }))
    .sort((a, b) => b.count - a.count).slice(0, 8);

  const condData: Record<string, number[]> = {};
  for (const s of symptoms) { if (!condData[s.condition]) condData[s.condition] = []; condData[s.condition].push(s.severity); }
  const condSummary = Object.entries(condData).map(([c, sevs]) => ({ condition: c, avg: Math.round(sevs.reduce((a, b) => a + b, 0) / sevs.length * 10) / 10, count: sevs.length }));

  const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dowData = dowLabels.map((name, i) => {
    const ds = symptoms.filter(s => new Date(s.date + 'T00:00:00').getDay() === i);
    return { name, logs: ds.length, avg: ds.length ? Math.round(ds.reduce((a, s) => a + s.severity, 0) / ds.length * 10) / 10 : 0 };
  });

  const locFreq: Record<string, number> = {};
  for (const s of symptoms) if (s.body_location) locFreq[s.body_location] = (locFreq[s.body_location] || 0) + 1;
  const locData = Object.entries(locFreq).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div style={{ maxWidth: 860, padding: '28px 24px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Patterns</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Insights from your symptom history</p>
        </div>
        <select value={days} onChange={e => setDays(parseInt(e.target.value))} style={{ border: '1px solid var(--border)', borderRadius: 99, padding: '7px 14px', fontSize: 12, background: '#fff', color: 'var(--text-2)', cursor: 'pointer' }}>
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
          <option value={180}>6 months</option>
        </select>
      </div>

      {symptoms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
          <p style={{ fontSize: 16, marginBottom: 8, fontWeight: 600 }}>No data yet</p>
          <p style={{ fontSize: 13 }}>Start logging symptoms to see patterns</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {condSummary.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(condSummary.length, 3)}, 1fr)`, gap: 12 }}>
              {condSummary.map((c, i) => (
                <div key={c.condition} style={{ ...card, background: i === 0 ? 'var(--accent-light)' : '#fff' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>{c.condition}</p>
                  <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1, color: COLORS[i % COLORS.length] }}>{c.avg}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>avg severity · {c.count} logs</p>
                </div>
              ))}
            </div>
          )}

          <div style={card}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>Top symptoms by frequency</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={freqData} layout="vertical" margin={{ left: 16, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="symptom" tick={{ fontSize: 11, fill: 'var(--text-2)' }} tickLine={false} axisLine={false} width={130} />
                <Tooltip content={<TT />} />
                <Bar dataKey="count" name="times logged" fill="#C83F6E" radius={[0, 6, 6, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={card}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>By day of week</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={dowData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="logs" name="logs" fill="#C83F6E" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="avg" name="avg severity" fill="#F4B8CC" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {locData.length > 0 && (
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Pain locations</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {locData.map(([name, count], i) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', width: 140, flexShrink: 0 }}>{name}</span>
                      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 99 }}>
                        <div style={{ height: '100%', borderRadius: 99, width: `${(count / (locData[0]?.[1] || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-3)', width: 16, textAlign: 'right' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
