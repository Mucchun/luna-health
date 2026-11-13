// Legal / consent content and UI shared across the app.
//
// Required for App Store review of a health app: a clear medical disclaimer
// (accepted once before use), a privacy policy, and community guidelines.

import { useState } from 'react';
import { X, ShieldCheck, HeartPulse } from 'lucide-react';
import { useI18n } from '../i18n';

export const DISCLAIMER_ACCEPTED_KEY = 'luna_disclaimer_v1';
export const GUIDELINES_ACCEPTED_KEY = 'luna_guidelines_v1';

// Keep this in sync with public/privacy.html (the hostable copy used for the
// App Store Connect privacy URL).
export const PRIVACY_TEXT = `Luna Health is designed to be private by default.

WHAT WE STORE
• All of your health information — symptoms, cycles, triggers, lab values, medications, and profile — is stored only on your device. It is never uploaded to us or to any third-party server.
• We do not use any external AI service. All insights and chat responses are generated on your device.
• We have no accounts and no login. We do not collect your name, email, contacts, location, or device identifiers.

ANALYTICS & TRACKING
• We do not use third-party analytics, advertising, or tracking SDKs.

ANONYMOUS COMMUNITY
• If you post in the Community, only the anonymous content you choose to share (a made-up display name, a colour, and your post text) is sent to the shared community server. Your personal health data is never attached to a community post.
• You can delete your own posts and replies at any time.

YOUR CONTROL
• You can delete any category of data, or wipe everything, from Settings at any time. Deleting the app also removes all on-device data.

CHILDREN
• Luna Health is not directed to children under 13.

CONTACT
• Questions about privacy: support@lunahealth.app`;

export const DISCLAIMER_TEXT = `Luna Health is a wellness and self-tracking tool. It is NOT a medical device and does NOT provide medical advice, diagnosis, or treatment.

• Information and AI-generated insights in this app are for general educational purposes only and may be incomplete or inaccurate.
• Always consult a qualified healthcare provider before making any decision about your health, medications, or treatment. Never disregard or delay professional medical advice because of something you read here.
• Do not start, stop, or change any medication based on this app.
• Predictions (such as cycle or flare predictions) are estimates based on the data you log and should not be relied upon for contraception, conception, or any medical purpose.

IF THIS IS AN EMERGENCY
If you think you may have a medical emergency, call your local emergency number or go to the nearest emergency department immediately. Do not use this app in an emergency.`;

export const GUIDELINES_TEXT = `The Community is an anonymous, supportive space for people managing their health. To keep it safe:

• Be kind and respectful. No harassment, bullying, hate speech, or threats.
• No medical misinformation presented as fact, and no promotion of self-harm.
• No spam, advertising, solicitation, or sharing others' private information.
• No sexually explicit or otherwise objectionable content.

There is zero tolerance for objectionable content or abusive users. You can Report any post or reply, or Block a user, and reported content is removed. Content that violates these rules is acted on within 24 hours.`;

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(28,10,18,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const sheet: React.CSSProperties = { background: '#fff', borderRadius: 24, width: '100%', maxWidth: 460, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.18)' };

// Read-only modal used from Settings / Community for each legal document.
export function LegalModal({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--border)', borderRadius: 99, padding: '5px 6px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex' }}><X size={14} /></button>
        </div>
        <div style={{ padding: '18px 20px', overflowY: 'auto', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{body}</div>
      </div>
    </div>
  );
}

// One-time gate shown before the app can be used. Blocks until accepted.
export function DisclaimerGate({ onAccept }: { onAccept: () => void }) {
  const { tr } = useI18n();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const accept = () => { localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, new Date().toISOString()); onAccept(); };
  return (
    <div style={overlay}>
      <div style={sheet}>
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, margin: '0 auto 12px', background: 'var(--grad-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(200,63,110,0.35)' }}>
            <HeartPulse size={22} color="#fff" />
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 4 }}>{tr('disclaimer.title')}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{tr('disclaimer.subtitle')}</p>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
          {tr('legal.disclaimer')}
        </div>
        <div style={{ padding: '14px 22px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, fontSize: 11, color: 'var(--text-3)' }}>
            <ShieldCheck size={13} style={{ color: 'var(--sage)' }} />
            {tr('disclaimer.privacyNote')}
            <button onClick={() => setPrivacyOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontSize: 11, padding: 0 }}>{tr('disclaimer.privacyPolicy')}</button>
          </div>
          <button onClick={accept} className="luna-btn-grad" style={{ width: '100%', padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {tr('disclaimer.agree')}
          </button>
        </div>
      </div>
      {privacyOpen && <LegalModal title="Privacy Policy" body={PRIVACY_TEXT} onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
}
