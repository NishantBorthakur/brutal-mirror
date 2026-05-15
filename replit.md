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
- `artifacts/mobile/context/RoastContext.tsx` — shared app state, history (AsyncStorage), settings
- `artifacts/mobile/constants/colors.ts` — dark theme design tokens (electric purple)
- `artifacts/mobile/components/` — all UI components
- `artifacts/mobile/app/(tabs)/index.tsx` — Roast tab (home + form + result)
- `artifacts/mobile/app/(tabs)/vault.tsx` — Roast Vault (history with search/filter/delete)
- `artifacts/mobile/app/(tabs)/settings.tsx` — Settings (defaults, data, about)
- `artifacts/mobile/app/(tabs)/_layout.tsx` — custom 3-tab bottom nav

## Architecture decisions

- History stored in AsyncStorage (no DB needed for MVP) — 20 items max
- Settings stored in AsyncStorage: `brutal_mirror_settings`
- Onboarding dismissal stored in AsyncStorage: `brutal_mirror_onboarding_v1`
- Roast generation is a single POST /api/roast call with `response_format: json_object`
- 3-tab bottom navigation: Roast / Vault / Settings
- Tabs use expo-router Tabs with a custom `tabBar` render prop
- Toast notifications via `ToastProvider` + `useToast()` hook (wraps root layout)
- App is fully dark-mode only (`userInterfaceStyle: "dark"`)

## Product

Users paste text (bio, startup idea, dating profile, resume, etc.) and select a category, roast intensity, and personality. The AI returns a structured brutal critique: the roast, diagnosis, weaknesses, 3 fixes, an improved version, a viral one-liner, and a 6-metric score report. Results are saved locally and accessible from the Roast Vault.

## Features

- **Onboarding card**: shown on first visit, dismissed via AsyncStorage
- **Roast Vault**: search, category filter, per-item delete + copy quote, detail view
- **Settings**: default category/intensity/personality, clear vault, reset onboarding, about
- **Score Report**: 6-metric animated bar chart (clarity, originality, marketability, cringeLevel, fixability, overallRoastScore)
- **Viral One-liner**: shareable quote with ViralCard + copy
- **Refinement buttons**: Sharper / Funnier / Professional — refines without clearing result
- **Report header**: each result shows a generated Report ID + timestamp
- **Toast notifications**: copy/delete success feedback via `useToast()`
- Copy-to-clipboard supported throughout

## User preferences

- Electric purple (`#8b5cf6`) accent on black/charcoal background
- No authentication, no database, no payments — pure MVP

## Gotchas

- After OpenAPI spec changes: run `pnpm --filter @workspace/api-spec run codegen` before using new hooks
- expo-clipboard version warning is expected (7.0.1 vs expected 8.0.x) but works fine
- `useNativeDriver` warning in web preview is expected — native animations fall back to JS on web

## AsyncStorage keys

- `brutal_mirror_history` — saved roasts (max 20)
- `brutal_mirror_settings` — default category/intensity/personality
- `brutal_mirror_onboarding_v1` — onboarding dismissed flag

## Pointers

- See `pnpm-workspace` skill for workspace structure
- See `ai-integrations-openai` skill for OpenAI integration details
- See `expo` skill for mobile app patterns
