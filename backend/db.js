const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'luna.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY,
    name TEXT DEFAULT '',
    conditions TEXT DEFAULT '[]',
    cycle_length INTEGER DEFAULT 28,
    period_length INTEGER DEFAULT 5,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS symptoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    condition TEXT NOT NULL,
    symptom TEXT NOT NULL,
    severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 10),
    body_location TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS triggers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    value TEXT NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    dose TEXT,
    frequency TEXT,
    start_date TEXT,
    active INTEGER DEFAULT 1,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS medication_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medication_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    taken INTEGER DEFAULT 1,
    notes TEXT,
    FOREIGN KEY (medication_id) REFERENCES medications(id)
  );

  CREATE TABLE IF NOT EXISTS lab_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    marker TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    lab TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS doctor_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    doctor TEXT,
    type TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    anon_name TEXT NOT NULL,
    anon_color TEXT NOT NULL DEFAULT '#C83F6E',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS community_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    anon_name TEXT NOT NULL,
    anon_color TEXT NOT NULL DEFAULT '#C83F6E',
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
  );
`);

// Create blank profile on first run — triggers onboarding in the UI
const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
if (!profile) {
  db.prepare('INSERT INTO user_profile (id, name, conditions, cycle_length, period_length) VALUES (1, ?, ?, 28, 5)')
    .run('', JSON.stringify([]));
}

module.exports = db;
