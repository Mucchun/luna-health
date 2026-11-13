# Shared anonymous Community

The Community is the one part of Luna Health that is shared between people on
different devices. Everything else (symptoms, cycle, labs, medications) stays on
the user's own device.

- **Server:** `community-api/` — one Vercel Function + Neon Postgres.
- **Live URL:** https://luna-community.vercel.app (Vercel project `luna-community`).
- **App side:** `frontend/src/lib/community.ts` points every build at that URL.
  Set `VITE_COMMUNITY_API_URL=local` to keep the community on-device while developing,
  or to another URL to use a different server.

## What is stored

Only what someone chooses to post: a made-up display name, a colour and the text.
Each install also sends a random secret; the server keeps only its hash, so that
people can delete their own posts (and nobody else's), like or report once, and
be rate-limited. No accounts, no health data. IP addresses are stored only as a
salted hash, for rate limiting.

## Safety

- The same objectionable-content filter runs in the app and again on the server.
- Limits: 5 posts / 20 replies per 10 minutes per install or network.
- Report: content reported by 3 different people is hidden until reviewed.
- Moderation page: https://luna-community.vercel.app/admin.html — paste the admin
  token to review reports and remove or keep content. The token is the
  `ADMIN_TOKEN` environment variable on the Vercel project (a copy is saved on
  this Mac at `~/.luna-health/community-admin-token`).

## Deploying changes

```bash
cd community-api
npm run migrate            # only when the tables change (reads .env.local)
npx vercel deploy --prod
```
