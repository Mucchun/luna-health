import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  'What foods help with my conditions?',
  'Why am I so tired before my period?',
  'How can I reduce bloating?',
  'What does my symptom pattern mean?',
];

function Star({ x, y, size, cls }: { x: number; y: number; size: number; cls: string }) {
  const t = size * 0.2;
  return (
    <polygon
      className={cls}
      points={`${x},${y - size} ${x + t},${y - t} ${x + size},${y} ${x + t},${y + t} ${x},${y + size} ${x - t},${y + t} ${x - size},${y} ${x - t},${y - t}`}
      fill="currentColor"
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    />
  );
}

function LunaFace({ talking = false, open = false }: { talking?: boolean; open?: boolean }) {
  return (
    <svg width="62" height="72" viewBox="0 0 62 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground shadow */}
      <ellipse cx="31" cy="70" rx="15" ry="3" fill="rgba(200,63,110,0.15)" />

      {/* Moon hair piece */}
      <path d="M31 2 C22 4 17 13 22 19 C26 14 36 14 40 19 C45 13 40 4 31 2Z" fill="#F4B8CC" />
      <circle cx="31" cy="10" r="4" fill="#FDE8F0" opacity="0.8" />
      <circle cx="26" cy="7" r="1.5" fill="white" opacity="0.6" />

      {/* Face base */}
      <circle cx="31" cy="38" r="24" fill="#FDE8F0" stroke="#F4B8CC" strokeWidth="1.5" />

      {/* Face inner highlight */}
      <ellipse cx="23" cy="29" rx="8" ry="6" fill="white" opacity="0.22" transform="rotate(-20 23 29)" />

      {/* Rosy cheeks */}
      <circle cx="15" cy="41" r="7" fill="#FFAEC8" opacity="0.42" />
      <circle cx="47" cy="41" r="7" fill="#FFAEC8" opacity="0.42" />

      {/* Left eye */}
      <g className="luna-eye-l">
        <circle cx="22" cy="35" r="5" fill="#1C0A12" />
        <circle cx="24" cy="33" r="1.8" fill="white" />
        <circle cx="21.5" cy="37" r="0.8" fill="white" opacity="0.5" />
      </g>

      {/* Right eye */}
      <g className="luna-eye-r">
        <circle cx="40" cy="35" r="5" fill="#1C0A12" />
        <circle cx="42" cy="33" r="1.8" fill="white" />
        <circle cx="39.5" cy="37" r="0.8" fill="white" opacity="0.5" />
      </g>

      {/* Mouth */}
      {talking ? (
        <ellipse cx="31" cy="44.5" rx="5.5" ry="4.5" fill="#C83F6E" className="luna-talk" />
      ) : open ? (
        /* slightly open 'o' mouth when chat is open */
        <ellipse cx="31" cy="44" rx="4" ry="3.5" fill="#C83F6E" opacity="0.9" />
      ) : (
        <path d="M 22 43 Q 31 51 40 43" stroke="#C83F6E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}

      {/* Sparkle stars */}
      <g style={{ color: '#C83F6E' }}>
        <Star x={5} y={20} size={5} cls="luna-star-1" />
      </g>
      <g style={{ color: '#7B52B8' }}>
        <Star x={55} y={26} size={4} cls="luna-star-2" />
      </g>
      <g style={{ color: '#FFAEC8' }}>
        <Star x={7} y={56} size={3.5} cls="luna-star-3" />
      </g>
      <g style={{ color: '#C83F6E' }}>
        <Star x={54} y={54} size={3} cls="luna-star-4" />
      </g>
    </svg>
  );
}

export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Msg[]>([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMsgs(m => [...m, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: msgs.slice(-12) }),
      });
      const data = await res.json();
      setMsgs(m => [...m, { role: 'assistant', content: data.reply || data.error || 'Something went wrong.' }]);
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'Could not reach the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = msgs.length > 0;

  return (
    <>
      <style>{`
        /* Float animation */
        @keyframes luna-float {
          0%,100%{transform:translateY(0px)}
          50%{transform:translateY(-9px)}
        }
        /* Blink */
        @keyframes luna-blink {
          0%,87%,100%{transform:scaleY(1)}
          91%,96%{transform:scaleY(0.05)}
        }
        .luna-eye-l {
          transform-box: fill-box;
          transform-origin: center;
          animation: luna-blink 4s 0.9s infinite;
        }
        .luna-eye-r {
          transform-box: fill-box;
          transform-origin: center;
          animation: luna-blink 4s infinite;
        }
        /* Sparkle stars */
        @keyframes luna-sparkle {
          0%,100%{transform:scale(1) rotate(0deg);opacity:1}
          50%{transform:scale(0.5) rotate(30deg);opacity:0.25}
        }
        .luna-star-1{animation:luna-sparkle 2.4s 0.3s infinite}
        .luna-star-2{animation:luna-sparkle 2.8s infinite}
        .luna-star-3{animation:luna-sparkle 2s 1s infinite}
        .luna-star-4{animation:luna-sparkle 2.2s 0.6s infinite}

        /* Talking mouth */
        @keyframes luna-talk-anim {
          0%{transform:scaleY(0.6)}100%{transform:scaleY(1.4)}
        }
        .luna-talk {
          transform-box: fill-box;
          transform-origin: center;
          animation: luna-talk-anim 0.22s infinite alternate;
        }

        /* Panel pop in */
        @keyframes luna-pop {
          0%{opacity:0;transform:scale(0.9) translateY(10px)}
          100%{opacity:1;transform:scale(1) translateY(0)}
        }

        /* Chat typing dots */
        @keyframes luna-bounce {
          0%,60%,100%{transform:translateY(0)}
          30%{transform:translateY(-6px)}
        }

        /* Positions */
        .luna-btn   { bottom: 82px; right: 16px; }
        .luna-panel { bottom: 156px; right: 16px; }
        @media(min-width:768px){
          .luna-btn   { bottom: 20px; right: 24px; }
          .luna-panel { bottom: 100px; right: 24px; }
        }
      `}</style>

      {/* ── Chat panel ── */}
      {open && (
        <div className="luna-panel" style={{
          position: 'fixed', zIndex: 200,
          width: 360, maxWidth: 'calc(100vw - 32px)',
          height: 520, maxHeight: 'calc(100dvh - 180px)',
          background: '#fff', borderRadius: 24,
          boxShadow: '0 24px 80px rgba(28,10,18,0.22)',
          border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'luna-pop 0.18s ease-out',
        }}>
          {/* Panel header */}
          <div style={{ background: 'var(--sidebar-bg)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Mini character in header */}
            <div style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="34" height="34" viewBox="0 0 62 72" fill="none">
                <circle cx="31" cy="38" r="24" fill="#FDE8F0" stroke="#F4B8CC" strokeWidth="1.5" />
                <path d="M31 2 C22 4 17 13 22 19 C26 14 36 14 40 19 C45 13 40 4 31 2Z" fill="#F4B8CC" />
                <circle cx="15" cy="41" r="7" fill="#FFAEC8" opacity="0.42" />
                <circle cx="47" cy="41" r="7" fill="#FFAEC8" opacity="0.42" />
                <circle cx="22" cy="35" r="5" fill="#1C0A12" />
                <circle cx="24" cy="33" r="1.8" fill="white" />
                <circle cx="40" cy="35" r="5" fill="#1C0A12" />
                <circle cx="42" cy="33" r="1.8" fill="white" />
                <ellipse cx="31" cy="44" rx="4" ry="3.5" fill="#C83F6E" opacity="0.9" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>Luna AI</p>
              <p style={{ fontSize: 10, color: 'var(--sidebar-muted)', marginTop: 1 }}>
                {loading ? 'typing…' : 'Your health assistant'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 6px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.length === 0 && (
              <>
                <div style={{ background: 'var(--accent-light)', borderRadius: '16px 16px 16px 4px', padding: '11px 13px', maxWidth: '88%', alignSelf: 'flex-start' }}>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
                    Hi, I'm Luna ✦ I can see your health data and help with questions about your symptoms, cycle, triggers, and conditions. What's on your mind?
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-light)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                      style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 11, border: '1px solid var(--border)', background: '#fff', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', transition: 'background 0.1s' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '84%', padding: '10px 13px', fontSize: 13, lineHeight: 1.6,
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--bg)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: `luna-bounce 1.1s ${i * 0.18}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask Luna anything…"
              disabled={loading}
              style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, padding: '9px 12px', fontSize: 13, color: 'var(--text)', background: '#fff', fontFamily: 'inherit', outline: 'none' }}
            />
            <button onClick={() => send(input)} disabled={!input.trim() || loading}
              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)', color: input.trim() && !loading ? '#fff' : 'var(--text-3)', transition: 'all 0.1s' }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Floating character button ── */}
      <button
        className="luna-btn"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Luna chat' : 'Chat with Luna AI'}
        style={{
          position: 'fixed', zIndex: 201,
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer',
          animation: 'luna-float 3.2s ease-in-out infinite',
          filter: 'drop-shadow(0 6px 18px rgba(200,63,110,0.38))',
          transition: 'filter 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.filter = 'drop-shadow(0 8px 22px rgba(200,63,110,0.55))')}
        onMouseLeave={e => (e.currentTarget.style.filter = 'drop-shadow(0 6px 18px rgba(200,63,110,0.38))')}
      >
        <LunaFace talking={loading && !open} open={open} />

        {/* X badge when open */}
        {open && (
          <div style={{
            position: 'absolute', top: 8, right: -2,
            width: 20, height: 20, borderRadius: '50%',
            background: '#1A0810', border: '2px solid var(--accent-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={10} color="#FFAEC8" />
          </div>
        )}

        {/* Unread dot when chat has messages and is closed */}
        {!open && hasMessages && (
          <div style={{
            position: 'absolute', top: 12, right: 0,
            width: 11, height: 11, borderRadius: '50%',
            background: 'var(--accent)', border: '2px solid white',
          }} />
        )}
      </button>
    </>
  );
}
