// Creates the community tables. Safe to re-run.
//   npm run migrate        (reads DATABASE_URL from .env.local)
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS posts (
  id          BIGSERIAL PRIMARY KEY,
  category    TEXT NOT NULL,
  anon_name   TEXT NOT NULL,
  anon_color  TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  owner_hash  TEXT NOT NULL,
  ip_hash     TEXT NOT NULL,
  hidden      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
)`;
await sql`CREATE TABLE IF NOT EXISTS comments (
  id          BIGSERIAL PRIMARY KEY,
  post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  anon_name   TEXT NOT NULL,
  anon_color  TEXT NOT NULL,
  content     TEXT NOT NULL,
  owner_hash  TEXT NOT NULL,
  ip_hash     TEXT NOT NULL,
  hidden      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
)`;
await sql`CREATE TABLE IF NOT EXISTS likes (
  post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  owner_hash  TEXT NOT NULL,
  PRIMARY KEY (post_id, owner_hash)
)`;
await sql`CREATE TABLE IF NOT EXISTS reports (
  id            BIGSERIAL PRIMARY KEY,
  target_type   TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id     BIGINT NOT NULL,
  reporter_hash TEXT NOT NULL,
  reason        TEXT,
  resolved      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, reporter_hash)
)`;
await sql`CREATE INDEX IF NOT EXISTS posts_feed ON posts (hidden, id DESC)`;
await sql`CREATE INDEX IF NOT EXISTS posts_rate ON posts (owner_hash, created_at)`;
await sql`CREATE INDEX IF NOT EXISTS comments_post ON comments (post_id, id)`;
await sql`CREATE INDEX IF NOT EXISTS comments_rate ON comments (owner_hash, created_at)`;

console.log('Community tables ready.');
