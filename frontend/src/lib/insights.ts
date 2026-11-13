// @ts-nocheck — faithful port of the validated backend engine; pure JS logic.
// ─────────────────────────────────────────────────────────────────────────────
// Luna local insight engine
//
// A zero-cost, on-device replacement for the Groq LLM. Every function is
// deterministic and derives its output purely from the user's tracked data, so
// there are no API keys, no per-request bills, and it works fully offline.
//
// Each generator returns the exact JSON shape the frontend already consumes.
// ─────────────────────────────────────────────────────────────────────────────

const round = (n, d = 1) => { const f = 10 ** d; return Math.round(n * f) / f; };
const pct = (n) => Math.round(n * 100);

// Lab reference ranges (marker → { low, high, unit, note }). Used for real,
// range-based lab interpretation — more reliable than an LLM guess.
const LAB_RANGES = {
  'Testosterone (total)': { low: 15, high: 70, unit: 'ng/dL', highNote: 'often elevated in PCOS' },
  'LH':                   { low: 2, high: 15, unit: 'mIU/mL' },
  'FSH':                  { low: 3, high: 10, unit: 'mIU/mL' },
  'AMH':                  { low: 1, high: 3.5, unit: 'ng/mL', highNote: 'elevated AMH is common in PCOS' },
  'Fasting insulin':      { low: 2, high: 25, unit: 'μIU/mL', highNote: 'higher levels can point to insulin resistance' },
  'Fasting glucose':      { low: 70, high: 99, unit: 'mg/dL' },
  'Estradiol (E2)':       { low: 30, high: 400, unit: 'pg/mL', phase: true },
  'Progesterone':         { low: 0.1, high: 25, unit: 'ng/mL', phase: true },
  'CA-125':               { low: 0, high: 35, unit: 'U/mL', highNote: 'can be raised with endometriosis' },
  'CRP':                  { low: 0, high: 3, unit: 'mg/L', highNote: 'a marker of inflammation' },
  'Ferritin':             { low: 12, high: 150, unit: 'ng/mL', lowNote: 'low ferritin can drive fatigue' },
  'Vitamin D':            { low: 30, high: 100, unit: 'ng/mL', lowNote: 'low vitamin D is very common and easily corrected' },
  'TSH':                  { low: 0.4, high: 4.5, unit: 'mIU/L', note: 'thyroid can mimic many hormonal symptoms' },
  'DHEA-S':               { low: 35, high: 430, unit: 'μg/dL' },
};

// Condition-tailored recommendation banks.
const COND_TIPS = {
  PCOS: [
    'Prioritise protein and fibre at each meal to steady blood-sugar and support insulin sensitivity — a common PCOS driver.',
    'Regular strength or resistance training 2–3× a week improves insulin response more than cardio alone for PCOS.',
    'Ask your doctor whether checking fasting insulin and HbA1c would help clarify the metabolic side of your PCOS.',
    'Inositol (myo + d-chiro) and vitamin D are the most evidence-backed PCOS supplements — discuss dosing with your provider.',
  ],
  Endometriosis: [
    'An anti-inflammatory pattern (oily fish, colourful veg, less ultra-processed food) can take the edge off endo pain for some.',
    'Heat, gentle movement, and pelvic-floor-aware stretching often ease flare-day pain more than rest alone.',
    'Track pain against your cycle day — endo pain that clusters premenstrually is useful information for your specialist.',
    'Ask about options beyond pain relief (hormonal suppression, pelvic physio, or referral) if flares disrupt daily life.',
  ],
  PMDD: [
    'Symptoms concentrated in the ~1–2 weeks before your period point to the luteal phase — logging by cycle day makes the pattern undeniable to a doctor.',
    'Consistent sleep, reduced alcohol, and steady blood-sugar in the luteal phase blunt PMDD mood swings for many.',
    'SSRIs (continuous or luteal-only) and some contraceptives are first-line PMDD treatments worth raising with your provider.',
    'Calcium (~1200mg/day) and vitamin B6 have modest evidence for premenstrual mood symptoms — check with your doctor first.',
  ],
};

const GENERIC_TIPS = [
  'Keep logging consistently — even quick daily entries make your patterns (and this analysis) far more accurate.',
  'Aim for regular sleep and hydration; both quietly influence almost every symptom you track.',
  'Bring this data to your next appointment — a tracked history is one of the most useful things you can hand a clinician.',
];

function conditionsOf(data) {
  return Array.isArray(data.conditions) ? data.conditions : [];
}

function pickTips(conditions, n = 5) {
  const tips = [];
  for (const c of conditions) if (COND_TIPS[c]) tips.push(...COND_TIPS[c]);
  tips.push(...GENERIC_TIPS);
  return tips.slice(0, n);
}

// ── Health analysis (/api/ai/analyze) ────────────────────────────────────────
function analyze(data) {
  const conditions = conditionsOf(data);
  const top = data.top_symptoms || [];
  const trend = data.severity_trend; // { older_avg, recent_avg } | null

  let severity_trend = 'insufficient_data';
  let trend_explanation = 'Log a few more weeks of symptoms and Luna can chart which way things are heading.';
  if (trend && trend.older_avg != null && trend.recent_avg != null) {
    const delta = round(trend.recent_avg - trend.older_avg);
    if (delta <= -0.7) {
      severity_trend = 'improving';
      trend_explanation = `Your average severity has eased from ${trend.older_avg} to ${trend.recent_avg} over this period — a real improvement.`;
    } else if (delta >= 0.7) {
      severity_trend = 'worsening';
      trend_explanation = `Your average severity has climbed from ${trend.older_avg} to ${trend.recent_avg}, so it's worth a closer look.`;
    } else {
      severity_trend = 'stable';
      trend_explanation = `Severity has held fairly steady (${trend.older_avg} → ${trend.recent_avg}), suggesting your current routine is holding the line.`;
    }
  }

  const worst = [...top].sort((a, b) => (b.avg_severity * b.count) - (a.avg_severity * a.count))[0];
  const mostFreq = [...top].sort((a, b) => b.count - a.count)[0];

  const key_insights = [];
  if (mostFreq) key_insights.push(`${cap(mostFreq.symptom)} is your most-logged symptom (${mostFreq.count}× at an average ${mostFreq.avg_severity}/10).`);
  if (worst && worst !== mostFreq) key_insights.push(`${cap(worst.symptom)} carries the heaviest load overall — high severity and frequency combined.`);
  if (data.avg_cycle_length_observed) key_insights.push(`Across ${data.cycles_logged} logged cycles your average length is about ${data.avg_cycle_length_observed} days.`);
  if ((data.top_triggers || []).length) key_insights.push(`You've logged ${data.top_triggers.length} recurring trigger${data.top_triggers.length > 1 ? 's' : ''} — the strongest is "${data.top_triggers[0].trigger}".`);
  if ((data.lab_results || []).length) key_insights.push(`You have ${data.lab_results.length} lab value${data.lab_results.length > 1 ? 's' : ''} on record — useful context for your care team.`);
  while (key_insights.length < 3) key_insights.push('Keep logging daily so Luna can surface deeper, more specific patterns for you.');

  const trigger_patterns = (data.top_triggers || []).slice(0, 3).map(
    t => `"${t.trigger}" shows up repeatedly (${t.count}×) — watch whether it lines up with your higher-severity days.`
  );

  const doctor_questions = buildDoctorQuestions(conditions, worst, data);

  return {
    summary: buildSummary(conditions, mostFreq, severity_trend),
    severity_trend,
    trend_explanation,
    key_insights: key_insights.slice(0, 5),
    trigger_patterns,
    recommendations: pickTips(conditions, 6),
    doctor_questions,
    cycle_insight: data.avg_cycle_length_observed
      ? `Your cycles average ~${data.avg_cycle_length_observed} days. ${data.avg_cycle_length_observed > 35 ? 'Longer or irregular cycles are worth flagging to your doctor.' : 'That falls within a typical range.'}`
      : null,
    most_impactful_symptom: worst ? worst.symptom : (mostFreq ? mostFreq.symptom : 'not enough data yet'),
    condition_note: conditions.length
      ? `Based on your logs, ${conditions[0]} appears to be the most active — the symptom pattern (${(top.slice(0, 3).map(t => t.symptom).join(', ')) || 'your entries'}) fits its typical profile.`
      : 'Add your conditions in Settings so Luna can tailor these insights to what you\'re managing.',
  };
}

function buildSummary(conditions, mostFreq, trend) {
  const c = conditions.length ? conditions.join(' and ') : 'your health';
  const s = mostFreq ? `${cap(mostFreq.symptom)} is showing up most often` : 'your logging is just getting started';
  const t = trend === 'improving' ? 'and the overall trend is encouraging' :
            trend === 'worsening' ? 'and severity has been creeping up lately' :
            trend === 'stable' ? 'and things have been holding steady' : 'and a clearer picture will emerge as you log more';
  return `Here's what your data says about ${c}: ${s}, ${t}. Remember this is pattern-spotting to bring to your provider — not a diagnosis.`;
}

function buildDoctorQuestions(conditions, worst, data) {
  const q = [];
  if (worst) q.push(`My ${worst.symptom} averages ${worst.avg_severity}/10 and peaks at ${worst.max_severity}/10 — what could be driving it and how do we treat it?`);
  if (conditions.includes('PCOS')) q.push('Given my PCOS, should we check insulin/glucose or review whether inositol or metformin fits?');
  if (conditions.includes('Endometriosis')) q.push('My pain clusters around my cycle — are we managing the endometriosis aggressively enough?');
  if (conditions.includes('PMDD')) q.push('My worst symptoms fall before my period — is PMDD-specific treatment (SSRI or hormonal) appropriate for me?');
  if (data.avg_cycle_length_observed && data.avg_cycle_length_observed > 35) q.push('My cycles run long/irregular — should we investigate why?');
  q.push('Based on this tracked history, what should we prioritise or test next?');
  return q.slice(0, 5);
}

// ── Contextual chat (/api/ai/chat) ───────────────────────────────────────────
// Intent-matched responder that weaves in the user's real data context.
function chat(message, ctx) {
  const m = (message || '').toLowerCase();
  const conditions = ctx.conditions || [];
  const condStr = conditions.length ? conditions.join(' and ') : 'your conditions';
  const recent = ctx.symptoms || [];
  const topSym = recent[0];

  const has = (...words) => words.some(w => m.includes(w));

  let body;
  if (has('food', 'eat', 'diet', 'nutrition', 'meal')) {
    body = conditions.includes('PCOS')
      ? 'For PCOS, building meals around protein and fibre with fewer refined carbs helps steady blood sugar and insulin — think eggs, fish, legumes, plenty of veg, and swapping white carbs for whole ones.'
      : conditions.includes('Endometriosis')
      ? 'Many women with endometriosis feel better on an anti-inflammatory pattern: oily fish, colourful vegetables, olive oil, and less ultra-processed food and alcohol.'
      : 'A steady-blood-sugar, anti-inflammatory pattern — protein and fibre at each meal, plenty of veg, less ultra-processed food — tends to help across all three conditions.';
  } else if (has('tired', 'fatigue', 'exhausted', 'energy', 'sleep')) {
    body = `Fatigue is one of the most common threads across ${condStr}. Steady blood sugar, consistent sleep, and checking ferritin/vitamin D/thyroid with your doctor are the highest-yield places to start.`;
  } else if (has('bloat', 'bloating', 'stomach', 'gut', 'digest')) {
    body = 'Bloating often tracks with the luteal (pre-period) phase and can flare with certain trigger foods. Logging it against your cycle day and your triggers is the fastest way to see what\'s behind it.';
  } else if (has('pain', 'cramp', 'ache', 'hurt')) {
    body = conditions.includes('Endometriosis')
      ? 'For endo pain, heat, gentle movement, and anti-inflammatories timed before the flare tend to help more than waiting it out. If pain regularly disrupts your day, that\'s worth escalating with your specialist.'
      : 'For cycle-related pain, heat, gentle movement, and timing anti-inflammatories before your usual flare day can help. Persistent or worsening pain is always worth raising with your doctor.';
  } else if (has('mood', 'anxiety', 'anxious', 'depress', 'irritab', 'cry', 'emotional')) {
    body = conditions.includes('PMDD')
      ? 'With PMDD, mood symptoms concentrate in the days before your period. Tracking them by cycle day makes the pattern clear — and there are effective treatments (SSRIs, some contraceptives) worth discussing with your provider.'
      : 'Hormonal shifts across your cycle can drive real mood changes. Logging mood by cycle day helps separate a cyclical pattern from other causes — useful to show your doctor.';
  } else if (has('period', 'cycle', 'ovulat', 'late', 'irregular')) {
    body = ctx.lastPeriod
      ? `Your last logged period started ${ctx.lastPeriod}. Keep logging each start date and Luna sharpens its predictions — irregular cycles are common with PCOS and always worth flagging to your doctor.`
      : 'Log each period start on the Cycle page and Luna will start predicting your next one. Irregular cycles are worth tracking closely and raising with your provider.';
  } else if (has('pattern', 'trend', 'insight', 'data', 'mean')) {
    body = topSym
      ? `Looking at your recent logs, ${topSym.symptom} (${topSym.severity}/10) stands out. Head to AI Insights for a full breakdown of your trends, triggers, and doctor questions.`
      : 'Once you\'ve logged a handful of symptoms, the AI Insights page pulls together your trends, triggers, and tailored doctor questions.';
  } else if (has('supplement', 'vitamin', 'inositol', 'medication', 'med ')) {
    body = 'Supplements and medications should be personalised with your provider, but the most evidence-backed options are: inositol + vitamin D for PCOS, magnesium/B6/calcium for premenstrual symptoms. Never start or stop a prescribed medication without your doctor.';
  } else if (has('hi', 'hello', 'hey', 'help', 'who are you', 'what can you')) {
    body = `Hi! I'm Luna. I can see the health data you log — symptoms, cycle, triggers, meds — and help you make sense of it for ${condStr}. Ask me about food, pain, mood, energy, your cycle, or what your patterns might mean.`;
  } else {
    body = topSym
      ? `That's a great thing to track. I can see you've recently logged ${topSym.symptom} (${topSym.severity}/10) — tell me a bit more about what you're noticing, and I can point you toward what usually helps and what to raise with your doctor.`
      : `Happy to help with anything about ${condStr} — your symptoms, cycle, triggers, food, mood, or energy. What are you noticing lately?`;
  }

  return `${body}\n\nThis is general information to help you prepare — always check medical decisions with your healthcare provider.`;
}

// ── Fertility insights (/api/ai/fertility) ───────────────────────────────────
function fertility(data) {
  const conditions = conditionsOf(data);
  const reg = data.cycle_regularity;
  const regWord = reg === 'regular' ? 'regular' : reg === 'slightly_irregular' ? 'slightly irregular' : reg === 'irregular' ? 'irregular' : 'not yet established';

  const cycle_assessment = data.avg_cycle_length
    ? `Your cycles average ${data.avg_cycle_length} days and look ${regWord}${data.cycle_variation_days != null ? ` (varying by ~${data.cycle_variation_days} days)` : ''}. ${reg === 'regular' ? 'Regular cycles make ovulation much easier to predict.' : 'More variable cycles make ovulation timing harder to pin down — tracking helps.'}`
    : 'Log a few cycle start dates and Luna can assess your regularity, which is the foundation for predicting ovulation.';

  const condMap = {
    PCOS: { impact: 'PCOS can make ovulation irregular or infrequent, which affects timing more than ability to conceive.', positive_note: 'Many people with PCOS conceive — improving insulin sensitivity and, if needed, ovulation-support treatments make a real difference.' },
    Endometriosis: { impact: 'Endometriosis can affect fertility through inflammation and adhesions, though many people conceive naturally.', positive_note: 'Early conversations with a specialist about timing and options put you in a strong position.' },
    PMDD: { impact: 'PMDD itself doesn\'t reduce fertility, but the luteal-phase symptoms can be intense — worth planning support around.', positive_note: 'Tracking your luteal phase closely doubles as excellent ovulation data.' },
  };
  const condition_impacts = conditions.filter(c => condMap[c]).map(c => ({ condition: c, ...condMap[c] }));
  if (!condition_impacts.length) condition_impacts.push({ condition: 'General', impact: 'No specific conditions logged, so the biggest lever is understanding your own cycle rhythm.', positive_note: 'Consistent tracking gives you a real edge in timing.' });

  const lab_fertility_notes = summariseFertilityLabs(data.relevant_labs || []);

  return {
    summary: `Here's your fertility picture based on ${data.cycles_logged || 0} logged cycle${data.cycles_logged === 1 ? '' : 's'}: your rhythm looks ${regWord}${conditions.length ? `, and we've factored in your ${conditions.join(' and ')}` : ''}. Small, consistent tracking habits are the most powerful thing you can do — and any big decisions belong with your provider or a fertility specialist.`,
    cycle_assessment,
    condition_impacts,
    conception_tips: buildConceptionTips(conditions),
    lab_fertility_notes,
    lifestyle_factors: buildLifestyleFactors(conditions),
    doctor_questions: [
      'Based on my cycle regularity, how would we confirm whether and when I\'m ovulating?',
      conditions.includes('PCOS') ? 'Given my PCOS, would ovulation-tracking or ovulation support be useful?' : 'Are there tests you\'d recommend before we start trying?',
      'How do my logged labs look from a fertility standpoint?',
      'When should we consider a referral to a fertility specialist?',
    ].slice(0, 3),
    tracking_suggestions: [
      'Log every period start date so Luna can predict your fertile window more accurately.',
      reg === 'regular' ? 'Add basal body temperature or LH-test results to confirm ovulation day.' : 'Track cervical mucus and ovulation tests to catch ovulation despite cycle variability.',
    ],
  };
}

function buildConceptionTips(conditions) {
  const tips = [
    'Take a daily prenatal with at least 400mcg folic acid before and during trying to conceive.',
    'Aim for intercourse every 2–3 days across your fertile window rather than trying to time a single day perfectly.',
  ];
  if (conditions.includes('PCOS')) tips.push('Improving insulin sensitivity (movement, protein/fibre, sometimes inositol or metformin) can help restore more regular ovulation.');
  if (conditions.includes('Endometriosis')) tips.push('If you have endometriosis, don\'t wait too long before speaking to a specialist about timing and options.');
  tips.push('Keep alcohol low, don\'t smoke, and aim for steady sleep — all support hormonal balance and conception.');
  tips.push('Manage stress where you can; chronic stress can disrupt ovulation timing.');
  return tips.slice(0, 5);
}

function buildLifestyleFactors(conditions) {
  const f = ['Sleep and stress levels both influence your hormonal cycle and ovulation.'];
  if (conditions.includes('PCOS')) f.push('Blood-sugar stability is a key lever for PCOS-related ovulation.');
  f.push('Regular moderate movement supports fertility; over-training can suppress it.');
  return f.slice(0, 3);
}

function summariseFertilityLabs(labs) {
  if (!labs.length) return null;
  const notes = labs.slice(0, 4).map(l => {
    const r = LAB_RANGES[l.marker];
    if (!r) return `${l.marker}: ${l.value} ${l.unit || ''}`.trim();
    const status = l.value > r.high ? 'above the typical range' : l.value < r.low ? 'below the typical range' : 'within the typical range';
    return `${l.marker} is ${l.value} ${r.unit} (${status})`;
  });
  return `From your logged labs: ${notes.join('; ')}. Your provider can interpret these against your full fertility picture.`;
}

// ── Lab analysis (/api/ai/analyze-labs) — real range-based interpretation ─────
function analyzeLabs(groupedByMarker, conditions) {
  const markers = [];
  const flagged = [];

  for (const [name, readings] of Object.entries(groupedByMarker)) {
    // readings: newest first
    const latest = readings[0];
    const r = LAB_RANGES[name];
    const val = Number(latest.value);

    let status = 'unknown';
    if (r && !Number.isNaN(val) && !r.phase) {
      const span = r.high - r.low;
      if (val > r.high) status = val > r.high + span * 0.15 ? 'high' : 'borderline_high';
      else if (val < r.low) status = val < r.low - span * 0.15 ? 'low' : 'borderline_low';
      else status = 'normal';
    } else if (r && r.phase) {
      status = 'unknown'; // phase-dependent — can't judge without cycle day
    }

    let trend = 'single_reading';
    if (readings.length > 1) {
      const prev = Number(readings[1].value);
      if (!Number.isNaN(prev) && !Number.isNaN(val)) {
        const diff = val - prev;
        const rel = prev !== 0 ? Math.abs(diff / prev) : 0;
        trend = rel < 0.05 ? 'stable' : diff > 0 ? 'rising' : 'falling';
      }
    }

    let observation;
    if (status === 'high' || status === 'borderline_high') {
      observation = `At ${val} ${latest.unit || r?.unit || ''}, this is ${status === 'high' ? 'above' : 'at the upper edge of'} the usual range${r?.highNote ? ` — ${r.highNote}` : ''}.`;
      flagged.push({ name, status, val, unit: latest.unit || r?.unit });
    } else if (status === 'low' || status === 'borderline_low') {
      observation = `At ${val} ${latest.unit || r?.unit || ''}, this is ${status === 'low' ? 'below' : 'at the lower edge of'} the usual range${r?.lowNote ? ` — ${r.lowNote}` : ''}.`;
      flagged.push({ name, status, val, unit: latest.unit || r?.unit });
    } else if (status === 'normal') {
      observation = `At ${val} ${latest.unit || r?.unit || ''}, this sits comfortably within the typical range.`;
    } else {
      observation = r?.phase
        ? `${val} ${latest.unit || r.unit} — this marker is phase-dependent, so it's best read against where you are in your cycle.`
        : `Logged at ${val} ${latest.unit || ''}. Your provider can interpret this against the right reference range for you.`;
    }
    if (readings.length > 1 && trend !== 'stable') observation += ` It's ${trend} across your ${readings.length} readings.`;

    markers.push({
      name,
      latest_value: Number.isNaN(val) ? latest.value : val,
      unit: latest.unit || r?.unit || '',
      status,
      trend,
      observation,
    });
  }

  const key_findings = [];
  if (flagged.length) {
    for (const f of flagged.slice(0, 3)) key_findings.push(`${f.name} is ${f.status.replace('_', ' ')} at ${f.val} ${f.unit || ''}`.trim() + '.');
  } else {
    key_findings.push('None of your logged markers fall clearly outside their typical ranges — reassuring, though context always matters.');
  }
  if (conditions.includes('PCOS') && groupedByMarker['LH'] && groupedByMarker['FSH']) {
    const lh = Number(groupedByMarker['LH'][0].value), fsh = Number(groupedByMarker['FSH'][0].value);
    if (fsh > 0 && lh / fsh >= 2) key_findings.push(`Your LH:FSH ratio is about ${round(lh / fsh)}:1 — a ratio above 2 is often seen in PCOS.`);
  }

  const summary = flagged.length
    ? `Across your logged labs, ${flagged.length} marker${flagged.length > 1 ? 's stand' : ' stands'} out (${flagged.slice(0, 3).map(f => f.name).join(', ')}). The rest look typical. Bring these to your provider for the full picture.`
    : 'Your logged labs largely sit within typical reference ranges. That\'s reassuring — keep tracking so trends stay visible, and review anything specific with your provider.';

  return {
    summary,
    markers,
    key_findings: key_findings.slice(0, 4),
    doctor_questions: [
      flagged.length ? `My ${flagged[0].name} is ${flagged[0].status.replace('_', ' ')} — what does that mean for me and do we need to act on it?` : 'Do my results look normal in the context of my conditions?',
      'Should any of these be rechecked, and how often?',
      conditions.length ? `How do these labs relate to my ${conditions.join(' and ')}?` : 'Are there other tests you\'d recommend based on these?',
      'Are there lifestyle changes that would move any of these numbers?',
    ].slice(0, 4),
    follow_up_tests: buildFollowUpTests(conditions, flagged),
  };
}

function buildFollowUpTests(conditions, flagged) {
  const t = [];
  if (conditions.includes('PCOS')) t.push('HbA1c / oral glucose tolerance', 'Fasting insulin');
  if (conditions.includes('Endometriosis')) t.push('CA-125 with pelvic imaging');
  if (flagged.some(f => f.name === 'Vitamin D')) t.push('Repeat vitamin D after supplementation');
  if (!t.length) t.push('Thyroid panel (TSH, free T4)', 'Vitamin D and ferritin');
  return [...new Set(t)].slice(0, 3);
}

// ── Menopause guide (/api/ai/menopause) ──────────────────────────────────────
const MENO_SYMPTOM_INFO = {
  'Hot flashes':   { why: 'Falling and fluctuating oestrogen disrupts the brain\'s temperature control.', tip: 'Layer clothing, keep spaces cool, and note triggers like caffeine, alcohol, and spicy food.' },
  'Night sweats':  { why: 'The same temperature dysregulation as hot flashes, happening during sleep.', tip: 'Breathable bedding, a cool room, and limiting evening alcohol all help.' },
  'Insomnia':      { why: 'Lower oestrogen and progesterone disrupt sleep architecture, often worsened by night sweats.', tip: 'A consistent wind-down routine and a cool, dark room protect sleep quality.' },
  'Fatigue':       { why: 'Broken sleep plus hormonal shifts leave energy low.', tip: 'Protect sleep, keep blood sugar steady, and ask your doctor to check thyroid and ferritin.' },
  'Mood swings':   { why: 'Fluctuating hormones affect serotonin and the brain\'s emotional regulation.', tip: 'Regular movement, daylight, and steady sleep smooth mood; persistent low mood deserves support.' },
  'Anxiety':       { why: 'Hormonal fluctuation can heighten the nervous system\'s stress response.', tip: 'Breathwork, movement, and limiting caffeine help; don\'t hesitate to seek support if it\'s persistent.' },
  'Low mood':      { why: 'Declining oestrogen influences mood-regulating neurotransmitters.', tip: 'Daylight, connection, and movement help — and low mood in this transition is very treatable.' },
  'Brain fog':     { why: 'Oestrogen supports memory and focus, so shifting levels can cloud thinking.', tip: 'Sleep, movement, and reducing multitasking help; it usually improves after the transition.' },
  'Joint pain':    { why: 'Oestrogen has an anti-inflammatory role, so joints can ache as it declines.', tip: 'Regular movement, strength work, and anti-inflammatory eating ease stiffness.' },
  'Headaches':     { why: 'Hormonal fluctuation is a common headache and migraine trigger.', tip: 'Track patterns against cycle/symptoms and discuss options if they\'re frequent.' },
  'Vaginal dryness': { why: 'Lower oestrogen thins and dries vaginal tissue.', tip: 'Vaginal moisturisers and local oestrogen (via your doctor) are very effective.' },
  'Low libido':    { why: 'Hormonal shifts plus symptoms like dryness and fatigue affect desire.', tip: 'Address the physical drivers first; this is a common and treatable part of the transition.' },
};

const STAGE_INSIGHT = {
  perimenopause: 'In perimenopause your ovaries are winding down and oestrogen fluctuates unpredictably — which is why symptoms can come and go. It typically lasts 4–10 years before periods stop entirely.',
  menopause: 'Menopause is defined as 12 consecutive months without a period, when hormone levels settle at their lowest. Symptoms are often at their most noticeable around this point.',
  postmenopause: 'In post-menopause the hormonal storm has largely passed and many symptoms ease, but lower oestrogen means bone and cardiovascular health deserve ongoing attention.',
  early_surgical: 'Early or surgical menopause brings hormonal changes more abruptly, which can make symptoms feel more intense. Specialist support around hormone replacement is especially worthwhile here.',
  unknown: 'Based on your symptoms you may be in the menopause transition. A doctor can confirm your stage, sometimes with an FSH blood test alongside your symptom picture.',
};

function menopause(reqData) {
  const conditions = conditionsOf(reqData);
  const stage = reqData.stage && STAGE_INSIGHT[reqData.stage] ? reqData.stage : 'unknown';
  const reported = reqData.reported_symptoms || [];

  const symptom_insights = reported.slice(0, 6).map(s => {
    const info = MENO_SYMPTOM_INFO[s];
    return {
      symptom: s,
      why_it_happens: info ? info.why : 'This can shift with the hormonal changes of the menopause transition.',
      management_tip: info ? info.tip : 'Track it against your other symptoms and raise persistent issues with your provider.',
    };
  });

  const lifestyle_pillars = [
    { category: 'Nutrition', tip: 'Prioritise protein, calcium, and colourful plants; limit alcohol and caffeine if they trigger flashes.', why: 'Supports bone density and steadier energy as oestrogen falls.' },
    { category: 'Movement', tip: 'Combine strength training with weight-bearing cardio 3–4× a week.', why: 'Protects bone and muscle mass, mood, and metabolic health.' },
    { category: 'Sleep', tip: 'Keep a cool, dark room and a consistent wind-down routine.', why: 'Directly counters the sleep disruption of night sweats and hormonal shifts.' },
    { category: 'Stress', tip: 'Build in daily downregulation — breathwork, walks, or anything restorative.', why: 'A calmer nervous system blunts both anxiety and hot-flash frequency.' },
  ];
  if (conditions.includes('PCOS')) lifestyle_pillars.push({ category: 'Metabolic', tip: 'Keep the blood-sugar habits that help your PCOS — they matter even more now.', why: 'Menopause raises insulin-resistance and cardiovascular risk, which PCOS already affects.' });

  const medical_options = [
    { name: 'HRT (hormone replacement therapy)', description: 'Replaces oestrogen (± progesterone) to relieve symptoms and protect bone.', suits_who: 'Often first-line for moderate–severe symptoms without contraindications.', flag: 'discuss with doctor' },
    { name: 'Vaginal (local) oestrogen', description: 'Low-dose oestrogen for dryness and urinary symptoms.', suits_who: 'Anyone with genitourinary symptoms, even alongside or instead of systemic HRT.', flag: 'discuss with doctor' },
    { name: 'Non-hormonal medications', description: 'Certain SSRIs/SNRIs and other agents can reduce hot flashes and mood symptoms.', suits_who: 'Those who can\'t or prefer not to take HRT.', flag: 'discuss with doctor' },
    { name: 'Lifestyle & supplements', description: 'Sleep, movement, and targeted nutrition; some find vitamin D and magnesium helpful.', suits_who: 'Everyone, as a foundation alongside any medical option.', flag: 'no known issues' },
  ];

  const lab_notes = summariseMenoLabs(reqData.relevant_labs || []);

  return {
    summary: `You're navigating the ${stage === 'unknown' ? 'menopause transition' : stage.replace('_', '/')} stage${reported.length ? `, and you've flagged ${reported.length} symptom${reported.length > 1 ? 's' : ''}` : ''}. This is a natural life stage, and with the right support most symptoms are very manageable. Here's a personalised map — bring anything that resonates to your GP or a menopause specialist.`,
    stage_insight: STAGE_INSIGHT[stage],
    symptom_insights,
    lifestyle_pillars: lifestyle_pillars.slice(0, 5),
    medical_options,
    condition_interactions: conditions.length
      ? `Your ${conditions.join(' and ')} can interact with this transition: ${conditions.includes('PCOS') ? 'PCOS raises cardiometabolic risk that menopause compounds, so metabolic health stays a priority. ' : ''}${conditions.includes('Endometriosis') ? 'Endometriosis symptoms often ease after menopause, though HRT choices may need tailoring. ' : ''}${conditions.includes('PMDD') ? 'PMDD-style mood sensitivity can extend into perimenopause and respond to similar treatments. ' : ''}`.trim()
      : null,
    lab_notes,
    doctor_questions: [
      'Based on my symptoms and stage, is HRT a good option for me — and what type?',
      reported.length ? `What can we do about my ${reported[0].toLowerCase()}?` : 'Which of my symptoms are menopause-related versus something else?',
      conditions.length ? `How does my ${conditions[0]} affect my menopause treatment choices?` : 'Should we check my bone or cardiovascular health?',
      'What symptoms would mean I should come back sooner?',
    ].slice(0, 4),
    what_to_track: [
      'Hot flashes / night sweats — frequency and triggers.',
      'Sleep quality and mood, day to day.',
      'Any bleeding pattern changes (important to report).',
    ],
  };
}

function summariseMenoLabs(labs) {
  if (!labs.length) return null;
  const fsh = labs.find(l => l.marker === 'FSH');
  const e2 = labs.find(l => l.marker === 'Estradiol (E2)');
  const parts = [];
  if (fsh) parts.push(`FSH is ${fsh.value} ${fsh.unit || 'mIU/mL'}${Number(fsh.value) > 25 ? ' — a raised FSH supports the menopause transition' : ''}`);
  if (e2) parts.push(`Estradiol is ${e2.value} ${e2.unit || 'pg/mL'}${Number(e2.value) < 30 ? ', which is low as expected around menopause' : ''}`);
  if (!parts.length) return `You've logged ${labs.length} relevant lab value${labs.length > 1 ? 's' : ''}; FSH and estradiol are the most useful for confirming menopause — your doctor can interpret them.`;
  return `${parts.join('; ')}. FSH and estradiol together help confirm menopause, but your doctor reads them alongside your symptoms.`;
}

function cap(s) { return typeof s === 'string' && s.length ? s[0].toUpperCase() + s.slice(1) : s; }

export { analyze, chat, fertility, analyzeLabs, menopause, round, pct };
