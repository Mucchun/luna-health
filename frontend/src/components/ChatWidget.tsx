import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  'What foods help with my conditions?',
  'Why am I so tired before my period?',
  'How can I reduce bloating?',
  'What does my symptom pattern mean?',
];

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
    const userMsg: Msg = { role: 'user', content: trimmed };
    setMsgs(m => [...m, userMsg]);
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

  return (
    <>
      <style>{`
        @keyframes luna-bounce {
          0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)}
        }
        @keyframes luna-pop {
          0%{opacity:0;transform:scale(0.92) translateY(8px)}
          100%{opacity:1;transform:scale(1) translateY(0)}
        }
        .chat-btn  { bottom: 88px; right: 16px; }
        .chat-panel{ bottom: 152px; right: 16px; }
        @media(min-width:768px){
          .chat-btn  { bottom: 24px; right: 24px; }
          .chat-panel{ bottom: 88px; right: 24px; }
        }
      `}</style>

      {/* Panel */}
      {open && (
        <div className="chat-panel" style={{
          position: 'fixed', zIndex: 200,
          width: 360, maxWidth: 'calc(100vw - 32px)',
          height: 520, maxHeight: 'calc(100dvh - 180px)',
          background: '#fff', borderRadius: 24,
          boxShadow: '0 24px 80px rgba(28,10,18,0.22)',
          border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'luna-pop 0.18s ease-out',
        }}>
          {/* Header */}
          <div style={{ background: 'var(--sidebar-bg)', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg, #C83F6E 0%, #7B52B8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>Luna AI</p>
              <p style={{ fontSize: 10, color: 'var(--sidebar-muted)', marginTop: 1 }}>Powered by Groq · Llama 3</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 6px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Welcome + suggestions */}
            {msgs.length === 0 && (
              <>
                <div style={{ background: 'var(--accent-light)', borderRadius: '16px 16px 16px 4px', padding: '11px 13px', maxWidth: '88%', alignSelf: 'flex-start' }}>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
                    Hi! I'm Luna ✦ I can see your health data and help with questions about your symptoms, cycle, triggers, and conditions. What's on your mind?
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 11, border: '1px solid var(--border)', background: '#fff', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-light)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Message history */}
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

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--bg)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: `luna-bounce 1.1s ${i * 0.18}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask me anything…"
              disabled={loading}
              style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, padding: '9px 12px', fontSize: 13, color: 'var(--text)', background: '#fff', fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)', color: input.trim() && !loading ? '#fff' : 'var(--text-3)', transition: 'all 0.1s' }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        className="chat-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', zIndex: 201,
          width: 54, height: 54, borderRadius: '50%', border: 'none',
          background: open ? '#1A0810' : 'var(--accent)',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 24px rgba(200,63,110,0.45)',
          transition: 'all 0.2s',
        }}
        title={open ? 'Close chat' : 'Chat with Luna AI'}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  );
}
