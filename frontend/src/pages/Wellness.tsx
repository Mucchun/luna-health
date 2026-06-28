import { useEffect, useState } from 'react';

type ConditionKey = 'PCOS' | 'Endometriosis' | 'PMDD';

interface Content {
  color: string;
  bg: string;
  tagline: string;
  eat: { category: string; items: string[] }[];
  avoid: string[];
  supplements: { name: string; dose: string; note: string }[];
  tips: { title: string; body: string }[];
  meals: { meal: string; ideas: string[] }[];
}

const DATA: Record<ConditionKey, Content> = {
  PCOS: {
    color: '#C83F6E',
    bg: 'var(--accent-light)',
    tagline: 'PCOS management centres on insulin sensitivity and androgen reduction. A low-glycaemic, anti-inflammatory diet is the most evidence-backed intervention alongside exercise.',
    eat: [
      { category: 'Low-GI grains', items: ['Oats', 'Quinoa', 'Brown rice', 'Lentils', 'Chickpeas', 'Sweet potato'] },
      { category: 'Anti-inflammatory', items: ['Wild salmon', 'Sardines', 'Berries', 'Turmeric', 'Ginger', 'Leafy greens'] },
      { category: 'Healthy fats', items: ['Avocado', 'Walnuts', 'Olive oil', 'Chia seeds', 'Flaxseed', 'Almonds'] },
      { category: 'Lean protein', items: ['Eggs', 'Chicken', 'Greek yogurt', 'Tofu', 'Tempeh', 'Turkey'] },
    ],
    avoid: ['Refined carbs (white bread, white pasta)', 'Sugary drinks & juices', 'Processed & packaged snacks', 'Trans fats & seed oils', 'Excess dairy (can worsen acne)', 'Alcohol'],
    supplements: [
      { name: 'Myo-inositol', dose: '2–4 g/day', note: 'Improves ovulation & insulin sensitivity — most studied supplement for PCOS' },
      { name: 'Vitamin D', dose: '2,000–4,000 IU/day', note: 'Deficient in 67–85% of PCOS cases; restoring levels improves cycles' },
      { name: 'Magnesium', dose: '200–400 mg/day', note: 'Reduces insulin resistance, supports sleep & reduces anxiety' },
      { name: 'Omega-3', dose: '1–2 g EPA+DHA/day', note: 'Lowers triglycerides, reduces androgens, anti-inflammatory' },
      { name: 'NAC (N-acetyl cysteine)', dose: '600 mg × 3/day', note: 'Clinical trials show reduction in testosterone & improved fertility markers' },
      { name: 'Zinc', dose: '25–30 mg/day', note: 'May reduce hair loss, hormonal acne, and hirsutism' },
    ],
    tips: [
      { title: 'Protein at every meal', body: 'Slows glucose absorption and reduces insulin spikes. Aim for 25–30g per meal — eggs, chicken, Greek yogurt, legumes.' },
      { title: 'Never skip breakfast', body: 'Eating within 1 hour of waking regulates cortisol and blood sugar for the whole day. A protein-first breakfast is ideal.' },
      { title: 'Walk after meals', body: '10 minutes of gentle movement after eating significantly improves insulin sensitivity and glucose uptake into muscles.' },
      { title: 'Try spearmint tea', body: '2 cups per day has been shown in RCTs to lower free testosterone levels. A simple, inexpensive add-on to any regimen.' },
      { title: 'Prioritise sleep', body: 'Even one night of poor sleep worsens insulin resistance. 7–9 hours is non-negotiable for PCOS management.' },
      { title: 'Manage stress', body: 'Chronically elevated cortisol directly worsens insulin resistance. Yoga, walking, breathwork, and nature all help.' },
    ],
    meals: [
      { meal: 'Breakfast', ideas: ['Oat porridge with berries, chia seeds & cinnamon', 'Scrambled eggs on sourdough with avocado & spinach', 'Greek yogurt with walnuts, mixed seeds & a handful of blueberries'] },
      { meal: 'Lunch', ideas: ['Salmon & quinoa salad with leafy greens, cucumber & lemon dressing', 'Lentil & vegetable soup with rye bread', 'Chicken stir-fry with brown rice, broccoli & ginger-soy sauce'] },
      { meal: 'Dinner', ideas: ['Baked salmon with roasted sweet potato & steamed green veg', 'Turkey meatballs with courgette noodles & tomato & basil sauce', 'Chickpea & spinach curry with cauliflower rice'] },
      { meal: 'Snacks', ideas: ['Small handful of walnuts + an apple or pear', 'Hummus with cucumber & carrot sticks', 'Apple with a tablespoon of almond butter'] },
    ],
  },
  Endometriosis: {
    color: '#7B52B8',
    bg: 'var(--purple-light)',
    tagline: 'Endometriosis is driven by inflammation and oestrogen dominance. An anti-inflammatory diet that reduces oestrogen load and supports progesterone is the most impactful dietary intervention.',
    eat: [
      { category: 'Omega-3 rich', items: ['Wild salmon', 'Sardines', 'Mackerel', 'Anchovies', 'Walnuts', 'Flaxseed'] },
      { category: 'High-fibre', items: ['Cruciferous veg', 'Legumes', 'Whole grains', 'Ground flaxseed', 'Leafy greens', 'Berries'] },
      { category: 'Anti-inflammatory', items: ['Turmeric (+ black pepper)', 'Ginger', 'Garlic', 'Dark chocolate 70%+', 'Green tea', 'Olive oil'] },
      { category: 'Phytoestrogen-balancing', items: ['Fermented soy (tempeh, miso)', 'Broccoli sprouts', 'Flaxseed', 'Sesame seeds'] },
    ],
    avoid: ['Red & processed meat', 'Alcohol (even small amounts)', 'Trans fats & fried food', 'Excess caffeine', 'Gluten (try a 30-day elimination)', 'Conventional dairy (inflammatory for many)'],
    supplements: [
      { name: 'Omega-3', dose: '2–4 g EPA+DHA/day', note: 'Reduces prostaglandins that drive cramping & inflammation' },
      { name: 'Vitamin D', dose: '2,000–5,000 IU/day', note: 'Anti-inflammatory; lower levels correlate with worse endo severity' },
      { name: 'Magnesium', dose: '300–400 mg/day', note: 'Reduces muscle cramping, chronic pelvic pain & supports sleep' },
      { name: 'NAC (N-acetyl cysteine)', dose: '600 mg × 3/day', note: 'Clinical trials show reduction in cyst size; anti-proliferative effect' },
      { name: 'Vitamins E + C', dose: '1,200 IU + 1,000 mg/day', note: 'Combination shown to reduce chronic pelvic pain in RCT' },
      { name: 'Melatonin', dose: '10 mg at night', note: 'Strong anti-inflammatory; clinical study data specifically for endo pain reduction' },
    ],
    tips: [
      { title: 'Try a 30-day elimination', body: 'Removing gluten and dairy for 30 days reduces pain for ~70% of endo patients in observational studies. Reintroduce one at a time to identify which matters.' },
      { title: 'Eat more fibre daily', body: 'Fibre binds excess oestrogen in the gut and removes it before reabsorption. Aim for 25–35g/day from whole foods.' },
      { title: 'Turmeric with every meal', body: 'Curcumin in turmeric inhibits NF-κB, a key inflammatory pathway in endometriosis. Always pair with black pepper (piperine) to increase absorption 2000%.' },
      { title: 'Time your NSAIDs right', body: 'Taking ibuprofen 12–24 hours before your period starts (before pain peaks) is far more effective than taking it reactively.' },
      { title: 'Heat therapy', body: 'A heat pad on your abdomen or lower back relaxes muscles as effectively as OTC pain medication for many women. Use it freely.' },
      { title: 'Limit alcohol completely', body: 'Alcohol raises oestrogen by up to 10% and is directly pro-inflammatory. Even 1 drink in the luteal phase can worsen symptoms measurably.' },
    ],
    meals: [
      { meal: 'Breakfast', ideas: ['Smoked salmon & eggs on rye bread with wilted spinach', 'Chia pudding with almond milk, flaxseed & berries', 'Avocado & poached eggs with turmeric on grain-free toast'] },
      { meal: 'Lunch', ideas: ['Sardine & rocket salad with olive oil, capers & lemon', 'Turmeric lentil soup with leafy greens & rye bread', 'Grilled chicken with roasted cruciferous veg & tahini drizzle'] },
      { meal: 'Dinner', ideas: ['Wild salmon with asparagus, quinoa & lemon', 'Baked mackerel with steamed greens & sweet potato mash', 'Turmeric & ginger chicken thighs with cauliflower rice & broccoli'] },
      { meal: 'Snacks', ideas: ['A small square of 85% dark chocolate + walnuts', 'Blueberries with coconut yogurt & seeds', 'Celery with almond butter & a sprinkle of cinnamon'] },
    ],
  },
  PMDD: {
    color: '#A85A20',
    bg: 'var(--amber-light)',
    tagline: 'PMDD is caused by heightened serotonin sensitivity in the luteal phase. Nutrition can stabilise mood and reduce physical symptoms by supporting neurotransmitter production and avoiding blood sugar crashes.',
    eat: [
      { category: 'Complex carbs (luteal phase)', items: ['Oats', 'Brown rice', 'Sweet potato', 'Whole grain pasta', 'Quinoa', 'Rye bread'] },
      { category: 'Calcium-rich', items: ['Dairy or fortified alternatives', 'Leafy greens', 'Almonds', 'Sesame seeds', 'Tinned sardines (with bones)'] },
      { category: 'Magnesium-rich', items: ['Dark chocolate 70%+', 'Pumpkin seeds', 'Spinach', 'Almonds', 'Black beans', 'Avocado'] },
      { category: 'B6-rich (serotonin co-factor)', items: ['Chicken', 'Banana', 'Potatoes', 'Tuna', 'Sunflower seeds', 'Pistachio nuts'] },
    ],
    avoid: ['Alcohol (dramatically worsens PMDD)', 'Caffeine especially in luteal phase', 'Excess salt (causes bloating & water retention)', 'Refined sugar spikes', 'Skipping meals', 'Fast food & processed snacks'],
    supplements: [
      { name: 'Calcium carbonate', dose: '1,200 mg/day', note: 'Strongest evidence base for PMDD — RCT shows 48% reduction in symptoms' },
      { name: 'Magnesium glycinate', dose: '200–400 mg/day', note: 'Reduces anxiety, mood swings, bloating & sleep disruption in luteal phase' },
      { name: 'Vitamin B6', dose: '50–100 mg/day', note: 'Rate-limiting co-factor for serotonin & dopamine synthesis' },
      { name: 'Vitamin D', dose: '2,000–4,000 IU/day', note: 'Deficiency independently linked to worse PMDD severity' },
      { name: 'Agnus castus (Vitex)', dose: '20–40 mg/day', note: 'Reduces prolactin & supports progesterone; evidence for mood & breast tenderness' },
      { name: 'Omega-3', dose: '1–2 g EPA/day', note: 'Reduces neuroinflammation; multiple studies show mood benefit' },
    ],
    tips: [
      { title: 'Track your luteal phase', body: 'PMDD symptoms begin ~14 days before your period. Knowing this window lets you prepare your nutrition, reduce commitments, and communicate your needs.' },
      { title: 'Front-load complex carbs at lunch', body: 'Complex carbs boost tryptophan transport into the brain, which converts to serotonin. Eating them at lunch — when serotonin demand peaks — is most effective.' },
      { title: 'Cut alcohol completely in luteal phase', body: 'Alcohol is a serotonin and GABA disruptor. It dramatically worsens PMDD anxiety, mood instability and sleep even in small amounts.' },
      { title: 'Eat every 3–4 hours', body: 'Blood sugar crashes directly worsen PMDD irritability and anxiety. Small, frequent balanced meals stabilise mood more reliably than any supplement.' },
      { title: 'Exercise gently in luteal phase', body: 'High-intensity exercise can worsen PMDD for some. Swimming, yoga, walking and cycling are ideal — they boost serotonin without spiking cortisol excessively.' },
      { title: 'Rest is treatment', body: 'Cortisol competes with progesterone at the receptor level. Prioritising rest and reducing commitments in your luteal phase is evidence-based self-care, not weakness.' },
    ],
    meals: [
      { meal: 'Breakfast', ideas: ['Banana & almond butter oat porridge with pumpkin seeds', 'Eggs with sautéed spinach & mushrooms on whole grain toast', 'Smoothie: frozen berries, banana, almond milk, sunflower seeds & a scoop of protein'] },
      { meal: 'Lunch', ideas: ['Chicken & sweet potato power bowl with leafy greens & tahini', 'Tuna & quinoa salad with avocado, cucumber & lemon', 'Lentil soup with whole grain bread & a side salad'] },
      { meal: 'Dinner', ideas: ['Salmon fillet with brown rice, roasted broccoli & edamame', 'Turkey & vegetable stir-fry with soba noodles', 'Bean & root vegetable stew with whole grain bread'] },
      { meal: 'Snacks', ideas: ['Banana + handful of almonds or pistachios', 'A square of dark chocolate (70%+) with pumpkin seeds', 'Cottage cheese with berries & a drizzle of honey'] },
    ],
  },
};

const GENERAL: Content = {
  color: '#2D7A56',
  bg: 'var(--sage-light)',
  tagline: 'These evidence-backed habits benefit anyone with a hormonal condition — regardless of specific diagnosis.',
  eat: [
    { category: 'Foundation foods', items: ['Variety of colourful vegetables', 'Whole fruits (not juice)', 'Whole grains & legumes', 'Fatty fish 2–3×/week', 'Fermented foods (kefir, kimchi, yogurt)'] },
  ],
  avoid: ['Ultra-processed foods', 'Excess alcohol', 'High-fructose corn syrup', 'Trans fats', 'Excess refined sugar'],
  supplements: [
    { name: 'Vitamin D', dose: '2,000–4,000 IU/day', note: 'Most people with hormonal conditions are deficient' },
    { name: 'Magnesium', dose: '200–400 mg/day', note: 'Essential co-factor depleted by stress and poor diet' },
    { name: 'Omega-3', dose: '1–2 g EPA+DHA/day', note: 'Broad anti-inflammatory benefit' },
  ],
  tips: [
    { title: 'Eat the rainbow', body: 'Each colour of vegetable provides different phytochemicals with unique anti-inflammatory and hormone-balancing effects. Aim for 5+ colours per day.' },
    { title: 'Prioritise sleep', body: 'Hormonal rhythms are tied to circadian rhythm. Poor sleep disrupts cortisol, insulin, and reproductive hormones all at once.' },
    { title: 'Move your body daily', body: 'Even 20–30 minutes of walking reduces inflammation markers and improves insulin sensitivity significantly.' },
    { title: 'Manage stress actively', body: 'Cortisol imbalance underpins most hormonal conditions. Identify your de-stress tools and use them daily, not just when things feel bad.' },
  ],
  meals: [],
};

export default function Wellness() {
  const [conditions, setConditions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('General');

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(p => {
      setConditions(p.conditions || []);
      if (p.conditions?.length) setSelected(p.conditions[0]);
    });
  }, []);

  const tabs = [...conditions, 'General'];
  const key = selected as ConditionKey;
  const d: Content = DATA[key] || GENERAL;

  const sectionLbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 };
  const card: React.CSSProperties = { background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 22px' };

  return (
    <div style={{ maxWidth: 720, padding: '28px 24px', margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Wellness & Nutrition</h1>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Evidence-based dietary guidance for your conditions</p>
      </div>

      {/* Condition tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const c = DATA[t as ConditionKey]?.color || '#2D7A56';
          const active = selected === t;
          return (
            <button key={t} onClick={() => setSelected(t)} style={{
              padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer',
              border: `1.5px solid ${active ? c : 'var(--border)'}`,
              background: active ? d.bg : '#fff',
              color: active ? c : 'var(--text-2)', transition: 'all 0.1s',
            }}>{t}</button>
          );
        })}
      </div>

      {/* Tagline */}
      <div style={{ background: d.bg, border: `1px solid ${d.color}22`, borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65 }}>{d.tagline}</p>
      </div>

      {/* Eat & Avoid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={card}>
          <p style={sectionLbl}>Eat more of</p>
          {d.eat.map(g => (
            <div key={g.category} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--sage)', marginBottom: 6, letterSpacing: '0.3px' }}>{g.category}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {g.items.map(item => (
                  <span key={item} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'var(--sage-light)', color: 'var(--sage)', fontWeight: 500 }}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={card}>
          <p style={sectionLbl}>Limit or avoid</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.avoid.map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, flexShrink: 0, marginTop: 5 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supplements */}
      <div style={{ ...card, marginBottom: 14 }}>
        <p style={sectionLbl}>Evidence-based supplements</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {d.supplements.map((s, i) => (
            <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '160px 90px 1fr', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < d.supplements.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</p>
              <p style={{ fontSize: 11, color: d.color, fontWeight: 500, paddingTop: 1 }}>{s.dose}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{s.note}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 14, lineHeight: 1.5, fontStyle: 'italic' }}>
          Always check with your doctor or pharmacist before starting new supplements, especially if you take prescription medications.
        </p>
      </div>

      {/* Tips */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ ...sectionLbl, marginBottom: 12 }}>Lifestyle tips</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {d.tips.map(t => (
            <div key={t.title} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{t.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{t.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meal plan */}
      {d.meals.length > 0 && (
        <div style={card}>
          <p style={sectionLbl}>Sample meal plan</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {d.meals.map((m, i) => (
              <div key={m.meal} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 16, padding: '12px 0', borderBottom: i < d.meals.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: d.color, paddingTop: 2 }}>{m.meal}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {m.ideas.map((idea, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--border-strong)', paddingTop: 1, flexShrink: 0 }}>·</span>
                      {idea}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
