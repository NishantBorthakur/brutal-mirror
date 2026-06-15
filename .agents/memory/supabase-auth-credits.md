---
name: Supabase auth + credits architecture
description: How Supabase auth and credit gating is wired in Brutal Mirror (backend + mobile)
---

## Rule
Backend verifies JWT via `supabase.auth.getUser(token)`, deducts credits atomically via `rpc('deduct_credit', ...)` before calling AI, and logs results in `roast_logs`. Mobile holds session in `AuthContext` and passes `Authorization: Bearer <token>` header on every roast request.

## Why
Credits must be deducted server-side (can't trust client), and the DB trigger auto-grants 5 free credits on signup so no extra API call is needed after registration.

## How to apply
- Backend: `artifacts/api-server/src/routes/roast.ts` — auth verify → credit check → AI call → log
- Backend admin client: `artifacts/api-server/src/lib/supabase.ts` (uses SERVICE_ROLE_KEY)
- Mobile client: `artifacts/mobile/lib/supabase.ts` (uses ANON_KEY)
- Auth state: `artifacts/mobile/context/AuthContext.tsx`
- Error codes: `AUTH_REQUIRED` (401) and `OUT_OF_CREDITS` (402) returned as JSON `{ error: "..." }`
- Graceful degradation: if `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` not set, backend logs a warning and skips auth entirely (dev mode)
- Schema: `supabase/schema.sql` — profiles, credit_transactions, roast_logs tables + RLS + trigger
