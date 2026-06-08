[Initial Created: 2026-03-25]
[Direction Status: momso cloud-core guide with a parked Body Note prototype surface.]
[Last Modified: 2026-03-25 15:14]

# momso Web App Guide

## Purpose

This guide explains how to run and verify the `apps/web` application in its current cloud-core state. The visible 3D anatomy surface is now a parked Body Note prototype, not the active momso MVP definition.

## Current Scope

- Vite + React + TypeScript web client
- Supabase-backed auth and persistence
- momso cloud workspace foundation
- Parked React Three Fiber proxy anatomy viewer for the future Body Note sister product
- Zustand for UI-only ephemeral state
- Mention parsing and memo authoring prototype
- Voice transcript review with text fallback

## Commands

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run test:e2e
npm run supabase:db:reset
```

## Runtime Notes

- Run commands from the repository root.
- Vite reads `VITE_` variables from the root `.env` through the app `envDir` setting.
- If you are in PowerShell, use `npm.cmd` if plain `npm` is blocked by execution policy.

## Current User Flow

1. Open the app.
2. Sign in with the Supabase email flow.
3. Let the app create or load the default cloud workspace.
4. Use the parked Body Note prototype only as a temporary sandbox.
5. Verify that projects, notes, settings, and auth state persist through Supabase.
6. Avoid treating the 3D anatomy workflow as the final momso product flow.

## Next Review Session

Run `npm run dev` and verify the cloud-core path from sign-in to project load, memo save, settings persistence, and reload.

Remote Supabase schema is already pushed, so the hosted project and the local migration set are aligned.
