# Brutal Mirror

An AI-powered roasting app that gives brutally honest feedback on ideas, bios, resumes, startup pitches, and more — then helps you improve them.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env (auto-provisioned): `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with expo-router
- API: Express 5
- AI: Replit AI Integrations (OpenAI gpt-5.4) via `@workspace/integrations-openai-ai-server`
- DB: PostgreSQL + Drizzle ORM (available but not used — history stored in AsyncStorage)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `artifacts/api-server/src/routes/roast.ts` — POST /api/roast endpoint
- `artifacts/mobile/context/RoastContext.tsx` — shared app state + AsyncStorage history
- `artifacts/mobile/constants/colors.ts` — dark theme design tokens (electric purple)
- `artifacts/mobile/components/` — RoastForm, RoastResultView, HistoryCard
- `artifacts/mobile/app/(tabs)/index.tsx` — home screen (landing + form + result)
- `artifacts/mobile/app/history.tsx` — history list + detail screen

## Architecture decisions

- History stored in AsyncStorage (no DB needed for MVP) — 20 items max
- Roast generation is a single POST /api/roast call with `response_format: json_object` — structured output guaranteed
- Single stack navigation (no tab bar) for focus; history accessed via header button
- Intensity mapped to distinct system prompt modifiers server-side so clients can't tamper
- App is fully dark-mode only (`userInterfaceStyle: "dark"`)

## Product

Users paste text (bio, startup idea, dating profile, resume, etc.) and select a category + roast intensity. The AI returns a structured brutal critique: the roast, diagnosis, weaknesses, 3 fixes, and an improved version. Results are saved locally and accessible from the history screen. Copy-to-clipboard supported.

## User preferences

- Electric purple (`#8b5cf6`) accent on black/charcoal background
- No authentication, no database, no payments — pure MVP

## Gotchas

- After OpenAPI spec changes: run `pnpm --filter @workspace/api-spec run codegen` before using new hooks
- expo-clipboard version warning is expected (7.0.1 vs expected 8.0.x) but works fine

## Pointers

- See `pnpm-workspace` skill for workspace structure
- See `ai-integrations-openai` skill for OpenAI integration details
- See `expo` skill for mobile app patterns
