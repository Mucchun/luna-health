// Luna Health — shared anonymous Community API.
//
// One Vercel Function serves every /api/community/* route (see vercel.json).
// It stores ONLY what a user chooses to post: a made-up display name, a colour,
// and the text. No accounts, no health data.
//
// Each install sends a random secret in `X-Luna-Owner`. We keep only its SHA-256
// hash, and use it to (a) let people delete their own posts — and nobody else's,
// (b) count one like / one report per install, and (c) rate-limit.

import { createHash, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { screenText } from '../lib/moderation.js';

const sql = neon(process.env.DATABASE_URL);

const TOPICS = [
  'Period & Cycle', 'PCOS', 'Endometriosis', 'PMDD', 'Treatments & Meds',
  'Mental Health', 'Diagnosis Journey', 'Relationships', 'Ask the Community',
];
const LIMITS = { title: 200, post: 2000, comment: 1000, name: 40 };
const RATE = { postsPer10Min: 5, postsPerDay: 30, commentsPer10Min: 20, commentsPerDay: 200 };
const REPORTS_TO_HIDE = 3; // distinct reporters before content is hidden pending review

const sha = (s) => createHash('sha256').update(s).digest('hex');

function send(res, status, data) {
  res.status(status).json(data);
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Luna-Owner, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store');
}

function ownerHash(req) {
  const raw = String(req.headers['x-luna-owner'] || '');
  return /^[A-Za-z0-9-]{16,100}$/.test(raw) ? sha(raw) : null;
}

function ipHash(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  return sha((process.env.IP_SALT || 'luna') + ip);
}

function isAdmin(req) {
  const token = process.env.ADMIN_TOKEN;
  const given = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || !given) return false;
  const a = Buffer.from(sha(token)), b = Buffer.from(sha(given));
  return timingSafeEqual(a, b);
}

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max + 1) : '');
const color = (v) => (/^#[0-9a-fA-F]{6}$/.test(v || '') ? v : '#C83F6E');

async function tooMany(table, owner, ip, per10, perDay) {
  const rows = table === 'posts'
    ? await sql`SELECT
        count(*) FILTER (WHERE created_at > now() - interval '10 minutes')::int AS recent,
        count(*)::int AS day
      FROM posts WHERE (owner_hash = ${owner} OR ip_hash = ${ip}) AND created_at > now() - interval '1 day'`
    : await sql`SELECT
        count(*) FILTER (WHERE created_at > now() - interval '10 minutes')::int AS recent,
        count(*)::int AS day
      FROM comments WHERE (owner_hash = ${owner} OR ip_hash = ${ip}) AND created_at > now() - interval '1 day'`;
  return rows[0].recent >= per10 || rows[0].day >= perDay;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const path = String(req.query.p || '').replace(/^\/+|\/+$/g, '');
    const M = req.method;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const owner = ownerHash(req);
    let m;

    if (path === 'health') return send(res, 200, { ok: true });

    // ── Feed ────────────────────────────────────────────────────────────────
    if (path === 'posts' && M === 'GET') {
      const category = TOPICS.includes(req.query.category) ? req.query.category : null;
      const rows = await sql`
        SELECT p.id::int AS id, p.category, p.anon_name, p.anon_color, p.title, p.content,
               to_char(p.created_at AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS') AS created_at,
               (SELECT count(*)::int FROM likes l WHERE l.post_id = p.id) AS likes,
               (SELECT count(*)::int FROM comments c WHERE c.post_id = p.id AND NOT c.hidden) AS comment_count,
               (p.owner_hash = ${owner || ''}) AS mine
        FROM posts p
        WHERE NOT p.hidden AND (${category}::text IS NULL OR p.category = ${category})
        ORDER BY p.id DESC LIMIT 60`;
      return send(res, 200, rows);
    }

    // ── Create post ─────────────────────────────────────────────────────────
    if (path === 'posts' && M === 'POST') {
      if (!owner) return send(res, 400, { error: 'Please update Luna Health to post in the Community.' });
      const category = body.category, name = clean(body.anon_name, LIMITS.name);
      const title = clean(body.title, LIMITS.title), content = clean(body.content, LIMITS.post);
      if (!TOPICS.includes(category) || !name || !title || !content) return send(res, 400, { error: 'Missing fields' });
      if (name.length > LIMITS.name || title.length > LIMITS.title || content.length > LIMITS.post) return send(res, 400, { error: 'Too long' });
      if (screenText(title) || screenText(content) || screenText(name)) return send(res, 422, { error: 'Content violates the community guidelines' });
      const ip = ipHash(req);
      if (await tooMany('posts', owner, ip, RATE.postsPer10Min, RATE.postsPerDay)) return send(res, 429, { error: "You're posting very quickly — please wait a few minutes." });
      const rows = await sql`INSERT INTO posts (category, anon_name, anon_color, title, content, owner_hash, ip_hash)
        VALUES (${category}, ${name}, ${color(body.anon_color)}, ${title}, ${content}, ${owner}, ${ip}) RETURNING id::int AS id`;
      return send(res, 200, { id: rows[0].id });
    }

    // ── One post + its replies / delete own post ────────────────────────────
    if ((m = path.match(/^posts\/(\d+)$/))) {
      const id = +m[1];
      if (M === 'GET') {
        const posts = await sql`
          SELECT p.id::int AS id, p.category, p.anon_name, p.anon_color, p.title, p.content,
                 to_char(p.created_at AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS') AS created_at,
                 (SELECT count(*)::int FROM likes l WHERE l.post_id = p.id) AS likes,
                 (p.owner_hash = ${owner || ''}) AS mine
          FROM posts p WHERE p.id = ${id} AND NOT p.hidden`;
        if (!posts.length) return send(res, 404, { error: 'Not found' });
        const comments = await sql`
          SELECT c.id::int AS id, c.post_id::int AS post_id, c.anon_name, c.anon_color, c.content,
                 to_char(c.created_at AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS') AS created_at,
                 (c.owner_hash = ${owner || ''}) AS mine
          FROM comments c WHERE c.post_id = ${id} AND NOT c.hidden ORDER BY c.id ASC`;
        return send(res, 200, { ...posts[0], comment_count: comments.length, comments });
      }
      if (M === 'DELETE') {
        if (!owner) return send(res, 403, { error: 'Not allowed' });
        const rows = await sql`DELETE FROM posts WHERE id = ${id} AND owner_hash = ${owner} RETURNING id`;
        return rows.length ? send(res, 200, { ok: true }) : send(res, 403, { error: 'You can only delete your own posts.' });
      }
    }

    // ── Reply ───────────────────────────────────────────────────────────────
    if ((m = path.match(/^posts\/(\d+)\/comments$/)) && M === 'POST') {
      if (!owner) return send(res, 400, { error: 'Please update Luna Health to reply in the Community.' });
      const postId = +m[1];
      const name = clean(body.anon_name, LIMITS.name), content = clean(body.content, LIMITS.comment);
      if (!name || !content) return send(res, 400, { error: 'Missing fields' });
      if (name.length > LIMITS.name || content.length > LIMITS.comment) return send(res, 400, { error: 'Too long' });
      if (screenText(content) || screenText(name)) return send(res, 422, { error: 'Content violates the community guidelines' });
      const exists = await sql`SELECT 1 FROM posts WHERE id = ${postId} AND NOT hidden`;
      if (!exists.length) return send(res, 404, { error: 'Not found' });
      const ip = ipHash(req);
      if (await tooMany('comments', owner, ip, RATE.commentsPer10Min, RATE.commentsPerDay)) return send(res, 429, { error: "You're replying very quickly — please wait a few minutes." });
      const rows = await sql`INSERT INTO comments (post_id, anon_name, anon_color, content, owner_hash, ip_hash)
        VALUES (${postId}, ${name}, ${color(body.anon_color)}, ${content}, ${owner}, ${ip}) RETURNING id::int AS id`;
      return send(res, 200, { id: rows[0].id });
    }

    // ── Like (once per install) ─────────────────────────────────────────────
    if ((m = path.match(/^posts\/(\d+)\/like$/)) && M === 'POST') {
      const postId = +m[1];
      if (owner) {
        const exists = await sql`SELECT 1 FROM posts WHERE id = ${postId} AND NOT hidden`;
        if (exists.length) await sql`INSERT INTO likes (post_id, owner_hash) VALUES (${postId}, ${owner}) ON CONFLICT DO NOTHING`;
      }
      const rows = await sql`SELECT count(*)::int AS likes FROM likes WHERE post_id = ${postId}`;
      return send(res, 200, { likes: rows[0].likes });
    }

    // ── Delete own reply ────────────────────────────────────────────────────
    if ((m = path.match(/^comments\/(\d+)$/)) && M === 'DELETE') {
      if (!owner) return send(res, 403, { error: 'Not allowed' });
      const rows = await sql`DELETE FROM comments WHERE id = ${+m[1]} AND owner_hash = ${owner} RETURNING id`;
      return rows.length ? send(res, 200, { ok: true }) : send(res, 403, { error: 'You can only delete your own replies.' });
    }

    // ── Report ──────────────────────────────────────────────────────────────
    if ((m = path.match(/^(posts|comments)\/(\d+)\/report$/)) && M === 'POST') {
      const type = m[1] === 'posts' ? 'post' : 'comment', id = +m[2];
      const reporter = owner || ipHash(req);
      await sql`INSERT INTO reports (target_type, target_id, reporter_hash, reason)
        VALUES (${type}, ${id}, ${reporter}, ${clean(body.reason, 200) || null}) ON CONFLICT DO NOTHING`;
      const rows = await sql`SELECT count(*)::int AS n FROM reports WHERE target_type = ${type} AND target_id = ${id} AND NOT resolved`;
      if (rows[0].n >= REPORTS_TO_HIDE) {
        if (type === 'post') await sql`UPDATE posts SET hidden = TRUE WHERE id = ${id}`;
        else await sql`UPDATE comments SET hidden = TRUE WHERE id = ${id}`;
      }
      return send(res, 200, { ok: true });
    }

    // ── Moderation (admin token required) ───────────────────────────────────
    if (path.startsWith('admin/')) {
      if (!isAdmin(req)) return send(res, 401, { error: 'Unauthorized' });

      if (path === 'admin/queue' && M === 'GET') {
        const reported = await sql`
          SELECT r.target_type, r.target_id::int AS target_id, count(*)::int AS reports,
                 to_char(max(r.created_at) AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS') AS last_reported,
                 COALESCE(p.title, '') AS title, COALESCE(p.content, c.content) AS content,
                 COALESCE(p.anon_name, c.anon_name) AS anon_name, COALESCE(p.hidden, c.hidden) AS hidden
          FROM reports r
          LEFT JOIN posts p ON r.target_type = 'post' AND p.id = r.target_id
          LEFT JOIN comments c ON r.target_type = 'comment' AND c.id = r.target_id
          WHERE NOT r.resolved AND COALESCE(p.id, c.id) IS NOT NULL
          GROUP BY r.target_type, r.target_id, p.title, p.content, c.content, p.anon_name, c.anon_name, p.hidden, c.hidden
          ORDER BY max(r.created_at) DESC LIMIT 200`;
        const recent = await sql`
          SELECT 'post' AS target_type, id::int AS target_id, title, content, anon_name, hidden,
                 to_char(created_at AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS') AS created_at
          FROM posts ORDER BY id DESC LIMIT 50`;
        return send(res, 200, { reported, recent });
      }

      if (path === 'admin/resolve' && M === 'POST') {
        const type = body.target_type === 'comment' ? 'comment' : 'post', id = +body.target_id;
        if (!id || !['remove', 'keep'].includes(body.action)) return send(res, 400, { error: 'Bad request' });
        if (body.action === 'remove') {
          if (type === 'post') await sql`DELETE FROM posts WHERE id = ${id}`;
          else await sql`DELETE FROM comments WHERE id = ${id}`;
        } else {
          if (type === 'post') await sql`UPDATE posts SET hidden = FALSE WHERE id = ${id}`;
          else await sql`UPDATE comments SET hidden = FALSE WHERE id = ${id}`;
        }
        await sql`UPDATE reports SET resolved = TRUE WHERE target_type = ${type} AND target_id = ${id}`;
        return send(res, 200, { ok: true });
      }
    }

    return send(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error('community api error', e);
    return send(res, 500, { error: 'Something went wrong. Please try again.' });
  }
}
