// On-device API router.
//
// Reimplements every `/api/*` route the app used to call on the Express+SQLite
// backend, but running entirely client-side against on-device storage
// (see store.ts). This is what lets the app ship to the App Store with no shared
// health backend — each device is self-contained.
//
// The only thing that still talks to a server is the anonymous Community, and
// only when a shared backend is configured (see lib/community.ts). When it isn't,
// the community routes here act as a local, single-device fallback.

import * as store from './store';
import { nowStamp } from './store';
import * as insights from './insights';
import { screenText } from './moderation';

type Json = any;
interface Result { status: number; data: Json }

const ok = (data: Json): Result => ({ status: 200, data });
const err = (status: number, error: string): Result => ({ status, data: { error } });

// ── date helpers (dates are stored as 'YYYY-MM-DD', which sort chronologically) ─
const today = () => new Date().toISOString().slice(0, 10);
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
const dayDiff = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

// Default profile — mirrors the old db.js seed (blank triggers onboarding).
async function getProfile() {
  return store.load('profile', { id: 1, name: '', conditions: [] as string[], cycle_length: 28, period_length: 5, created_at: nowStamp() });
}

// Rows sorted by a date field descending, id as tiebreak.
function byDateDesc<T extends { id: number }>(rows: T[], field: keyof T): T[] {
  return [...rows].sort((a, b) => String(b[field]).localeCompare(String(a[field])) || b.id - a.id);
}

// ─────────────────────────────────────────────────────────────────────────────
export async function handleLocal(method: string, rawPath: string, body: Json): Promise<Result> {
  const url = new URL(rawPath, 'http://local');
  const path = url.pathname;
  const q = url.searchParams;
  const M = method.toUpperCase();

  // ── Profile ────────────────────────────────────────────────────────────────
  if (path === '/api/profile') {
    if (M === 'GET') return ok(await getProfile());
    if (M === 'PUT') {
      const p = await getProfile();
      const { name, conditions, cycle_length, period_length } = body || {};
      await store.save('profile', { ...p, name, conditions, cycle_length, period_length });
      return ok({ ok: true });
    }
  }

  // ── Cycles ───────────────────────────────────────────────────────────────────
  if (path === '/api/cycles') {
    if (M === 'GET') return ok(byDateDesc(await store.all('cycles'), 'start_date').slice(0, 12));
    if (M === 'POST') {
      const { start_date, end_date, notes } = body;
      const id = await store.insert('cycles', { start_date, end_date: end_date || null, notes: notes || null, created_at: nowStamp() });
      return ok({ id });
    }
  }
  let m = path.match(/^\/api\/cycles\/(\d+)$/);
  if (m) {
    const id = +m[1];
    if (M === 'PUT') { await store.update('cycles', id, { end_date: body.end_date, notes: body.notes }); return ok({ ok: true }); }
    if (M === 'DELETE') { await store.del('cycles', id); return ok({ ok: true }); }
  }

  // ── Symptoms ─────────────────────────────────────────────────────────────────
  if (path === '/api/symptoms') {
    if (M === 'GET') {
      const days = +(q.get('days') || 90);
      const cutoff = daysAgo(days);
      const rows = (await store.all('symptoms')).filter((s: any) => s.date >= cutoff);
      return ok(byDateDesc(rows, 'date'));
    }
    if (M === 'POST') {
      const { date, condition, symptom, severity, body_location, notes } = body;
      const id = await store.insert('symptoms', { date, condition, symptom, severity, body_location: body_location || null, notes: notes || null, created_at: nowStamp() });
      return ok({ id });
    }
  }
  m = path.match(/^\/api\/symptoms\/(\d+)$/);
  if (m && M === 'DELETE') { await store.del('symptoms', +m[1]); return ok({ ok: true }); }

  // ── Triggers ─────────────────────────────────────────────────────────────────
  if (path === '/api/triggers') {
    if (M === 'GET') {
      const cutoff = daysAgo(+(q.get('days') || 90));
      const rows = (await store.all('triggers')).filter((t: any) => t.date >= cutoff);
      return ok(byDateDesc(rows, 'date'));
    }
    if (M === 'POST') {
      const { date, category, value, notes } = body;
      const id = await store.insert('triggers', { date, category, value, notes: notes || null, created_at: nowStamp() });
      return ok({ id });
    }
  }
  m = path.match(/^\/api\/triggers\/(\d+)$/);
  if (m && M === 'DELETE') { await store.del('triggers', +m[1]); return ok({ ok: true }); }

  // ── Trigger correlations ─────────────────────────────────────────────────────
  if (path === '/api/correlations' && M === 'GET') {
    const triggers: any[] = await store.all('triggers');
    const symptoms: any[] = await store.all('symptoms');
    const pairs = [...new Set(triggers.map(t => `${t.category}||${t.value}`))];
    const results: any[] = [];
    for (const pair of pairs) {
      const [category, value] = pair.split('||');
      const triggerDates = [...new Set(triggers.filter(t => t.category === category && t.value === value).map(t => t.date))];
      if (triggerDates.length < 2) continue;
      const onSet = new Set(triggerDates);
      const on = symptoms.filter(s => onSet.has(s.date));
      const off = symptoms.filter(s => !onSet.has(s.date));
      if (!on.length || !off.length) continue;
      const avg = (a: any[]) => a.reduce((x, s) => x + s.severity, 0) / a.length;
      const onAvg = avg(on), offAvg = avg(off);
      results.push({
        category, value,
        on_avg: Math.round(onAvg * 10) / 10,
        off_avg: Math.round(offAvg * 10) / 10,
        days_tracked: triggerDates.length,
        impact: Math.round((onAvg - offAvg) * 10) / 10,
      });
    }
    results.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    return ok(results.slice(0, 10));
  }

  // ── Medications ───────────────────────────────────────────────────────────────
  if (path === '/api/medications') {
    if (M === 'GET') {
      const rows: any[] = await store.all('medications');
      rows.sort((a, b) => (b.active - a.active) || String(a.name).localeCompare(String(b.name)));
      return ok(rows);
    }
    if (M === 'POST') {
      const { name, type, dose, frequency, start_date, notes } = body;
      const id = await store.insert('medications', { name, type, dose: dose || null, frequency: frequency || null, start_date: start_date || null, active: 1, notes: notes || null, created_at: nowStamp() });
      return ok({ id });
    }
  }
  m = path.match(/^\/api\/medications\/(\d+)\/log$/);
  if (m && M === 'POST') {
    const { date, taken, notes } = body;
    const id = await store.insert('medication_logs', { medication_id: +m[1], date, taken: taken ? 1 : 0, notes: notes || null });
    return ok({ id });
  }
  m = path.match(/^\/api\/medications\/(\d+)$/);
  if (m && M === 'PUT') { await store.update('medications', +m[1], { active: body.active ? 1 : 0 }); return ok({ ok: true }); }

  // ── Lab values ────────────────────────────────────────────────────────────────
  if (path === '/api/labs') {
    if (M === 'GET') return ok(byDateDesc(await store.all('lab_values'), 'date'));
    if (M === 'POST') {
      const { date, marker, value, unit, lab, notes } = body;
      const id = await store.insert('lab_values', { date, marker, value, unit, lab: lab || null, notes: notes || null, created_at: nowStamp() });
      return ok({ id });
    }
  }
  m = path.match(/^\/api\/labs\/(\d+)$/);
  if (m && M === 'DELETE') { await store.del('lab_values', +m[1]); return ok({ ok: true }); }

  // ── Flare predictions ──────────────────────────────────────────────────────────
  if (path === '/api/predictions' && M === 'GET') {
    const profile = await getProfile();
    const cycles = byDateDesc(await store.all('cycles'), 'start_date').slice(0, 6) as any[];
    if (cycles.length < 2) return ok({ predictions: [], message: 'Need at least 2 logged cycles for predictions' });
    const symptoms: any[] = await store.all('symptoms');

    const seen = new Set<string>();
    const dayCounts: Record<number, number> = {};
    for (const s of symptoms) {
      if (s.severity < 6) continue;
      for (const c of cycles) {
        if (s.date >= c.start_date && (!c.end_date || s.date <= c.end_date)) {
          const cycleDay = Math.floor(dayDiff(c.start_date, s.date));
          if (cycleDay < 0 || cycleDay > 35) continue;
          const key = `${s.date}|${c.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          dayCounts[cycleDay] = (dayCounts[cycleDay] || 0) + 1;
        }
      }
    }
    const totalCycles = cycles.length;
    const flareDays = Object.entries(dayCounts).filter(([, c]) => (c as number) / totalCycles >= 0.4).map(([d]) => +d);

    const lastCycle = cycles[0];
    const nextCycleStart = lastCycle.end_date ? new Date(lastCycle.end_date) : new Date(lastCycle.start_date);
    if (!lastCycle.end_date) nextCycleStart.setDate(nextCycleStart.getDate() + (profile.cycle_length || 28));

    const predictions = flareDays.map(day => {
      const d = new Date(nextCycleStart); d.setDate(d.getDate() + day);
      return { date: d.toISOString().slice(0, 10), cycle_day: day, confidence: Math.min(Math.round((dayCounts[day] / totalCycles) * 100), 95) };
    }).filter(p => p.date >= today()).slice(0, 7);

    return ok({ predictions, next_cycle_start: nextCycleStart.toISOString().slice(0, 10) });
  }

  // ── Doctor report ────────────────────────────────────────────────────────────
  if (path === '/api/report' && M === 'GET') {
    const days = +(q.get('days') || 90);
    const cutoff = daysAgo(days);
    const profile = await getProfile();
    const symptoms = byDateDesc((await store.all('symptoms')).filter((s: any) => s.date >= cutoff), 'date') as any[];
    const cycles = byDateDesc(await store.all('cycles'), 'start_date').slice(0, 6) as any[];
    const labs = byDateDesc(await store.all('lab_values'), 'date') as any[];
    const meds = (await store.all('medications')).filter((x: any) => x.active) as any[];
    const triggers = (await store.all('triggers')).filter((t: any) => t.date >= cutoff) as any[];

    const freq: Record<string, number> = {}, sev: Record<string, number[]> = {};
    for (const s of symptoms) { freq[s.symptom] = (freq[s.symptom] || 0) + 1; (sev[s.symptom] ||= []).push(s.severity); }
    const top_symptoms = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([symptom, count]) => ({
      symptom, count, avg_severity: Math.round((sev[symptom].reduce((a, b) => a + b, 0) / sev[symptom].length) * 10) / 10,
    }));

    return ok({
      profile, period_days: days, top_symptoms, total_symptom_logs: symptoms.length,
      cycles: cycles.slice(0, 3), labs, active_medications: meds, trigger_count: triggers.length,
      high_severity_days: symptoms.filter(s => s.severity >= 7).length, generated_at: new Date().toISOString(),
    });
  }

  // ── Dashboard stats ────────────────────────────────────────────────────────────
  if (path === '/api/stats' && M === 'GET') {
    const profile = await getProfile();
    const symptoms: any[] = await store.all('symptoms');
    const groupByDate = (cutoff: string) => {
      const map: Record<string, { sum: number; count: number }> = {};
      for (const s of symptoms) if (s.date >= cutoff) { (map[s.date] ||= { sum: 0, count: 0 }); map[s.date].sum += s.severity; map[s.date].count++; }
      return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({ date, avg_severity: v.sum / v.count, count: v.count }));
    };
    const last30src = symptoms.filter(s => s.date >= daysAgo(30));
    const mfreq: Record<string, { count: number; sum: number; condition: string }> = {};
    for (const s of last30src) { (mfreq[s.symptom] ||= { count: 0, sum: 0, condition: s.condition }); mfreq[s.symptom].count++; mfreq[s.symptom].sum += s.severity; }
    const most_common_symptoms = Object.entries(mfreq).sort((a, b) => b[1].count - a[1].count).slice(0, 5)
      .map(([symptom, v]) => ({ symptom, condition: v.condition, count: v.count, avg_sev: v.sum / v.count }));

    const lastCycle = byDateDesc(await store.all('cycles'), 'start_date')[0] || null;
    return ok({
      last7: groupByDate(daysAgo(7)), last30: groupByDate(daysAgo(30)), most_common_symptoms,
      last_cycle: lastCycle, today_symptoms: symptoms.filter(s => s.date === today()), profile,
    });
  }

  // ── Data management ──────────────────────────────────────────────────────────
  m = path.match(/^\/api\/data\/([a-z]+)$/);
  if (m && M === 'DELETE') {
    const allowed: Record<string, string> = { symptoms: 'symptoms', cycles: 'cycles', triggers: 'triggers', labs: 'lab_values', medications: 'medications' };
    const coll = allowed[m[1]];
    if (!coll) return err(400, 'Unknown table');
    if (coll === 'medications') await store.clear('medication_logs');
    await store.clear(coll);
    return ok({ ok: true });
  }
  if (path === '/api/data/all/confirm' && M === 'DELETE') {
    for (const c of ['symptoms', 'cycles', 'triggers', 'lab_values', 'medications', 'medication_logs', 'community_posts', 'community_comments']) await store.clear(c);
    await store.save('profile', { id: 1, name: '', conditions: [], cycle_length: 28, period_length: 5, created_at: nowStamp() });
    return ok({ ok: true });
  }

  // ── AI (all local, zero-cost) ────────────────────────────────────────────────
  if (path.startsWith('/api/ai/') && M === 'POST') return handleAi(path, body);

  // ── Community (local fallback when no shared backend is configured) ───────────
  if (path.startsWith('/api/community/')) return handleCommunity(M, path, body);

  return err(404, `No local handler for ${method} ${path}`);
}

// ── AI handlers ────────────────────────────────────────────────────────────────
async function handleAi(path: string, body: Json): Promise<Result> {
  const profile = await getProfile();
  const conditions: string[] = Array.isArray(profile.conditions) ? profile.conditions : [];

  if (path === '/api/ai/chat') {
    if (!body?.message?.trim()) return err(400, 'No message.');
    const symptoms = byDateDesc(await store.all('symptoms'), 'date').slice(0, 15) as any[];
    const cycles = byDateDesc(await store.all('cycles'), 'start_date').slice(0, 3) as any[];
    const meds = (await store.all('medications')).filter((x: any) => x.active) as any[];
    const triggers = byDateDesc(await store.all('triggers'), 'date').slice(0, 10) as any[];
    const reply = insights.chat(body.message, {
      conditions, cycleLength: profile.cycle_length, periodLength: profile.period_length,
      symptoms, meds, triggers, lastPeriod: cycles.length ? cycles[0].start_date : null,
    });
    return ok({ reply });
  }

  if (path === '/api/ai/analyze') {
    const symptoms = (await store.all('symptoms')).filter((s: any) => s.date >= daysAgo(90))
      .sort((a: any, b: any) => String(a.date).localeCompare(String(b.date))) as any[];
    const cycles = byDateDesc(await store.all('cycles'), 'start_date').slice(0, 8) as any[];
    const triggers = (await store.all('triggers')).filter((t: any) => t.date >= daysAgo(90)) as any[];
    const labs = byDateDesc(await store.all('lab_values'), 'date').slice(0, 20) as any[];
    const meds = (await store.all('medications')).filter((x: any) => x.active) as any[];
    if (symptoms.length < 3 && cycles.length < 1) return err(400, 'Not enough data yet. Log at least a few symptoms or periods first.');

    const freq: Record<string, number> = {}, sev: Record<string, number[]> = {};
    for (const s of symptoms) { freq[s.symptom] = (freq[s.symptom] || 0) + 1; (sev[s.symptom] ||= []).push(s.severity); }
    const top_symptoms = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([symptom, count]) => ({
      symptom, count,
      avg_severity: Math.round(sev[symptom].reduce((a, b) => a + b, 0) / sev[symptom].length * 10) / 10,
      max_severity: Math.max(...sev[symptom]),
    }));
    const third = Math.floor(symptoms.length / 3);
    const oldAvg = third ? symptoms.slice(0, third).reduce((a, s) => a + s.severity, 0) / third : null;
    const newAvg = third ? symptoms.slice(-third).reduce((a, s) => a + s.severity, 0) / third : null;
    const trigFreq: Record<string, number> = {};
    for (const t of triggers) { const k = `${t.category}: ${t.value}`; trigFreq[k] = (trigFreq[k] || 0) + 1; }
    const top_triggers = Object.entries(trigFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, c]) => ({ trigger: k, count: c }));
    const cycleLengths: number[] = [];
    for (let i = 0; i < cycles.length - 1; i++) { const d = dayDiff(cycles[i + 1].start_date, cycles[i].start_date); if (d > 0 && d < 60) cycleLengths.push(d); }
    const avgCycleLen = cycleLengths.length ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : null;

    const healthData = {
      conditions, cycle_length_preference: profile.cycle_length, period_length_preference: profile.period_length,
      data_period_days: 90, total_symptom_logs: symptoms.length,
      severity_trend: oldAvg && newAvg ? { older_avg: Math.round(oldAvg * 10) / 10, recent_avg: Math.round(newAvg * 10) / 10 } : null,
      top_symptoms, cycles_logged: cycles.length, avg_cycle_length_observed: avgCycleLen,
      period_durations: cycles.filter(c => c.end_date).map(c => ({ start: c.start_date, duration_days: dayDiff(c.start_date, c.end_date) + 1, notes: c.notes })),
      top_triggers, lab_results: labs.map(l => ({ marker: l.marker, value: l.value, unit: l.unit, date: l.date })),
      active_medications: meds.map(mm => ({ name: mm.name, type: mm.type, dose: mm.dose, frequency: mm.frequency })),
    };
    return ok({ analysis: insights.analyze(healthData), data_points: symptoms.length, cycles_analyzed: cycles.length, generated_at: new Date().toISOString() });
  }

  if (path === '/api/ai/fertility') {
    const cycles = byDateDesc(await store.all('cycles'), 'start_date').slice(0, 12) as any[];
    const fertMarkers = ['AMH', 'FSH', 'LH', 'Estradiol (E2)', 'Progesterone', 'Testosterone (total)', 'Fasting insulin', 'DHEA-S'];
    const labs = byDateDesc((await store.all('lab_values')).filter((l: any) => fertMarkers.includes(l.marker)), 'date').slice(0, 16) as any[];
    const symptoms = byDateDesc(await store.all('symptoms'), 'date').slice(0, 30) as any[];
    const meds = (await store.all('medications')).filter((x: any) => x.active) as any[];
    const cycleLengths: number[] = [];
    for (let i = 0; i < cycles.length - 1; i++) { const d = dayDiff(cycles[i + 1].start_date, cycles[i].start_date); if (d > 10 && d < 90) cycleLengths.push(d); }
    const avgCycle = cycleLengths.length ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : (profile.cycle_length || 28);
    const variation = cycleLengths.length > 1 ? Math.max(...cycleLengths) - Math.min(...cycleLengths) : null;
    const data = {
      conditions, cycles_logged: cycles.length, avg_cycle_length: avgCycle, cycle_variation_days: variation,
      cycle_regularity: variation == null ? 'unknown' : variation <= 3 ? 'regular' : variation <= 7 ? 'slightly_irregular' : 'irregular',
      profile_cycle_length: profile.cycle_length, profile_period_length: profile.period_length,
      last_period: cycles[0]?.start_date || null,
      relevant_labs: labs.map(l => ({ marker: l.marker, value: l.value, unit: l.unit, date: l.date })),
      active_medications: meds.map(mm => mm.name), recent_symptoms: symptoms.slice(0, 15).map(s => `${s.symptom} (${s.severity}/10)`),
    };
    return ok({ analysis: insights.fertility(data), data_summary: { avg_cycle: avgCycle, variation, cycles_logged: cycles.length }, generated_at: new Date().toISOString() });
  }

  if (path === '/api/ai/analyze-labs') {
    const labs = [...(await store.all('lab_values')) as any[]].sort((a, b) => String(a.marker).localeCompare(String(b.marker)) || String(b.date).localeCompare(String(a.date)));
    if (!labs.length) return err(400, 'No lab results logged yet.');
    const grouped: Record<string, any[]> = {};
    for (const l of labs) (grouped[l.marker] ||= []).push({ value: l.value, unit: l.unit, date: l.date, notes: l.notes || undefined });
    return ok({ analysis: insights.analyzeLabs(grouped, conditions), generated_at: new Date().toISOString() });
  }

  if (path === '/api/ai/menopause') {
    const menoMarkers = ['FSH', 'Estradiol (E2)', 'Progesterone', 'AMH', 'LH', 'Testosterone (total)', 'TSH'];
    const labs = byDateDesc((await store.all('lab_values')).filter((l: any) => menoMarkers.includes(l.marker)), 'date').slice(0, 14) as any[];
    const meds = (await store.all('medications')).filter((x: any) => x.active) as any[];
    const data = {
      stage: body?.stage || 'unknown', reported_symptoms: body?.symptoms || [], last_period_date: body?.last_period || null,
      conditions, active_medications: meds.map(mm => ({ name: mm.name, type: mm.type })),
      relevant_labs: labs.map(l => ({ marker: l.marker, value: l.value, unit: l.unit, date: l.date })),
    };
    return ok({ analysis: insights.menopause(data), generated_at: new Date().toISOString() });
  }

  return err(404, `No AI handler for ${path}`);
}

// ── Community handlers (local fallback) ──────────────────────────────────────────
async function handleCommunity(M: string, path: string, body: Json): Promise<Result> {
  if (path === '/api/community/posts') {
    if (M === 'GET') {
      const url = new URL(path, 'http://local');
      const category = url.searchParams.get('category');
      let posts: any[] = await store.all('community_posts');
      if (category) posts = posts.filter(p => p.category === category);
      const comments: any[] = await store.all('community_comments');
      const withCounts = posts.map(p => ({ ...p, comment_count: comments.filter(c => c.post_id === p.id).length }));
      withCounts.sort((a, b) => b.id - a.id);
      return ok(withCounts.slice(0, 60));
    }
    if (M === 'POST') {
      const { category, anon_name, anon_color, title, content } = body || {};
      if (!category || !anon_name || !title?.trim() || !content?.trim()) return err(400, 'Missing fields');
      if (title.length > 200 || content.length > 2000) return err(400, 'Too long');
      if (screenText(title) || screenText(content)) return err(422, 'Content violates the community guidelines');
      const id = await store.insert('community_posts', { category, anon_name, anon_color: anon_color || '#C83F6E', title: title.trim(), content: content.trim(), likes: 0, created_at: nowStamp() });
      return ok({ id });
    }
  }
  let m = path.match(/^\/api\/community\/posts\/(\d+)$/);
  if (m) {
    const id = +m[1];
    if (M === 'GET') {
      const post = (await store.all('community_posts') as any[]).find(p => p.id === id);
      if (!post) return err(404, 'Not found');
      const comments = (await store.all('community_comments') as any[]).filter(c => c.post_id === id).sort((a, b) => a.id - b.id);
      return ok({ ...post, comments });
    }
    if (M === 'DELETE') {
      const comments = (await store.all('community_comments') as any[]).filter(c => c.post_id !== id);
      await store.save('community_comments', comments);
      await store.del('community_posts', id);
      return ok({ ok: true });
    }
  }
  m = path.match(/^\/api\/community\/posts\/(\d+)\/comments$/);
  if (m && M === 'POST') {
    const { anon_name, anon_color, content } = body || {};
    if (!anon_name || !content?.trim()) return err(400, 'Missing fields');
    if (content.length > 1000) return err(400, 'Too long');
    if (screenText(content)) return err(422, 'Content violates the community guidelines');
    const id = await store.insert('community_comments', { post_id: +m[1], anon_name, anon_color: anon_color || '#C83F6E', content: content.trim(), created_at: nowStamp() });
    return ok({ id });
  }
  m = path.match(/^\/api\/community\/posts\/(\d+)\/like$/);
  if (m && M === 'POST') {
    const id = +m[1];
    const posts = await store.all('community_posts') as any[];
    const p = posts.find(x => x.id === id);
    if (p) { p.likes = (p.likes || 0) + 1; await store.save('community_posts', posts); }
    return ok({ likes: p?.likes ?? 0 });
  }
  m = path.match(/^\/api\/community\/comments\/(\d+)$/);
  if (m && M === 'DELETE') { await store.del('community_comments', +m[1]); return ok({ ok: true }); }

  // Moderation report (recorded locally when there is no shared backend).
  m = path.match(/^\/api\/community\/(posts|comments)\/(\d+)\/report$/);
  if (m && M === 'POST') {
    await store.insert('community_reports', { target_type: m[1] === 'posts' ? 'post' : 'comment', target_id: +m[2], reason: (body?.reason || '').slice(0, 300), reporter: (body?.reporter || '').slice(0, 80), created_at: nowStamp(), resolved: 0 });
    return ok({ ok: true });
  }

  return err(404, `No community handler for ${M} ${path}`);
}
