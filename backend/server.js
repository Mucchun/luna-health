const express = require('express');
const cors = require('cors');
const db = require('./db');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// ── Profile ──────────────────────────────────────────────────────────────────
app.put('/api/profile', (req, res) => {
  const { name, conditions, cycle_length, period_length } = req.body;
  db.prepare(`UPDATE user_profile SET name=?, conditions=?, cycle_length=?, period_length=? WHERE id=1`)
    .run(name, JSON.stringify(conditions), cycle_length, period_length);
  res.json({ ok: true });
});

// ── Cycles ───────────────────────────────────────────────────────────────────
app.get('/api/cycles', (req, res) => {
  const rows = db.prepare('SELECT * FROM cycles ORDER BY start_date DESC LIMIT 12').all();
  res.json(rows);
});

app.post('/api/cycles', (req, res) => {
  const { start_date, end_date, notes } = req.body;
  const info = db.prepare('INSERT INTO cycles (start_date, end_date, notes) VALUES (?,?,?)')
    .run(start_date, end_date || null, notes || null);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/cycles/:id', (req, res) => {
  const { end_date, notes } = req.body;
  db.prepare('UPDATE cycles SET end_date=?, notes=? WHERE id=?').run(end_date, notes, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/cycles/:id', (req, res) => {
  db.prepare('DELETE FROM cycles WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── Symptoms ─────────────────────────────────────────────────────────────────
app.get('/api/symptoms', (req, res) => {
  const { days = 90 } = req.query;
  const rows = db.prepare(`
    SELECT * FROM symptoms
    WHERE date >= date('now', '-' || ? || ' days')
    ORDER BY date DESC
  `).all(days);
  res.json(rows);
});

app.post('/api/symptoms', (req, res) => {
  const { date, condition, symptom, severity, body_location, notes } = req.body;
  const info = db.prepare(`
    INSERT INTO symptoms (date, condition, symptom, severity, body_location, notes)
    VALUES (?,?,?,?,?,?)
  `).run(date, condition, symptom, severity, body_location || null, notes || null);
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/symptoms/:id', (req, res) => {
  db.prepare('DELETE FROM symptoms WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── Triggers ─────────────────────────────────────────────────────────────────
app.get('/api/triggers', (req, res) => {
  const { days = 90 } = req.query;
  const rows = db.prepare(`
    SELECT * FROM triggers
    WHERE date >= date('now', '-' || ? || ' days')
    ORDER BY date DESC
  `).all(days);
  res.json(rows);
});

app.post('/api/triggers', (req, res) => {
  const { date, category, value, notes } = req.body;
  const info = db.prepare('INSERT INTO triggers (date, category, value, notes) VALUES (?,?,?,?)')
    .run(date, category, value, notes || null);
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/triggers/:id', (req, res) => {
  db.prepare('DELETE FROM triggers WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── Trigger correlations ─────────────────────────────────────────────────────
app.get('/api/correlations', (req, res) => {
  // For each trigger value, compare avg symptom severity on trigger days vs non-trigger days
  const triggers = db.prepare('SELECT DISTINCT category, value FROM triggers').all();
  const results = [];

  for (const t of triggers) {
    const triggerDates = db.prepare('SELECT DISTINCT date FROM triggers WHERE category=? AND value=?')
      .all(t.category, t.value).map(r => r.date);

    if (triggerDates.length < 2) continue;

    const placeholders = triggerDates.map(() => '?').join(',');
    const onDays = db.prepare(`SELECT AVG(severity) as avg FROM symptoms WHERE date IN (${placeholders})`)
      .get(...triggerDates);
    const offDays = db.prepare(`SELECT AVG(severity) as avg FROM symptoms WHERE date NOT IN (${placeholders})`)
      .get(...triggerDates);

    if (onDays.avg !== null && offDays.avg !== null) {
      results.push({
        category: t.category,
        value: t.value,
        on_avg: Math.round(onDays.avg * 10) / 10,
        off_avg: Math.round((offDays.avg || 0) * 10) / 10,
        days_tracked: triggerDates.length,
        impact: Math.round((onDays.avg - (offDays.avg || 0)) * 10) / 10,
      });
    }
  }

  results.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  res.json(results.slice(0, 10));
});

// ── Medications ───────────────────────────────────────────────────────────────
app.get('/api/medications', (req, res) => {
  const rows = db.prepare('SELECT * FROM medications ORDER BY active DESC, name').all();
  res.json(rows);
});

app.post('/api/medications', (req, res) => {
  const { name, type, dose, frequency, start_date, notes } = req.body;
  const info = db.prepare(`
    INSERT INTO medications (name, type, dose, frequency, start_date, notes)
    VALUES (?,?,?,?,?,?)
  `).run(name, type, dose || null, frequency || null, start_date || null, notes || null);
  res.json({ id: info.lastInsertRowid });
});

app.post('/api/medications/:id/log', (req, res) => {
  const { date, taken, notes } = req.body;
  const info = db.prepare('INSERT INTO medication_logs (medication_id, date, taken, notes) VALUES (?,?,?,?)')
    .run(req.params.id, date, taken ? 1 : 0, notes || null);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/medications/:id', (req, res) => {
  const { active } = req.body;
  db.prepare('UPDATE medications SET active=? WHERE id=?').run(active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// ── Lab Values ────────────────────────────────────────────────────────────────
app.get('/api/labs', (req, res) => {
  const rows = db.prepare('SELECT * FROM lab_values ORDER BY date DESC').all();
  res.json(rows);
});

app.post('/api/labs', (req, res) => {
  const { date, marker, value, unit, lab, notes } = req.body;
  const info = db.prepare('INSERT INTO lab_values (date, marker, value, unit, lab, notes) VALUES (?,?,?,?,?,?)')
    .run(date, marker, value, unit, lab || null, notes || null);
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/labs/:id', (req, res) => {
  db.prepare('DELETE FROM lab_values WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── Flare Prediction ─────────────────────────────────────────────────────────
app.get('/api/predictions', (req, res) => {
  const profile = db.prepare('SELECT * FROM user_profile WHERE id=1').get();
  const cycles = db.prepare('SELECT * FROM cycles ORDER BY start_date DESC LIMIT 6').all();

  if (cycles.length < 2) {
    return res.json({ predictions: [], message: 'Need at least 2 logged cycles for predictions' });
  }

  // Find high-severity days relative to cycle start
  const highSeverityPattern = db.prepare(`
    SELECT s.date, c.start_date,
      CAST((julianday(s.date) - julianday(c.start_date)) AS INTEGER) AS cycle_day,
      AVG(s.severity) as avg_severity
    FROM symptoms s
    JOIN cycles c ON s.date >= c.start_date
      AND (c.end_date IS NULL OR s.date <= c.end_date)
    WHERE s.severity >= 6
    GROUP BY s.date, c.id
    HAVING cycle_day >= 0 AND cycle_day <= 35
    ORDER BY cycle_day
  `).all();

  // Count flare frequency by cycle day
  const dayCounts = {};
  for (const row of highSeverityPattern) {
    dayCounts[row.cycle_day] = (dayCounts[row.cycle_day] || 0) + 1;
  }

  const totalCycles = cycles.length;
  const flareDays = Object.entries(dayCounts)
    .filter(([, count]) => count / totalCycles >= 0.4)
    .map(([day]) => parseInt(day));

  // Project flare days onto next cycle
  const lastCycle = cycles[0];
  const nextCycleStart = lastCycle.end_date
    ? new Date(lastCycle.end_date)
    : new Date(lastCycle.start_date);

  if (!lastCycle.end_date) {
    nextCycleStart.setDate(nextCycleStart.getDate() + (profile.cycle_length || 28));
  }

  const predictions = flareDays.map(day => {
    const d = new Date(nextCycleStart);
    d.setDate(d.getDate() + day);
    return {
      date: d.toISOString().split('T')[0],
      cycle_day: day,
      confidence: Math.min(Math.round((dayCounts[day] / totalCycles) * 100), 95),
    };
  }).filter(p => new Date(p.date) >= new Date()).slice(0, 7);

  res.json({ predictions, next_cycle_start: nextCycleStart.toISOString().split('T')[0] });
});

// ── Doctor Report ─────────────────────────────────────────────────────────────
app.get('/api/report', (req, res) => {
  const { days = 90 } = req.query;
  const profile = db.prepare('SELECT * FROM user_profile WHERE id=1').get();
  const symptoms = db.prepare(`
    SELECT * FROM symptoms WHERE date >= date('now', '-' || ? || ' days') ORDER BY date DESC
  `).all(days);
  const cycles = db.prepare('SELECT * FROM cycles ORDER BY start_date DESC LIMIT 6').all();
  const labs = db.prepare('SELECT * FROM lab_values ORDER BY date DESC').all();
  const meds = db.prepare('SELECT * FROM medications WHERE active=1').all();
  const triggers = db.prepare(`SELECT * FROM triggers WHERE date >= date('now', '-' || ? || ' days')`).all(days);

  // Symptom frequency
  const symptomFreq = {};
  const symptomSeverity = {};
  for (const s of symptoms) {
    symptomFreq[s.symptom] = (symptomFreq[s.symptom] || 0) + 1;
    if (!symptomSeverity[s.symptom]) symptomSeverity[s.symptom] = [];
    symptomSeverity[s.symptom].push(s.severity);
  }

  const topSymptoms = Object.entries(symptomFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([symptom, count]) => ({
      symptom,
      count,
      avg_severity: Math.round((symptomSeverity[symptom].reduce((a, b) => a + b, 0) / symptomSeverity[symptom].length) * 10) / 10,
    }));

  res.json({
    profile: { ...profile, conditions: JSON.parse(profile.conditions) },
    period_days: parseInt(days),
    top_symptoms: topSymptoms,
    total_symptom_logs: symptoms.length,
    cycles: cycles.slice(0, 3),
    labs,
    active_medications: meds,
    trigger_count: triggers.length,
    high_severity_days: symptoms.filter(s => s.severity >= 7).length,
    generated_at: new Date().toISOString(),
  });
});

// ── Stats / Dashboard ─────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const profile = db.prepare('SELECT * FROM user_profile WHERE id=1').get();

  const last7 = db.prepare(`
    SELECT date, AVG(severity) as avg_severity, COUNT(*) as count
    FROM symptoms
    WHERE date >= date('now', '-7 days')
    GROUP BY date ORDER BY date
  `).all();

  const last30 = db.prepare(`
    SELECT date, AVG(severity) as avg_severity, COUNT(*) as count
    FROM symptoms
    WHERE date >= date('now', '-30 days')
    GROUP BY date ORDER BY date
  `).all();

  const mostCommon = db.prepare(`
    SELECT symptom, condition, COUNT(*) as count, AVG(severity) as avg_sev
    FROM symptoms
    WHERE date >= date('now', '-30 days')
    GROUP BY symptom ORDER BY count DESC LIMIT 5
  `).all();

  const lastCycle = db.prepare('SELECT * FROM cycles ORDER BY start_date DESC LIMIT 1').get();
  const todaySymptoms = db.prepare(`SELECT * FROM symptoms WHERE date = date('now')`).all();

  res.json({
    last7,
    last30,
    most_common_symptoms: mostCommon,
    last_cycle: lastCycle || null,
    today_symptoms: todaySymptoms,
    profile: { ...profile, conditions: JSON.parse(profile.conditions) },
  });
});

// ── Community ─────────────────────────────────────────────────────────────────
app.get('/api/community/posts', (req, res) => {
  const { category } = req.query;
  const rows = category
    ? db.prepare(`
        SELECT p.*, COUNT(c.id) AS comment_count
        FROM community_posts p
        LEFT JOIN community_comments c ON c.post_id = p.id
        WHERE p.category = ?
        GROUP BY p.id ORDER BY p.id DESC LIMIT 60
      `).all(category)
    : db.prepare(`
        SELECT p.*, COUNT(c.id) AS comment_count
        FROM community_posts p
        LEFT JOIN community_comments c ON c.post_id = p.id
        GROUP BY p.id ORDER BY p.id DESC LIMIT 60
      `).all();
  res.json(rows);
});

app.post('/api/community/posts', (req, res) => {
  const { category, anon_name, anon_color, title, content } = req.body;
  if (!category || !anon_name || !title?.trim() || !content?.trim()) return res.status(400).json({ error: 'Missing fields' });
  if (title.length > 200 || content.length > 2000) return res.status(400).json({ error: 'Too long' });
  const info = db.prepare('INSERT INTO community_posts (category, anon_name, anon_color, title, content) VALUES (?,?,?,?,?)')
    .run(category, anon_name, anon_color || '#C83F6E', title.trim(), content.trim());
  res.json({ id: info.lastInsertRowid });
});

app.get('/api/community/posts/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const comments = db.prepare('SELECT * FROM community_comments WHERE post_id=? ORDER BY id ASC').all(req.params.id);
  res.json({ ...post, comments });
});

app.post('/api/community/posts/:id/comments', (req, res) => {
  const { anon_name, anon_color, content } = req.body;
  if (!anon_name || !content?.trim()) return res.status(400).json({ error: 'Missing fields' });
  if (content.length > 1000) return res.status(400).json({ error: 'Too long' });
  const info = db.prepare('INSERT INTO community_comments (post_id, anon_name, anon_color, content) VALUES (?,?,?,?)')
    .run(req.params.id, anon_name, anon_color || '#C83F6E', content.trim());
  res.json({ id: info.lastInsertRowid });
});

app.post('/api/community/posts/:id/like', (req, res) => {
  db.prepare('UPDATE community_posts SET likes = likes + 1 WHERE id=?').run(req.params.id);
  const row = db.prepare('SELECT likes FROM community_posts WHERE id=?').get(req.params.id);
  res.json({ likes: row?.likes ?? 0 });
});

app.delete('/api/community/comments/:id', (req, res) => {
  db.prepare('DELETE FROM community_comments WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/community/posts/:id', (req, res) => {
  db.prepare('DELETE FROM community_comments WHERE post_id=?').run(req.params.id);
  db.prepare('DELETE FROM community_posts WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── Data Management ───────────────────────────────────────────────────────────
app.delete('/api/data/:table', (req, res) => {
  const allowed = { symptoms: 'symptoms', cycles: 'cycles', triggers: 'triggers', labs: 'lab_values', medications: 'medications' };
  const table = allowed[req.params.table];
  if (!table) return res.status(400).json({ error: 'Unknown table' });
  if (table === 'medications') db.prepare('DELETE FROM medication_logs').run();
  db.prepare(`DELETE FROM ${table}`).run();
  res.json({ ok: true });
});

app.delete('/api/data/all/confirm', (req, res) => {
  ['symptoms','cycles','triggers','lab_values','medications','medication_logs','community_posts','community_comments'].forEach(t =>
    db.prepare(`DELETE FROM ${t}`).run()
  );
  db.prepare(`UPDATE user_profile SET name='', conditions='[]', cycle_length=28, period_length=5 WHERE id=1`).run();
  res.json({ ok: true });
});

// ── AI Health Analysis ────────────────────────────────────────────────────────
app.post('/api/ai/analyze', async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'GROQ_API_KEY not set. Add it to your environment and restart the server.' });
  }

  const profile = db.prepare('SELECT * FROM user_profile WHERE id=1').get();
  const symptoms = db.prepare(`SELECT * FROM symptoms WHERE date >= date('now', '-90 days') ORDER BY date ASC`).all();
  const cycles = db.prepare('SELECT * FROM cycles ORDER BY start_date DESC LIMIT 8').all();
  const triggers = db.prepare(`SELECT * FROM triggers WHERE date >= date('now', '-90 days')`).all();
  const labs = db.prepare('SELECT * FROM lab_values ORDER BY date DESC LIMIT 20').all();
  const meds = db.prepare('SELECT * FROM medications WHERE active=1').all();

  if (symptoms.length < 3 && cycles.length < 1) {
    return res.status(400).json({ error: 'Not enough data yet. Log at least a few symptoms or periods first.' });
  }

  // Aggregate symptom stats
  const freq = {};
  const sevMap = {};
  for (const s of symptoms) {
    freq[s.symptom] = (freq[s.symptom] || 0) + 1;
    if (!sevMap[s.symptom]) sevMap[s.symptom] = [];
    sevMap[s.symptom].push(s.severity);
  }
  const topSymptoms = Object.entries(freq)
    .sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([symptom, count]) => ({
      symptom, count,
      avg_severity: Math.round(sevMap[symptom].reduce((a, b) => a + b, 0) / sevMap[symptom].length * 10) / 10,
      max_severity: Math.max(...sevMap[symptom]),
    }));

  // Severity trend: compare oldest third vs newest third
  const third = Math.floor(symptoms.length / 3);
  const oldAvg = third ? symptoms.slice(0, third).reduce((a, s) => a + s.severity, 0) / third : null;
  const newAvg = third ? symptoms.slice(-third).reduce((a, s) => a + s.severity, 0) / third : null;

  // Trigger frequency
  const trigFreq = {};
  for (const t of triggers) {
    const k = `${t.category}: ${t.value}`;
    trigFreq[k] = (trigFreq[k] || 0) + 1;
  }
  const topTriggers = Object.entries(trigFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, c]) => ({ trigger: k, count: c }));

  // Cycle stats
  const cycleLengths = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    const diff = Math.round((new Date(cycles[i].start_date).getTime() - new Date(cycles[i+1].start_date).getTime()) / 86400000);
    if (diff > 0 && diff < 60) cycleLengths.push(diff);
  }
  const avgCycleLen = cycleLengths.length ? Math.round(cycleLengths.reduce((a,b) => a+b, 0) / cycleLengths.length) : null;

  const healthData = {
    conditions: JSON.parse(profile.conditions || '[]'),
    cycle_length_preference: profile.cycle_length,
    period_length_preference: profile.period_length,
    data_period_days: 90,
    total_symptom_logs: symptoms.length,
    severity_trend: oldAvg && newAvg ? { older_avg: Math.round(oldAvg*10)/10, recent_avg: Math.round(newAvg*10)/10 } : null,
    top_symptoms: topSymptoms,
    cycles_logged: cycles.length,
    avg_cycle_length_observed: avgCycleLen,
    period_durations: cycles.filter(c => c.end_date).map(c => ({
      start: c.start_date,
      duration_days: Math.round((new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / 86400000) + 1,
      notes: c.notes,
    })),
    top_triggers: topTriggers,
    lab_results: labs.map(l => ({ marker: l.marker, value: l.value, unit: l.unit, date: l.date })),
    active_medications: meds.map(m => ({ name: m.name, type: m.type, dose: m.dose, frequency: m.frequency })),
  };

  const systemPrompt = `You are a compassionate women's health analyst embedded in Luna Health, an app for women managing chronic conditions (PCOS, Endometriosis, PMDD). You analyze real health tracking data and provide personalised, evidence-based insights.

Your tone is warm, clear, and empowering — never clinical or alarmist. Always remind users to discuss findings with their healthcare provider.

You will receive aggregated health data and must return a JSON object ONLY — no markdown, no explanation, just the JSON.`;

  const userPrompt = `Analyse this user's health data and return insights as a JSON object with exactly this structure:

{
  "summary": "2-3 sentence personalised overview of the most notable patterns you see",
  "severity_trend": "improving" | "stable" | "worsening" | "insufficient_data",
  "trend_explanation": "one sentence explaining the trend direction with specific numbers if available",
  "key_insights": ["specific insight from data", "..."] (3-5 insights, each referencing actual data points),
  "trigger_patterns": ["pattern description", "..."] (2-3 trigger observations, empty array if no trigger data),
  "recommendations": ["actionable recommendation", "..."] (4-6 evidence-based recommendations tailored to their conditions AND their actual symptom data),
  "doctor_questions": ["specific question to ask", "..."] (4-5 questions tailored to their data — not generic),
  "cycle_insight": "one specific observation about their period/cycle patterns" or null,
  "most_impactful_symptom": "the symptom that appears most severe or frequent based on data",
  "condition_note": "which of their conditions seems most active and why, based on the symptom pattern"
}

Health Data:
${JSON.stringify(healthData, null, 2)}`;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    // Strip any accidental markdown fences
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const analysis = JSON.parse(jsonStr);

    res.json({
      analysis,
      data_points: symptoms.length,
      cycles_analyzed: cycles.length,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('AI analysis error:', err.message);
    res.status(500).json({ error: 'Analysis failed. ' + (err.message || '') });
  }
});

// ── AI Chat ───────────────────────────────────────────────────────────────────
app.post('/api/ai/chat', async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'GROQ_API_KEY not set.' });
  }

  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'No message.' });

  const profile = db.prepare('SELECT * FROM user_profile WHERE id=1').get();
  const symptoms  = db.prepare(`SELECT symptom, severity, date FROM symptoms ORDER BY date DESC LIMIT 15`).all();
  const cycles    = db.prepare('SELECT start_date, end_date FROM cycles ORDER BY start_date DESC LIMIT 3').all();
  const meds      = db.prepare('SELECT name, dose, frequency FROM medications WHERE active=1').all();
  const triggers  = db.prepare(`SELECT category, value FROM triggers ORDER BY date DESC LIMIT 10`).all();

  const conditions = JSON.parse(profile?.conditions || '[]');
  const ctx = [
    `Conditions: ${conditions.join(', ') || 'none specified'}`,
    `Cycle: ${profile?.cycle_length || 28}d cycle, ${profile?.period_length || 5}d period`,
    meds.length     ? `Medications: ${meds.map(m => `${m.name}${m.dose ? ' ' + m.dose : ''}`).join(', ')}` : null,
    symptoms.length ? `Recent symptoms: ${symptoms.map(s => `${s.symptom} (${s.severity}/10, ${s.date})`).join('; ')}` : null,
    triggers.length ? `Recent triggers: ${triggers.map(t => `${t.value} (${t.category})`).join(', ')}` : null,
    cycles.length   ? `Last period started: ${cycles[0].start_date}` : null,
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are Luna, a compassionate women's health assistant inside the Luna Health app — built for women managing PCOS, Endometriosis, and PMDD.

The user's current health data:
${ctx}

Your style:
- Warm, empathetic, direct — never clinical or robotic
- Use their actual data when it's relevant (e.g. "I can see you've had a lot of back pain lately")
- Keep answers to 3–5 sentences unless they clearly need more detail
- Practical, actionable advice tailored to their specific conditions
- Always gently recommend consulting a healthcare provider for medical decisions
- Never diagnose, prescribe, or suggest stopping medications`;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-12),
        { role: 'user', content: message },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });
    const reply = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Chat failed.' });
  }
});

// ── Profile — handle missing profile gracefully ───────────────────────────────
app.get('/api/profile', (req, res) => {
  let p = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  if (!p) {
    db.prepare('INSERT INTO user_profile (id, name, conditions) VALUES (1, ?, ?)').run('', '[]');
    p = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  }
  res.json({ ...p, conditions: JSON.parse(p.conditions) });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Luna API running on http://localhost:${PORT}`));
