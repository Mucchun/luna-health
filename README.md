# 🌸 Luna Health

A beautiful, private women's health app for managing **PCOS**, **Endometriosis**, and **PMDD**. Track your cycle, symptoms, triggers, labs, and medications — and let AI surface patterns you might be missing.


---

## Features

### 📅 Cycle Tracker
Tap any day on the calendar to log a period. Luna predicts your next period based on your logged cycles and highlights it automatically.


---

### 🤖 AI Health Insights
Powered by **Groq + Llama 3**. Analyses your symptom logs, period patterns, triggers, and lab values to generate:
- Personalised severity trend (improving / stable / worsening)
- Top symptom and condition focus
- Evidence-based recommendations tailored to your conditions
- Doctor questions specific to your data

---

### 💬 Anonymous Community
Share questions, experiences, and support with other women — completely anonymously. Inspired by Flo's Secret Chats. Topic-based forum with likes, replies, and delete on your own content.

---

### 🌿 Wellness Hub
Condition-specific dietary plans, supplements, lifestyle tips, and meal ideas for PCOS, Endometriosis, and PMDD.

---

### ⚙️ Settings & Data Management
Update your profile, cycle lengths, and conditions. Clear specific data categories or wipe everything and start fresh.

---

### Other features
- **Symptom Logging** — severity 1–10, condition tagging, daily log
- **Patterns** — Recharts graphs of symptom trends over time
- **Trigger Journal** — log food, stress, activity, environment; see correlations with bad days
- **Labs** — track blood test values with trend charts
- **Medications** — daily check-in, active/discontinued status
- **Doctor Report** — auto-generated PDF-ready summary for appointments
- **Luna AI Chat** — floating chat widget on every page, context-aware (knows your symptoms, conditions, medications)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite |
| Styling | CSS custom properties (design system), inline styles |
| Charts | Recharts |
| Backend | Node.js, Express 5 |
| Database | SQLite via better-sqlite3 |
| AI | Groq API (Llama 3.3 70B) |
| Icons | Lucide React |
| Routing | React Router DOM |

---

## Setup

### Prerequisites
- Node.js 18+
- A free [Groq API key](https://console.groq.com) (for AI features)

### Install

```bash
git clone https://github.com/Mucchun/luna-health.git
cd luna-health

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Run

```bash
# With AI features (get free key at console.groq.com)
GROQ_API_KEY=gsk_... ./start.sh

# Without AI (all other features still work)
./start.sh
```

The app opens at **http://localhost:5173**

---

## Project Structure

```
luna-health/
├── backend/
│   ├── server.js        # Express API (all routes)
│   └── db.js            # SQLite schema + seed
├── frontend/
│   └── src/
│       ├── pages/       # Dashboard, CycleTracker, Wellness, Community, AiInsights…
│       ├── components/  # ChatWidget
│       └── App.tsx      # Router, sidebar, onboarding
├── docs/                # Screenshots
└── start.sh             # Starts both servers
```

---

## Privacy

All data is stored **locally** on your device in a SQLite database (`backend/luna.db`). Nothing is sent to any server except:
- AI analysis/chat requests → sent to Groq API (anonymised symptom aggregates, no personal identifiers)
- Community posts → stored in your local DB only

---

## Conditions Supported

| Condition | Focus |
|-----------|-------|
| **PCOS** | Androgen symptoms, insulin resistance, irregular cycles, AMH, testosterone, LH:FSH |
| **Endometriosis** | Pelvic & deep pain, bladder/bowel symptoms, dyspareunia, CA-125, CRP |
| **PMDD** | Mood changes mapped to luteal phase — irritability, depression, anxiety |

---

Built with 💗 for women who deserve better health tools.
