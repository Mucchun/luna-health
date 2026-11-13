// Medical citations shown alongside health information in the app.
//
// App Store Guideline 1.4.1 (Physical Harm) requires that any medical/health
// information, recommendations, calculations, reports or references include
// citations to the sources of that information, and that those citations are
// easy for the user to find. Every screen that presents health guidance renders
// a <Citations> block listing the authoritative sources it is based on. Links
// open in the user's browser (see the window-open handler in electron/main.js).

import { useState } from 'react';
import { BookOpen, ChevronDown, ExternalLink } from 'lucide-react';

export interface Source {
  label: string;
  publisher: string;
  url: string;
}

// Authoritative, publicly citable clinical sources, grouped by topic. These are
// national health bodies and professional colleges (NHS, NICE, ACOG, WHO, the
// U.S. Office on Women's Health, Mayo Clinic, the Menopause Society, ASRM).
export const SOURCES: Record<string, Source[]> = {
  general: [
    { label: "Women's Health", publisher: 'NHS', url: 'https://www.nhs.uk/womens-health/' },
    { label: 'Office on Women’s Health', publisher: 'U.S. HHS', url: 'https://www.womenshealth.gov/' },
    { label: 'Health topics', publisher: 'World Health Organization', url: 'https://www.who.int/health-topics' },
    { label: 'Women’s health', publisher: 'Mayo Clinic', url: 'https://www.mayoclinic.org/healthy-lifestyle/womens-health/basics/womens-health/hlv-20049411' },
  ],
  cycle: [
    { label: 'Periods and menstrual cycle', publisher: 'NHS', url: 'https://www.nhs.uk/conditions/periods/' },
    { label: 'Your Menstrual Cycle', publisher: 'ACOG', url: 'https://www.acog.org/womens-health/faqs/the-menstrual-cycle' },
    { label: 'Menstruation and menstrual problems', publisher: 'U.S. Office on Women’s Health', url: 'https://www.womenshealth.gov/menstrual-cycle' },
  ],
  fertility: [
    { label: 'Evaluating Infertility', publisher: 'ACOG', url: 'https://www.acog.org/womens-health/faqs/evaluating-infertility' },
    { label: 'Fertility awareness & ovulation', publisher: 'NHS', url: 'https://www.nhs.uk/conditions/periods/getting-pregnant/' },
    { label: 'Patient resources', publisher: 'ASRM (Repro Facts)', url: 'https://www.reproductivefacts.org/' },
  ],
  menopause: [
    { label: 'Menopause', publisher: 'NHS', url: 'https://www.nhs.uk/conditions/menopause/' },
    { label: 'Menopause: diagnosis and management (NG23)', publisher: 'NICE', url: 'https://www.nice.org.uk/guidance/ng23' },
    { label: 'Menopause information', publisher: 'The Menopause Society', url: 'https://menopause.org/patient-education' },
  ],
  labs: [
    { label: 'Understanding blood tests', publisher: 'NHS', url: 'https://www.nhs.uk/conditions/blood-tests/' },
    { label: 'Lab Tests', publisher: 'MedlinePlus (NIH)', url: 'https://medlineplus.gov/lab-tests/' },
    { label: 'Hormone testing guidance', publisher: 'ACOG', url: 'https://www.acog.org/womens-health' },
  ],
};

const linkRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  padding: '9px 12px', background: 'var(--bg)', borderRadius: 10, textDecoration: 'none',
};

// Collapsible "Sources & references" block. `topics` selects which source groups
// to show; defaults to the general women's-health set.
export function Citations({ topics = ['general'], defaultOpen = false }: { topics?: (keyof typeof SOURCES)[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const seen = new Set<string>();
  const items: Source[] = [];
  for (const t of topics) for (const s of SOURCES[t] || []) {
    if (!seen.has(s.url)) { seen.add(s.url); items.push(s); }
  }
  if (items.length === 0) return null;

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <BookOpen size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', flex: 1 }}>Sources &amp; references</span>
        <ChevronDown size={15} style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div style={{ padding: '4px 14px 14px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6, margin: '2px 2px 10px' }}>
            Health information in this app is based on guidance from the sources below. Tap any source to read it.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {items.map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer noopener" style={linkRow}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', display: 'block', lineHeight: 1.3 }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.publisher}</span>
                </span>
                <ExternalLink size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
