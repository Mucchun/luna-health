import { chromium } from '/Users/serramac/argus/node_modules/playwright/index.mjs';
const DIR = process.env.DIR;
const APP = 'http://localhost:5199';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: DIR + '/raw', size: { width: 1600, height: 900 } } });
// Tap indicator inside the app frame.
await ctx.addInitScript(() => {
  if (window.top === window) return;
  addEventListener('pointerdown', e => {
    const d = document.createElement('div');
    d.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;background:rgba(200,63,110,.28);border:2px solid rgba(200,63,110,.55);z-index:99999;pointer-events:none;transition:transform .45s ease,opacity .45s ease;`;
    document.documentElement.appendChild(d);
    requestAnimationFrame(() => { d.style.transform = 'scale(1.7)'; d.style.opacity = '0'; });
    setTimeout(() => d.remove(), 500);
  }, true);
});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
const t0 = Date.now();
await page.goto('file://' + DIR + '/stage.html');
const setSrc = (u) => page.evaluate((u) => { document.getElementById('app').src = u; }, u);
const frame = () => page.frames().find(f => f.url().startsWith(APP));
const f = page.frameLocator('#app');
const wait = (ms) => page.waitForTimeout(ms);
const caption = (a, b, c) => page.evaluate(([a, b, c]) => window.caption(a, b, c), [a, b, c]);
const scroll = async (top, ms = 1400) => { await frame().evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), top); await wait(ms); };

// ── Seed realistic demo data (stored only in this throwaway browser) ─────────
await setSrc(APP + '/'); await wait(1200);
await frame().evaluate(async () => {
  localStorage.setItem('luna_disclaimer_v1', '1'); localStorage.setItem('luna_guidelines_v1', '1'); localStorage.setItem('luna_lang', 'en');
  const send = (u, b, m = 'POST') => fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  const iso = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  await send('/api/profile', { name: 'Maya', conditions: ['PCOS', 'Endometriosis'], cycle_length: 29, period_length: 5 }, 'PUT');
  const starts = [125, 96, 67, 38, 9];
  for (const n of starts) await send('/api/cycles', { start_date: iso(n), end_date: iso(n - 4) });
  // Symptoms follow the cycle: cramps and pelvic pain around the period, bloating and
  // fatigue in the late luteal phase, quieter mid-cycle.
  const byDay = { 0: [['Pelvic cramping', 8], ['Fatigue', 6]], 1: [['Deep pelvic pain', 8], ['Lower back pain', 6]], 2: [['Pelvic cramping', 6]], 3: [['Fatigue', 4]],
    8: [['Headache', 3]], 13: [['Bloating', 3]], 16: [['Acne / skin breakouts', 4]], 20: [['Fatigue', 5]], 23: [['Bloating', 6], ['Mood swings', 6]],
    25: [['Bloating', 7], ['Fatigue', 6]], 26: [['Mood swings', 7], ['Headache', 5]], 27: [['Pelvic cramping', 6]] };
  for (const s of starts) for (const [day, list] of Object.entries(byDay)) {
    const ago = s - +day; if (ago < 1) continue;
    for (const [symptom, severity] of list) await send('/api/symptoms', { date: iso(ago), condition: /pelvic pain|back/.test(symptom) ? 'Endometriosis' : 'PCOS', symptom, severity, body_location: /pelvic|cramp/i.test(symptom) ? 'Lower abdomen / pelvis' : /back/i.test(symptom) ? 'Lower back' : '' });
  }
  for (const [n, c, v] of [[2, 'Food', 'Dairy'], [4, 'Stress', 'Work deadline'], [12, 'Sleep', 'Under 6 hours'], [13, 'Food', 'Sugar'], [38, 'Stress', 'Work deadline'], [40, 'Food', 'Dairy']]) await send('/api/triggers', { date: iso(n), category: c, value: v });
  const m1 = await (await send('/api/medications', { name: 'Metformin', type: 'Medication', dose: '500 mg', frequency: 'Twice daily', start_date: iso(120) })).json();
  const m2 = await (await send('/api/medications', { name: 'Myo-inositol', type: 'Supplement', dose: '2 g', frequency: 'Daily', start_date: iso(90) })).json();
  for (let i = 1; i < 14; i++) { await send(`/api/medications/${m1.id}/log`, { date: iso(i), taken: i !== 6 }); await send(`/api/medications/${m2.id}/log`, { date: iso(i), taken: true }); }
  for (const [n, marker, value, unit] of [[100, 'Vitamin D', '21', 'ng/mL'], [20, 'Vitamin D', '34', 'ng/mL'], [20, 'Testosterone (total)', '58', 'ng/dL'], [20, 'Fasting insulin', '14', 'µIU/mL']]) await send('/api/labs', { date: iso(n), marker, value, unit, lab: 'City Lab' });
});
await setSrc('about:blank'); await wait(200);

// ── Scenes ───────────────────────────────────────────────────────────────────
const marks = [];
const scene = async (step, title, sub) => { marks.push([((Date.now() - t0) / 1000).toFixed(1), title]); await caption(step, title, sub); };

await scene('Women’s health tracker', 'Your cycle at a glance', 'Current phase, next period and how the last month has felt, on one screen.');
await setSrc(APP + '/'); await wait(3200);
await scroll(430, 2200); await scroll(900, 2400); await scroll(0, 1600);

await scene('Logging', 'Log how you feel in seconds', 'Pick several symptoms at once, rate the severity with one tap, and save.');
await f.locator('.luna-tab-log').click(); await wait(1300);
await f.getByRole('button', { name: 'Bloating', exact: true }).click(); await wait(600);
await f.getByRole('button', { name: 'Fatigue', exact: true }).click(); await wait(600);
await f.getByPlaceholder('Search or add a symptom…').pressSequentially('Jaw pain', { delay: 70 }); await wait(500);
await f.getByRole('button', { name: /Add/ }).click(); await wait(700);
await scroll(520, 1300);
await f.getByRole('radio', { name: '7', exact: true }).click(); await wait(900);
await f.getByRole('button', { name: 'Lower abdomen / pelvis' }).click(); await wait(800);
await f.getByRole('button', { name: /Save 3 symptoms/ }).click(); await wait(2300);
await f.getByRole('button', { name: 'Done', exact: true }).click(); await wait(2200);

await scene('Cycle', 'Periods, tracked and predicted', 'Tap a day to log a period. Luna predicts the next one from your own history.');
await f.locator('.luna-tabbar').getByText('Cycle').click(); await wait(2600);
await scroll(380, 2000); await scroll(0, 1000);

await scene('Patterns', 'See what your body is telling you', 'Which symptoms come up most, on which days, and where it hurts.');
await f.locator('.luna-tabbar').getByText('More').click(); await wait(1500);
await f.locator('.luna-sheet').getByText('Patterns').click(); await wait(2400);
await scroll(420, 2200); await scroll(0, 900);

await scene('Insights', 'Analysis that never leaves your phone', 'Insights are generated on the device. No account, no cloud AI, no health data uploaded.');
await f.locator('.luna-tabbar').getByText('Insights').click(); await wait(1600);
await f.getByRole('button', { name: /Analyse my health/ }).first().click(); await wait(3200);
await scroll(380, 2300); await scroll(820, 2400); await scroll(0, 900);

await scene('Community', 'Anonymous support, shared across devices', 'Ask, vent or share what worked. Only what you choose to post is ever sent.');
await f.locator('.luna-tabbar').getByText('More').click(); await wait(1400);
await f.locator('.luna-sheet').getByText('Community').click(); await wait(3200);
const post = f.getByText('Inositol — did it help anyone?');
if (await post.count()) { await post.first().click(); await wait(3200); }

await scene('Doctor report', 'A summary to bring to your appointment', 'Symptoms, cycles, medications and labs in one printable page.');
await f.locator('.luna-tabbar').getByText('More').click(); await wait(1400);
await f.locator('.luna-sheet').getByText('Report').click(); await wait(2400);
await scroll(450, 2300); await scroll(950, 2300);

await scene('Luna Health', 'Built for PCOS, endometriosis and PMDD', 'Private, on-device health tracking for iPhone and Mac, in seven languages.');
await f.locator('.luna-tabbar').getByText('Home').click(); await wait(4200);

const total = ((Date.now() - t0) / 1000).toFixed(1);
const video = page.video();
await ctx.close(); await browser.close();
console.log(JSON.stringify({ marks, total, path: await video.path() }));
