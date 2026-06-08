[Initial Created: 2026-03-25]
[Direction Status: momso-first infrastructure. Body Note is a deferred sister product concept.]
[Last Modified: 2026-03-25 15:14]

# momso Infrastructure Guide

## Purpose

This document records the current open-source infrastructure, local CLI usage, and cloud-core database setup for momso.

## Product Direction Status

momso is the active SaaS umbrella. The 3D anatomy work in this repository is now a parked prototype for the future Body Note sister product, so infrastructure naming should stay momso-first.

## Security Rules

Never commit the following:

- `.env`
- `.env.local`
- `.env.*.local`
- Supabase access tokens
- Supabase DB passwords
- Vercel project secrets
- Supabase temp and branch cache files
- database dumps or backup files

Tracked guidance files:

- `.env.example`
- `vercel.json`
- `supabase/config.toml`

## Current Tooling

- Supabase CLI
- Vercel CLI
- Docker Desktop
- local Supabase stack
- Vitest
- Playwright

## Local Setup Commands

```bash
npm install
npm run dev
npm run supabase:start
npm run supabase:db:reset
npm run supabase:status
npm run build
npm run test
npm run lint
npm run test:e2e
```

## Cloud Core Schema

The current local migration is:

- `supabase/migrations/20260325153000_cloud_core_schema.sql`

It creates these user-scoped tables with RLS enabled:

- `projects`
- `action_families`
- `action_instances`
- `threads`
- `thread_memos`
- `project_settings`

Deferred to the next phase:

- `share_links`
- clone policy tables and flows

## Frontend Environment Notes

- The web app uses the repository root `.env`.
- `apps/web/vite.config.ts` points `envDir` at the repository root so production build and local dev read the same shared variables.
- Only browser-safe values should use the `VITE_` prefix.

## Current Status

- GitHub public repository connected
- Supabase project linked
- Vercel project linked
- Production deployment active
- Local Docker + local Supabase verified
- Cloud-core migration verified with `npm run supabase:db:reset`
- Linked remote Supabase project updated with `npm run supabase:db:push`

## Next Review Session

Before testing the authenticated cloud flow, make sure Docker is running, local Supabase is up if needed, and the app is started from the repository root so the shared `.env` is loaded correctly.
