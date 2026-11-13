import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, ChevronRight, CalendarDays } from 'lucide-react';
import { Citations } from '../lib/references';
import { useI18n, type StringKey } from '../i18n';
import { trTerm } from '../i18n/medical';
import { localISO, daysBetween } from '../lib/date';

type PhaseKey = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
const PHASES: Record<PhaseKey, { name: StringKey; desc: StringKey; color: string; bg: string }> = {
  menstrual:  { name: 'phase.menstrual',  desc: 'phase.menstrualDesc',  color: '#C83F6E', bg: '#FFF0F5' },
  follicular: { name: 'phase.follicular', desc: 'phase.follicularDesc', color: '#7B52B8', bg: '#F5F0FF' },
  ovulatory:  { name: 'phase.ovulatory',  desc: 'phase.ovulatoryDesc',  color: '#2D7A56', bg: '#F0FBF5' },
  luteal:     { name: 'phase.luteal',     desc: 'phase.lutealDesc',     color: '#A85A20', bg: '#FFF5ED' },
};

// Phase boundaries as fractions of the cycle: period, then follicular to 35%,
// ovulatory to 50%, luteal for the rest.
function phaseBounds(cycleLen: number, periodLen: number): [PhaseKey, number, number][] {
  const p = Math.min(periodLen / cycleLen, 0.3);
  return [['menstrual', 0, p], ['follicular', p, 0.35], ['ovulatory', 0.35, 0.5], ['luteal', 0.5, 1]];
}
function phaseFor(day: number, cycleLen: number, periodLen: number): PhaseKey {
  const pct = Math.min(day / cycleLen, 0.999);
  return (phaseBounds(cycleLen, periodLen).find(([, from, to]) => pct >= from && pct < to) || ['luteal'])[0] as PhaseKey;
}

// Ring showing the whole cycle as four phase arcs, with a marker for today.
function CycleRing({ day, cycleLen, periodLen, label }: { day: number; cycleLen: number; periodLen: number; label: string }) {
  const R = 52, C = 2 * Math.PI * R, GAP = 4;
  const pct = Math.min(day / cycleLen, 1);
  const angle = pct * 2 * Math.PI - Math.PI / 2;
  const current = phaseFor(day, cycleLen, periodLen);
  return (
    <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
      <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`${label} ${day + 1} / ${cycleLen}`}>
        <g transform="rotate(-90 64 64)">
          {phaseBounds(cycleLen, periodLen).map(([key, from, to]) => {
            const len = Math.max((to - from) * C - GAP, 1);
            return (
              <circle key={key} cx="64" cy="64" r={R} fill="none" strokeWidth="11"
                stroke={PHASES[key].color} opacity={key === current ? 1 : 0.28}
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-(from * C + GAP / 2)} />
            );
          })}
        </g>
        <circle cx={64 + R * Math.cos(angle)} cy={64 + R * Math.sin(angle)} r="8.5" fill="#fff" stroke={PHASES[current].color} strokeWidth="3.5" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text)', lineHeight: 1 }}>{day + 1}</span>
      </div>
    </div>
  );
}

const Tooltip_ = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 16px rgba(200,63,110,0.08)' }}>
      <p style={{ color: 'var(--text-3)', marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 700, color: 'var(--accent)' }}>{payload[0].value}<span style={{ fontWeight: 400, color: 'var(--text-3)' }}>/10</span></p>
    </div>
  );
};

const sevColor = (sev: number) => sev >= 7 ? 'var(--accent)' : sev >= 5 ? 'var(--amber)' : 'var(--sage)';

const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.6px', textTransform: 'uppercase' };
const cardTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' };
const linkStyle: React.CSSProperties = { fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' };

export default function Dashboard() {
  const { tr, lang } = useI18n();
  const [stats, setStats] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const today = new Date();
  const todayStr = localISO(today);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/predictions').then(r => r.json()),
    ]).then(([s, p]) => { setStats(s); setPredictions(p); });
  }, []);

  if (!stats) return (
    <div style={{ padding: '28px 24px', maxWidth: 960, margin: '0 auto' }} aria-busy="true" aria-label={tr('common.loading')}>
      <div className="luna-skel" style={{ width: 220, height: 30, borderRadius: 10, marginBottom: 24 }} />
      <div className="dash-bento">
        <div className="luna-skel b3" style={{ height: 180 }} />
        <div className="luna-skel b1m" style={{ height: 180 }} />
        <div className="luna-skel b3" style={{ height: 190 }} />
        <div className="luna-skel b1m" style={{ height: 190 }} />
      </div>
    </div>
  );

  const lastCycle = stats.last_cycle;
  const cycleLen = stats.profile.cycle_length || 28;
  const periodLen = stats.profile.period_length || 5;
  const dayInCycle = lastCycle ? Math.max(0, daysBetween(lastCycle.start_date, todayStr)) : null;
  const phase = dayInCycle !== null ? PHASES[phaseFor(dayInCycle, cycleLen, periodLen)] : null;

  // Next period: prefer the shared prediction; fall back to last start + cycle
  // length so it shows from the very first logged period.
  const nextStart: string | null = predictions?.next_cycle_start
    || (lastCycle ? localISO(new Date(new Date(lastCycle.start_date + 'T00:00:00').getTime() + cycleLen * 86400000)) : null);
  const daysToNext = nextStart ? daysBetween(todayStr, nextStart) : null;
  const nextLabel = daysToNext === null ? null
    : daysToNext > 1 ? tr('dashboard.inDays', { n: daysToNext })
    : daysToNext === 1 ? tr('dashboard.tomorrow')
    : daysToNext === 0 ? tr('dashboard.expectedToday')
    : tr('dashboard.daysLate', { n: -daysToNext });
  const nextDate = nextStart ? new Date(nextStart + 'T00:00:00').toLocaleDateString(lang, { month: 'short', day: 'numeric' }) : null;

  const chartData = stats.last30.map((d: any) => ({
    d: new Date(d.date + 'T00:00:00').toLocaleDateString(lang, { month: 'short', day: 'numeric' }),
    v: Math.round(d.avg_severity * 10) / 10,
  }));
  const totalLogs = stats.last30.reduce((a: number, d: any) => a + d.count, 0);
  const avgSev = stats.last30.length
    ? Math.round(stats.last30.reduce((a: number, d: any) => a + d.avg_severity, 0) / stats.last30.length * 10) / 10
    : null;

  const flares = (predictions?.predictions || []).slice(0, 3);

  const hour = today.getHours();
  const greeting = hour < 12 ? tr('dashboard.goodMorning') : hour < 17 ? tr('dashboard.goodAfternoon') : tr('dashboard.goodEvening');
  const name = stats.profile.name?.trim();

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: '#fff', borderRadius: 22, border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)', overflow: 'hidden', minWidth: 0, ...extra,
  });

  return (
    <div style={{ padding: '28px 24px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div className="luna-head" style={{ marginBottom: 20 }}>
        <div>
          <p style={{ ...eyebrow, fontWeight: 600, marginBottom: 4 }}>
            {today.toLocaleDateString(lang, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.7px', lineHeight: 1.15 }}>
            {greeting}{name ? `, ${name}` : ''}
          </h1>
          {stats.profile.conditions.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {stats.profile.conditions.map((c: string) => (
                <span key={c} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>{c}</span>
              ))}
            </div>
          )}
        </div>
        {/* Desktop only — on phones the tab bar's centre button does this job. */}
        <Link to="/log" className="hidden md:inline-flex luna-btn-grad" style={{ alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 99 }}>
          <Plus size={15} strokeWidth={2.5} /> {tr('nav.logSymptom')}
        </Link>
      </div>

      <div className="dash-bento">

        {/* Cycle hero */}
        <div className="b3" style={card({ background: phase?.bg || 'var(--surface-pink)', display: 'flex', alignItems: 'center' })}>
          {phase && dayInCycle !== null ? (
            <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
              <CycleRing day={dayInCycle} cycleLen={cycleLen} periodLen={periodLen} label={tr('dashboard.day')} />
              <div style={{ minWidth: 0 }}>
                <p style={{ ...eyebrow, color: phase.color, marginBottom: 6 }}>{tr('dashboard.currentPhase')}</p>
                <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text)', lineHeight: 1.05 }}>{tr(phase.name)}</p>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.45, maxWidth: 340 }}>{tr(phase.desc)}</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, fontWeight: 500 }}>{tr('dashboard.dayOf', { day: dayInCycle + 1, total: cycleLen })}</p>
              </div>
            </div>
          ) : (
            <div style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: '#fff', border: '1px solid var(--accent-border)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CalendarDays size={26} strokeWidth={1.7} />
              </div>
              <div>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 10 }}>
                  {tr('dashboard.logFirstPeriod')} {tr('dashboard.unlockPhase')}
                </p>
                <Link to="/cycle" className="luna-btn-grad" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 99 }}>
                  <Plus size={14} strokeWidth={2.5} /> {tr('cycle.logPeriod')}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Key numbers */}
        <div className="dash-stats">
          <Link to="/cycle" style={{ ...card({ padding: 18 }), textDecoration: 'none', display: 'block' }}>
            <p style={{ ...eyebrow, marginBottom: 10 }}>{tr('dashboard.nextPeriod')}</p>
            <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.6px', color: daysToNext !== null && daysToNext < 0 ? 'var(--amber)' : 'var(--text)', lineHeight: 1.1 }}>
              {nextLabel || '—'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 5 }}>{nextDate ? `${nextDate} · ${tr('dashboard.predicted')}` : tr('dashboard.predicted')}</p>
          </Link>
          <Link to="/patterns" style={{ ...card({ padding: 18 }), textDecoration: 'none', display: 'block' }}>
            <p style={{ ...eyebrow, marginBottom: 10 }}>{tr('dashboard.avgSeverity')}</p>
            <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.6px', color: avgSev !== null ? sevColor(avgSev) : 'var(--text)', lineHeight: 1.1 }}>
              {avgSev !== null ? avgSev : '—'}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>{avgSev !== null ? '/10' : ''}</span>
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 5 }}>{tr('dashboard.last30')}</p>
          </Link>
        </div>

        {/* Today */}
        <div className="b1m" style={card({ padding: 20, display: 'flex', flexDirection: 'column' })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={cardTitle}>{tr('dashboard.today')}</p>
            {stats.today_symptoms.length > 0 && (
              <Link to="/log" aria-label={tr('nav.logSymptom')} style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={17} strokeWidth={2.4} />
              </Link>
            )}
          </div>
          {stats.today_symptoms.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
              <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.5 }}>{tr('dashboard.nothingToday')}</p>
              <Link to="/log" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '11px 14px', borderRadius: 14, background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                <Plus size={15} strokeWidth={2.5} /> {tr('nav.logSymptom')}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.today_symptoms.slice(0, 5).map((s: any) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 14, color: 'var(--text-2)', flex: 1, lineHeight: 1.3 }}>{trTerm(s.symptom, lang)}</p>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 30, textAlign: 'center', padding: '2px 7px', borderRadius: 8, background: `color-mix(in srgb, ${sevColor(s.severity)} 12%, white)`, color: sevColor(s.severity) }}>{s.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Severity chart */}
        <div className="b3" style={card({ padding: '20px 20px 14px' })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <div>
              <p style={cardTitle}>{tr('dashboard.severity30')}</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                {tr('dashboard.logsAvg', { count: totalLogs, avg: avgSev !== null ? `${avgSev}/10` : '—' })}
              </p>
            </div>
            <Link to="/patterns" style={linkStyle}>{tr('nav.patterns')} <ChevronRight size={15} /></Link>
          </div>
          {chartData.length === 0 ? (
            <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 14, textAlign: 'center' }}>
              {tr('dashboard.logToSeeTrend')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id="pink-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C83F6E" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#C83F6E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} ticks={[0, 5, 10]} />
                <Tooltip content={<Tooltip_ />} />
                <Area type="monotone" dataKey="v" stroke="#C83F6E" strokeWidth={2.2} fill="url(#pink-grad)" dot={chartData.length < 3 ? { r: 3, fill: '#C83F6E', strokeWidth: 0 } : false} activeDot={{ r: 4, fill: '#C83F6E', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top symptoms */}
        <div className="b2" style={card({ padding: 20 })}>
          <p style={{ ...cardTitle, marginBottom: 16 }}>{tr('dashboard.topSymptoms')}</p>
          {stats.most_common_symptoms.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-3)' }}>{tr('common.noDataYet')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {stats.most_common_symptoms.map((s: any, i: number) => (
                <div key={s.symptom}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline', gap: 8 }}>
                    <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: i === 0 ? 600 : 400 }}>{trTerm(s.symptom, lang)}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{s.count}× · {Math.round(s.avg_sev * 10) / 10}/10</p>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${(s.count / (stats.most_common_symptoms[0]?.count || 1)) * 100}%`, background: i === 0 ? 'var(--accent)' : 'var(--accent-2)', opacity: i === 0 ? 1 : 0.55 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flare predictions */}
        <div className="b2" style={card({ padding: 20 })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
            <p style={cardTitle}>{tr('dashboard.predictedFlares')}</p>
            <span style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'right' }}>{tr('dashboard.fromCycleHistory')}</span>
          </div>
          {flares.length === 0 ? (
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.55, marginBottom: 12 }}>{tr('dashboard.flaresLocked')}</p>
              <Link to="/cycle" style={linkStyle}>{tr('page.cycleTracker')} <ChevronRight size={15} /></Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {flares.map((p: any) => (
                <div key={p.date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                      {new Date(p.date + 'T00:00:00').toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{tr('dashboard.cycleDay')} {p.cycle_day + 1}</p>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 99, background: 'var(--amber-light)', color: 'var(--amber)', border: '1px solid #F4C8A0', whiteSpace: 'nowrap' }}>
                    {tr('dashboard.likely', { n: p.confidence })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Citations — Guideline 1.4.1 */}
      <div style={{ marginTop: 16 }}>
        <Citations topics={['general', 'cycle']} />
      </div>
    </div>
  );
}
