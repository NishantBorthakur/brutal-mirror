# Brutal Mirror — Implementation Status
> As of June 15, 2026

---

## What the App Does

Users paste text (bio, startup idea, dating profile, resume, etc.), pick a category, roast intensity, and AI personality. The AI returns a structured critique: a roast, diagnosis, weaknesses, 3 actionable fixes, an improved version, a viral one-liner, and a 6-metric score card. Results are saved locally and accessible from the Roast Vault.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile | Expo (React Native) + expo-router, TypeScript |
| API | Express 5, Node.js 24, TypeScript |
| AI | OpenAI gpt-5.4 via Replit AI Integrations |
| Auth | Replit OIDC (PKCE flow for mobile via expo-auth-session) |
| Database | PostgreSQL + Drizzle ORM |
| Payments | Razorpay (web-based checkout via WebBrowser) |
| Validation | Zod v4 + drizzle-zod |
| API contract | OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas) |

---

## Features Shipped

### Core Roasting
- Free-text input with category selector (Startup Idea, Bio, Resume, Dating Profile, etc.)
- Three roast intensities: Mild / Savage / Nuclear
- Four AI personalities: Brutally Honest / Startup Investor / Therapist / Gordon Ramsay
- Structured AI response: roast, diagnosis, weaknesses, 3 fixes, improved version, viral one-liner
- 6-metric animated score bar chart (clarity, originality, marketability, cringeLevel, fixability, overallRoastScore)
- Refinement buttons: Sharper / Funnier / Professional (refines without clearing result)
- Report ID + timestamp on every result
- Copy-to-clipboard throughout

### Roast Vault
- Full history (max 20 entries, stored in AsyncStorage)
- Search by text + filter by category
- Per-item delete and copy quote
- Detail view

### Auth
- Sign in with Replit (OIDC PKCE flow via expo-auth-session)
- Session stored in expo-secure-store (opaque session token)
- Auth state managed in `AuthContext` — available app-wide
- 5 free credits granted automatically on first login

### Credits & Billing
- Credit balance tracked in PostgreSQL (`user_credits` table)
- 1 credit deducted per roast
- Three credit packs purchasable via Razorpay:

  | Pack | Price | Credits |
  |---|---|---|
  | Starter | ₹49 | 20 |
  | Value *(best value)* | ₹99 | 50 |
  | Power | ₹199 | 120 |

- Purchase flow: in-app modal → WebBrowser opens a server-rendered Razorpay checkout page → on success redirects to `brutalmirror://payment/success?balance=XX` → app updates credit balance instantly
- Low-credit banner on home tab when credits ≤ 2
- Out-of-credits modal with direct link to buy more
- Transaction history visible in Settings tab

### Settings
- Default category, intensity, personality (persisted in AsyncStorage)
- Clear Vault
- Reset onboarding
- Credit balance + buy more button
- Transaction history list
- About section

### UX
- Onboarding card on first visit (dismissable, remembers via AsyncStorage)
- Toast notifications for copy/delete feedback
- Fully dark-mode only (electric purple `#8b5cf6` on black/charcoal)

---

## Backend Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/login` | — | Initiates OIDC login |
| GET | `/callback` | — | OIDC callback, sets session cookie |
| GET | `/logout` | — | Clears session |
| POST | `/api/mobile-auth/token-exchange` | — | Exchanges PKCE code for opaque session token |
| POST | `/api/mobile-auth/refresh` | Session | Refreshes session |

### Profile & Account
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/profile` | Required | Credit balance |
| GET | `/api/account/me` | Required | Full user info + balance |

### Roasting
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/roast` | Required + 1 credit | Generate roast |

### Billing
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/billing/create-order` | Required | Create Razorpay order |
| GET | `/api/billing/checkout` | Via `authToken` param | Serve HTML checkout page |
| POST | `/api/billing/verify-payment` | Required | Verify HMAC, **grant credits** |
| POST | `/api/billing/razorpay-webhook` | None (HMAC-signed) | Update order status (audit only) |
| GET | `/api/billing/transactions` | Required | Transaction history |

---

## Database Schema

```
users                  — Replit OIDC user records
sessions               — opaque session tokens
user_credits           — one row per user, current balance
credit_transactions    — every debit (roast) and credit (purchase/grant)
roast_logs             — every roast request with metadata
payment_orders         — every Razorpay order with status lifecycle
```

---

## Payment Flow (detailed)

```
User taps "Buy" in app
       │
       ▼
POST /api/billing/create-order          ← Bearer session token
       │ returns { orderId, keyId, amount, packId, credits }
       ▼
App builds checkout URL:
  /api/billing/checkout?orderId=XXX&authToken=YYY
       │
       ▼
WebBrowser.openAuthSessionAsync(url, 'brutalmirror://')
       │
       ▼
Server renders HTML page
  → validates authToken + orderId ownership
  → embeds Razorpay checkout.js, auto-opens payment sheet
       │
       ▼  (user pays)
       │
       ▼
HTML page POSTs to /api/billing/verify-payment
  → HMAC-SHA256 signature verified
  → credits added in DB transaction (idempotent: skips if already verified)
  → redirects to brutalmirror://payment/success?credits=XX&balance=YY
       │
       ▼
App receives deep-link
  → updates credit balance in AuthContext
  → shows "Credits added!" toast
       │
       ▼  (async, parallel)
Razorpay webhook → POST /api/billing/razorpay-webhook
  → HMAC verified
  → 200 sent immediately (< 25ms)
  → order status updated to paid/failed in background (audit record only)
```

---

## What Is and Isn't Production-Ready

### ✅ Ready for launch
- Auth flow (Replit OIDC, PKCE, session management)
- Credit deduction with race-condition safety (DB transaction)
- Payment verification with HMAC-SHA256 signature check and `crypto.timingSafeEqual`
- Idempotent credit grants (second verify call on same order returns current balance, no double-credit)
- Webhook responds in < 30ms (fires 200 before any DB work)
- Pack prices defined server-side only — client cannot tamper with amounts
- Webhook secret verified against `RAZORPAY_WEBHOOK_SECRET`
- `payment_orders` table records full lifecycle: created → paid → verified (or failed)
- Deep-link on success updates balance without requiring a page reload

### ⚠️ Known limitations / post-launch improvements

| Item | Notes |
|---|---|
| **Webhook credit fallback** | Webhook currently only updates order status. If `/verify-payment` ever fails (network drop after payment), credits are lost until support intervenes. Fix: add idempotent credit grant in `payment.captured` webhook handler, gated on `order.status !== "verified"`. Safe to add post-launch. |
| **Razorpay test vs. live keys** | Currently using whichever key is in `RAZORPAY_KEY_ID`. Make sure to swap to `rzp_live_...` keys before going live. |
| **No refund handling** | No endpoint for issuing refunds or reversing credits. Razorpay refunds can be issued manually from the dashboard; credit reversal requires manual DB update. |
| **History is local only** | Roast history lives in AsyncStorage (device-local). Uninstalling or switching devices loses history. Post-launch: sync history to DB. |
| **No subscription model** | Only one-time credit packs. Subscriptions would require Razorpay Subscriptions API + recurring billing logic. |
| **Rate limiting** | No per-user rate limit on `/api/roast` beyond the credit check. A user with many credits could hammer the AI endpoint. |
| **No receipt / email** | No purchase confirmation email. Razorpay sends its own email if configured in the dashboard. |

---

## Environment Variables Required

| Key | Where | Description |
|---|---|---|
| `DATABASE_URL` | Auto-provisioned | PostgreSQL connection string |
| `SESSION_SECRET` | Replit Secret | Express session signing key |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Auto-provisioned | Replit AI proxy base URL |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Auto-provisioned | Replit AI proxy key |
| `REPL_ID` | Auto-provisioned | Replit OIDC client ID |
| `RAZORPAY_KEY_ID` | Replit Secret | Razorpay key ID (`rzp_test_...` or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Replit Secret | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Replit Secret ✅ set | Razorpay webhook signature secret |

---

## Razorpay Dashboard Checklist

- [x] Webhook URL set: `https://<your-app>.replit.app/api/billing/razorpay-webhook`
- [x] Webhook secret: matches `RAZORPAY_WEBHOOK_SECRET`
- [x] Events enabled: `payment.captured`, `payment.failed`
- [ ] Switch to live keys before going live (`rzp_live_...`)
- [ ] Enable Razorpay email receipts (optional, in Settings → Notifications)

---

## Files Reference

```
artifacts/
  api-server/src/
    lib/razorpay.ts          — Razorpay client, PACKS config, checkout HTML, HMAC verify
    routes/billing.ts        — All billing endpoints
    routes/account.ts        — GET /api/account/me
    routes/roast.ts          — POST /api/roast (credit deduction)
    middlewares/authMiddleware.ts
    lib/auth.ts              — OIDC config + session helpers
  mobile/
    context/AuthContext.tsx  — Auth state, credits, refreshCredits()
    context/RoastContext.tsx — Roast history, settings, generation
    components/BillingModal.tsx     — Credit pack purchase UI
    components/OutOfCreditsModal.tsx
    app/(tabs)/index.tsx     — Home / Roast tab (low-credit banner)
    app/(tabs)/vault.tsx     — Roast Vault
    app/(tabs)/settings.tsx  — Settings + transaction history
lib/
  db/src/schema/
    auth.ts                  — users, sessions
    credits.ts               — user_credits, credit_transactions, roast_logs
    billing.ts               — payment_orders
  api-spec/openapi.yaml      — API contract (source of truth)
```
