import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
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
  Plus, Leaf, MessageCircle, Sparkles, Flower2, Sun, Menu, X,
} from 'lucide-react';
import AiInsights from './pages/AiInsights';
import ChatWidget from './components/ChatWidget';
import Fertility from './pages/Fertility';
import Menopause from './pages/Menopause';
import { DisclaimerGate, DISCLAIMER_ACCEPTED_KEY } from './lib/legal';
import { tapLight } from './lib/haptics';
import { useI18n, type StringKey } from './i18n';

const NAV: { to: string; icon: any; key: StringKey }[] = [
  { to: '/', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/cycle', icon: CalendarDays, key: 'nav.cycle' },
  { to: '/fertility', icon: Flower2, key: 'nav.fertility' },
  { to: '/menopause', icon: Sun, key: 'nav.menopause' },
  { to: '/patterns', icon: TrendingUp, key: 'nav.patterns' },
  { to: '/triggers', icon: Zap, key: 'nav.triggers' },
  { to: '/labs', icon: FlaskConical, key: 'nav.labs' },
  { to: '/medications', icon: Pill, key: 'nav.medications' },
  { to: '/wellness', icon: Leaf, key: 'nav.wellness' },
  { to: '/ai', icon: Sparkles, key: 'nav.ai' },
  { to: '/community', icon: MessageCircle, key: 'nav.community' },
  { to: '/report', icon: FileText, key: 'nav.report' },
  { to: '/settings', icon: SettingsIcon, key: 'nav.settings' },
];

// In the macOS desktop (Electron) build the window uses a hidden-inset title bar,
// so the OS traffic-light buttons float over the top-left of the content. Without
// an inset they overlap the sidebar logo, which App Review flagged under
// Guideline 4 ("text that is overlapped"). Detect Electron and reserve space.
const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron');
const MAC_TITLEBAR = 28; // px reserved for the floating traffic-light buttons

const CONDITIONS = ['PCOS', 'Endometriosis', 'PMDD'];
const COND_COLORS: Record<string, string> = { PCOS: '#C83F6E', Endometriosis: '#7B52B8', PMDD: '#A85A20' };

const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: 'var(--text)', background: '#fff' };

function Onboarding({ onDone }: { onDone: () => void }) {
  const { tr } = useI18n();
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
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>{tr('onboarding.welcome')}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.5 }}>{tr('onboarding.welcomeSub')}</p>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>{tr('onboarding.nameLabel')}</label>
            <input
              type="text" placeholder={tr('onboarding.namePlaceholder')} value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(2); }}
              style={inp} autoFocus
            />
            <button onClick={() => { if (name.trim()) setStep(2); }} disabled={!name.trim()} style={{ marginTop: 16, width: '100%', padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer', background: name.trim() ? 'var(--accent)' : 'var(--border)', color: name.trim() ? '#fff' : 'var(--text-3)', fontSize: 14, fontWeight: 700, transition: 'all 0.1s' }}>
              {tr('common.continue')} →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>{tr('onboarding.conditionsTitle')}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.5 }}>{tr('onboarding.conditionsSub')}</p>
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
              <button onClick={() => setStep(1)} style={{ padding: '13px', borderRadius: 14, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1 }}>{tr('common.back')}</button>
              <button onClick={() => setStep(3)} style={{ padding: '13px', borderRadius: 14, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', flex: 2 }}>{tr('common.continue')} →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>{tr('onboarding.cycleTitle')}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.5 }}>{tr('onboarding.cycleSub')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{tr('onboarding.cycleLength')}</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)', textTransform: 'none' }}>{cycleLen} {tr('common.days')}</span>
                </label>
                <input type="range" min={21} max={45} value={cycleLen} onChange={e => setCycleLen(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}><span>21 {tr('common.days')}</span><span>45 {tr('common.days')}</span></div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{tr('onboarding.periodLength')}</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)', textTransform: 'none' }}>{periodLen} {tr('common.days')}</span>
                </label>
                <input type="range" min={2} max={10} value={periodLen} onChange={e => setPeriodLen(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}><span>2 {tr('common.days')}</span><span>10 {tr('common.days')}</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep(2)} style={{ padding: '13px', borderRadius: 14, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1 }}>{tr('common.back')}</button>
              <button onClick={save} style={{ padding: '13px', borderRadius: 14, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', flex: 2 }}>
                {tr('onboarding.getStarted')} ✦
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar() {
  const { tr } = useI18n();
  return (
    <aside className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0" style={{ width: 200, background: 'var(--grad-sidebar)', borderRight: '1px solid var(--sidebar-border)', boxShadow: '2px 0 24px rgba(28,10,18,0.14)', paddingTop: isElectron ? MAC_TITLEBAR : undefined }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 18px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--grad-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(200,63,110,0.45)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
              <circle cx="7" cy="7" r="2.5" fill="white" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.3px' }}>Luna</div>
            <div style={{ fontSize: 9, color: 'var(--sidebar-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: -1 }}>{tr('nav.hub')}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {NAV.map(({ to, icon: Icon, key }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            position: 'relative',
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', borderRadius: 10,
            fontSize: 13, fontWeight: isActive ? 600 : 400,
            color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-muted)',
            background: isActive ? 'linear-gradient(90deg, rgba(200,63,110,0.26), rgba(123,82,184,0.12))' : 'transparent',
            boxShadow: isActive ? 'inset 3px 0 0 0 #FFAEC8, 0 4px 14px rgba(200,63,110,0.14)' : 'none',
            textDecoration: 'none', transition: 'all 0.16s',
          })}>
            {({ isActive }) => (
              <>
                <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                {tr(key)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* CTA */}
      <div style={{ padding: '12px 8px 16px', borderTop: '1px solid var(--sidebar-border)' }}>
        <NavLink to="/log" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, textDecoration: 'none', background: 'var(--grad-accent)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.1px', boxShadow: '0 6px 18px rgba(200,63,110,0.4)', transition: 'transform 0.12s, box-shadow 0.18s' }}>
          <Plus size={13} strokeWidth={2.5} />
          {tr('nav.logSymptom')}
        </NavLink>
      </div>
    </aside>
  );
}

function MobileBottom() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { tr } = useI18n();
  // Bottom bar shows the essentials; "More" opens the full navigation so every
  // page (Labs, Settings, etc.) is reachable on iPhone.
  const bar: { to: string; icon: any; key: StringKey }[] = [NAV[0], NAV[1], { to: '/log', icon: Plus, key: 'nav.log' }, NAV[9]]; // Dashboard, Cycle, Log, AI Insights
  return (
    <>
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'var(--sidebar-bg)', borderTop: '1px solid var(--sidebar-border)', display: 'flex' }} className="md:hidden mobile-bottom-nav">
        {bar.map(({ to, icon: Icon, key }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '10px 0', textDecoration: 'none',
            fontSize: 9, fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase',
            color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-muted)',
          })}>
            {({ isActive }) => (<><Icon size={18} strokeWidth={isActive ? 2 : 1.5} />{tr(key)}</>)}
          </NavLink>
        ))}
        <button onClick={() => setMoreOpen(true)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
          fontSize: 9, fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase',
          color: 'var(--sidebar-muted)', fontFamily: 'inherit',
        }}>
          <Menu size={18} strokeWidth={1.5} />
          {tr('nav.more')}
        </button>
      </nav>

      {/* Full-nav drawer (mobile) */}
      {moreOpen && (
        <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <div onClick={() => setMoreOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(28,10,18,0.5)', backdropFilter: 'blur(4px)', animation: 'luna-rise 0.2s' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 260, maxWidth: '82vw', background: 'var(--grad-sidebar)', borderRight: '1px solid var(--sidebar-border)', boxShadow: '2px 0 30px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', animation: 'luna-slide-in 0.24s cubic-bezier(0.22,1,0.36,1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 16px 14px', borderBottom: '1px solid var(--sidebar-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--grad-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(200,63,110,0.45)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" /><circle cx="7" cy="7" r="2.5" fill="white" /></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Luna</div>
              </div>
              <button onClick={() => setMoreOpen(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px', cursor: 'pointer', color: 'var(--sidebar-text)', display: 'flex' }}><X size={15} /></button>
            </div>
            <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
              {NAV.map(({ to, icon: Icon, key }) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={() => setMoreOpen(false)} style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 10,
                  fontSize: 14, fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                  color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-muted)',
                  background: isActive ? 'linear-gradient(90deg, rgba(200,63,110,0.26), rgba(123,82,184,0.12))' : 'transparent',
                })}>
                  {({ isActive }) => (<><Icon size={17} strokeWidth={isActive ? 2 : 1.5} />{tr(key)}</>)}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function AnimatedMain() {
  const location = useLocation();
  return (
    <main style={{ flex: 1, minWidth: 0, paddingBottom: 72 }} className="md:pb-0 luna-main">
      <div key={location.pathname} className="luna-page">
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log" element={<LogSymptom />} />
          <Route path="/cycle" element={<CycleTracker />} />
          <Route path="/fertility" element={<Fertility />} />
          <Route path="/menopause" element={<Menopause />} />
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
      </div>
    </main>
  );
}

export default function App() {
  const [onboarding, setOnboarding] = useState<boolean | null>(null);
  const [disclaimerOk, setDisclaimerOk] = useState<boolean>(() => !!localStorage.getItem(DISCLAIMER_ACCEPTED_KEY));

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#1A0810' });
      SplashScreen.hide({ fadeOutDuration: 300 });
    }
  }, []);

  // Global light haptic on any button/link tap, so the whole app feels native
  // without wiring feedback into every component. Uses pointerdown for an
  // immediate, tactile response (like native controls).
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest('button, a, [role="button"], input[type="submit"]');
      if (el && !(el as HTMLButtonElement).disabled) tapLight();
    };
    document.addEventListener('pointerdown', onDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

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
      <div className={isElectron ? 'is-electron' : undefined} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        {isElectron && (
          // Draggable strip so the window can still be moved by its top edge even
          // though content sits under the hidden-inset title bar.
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: MAC_TITLEBAR, zIndex: 40, WebkitAppRegion: 'drag' } as React.CSSProperties} />
        )}
        <Sidebar />
        <AnimatedMain />
        <MobileBottom />
        <ChatWidget />
        {disclaimerOk && onboarding && <Onboarding onDone={() => setOnboarding(false)} />}
        {!disclaimerOk && <DisclaimerGate onAccept={() => setDisclaimerOk(true)} />}
      </div>
    </BrowserRouter>
  );
}
