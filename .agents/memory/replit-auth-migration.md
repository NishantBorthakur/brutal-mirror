---
name: Replit Auth migration
description: Key decisions and quirks from migrating Brutal Mirror from Supabase to Replit Auth OIDC + PostgreSQL credits
---

## The rule
Mobile auth uses `expo-auth-session` PKCE flow → backend `/api/mobile-auth/token-exchange` → opaque session token stored in `expo-secure-store`. No `session` object on mobile — use `getToken()` from `AuthContext` to get the raw Bearer token for API calls.

**Why:** Replit OIDC is the auth provider; there is no Supabase session. Mobile tokens are opaque DB-backed session IDs, not JWTs.

**How to apply:** Any component that previously used `session?.access_token` must call `await getToken()` instead. Any component that used `session` as a truthy check must use `isAuthenticated` boolean. `logout()` replaces `signOut()`.

## Credit system
- `user_credits` table: `userId (PK, FK users.id)`, `balance int default 5`, `freeGranted bool`
- Credits initialized on first login inside `routes/auth.ts → ensureUserCredits(userId)` — called after upsertUser in both browser callback and mobile token-exchange handlers
- `GET /api/profile` returns `{ credits: number }` for the authenticated user
- Each roast deducts 1 credit via DB transaction; `creditsRemaining` is returned in the roast response

## Integrations lib build quirk
`lib/integrations-openai-ai-server` has pre-existing TS errors (p-retry `AbortError` type + optional undefined checks). Its dist does NOT auto-build. Before `pnpm --filter @workspace/api-server run typecheck` will pass, run:
```
npx tsc -p lib/integrations-openai-ai-server/tsconfig.json --noEmitOnError false
```
This generates declarations despite errors. Also needed to add `@types/node@catalog:` to that lib's devDeps.

## AuthRequest.nonce type
`expo-auth-session`'s `AuthRequest` type does not expose `nonce` publicly in TypeScript. Use a cast: `(request as { nonce?: string }).nonce` when forwarding to the token exchange endpoint.
