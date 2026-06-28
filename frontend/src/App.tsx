import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import LogSymptom from './pages/LogSymptom';
import CycleTracker from './pages/CycleTracker';
import Patterns from './pages/Patterns';
import Triggers from './pages/Triggers';
import Labs from './pages/Labs';
import Medications from './pages/Medications';
import DoctorReport from './pages/DoctorReport';
import Settings from './pages/Settings';
import Wellness from './pages/Wellness';
import Community from './pages/Community';
import {
  LayoutDashboard, Pill, FlaskConical, TrendingUp,
  CalendarDays, Zap, FileText, Settings as SettingsIcon,
  Plus, Leaf, MessageCircle, X, Sparkles,
} from 'lucide-react';
import AiInsights from './pages/AiInsights';
import ChatWidget from './components/ChatWidget';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cycle', icon: CalendarDays, label: 'Cycle' },
  { to: '/patterns', icon: TrendingUp, label: 'Patterns' },
  { to: '/triggers', icon: Zap, label: 'Triggers' },
  { to: '/labs', icon: FlaskConical, label: 'Labs' },
  { to: '/medications', icon: Pill, label: 'Medications' },
  { to: '/wellness', icon: Leaf, label: 'Wellness' },
  { to: '/ai', icon: Sparkles, label: 'AI Insights' },
  { to: '/community', icon: MessageCircle, label: 'Community' },
  { to: '/report', icon: FileText, label: 'Report' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

const CONDITIONS = ['PCOS', 'Endometriosis', 'PMDD'];
const COND_COLORS: Record<string, string> = { PCOS: '#C83F6E', Endometriosis: '#7B52B8', PMDD: '#A85A20' };

const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: 'var(--text)', background: '#fff' };

function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);

  const toggle = (c: string) => setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const save = async () => {
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, conditions, cycle_length: cycleLen, period_length: periodLen }),
    });
    onDone();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(28,10,18,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 32px 80px rgba(0,0,0,0.15)' }}>
        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ height: 3, borderRadius: 99, flex: 1, background: s <= step ? 'var(--accent)' : 'var(--border)', transition: 'background 0.2s' }} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <div style={{ fontSize: 26, marginBottom: 6 }}>👋</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>Welcome to Luna</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.5 }}>A private health hub built for chronic conditions. Let's set up your profile — it takes 30 seconds.</p>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>What should we call you?</label>
            <input
              type="text" placeholder="Your first name…" value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(2); }}
              style={inp} autoFocus
            />
            <button onClick={() => { if (name.trim()) setStep(2); }} disabled={!name.trim()} style={{ marginTop: 16, width: '100%', padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer', background: name.trim() ? 'var(--accent)' : 'var(--border)', color: name.trim() ? '#fff' : 'var(--text-3)', fontSize: 14, fontWeight: 700, transition: 'all 0.1s' }}>
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>What are you managing?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.5 }}>Select all that apply. This personalises your tips, supplement suggestions, and community channels.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CONDITIONS.map(c => {
                const active = conditions.includes(c);
                return (
                  <button key={c} type="button" onClick={() => toggle(c)} style={{
                    padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s',
                    border: `2px solid ${active ? COND_COLORS[c] : 'var(--border)'}`,
                    background: active ? COND_COLORS[c] + '12' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: active ? COND_COLORS[c] : 'var(--text)' }}>{c}</span>
                    {active && <span style={{ width: 18, height: 18, borderRadius: '50%', background: COND_COLORS[c], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setStep(1)} style={{ padding: '13px', borderRadius: 14, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1 }}>Back</button>
              <button onClick={() => setStep(3)} style={{ padding: '13px', borderRadius: 14, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', flex: 2 }}>Continue →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>Your cycle</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.5 }}>Used for phase detection and flare predictions. You can always update this in Settings.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Cycle length</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)', textTransform: 'none' }}>{cycleLen} days</span>
                </label>
                <input type="range" min={21} max={45} value={cycleLen} onChange={e => setCycleLen(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}><span>21 days</span><span>45 days</span></div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Period length</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)', textTransform: 'none' }}>{periodLen} days</span>
                </label>
                <input type="range" min={2} max={10} value={periodLen} onChange={e => setPeriodLen(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}><span>2 days</span><span>10 days</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep(2)} style={{ padding: '13px', borderRadius: 14, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1 }}>Back</button>
              <button onClick={save} style={{ padding: '13px', borderRadius: 14, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', flex: 2 }}>
                Get started ✦
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0" style={{ width: 200, background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 18px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #C83F6E 0%, #E86090 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
              <circle cx="7" cy="7" r="2.5" fill="white" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.3px' }}>Luna</div>
            <div style={{ fontSize: 9, color: 'var(--sidebar-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: -1 }}>Health Hub</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', borderRadius: 10,
            fontSize: 13, fontWeight: isActive ? 500 : 400,
            color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-muted)',
            background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
            textDecoration: 'none', transition: 'all 0.12s',
          })}>
            {({ isActive }) => (
              <>
                <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* CTA */}
      <div style={{ padding: '12px 8px 16px', borderTop: '1px solid var(--sidebar-border)' }}>
        <NavLink to="/log" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, textDecoration: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: '0.1px', transition: 'opacity 0.12s' }}>
          <Plus size={13} strokeWidth={2.5} />
          Log Symptom
        </NavLink>
      </div>
    </aside>
  );
}

function MobileBottom() {
  const loc = useLocation();
  const mobile5 = [NAV[0], NAV[1], NAV[2], NAV[7], NAV[8]]; // Dashboard, Cycle, Patterns, AI Insights, Community
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'var(--sidebar-bg)', borderTop: '1px solid var(--sidebar-border)', display: 'flex' }} className="md:hidden">
      {[...mobile5, { to: '/log', icon: Plus, label: 'Log' }].map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 3, padding: '10px 0', textDecoration: 'none',
          fontSize: 9, fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase',
          color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-muted)',
        })}>
          {({ isActive }) => (
            <>
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  const [onboarding, setOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(p => {
        setOnboarding(!p.name?.trim() && (!p.conditions || p.conditions.length === 0));
      })
      .catch(() => setOnboarding(false));
  }, []);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, paddingBottom: 72 }} className="md:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log" element={<LogSymptom />} />
            <Route path="/cycle" element={<CycleTracker />} />
            <Route path="/patterns" element={<Patterns />} />
            <Route path="/triggers" element={<Triggers />} />
            <Route path="/labs" element={<Labs />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/wellness" element={<Wellness />} />
            <Route path="/ai" element={<AiInsights />} />
            <Route path="/community" element={<Community />} />
            <Route path="/report" element={<DoctorReport />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <MobileBottom />
        <ChatWidget />
        {onboarding && <Onboarding onDone={() => setOnboarding(false)} />}
      </div>
    </BrowserRouter>
  );
}
