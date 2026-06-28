import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function cyclePhase(day: number, length: number) {
  const pct = day / length;
  if (day <= 5) return { phase: 'Menstrual', desc: 'Rest & restore. Your energy is at its lowest — honour it.', color: '#C83F6E', bg: '#FFF0F5', dot: '#F4B8CC' };
  if (pct <= 0.35) return { phase: 'Follicular', desc: 'Energy rising. Good time for new projects and social connection.', color: '#7B52B8', bg: '#F5F0FF', dot: '#C4B0E8' };
  if (pct <= 0.5) return { phase: 'Ovulatory', desc: 'Peak energy and communication. Schedule important conversations.', color: '#2D7A56', bg: '#F0FBF5', dot: '#A0DBC0' };
  return { phase: 'Luteal', desc: 'Focus inward. Watch for PMDD symptoms in the late luteal window.', color: '#A85A20', bg: '#FFF5ED', dot: '#F4C8A0' };
}

const Tooltip_ = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 10, padding: '8px 12px', fontSize: 12,
      boxShadow: '0 4px 16px rgba(200,63,110,0.08)',
    }}>
      <p style={{ color: 'var(--text-3)', marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 700, color: 'var(--accent)' }}>{payload[0].value}<span style={{ fontWeight: 400, color: 'var(--text-3)' }}>/10</span></p>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/predictions').then(r => r.json()),
    ]).then(([s, p]) => { setStats(s); setPredictions(p); });
  }, []);

  if (!stats) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  const lastCycle = stats.last_cycle;
  const dayInCycle = lastCycle
    ? Math.max(0, Math.floor((new Date(todayStr).getTime() - new Date(lastCycle.start_date).getTime()) / 86400000))
    : null;
  const cycleLen = stats.profile.cycle_length || 28;
  const phase = dayInCycle !== null ? cyclePhase(dayInCycle, cycleLen) : null;
  const phasePct = dayInCycle !== null ? Math.min(100, Math.round((dayInCycle / cycleLen) * 100)) : 0;

  const chartData = stats.last30.map((d: any) => ({
    d: d.date.slice(5).replace('-', '/'),
    v: Math.round(d.avg_severity * 10) / 10,
  }));
  const totalLogs = stats.last30.reduce((a: number, d: any) => a + d.count, 0);
  const avgSev = stats.last30.length
    ? Math.round(stats.last30.reduce((a: number, d: any) => a + d.avg_severity, 0) / stats.last30.length * 10) / 10
    : null;

  const flares = (predictions?.predictions || []).slice(0, 3);

  const nextPeriodDate = predictions?.next_cycle_start
    ? new Date(predictions.next_cycle_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Card style
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: '#fff',
    borderRadius: 20,
    border: '1px solid var(--border)',
    overflow: 'hidden',
    ...extra,
  });

  return (
    <div style={{ padding: '28px 24px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.6px', lineHeight: 1.15 }}>
            {greeting}, {stats.profile.name} ✦
          </h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {stats.profile.conditions.map((c: string) => (
              <span key={c} style={{
                fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99,
                background: 'var(--accent-light)', color: 'var(--accent)',
                border: '1px solid var(--accent-border)', letterSpacing: '0.2px',
              }}>{c}</span>
            ))}
          </div>
        </div>
        <Link to="/log" style={{
          display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
          background: 'var(--accent)', color: '#fff',
          fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 99,
        }}>
          + Log symptom
        </Link>
      </div>

      {/* Bento grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>

        {/* Phase card — 2 cols */}
        <div style={{ ...card(), gridColumn: 'span 2', padding: 0, background: phase?.bg || '#FFF5F8' }}>
          {phase && dayInCycle !== null ? (
            <div style={{ padding: '22px 24px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: phase.color, marginBottom: 10 }}>
                Current Phase
              </p>
              <p style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--text)', lineHeight: 1 }}>
                {phase.phase}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.5, maxWidth: 240 }}>
                {phase.desc}
              </p>
              <div style={{ marginTop: 18 }}>
                <div style={{ height: 5, background: `${phase.color}20`, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${phasePct}%`, background: phase.color, borderRadius: 99 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 10, color: phase.color, fontWeight: 600 }}>Day {dayInCycle + 1} of {cycleLen}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{cycleLen - dayInCycle - 1}d remaining</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '22px 24px' }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
                <Link to="/cycle" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Log your first period</Link> to unlock cycle phase tracking.
              </p>
            </div>
          )}
        </div>

        {/* Day in cycle — 1 col */}
        <div style={{ ...card({ padding: '22px 20px', background: 'var(--surface-pink)' }) }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>
            Cycle day
          </p>
          <p style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-2px', color: 'var(--accent)', lineHeight: 1 }}>
            {dayInCycle !== null ? dayInCycle + 1 : '—'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>of {cycleLen} days</p>
        </div>

        {/* Next period — 1 col */}
        <div style={{ ...card({ padding: '22px 20px' }) }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>
            Next period
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text)', lineHeight: 1 }}>
            {nextPeriodDate || '—'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>predicted</p>
        </div>

        {/* Chart — 3 cols */}
        <div style={{ ...card({ padding: '20px 22px' }), gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Severity — 30 days</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {totalLogs} logs · avg {avgSev !== null ? `${avgSev}/10` : '—'}
              </p>
            </div>
            <Link to="/patterns" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
              Patterns →
            </Link>
          </div>
          {chartData.length === 0 ? (
            <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 12 }}>
              Log symptoms to see your trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -32 }}>
                <defs>
                  <linearGradient id="pink-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C83F6E" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#C83F6E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fontSize: 9, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} ticks={[0, 5, 10]} />
                <Tooltip content={<Tooltip_ />} />
                <Area type="monotone" dataKey="v" stroke="#C83F6E" strokeWidth={2} fill="url(#pink-grad)" dot={false} activeDot={{ r: 4, fill: '#C83F6E', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Today's symptoms — 1 col */}
        <div style={{ ...card({ padding: '20px 20px' }) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Today</p>
            <Link to="/log" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>+ Log</Link>
          </div>
          {stats.today_symptoms.length === 0 ? (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.7 }}>
                Nothing logged<br />yet today
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {stats.today_symptoms.slice(0, 4).map((s: any) => {
                const sev = s.severity;
                const sevColor = sev >= 7 ? '#C83F6E' : sev >= 5 ? 'var(--amber)' : 'var(--sage)';
                return (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-2)', flex: 1, lineHeight: 1.3 }}>{s.symptom}</p>
                    <span style={{
                      fontSize: 11, fontWeight: 700, minWidth: 26, textAlign: 'center',
                      padding: '1px 6px', borderRadius: 6, background: `${sevColor}18`, color: sevColor,
                    }}>{sev}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top symptoms — 2 cols */}
        <div style={{ ...card({ padding: '20px 22px' }), gridColumn: 'span 2' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Top symptoms this month</p>
          {stats.most_common_symptoms.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {stats.most_common_symptoms.map((s: any, i: number) => (
                <div key={s.symptom}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                    <p style={{ fontSize: 12, color: i === 0 ? 'var(--text)' : 'var(--text-2)', fontWeight: i === 0 ? 500 : 400 }}>
                      {s.symptom}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{s.count}× · {Math.round(s.avg_sev * 10) / 10}/10</p>
                  </div>
                  <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${(s.count / (stats.most_common_symptoms[0]?.count || 1)) * 100}%`,
                      background: i === 0 ? 'var(--accent)' : 'var(--border-strong)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flare predictions — 2 cols */}
        <div style={{ ...card({ padding: '20px 22px' }), gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Predicted flare days</p>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>From cycle history</span>
          </div>
          {flares.length === 0 ? (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 10 }}>
                {predictions?.message || 'Log symptoms across 2+ cycles to unlock predictions.'}
              </p>
              <Link to="/cycle" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                → Cycle tracker
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {flares.map((p: any) => (
                <div key={p.date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Cycle day {p.cycle_day + 1}</p>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                    background: 'var(--amber-light)', color: 'var(--amber)',
                    border: '1px solid #F4C8A0',
                  }}>
                    {p.confidence}% likely
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
