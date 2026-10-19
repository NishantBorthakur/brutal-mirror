# Brutal Mirror — Current Application State

**Audit date:** 2026-10-19  
**Git commit at audit:** `ce9cc597cfb307927350212092223319bc2cdc9b`

## Executive summary

Brutal Mirror is an Expo application for mobile and web that generates AI critiques and rewrites of user-submitted ideas and profiles. The implementation includes a polished, dark-purple interface, nine selectable content categories, four roast intensities, six critic personalities, five result views, refinement requests, device-local history and preferences, Replit OIDC authentication, PostgreSQL-backed user credits, and Razorpay credit-purchase code.

The mobile Expo preview and Express API were running during this audit. The 402 × 874 browser preview displayed the onboarding and roast form; `GET /api/healthz` returned HTTP 200, and `GET /api/login` returned an OIDC redirect. Targeted TypeScript checks for the mobile app and API passed. A full workspace typecheck failed in the separate Canvas/mockup-sandbox package because two UI components resolve incompatible copies of React ref types.

**Not confirmed:** real account sign-in, token exchange, an AI roast, paid checkout, a Razorpay webhook, native iOS/Android builds, or a deployed production environment. The payment credentials are optional and were not confirmed as configured. The packaged EAS builds still contain a different Replit project’s API domain and client ID.

**Overall launch readiness:** not ready for public launch until the production mobile domain/client ID, payment verification idempotency, and privacy disclosures are resolved and sign-in/roast/purchase flows are tested in the intended deployment.

**Three highest-priority actions**

1. Replace the legacy EAS API domain and Replit OIDC client ID with values for the intended deployment; verify sign-in from a release build.
2. Make payment verification race-safe and avoid sending opaque session tokens in checkout URLs.
3. Update the privacy policy to accurately describe accounts, server-side credit/payment records, roast logging, and OpenAI processing.

## 1. Project overview

- **Name and purpose:** Brutal Mirror produces humorous but constructive feedback on submitted text, followed by practical suggestions and a rewritten version.
- **Intended audience:** Inferred from the product categories and copy: people refining startup and product ideas, bios, resumes, business names, dating profiles, personal goals, and other short-form content.
- **Main experience:** Choose a content category, intensity and persona; submit text; receive a structured AI response; browse/copy/share the result; optionally request a sharper, funnier or more professional refinement; revisit locally saved roasts.
- **Development stage:** Functional prototype. Significant product flows have source implementations, but important production configuration and live end-to-end flows remain unverified, and a payment concurrency risk is visible in code.
- **Platforms:** Expo Router targets iOS and Android and includes Expo Web support. Replit’s current preview renders the app in a browser. This is one Expo app, not a separate web frontend.
- **Primary entry points:**
  - `artifacts/mobile/app/_layout.tsx` — root providers and navigation stack.
  - `artifacts/mobile/app/(tabs)/_layout.tsx` — Roast, Vault and Settings tabs.
  - `artifacts/mobile/app/(tabs)/index.tsx` — roast form and current result.
  - `artifacts/api-server/src/index.ts` — Express API listener.
  - `artifacts/api-server/src/app.ts` — middleware and `/api` router mounting.
- **Replit development commands:** Managed workflows run `pnpm --filter @workspace/mobile run dev` and `pnpm --filter @workspace/api-server run dev`. The API health route is `/api/healthz`.
- **Production configuration:** `.replit` declares autoscale deployment. The mobile artifact provides a production static Expo build and serve script; the API artifact provides an esbuild bundle and Node start command. Configuration is present, but deployment and release builds were not tested.
- **External services:** Replit OIDC for authentication, Replit PostgreSQL for accounts/credits/payment records/roast logs, Replit AI Integrations’ OpenAI-compatible endpoint for `gpt-5.4` roast generation, and Razorpay for optional INR credit purchases.

## 2. Feature inventory

### Authentication and accounts

- Browser authentication uses Replit OpenID Connect (OIDC), with PKCE, state and nonce checks, secure HTTP-only `sid` cookies, and a PostgreSQL-backed session with a seven-day expiry.
- The browser flow begins at `GET /api/login`, completes at `/api/callback`, and redirects to a safe relative `returnTo` path. Invalid or absent return paths fall back to `/`.
- Mobile authentication uses `expo-auth-session` to obtain an authorization code, sends it to `/api/mobile-auth/token-exchange`, and stores the returned opaque session ID with `expo-secure-store`. Requests send it as a bearer token. `AuthContext` also checks the current user at launch and fetches the credit balance.
- On a user’s first successful OIDC login, the backend creates a balance of **5 credits** and a corresponding `free_grant` transaction. This is implemented in the browser callback and mobile code-exchange path.
- Users can sign out. Browser sign-out clears its session and begins OIDC end-session; mobile sign-out calls the mobile logout endpoint and removes its locally stored token.
- The home screen lets unauthenticated visitors inspect the roast interface. Attempting to generate a roast requires authentication and prompts for sign-in.
- No guest roast-generation path, public registration form, account deletion endpoint, profile editing, or server-side account-management UI was found. Account creation relies on the OIDC provider.
- `GET /api/account/me` returns the authenticated user and balance, but no mobile screen was found using it; the client uses `/api/auth/user` and `/api/profile`.
- **Operational verification:** the unauthenticated browser login endpoint returned HTTP 302 in the development environment. User sign-in, callback, mobile token exchange and logout were not completed with a real account.

### AI roasting engine

**Selectable content categories**

1. Instagram Bio
2. Startup Idea
3. Dating Profile
4. Resume Summary
5. Business Name
6. YouTube Channel Idea
7. Mobile App Idea
8. Personal Goal
9. Other

**Intensity levels**

- Honest — direct, professional, comparatively warm feedback.
- Harsh — unfiltered, precise criticism.
- Brutal — savage, witty and specific feedback.
- Career-ending — maximum creative destruction; the system prompt still requires constructive, safe critique.

**Personalities**

- Savage Mentor
- Startup Investor
- Creative Director
- Dating Coach
- Resume Recruiter
- Internet Troll, but useful

The category, intensity and personality options are defined in both the roast form and settings UI. The backend has detailed prompt instructions for the four intensities and six personalities. If the API receives an unknown intensity or personality string, it silently uses the Brutal or Savage Mentor prompt instructions, respectively; it does not reject an unknown value.

- **Input bounds:** The form and API enforce a minimum of 20 and maximum of 3,000 characters. The server also requires nonempty `category`, `intensity`, `content` and `personality`.
- **Authentication and credits:** The API requires an authenticated session. It atomically decrements one credit before calling the AI, preventing concurrent requests from passing a stale positive-balance check. An insufficient balance returns HTTP 402. Roasting and each refinement request consume a credit.
- **AI model and prompt:** `artifacts/api-server/src/routes/roast.ts` calls the OpenAI-compatible Replit AI integration using model `gpt-5.4`, JSON-object response format and a completion-token cap. A system prompt defines the voice and disallows protected-trait attacks, threats, harassment, self-harm encouragement and illegal-activity encouragement. The user prompt includes the selected content and instructions.
- **Response structure:** `viralOneLiner`, `brutalRoast`, `actualDiagnosis`, `biggestWeaknesses`, `threeFixes`, `improvedVersion` and `scoreReport`. The score report includes overall roast score, clarity, originality, marketability, cringe level and fixability.
- **Refinement:** Three modes—Sharper, Funnier and Professional—reuse the submitted content and adjust the prompt. The refinement result replaces the newest local history item.
- **Failure handling:** AI call failures, absent content and invalid JSON trigger a credit refund and a failed roast-log entry. The response is checked for valid JSON and for `brutalRoast` and `actualDiagnosis`; the remaining expected fields are not comprehensively schema-validated before the client uses them.
- **Rate limiting:** No API rate-limiting middleware or per-user request-rate control was found. Content length and credit balance are bounded; users can still make repeated requests while they have credits.
- **Verification:** Source and server startup are verified, but no live paid AI request or end-to-end roast was performed during this audit.

### Results, sharing and navigation

- Results use five tabs: **Report**, **Roast**, **Fixes**, **Rewrite** and **Share**.
- The report can display the six score metrics. Other views show the original critique, diagnosis, weaknesses, fixes and rewritten version.
- Three refinement buttons request a revised version. Copy actions use Expo Clipboard, provide feedback, and issue haptics where supported.
- The share view presents a shareable one-liner and full-roast copy action. A device-native share sheet was not confirmed; implemented sharing is clipboard-based.
- An onboarding card introduces the product and can be dismissed. The home screen includes example chips that populate sample category/content.
- Navigation has three bottom tabs: Roast, Vault and Settings. A separate `app/history.tsx` history route is also present in the source.
- Loading messages/dots, credit banners, sign-in and out-of-credit modals, and toast notifications are implemented.

### Roast Vault and persistence

- Roast history is stored in AsyncStorage on the current device, with up to **20** items kept. Each entry contains result fields, selected options, a content preview, the full original prompt and a timestamp.
- The Vault lists and filters saved roasts by their available categories, searches the content preview, category, personality and one-liner, opens saved details, copies a quote, and supports individual deletion or clearing all items.
- Default category, intensity and personality are also stored in AsyncStorage. Onboarding dismissal is persisted locally.
- This is not a cross-device or server-synchronized history. Deleting an account is not implemented. History is not scoped by account and the inspected logout logic does not clear it, so users on the same device may continue seeing locally saved content after signing out or switching accounts.
- AsyncStorage read and write errors are generally caught without surfacing a user-visible persistence error.

### Credits and monetization

- New users receive five free credits. Successful roast/refinement calls spend one credit. Failed AI calls attempt a one-credit refund. Credit deduction is an atomic guarded database update.
- The UI and backend define three Razorpay order packs, denominated in Indian rupees:

  | Pack | Price | Credits |
  |---|---:|---:|
  | Starter | ₹49 | 20 |
  | Value | ₹99 | 50 |
  | Power | ₹199 | 120 |

- The client asks the authenticated API to create an order, opens an API-generated HTML page in a browser, invokes Razorpay Checkout, and posts the returned signature fields to server-side verification. The server checks ownership and signature, records the order and adds purchased credits in a database transaction.
- A Razorpay webhook validates the signature against the raw request body and supports captured/failed payment events. Captured-payment handling uses a conditional order-status update inside a transaction to guard against duplicate webhook delivery.
- Authenticated transaction history is returned by the API, capped at 20 records; the Settings UI displays fetched history.
- **Refunds:** Credit refunds are implemented for AI-generation failures. A customer payment refund workflow or refund API is not implemented.
- **Configuration and status:** Payment creation is disabled with HTTP 503 unless `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are configured. The webhook also requires `RAZORPAY_WEBHOOK_SECRET`. No real transactions or webhook deliveries were performed.

### Settings and personalization

- Users can choose defaults for category, intensity and personality. Changes save locally and show a toast.
- Settings displays the signed-in account email and current credit balance, offers sign-in/sign-out and credit purchase controls, and shows transaction history when present.
- Users can clear local roast history and reset/dismiss onboarding.
- No editing of user profile data, account deletion, data export, server-side history deletion or user-visible language/theme controls were found.

### UI and accessibility

- Current presentation is a dark interface with black backgrounds, purple gradients and accents, Inter font weights, cards and a custom three-tab bottom bar. Theme values are primarily centralized in mobile color constants, though some screens also use literal colors.
- Expo Web renders the same React Native screens; the captured mobile-sized preview displayed onboarding, the category/intensity/personality selectors, example chips and Roast/Vault/Settings navigation.
- Scroll views and web-specific top/bottom insets support smaller browsers. Tablet support is explicitly disabled for iOS in `app.json`.
- The app root includes a React error boundary and fonts/splash-screen handling. The result and form UI include loading and validation feedback; the auth context has several swallowed errors that can leave auth/credit status without a clear error explanation.
- No dedicated screen-reader or keyboard-accessibility audit was performed. The captured browser logs include React Native Web warnings about deprecated shadow/pointer-events props and native-driver animation falling back to JavaScript on web.

## 3. Feature implementation status

“Implemented” refers to source-level presence, not proof of production operation. “Unverified” calls out source that requires an external account or live integration to exercise.

| Feature | Status | Frontend | Backend | Notes |
|---|---|---|---|---|
| Roast landing/form and three-tab navigation | Implemented | Expo Router screens and custom tab bar | N/A | Browser preview rendered at mobile viewport |
| Category, intensity and persona selection | Implemented | Pickers and settings defaults | Prompt maps | Unknown API strings fall back rather than reject |
| Input length checks | Implemented | 20–3,000-character form limits | Same length bounds | Required string fields are manually checked |
| AI roast request | Unverified | Sends authenticated JSON request | OpenAI-compatible `gpt-5.4` call and credit accounting | AI integration configured; no live roast performed in audit |
| Roast report, fixes, rewrite and sharing | Implemented | Five result tabs; clipboard copy | JSON result prompt | No external/native share flow verified |
| Sharper/funnier/professional refinement | Implemented | Three refinement controls | Prompt refinement mode | Costs another credit; replaces latest local item |
| New-user OIDC authentication | Unverified | Browser modal and mobile PKCE flow | Replit OIDC callback/token exchange and DB sessions | Browser `/login` redirect verified; full sign-in not tested |
| Five free initial credits | Implemented | Balance display | Transactional-on-first-login grant code | Requires successful OIDC flow |
| Credit deduction/refund for roast | Implemented | Balance updated from response | Atomic deduction; refund on AI failure | Not exercised with an authenticated AI call |
| Roast Vault | Implemented | Search, category filtering, detail, copy, delete, clear | No server history API | Device-local, capped at 20 |
| Defaults and onboarding persistence | Implemented | Settings and onboarding | N/A | AsyncStorage |
| Razorpay credit checkout and signature verification | Unverified | Billing modal and external checkout flow | Order, signature, credit and transaction handlers | Credentials and real payments not verified; race risk below |
| Razorpay webhook processing | Unverified | N/A | Signed captured/failed event handler | No real webhook delivery performed |
| Purchase refund workflow | Not Implemented | None found | None found | Do not confuse AI-credit refund with payment refund |
| Account deletion and data export | Not Implemented | None found | No corresponding API route found | Local-history clear is not account deletion |
| Privacy-policy accuracy | Partially Implemented | Privacy link in Settings | Static `/api/privacy` HTML | Current policy contradicts actual account, roast-log and payment storage |
| Production mobile domain/OIDC configuration | Partially Implemented | Build scripts honor Expo environment variables, but EAS profiles hardcode prior project | API uses current Replit runtime identity | Release profiles specify a different Replit app; see launch risks |
| Development API availability | Implemented | Client targets the API | Health route | HTTP 200 verified in current development environment |
| Full workspace typecheck | Partially Implemented | Mobile target passes | API target passes | Root check fails in unused mockup-sandbox React ref types |
| Native release builds and published deployment | Unverified | EAS profiles and build scripts exist | Autoscale configuration exists | No native release build or deployed production endpoint tested |

## 4. Technical architecture

| Area | Current implementation |
|---|---|
| Workspace/package manager | pnpm 10 workspace; root requires Node.js 20 or later |
| Language | TypeScript in the mobile application, API, and libraries; JavaScript build/serve scripts |
| Mobile/UI | Expo SDK 54, React Native 0.81, React 19, Expo Router 6, and React Native Web |
| Backend | Express 5 API in TypeScript, built with esbuild to an ESM Node bundle |
| Database | PostgreSQL with `pg` and Drizzle ORM |
| Auth | Replit OIDC (`openid-client`); cookie sessions for browser and opaque DB-backed bearer session IDs for mobile |
| AI | OpenAI-compatible Replit AI Integration; `gpt-5.4` for roast completions |
| Payments | Razorpay order API and hosted Checkout HTML; rupee-denominated credit packs |
| Client state | React Context for auth and roast/product state; TanStack React Query provider is initialized but primary roast/auth flows use direct `fetch` |
| Local storage | AsyncStorage for settings, onboarding state and history; SecureStore for mobile auth token |
| API contract | OpenAPI 3.1 at `lib/api-spec/openapi.yaml`; Orval generates client/Zod packages. The contract covers several routes but is not a complete inventory of every implemented route |
| Development app commands | `pnpm --filter @workspace/mobile run dev`; `pnpm --filter @workspace/api-server run dev` |
| Type checks | `pnpm --filter @workspace/mobile run typecheck`; `pnpm --filter @workspace/api-server run typecheck`; `pnpm run typecheck` for workspace |

**Main directories**

- `artifacts/mobile/` — Expo app, routes, components, providers, EAS/build configuration.
- `artifacts/api-server/` — Express routes, auth middleware, payment and AI behavior.
- `lib/db/` — Drizzle schemas, database client and schema push script.
- `lib/api-spec/` — OpenAPI contract and code-generation configuration.
- `lib/api-client-react/`, `lib/api-zod/` — generated client and runtime schemas.
- `lib/integrations-openai-ai-server/` — OpenAI-compatible server integration used by the API.
- `supabase/schema.sql` — legacy Supabase schema; it does not describe the current Replit OIDC/PostgreSQL implementation.
- `artifacts/mockup-sandbox/` — separate UI mockup/Canvas development artifact; not required by the mobile product.

## 5. Backend API inventory

All endpoints use the `/api` prefix. Authentication means the route explicitly checks `req.isAuthenticated()` or uses an authenticated session for checkout. The payment webhook is authenticated by its Razorpay signature instead of a user session.

| Method | Endpoint | Purpose | Authentication required | Status |
|---|---|---|---|---|
| GET | `/api/healthz` | Basic service health response | No | Implemented; HTTP 200 verified |
| GET | `/api/auth/user` | Current user or `null` | No | Implemented |
| GET | `/api/login` | Begin browser OIDC login | No | Implemented; redirect verified |
| GET | `/api/callback` | Complete browser OIDC login and set session | OIDC state/nonce/PKCE cookies | Implemented; callback not end-to-end tested |
| GET | `/api/logout` | Clear browser session and redirect to OIDC logout | Existing session optional | Implemented; not end-to-end tested |
| POST | `/api/mobile-auth/token-exchange` | Exchange mobile authorization code for opaque session ID | OIDC code/PKCE/state/nonce validation | Implemented; not end-to-end tested |
| POST | `/api/mobile-auth/logout` | Revoke mobile session | Bearer session | Implemented |
| GET | `/api/account/me` | Return current user and credit balance | Yes | Implemented; no client usage found |
| GET | `/api/profile` | Return current credit balance | Yes | Implemented |
| POST | `/api/roast` | Generate or refine roast, deduct/refund credits, log result | Yes; also at least 20–3,000 characters | Implemented; AI interaction unverified |
| POST | `/api/billing/create-order` | Create a Razorpay order for a valid pack | Yes; Razorpay configured | Implemented; returns 503 when billing is unconfigured |
| GET | `/api/billing/checkout` | Render Razorpay checkout HTML for a created order | Valid `orderId` and session token supplied in query string | Implemented; bearer-token-in-URL risk; not tested |
| POST | `/api/billing/verify-payment` | Verify payment signature and grant order credits | Yes; order must belong to user | Implemented; concurrency/idempotency needs correction |
| POST | `/api/billing/razorpay-webhook` | Validate signed webhook and process payment events | Valid Razorpay webhook signature | Implemented; unverified against Razorpay |
| GET | `/api/billing/transactions` | Return up to 20 credit transactions | Yes | Implemented |
| GET | `/api/privacy` | Serve static privacy-policy HTML | No | Implemented; content is materially stale |

The server mounts `authMiddleware` before the routes. It resolves a session ID from the bearer header or `sid` cookie, checks expiry and attempts OIDC refresh when needed. Roast credits are decremented with a guarded atomic SQL update. Payment order creation restricts packs to the server-side `PACKS` allowlist. No general API rate limiter was found. Input validation is a mixture of manual checks and selected Zod parsing; `/api/roast` does not use a strict request schema to validate the selected option enums or every AI result field.

## 6. Database inventory

The active Drizzle definitions are in `lib/db/src/schema/`. A read-only inspection of the current development database confirmed these six public tables: `users`, `sessions`, `user_credits`, `credit_transactions`, `roast_logs`, and `payment_orders`.

| Table | Purpose and important fields |
|---|---|
| `users` | OIDC account profile: primary ID, unique nullable email, first/last name, profile image, created/updated timestamps. |
| `sessions` | Browser/mobile session storage: session ID (`sid`), JSON session payload and expiration timestamp. An expiry index is defined. |
| `user_credits` | One row per user; user ID primary key/foreign key with cascade delete, balance (default 5), `free_granted`, updated timestamp. |
| `credit_transactions` | Credit grants, spends, purchases and refunds: ID, user foreign key, type, signed credit count, post-transaction balance, reason, JSON metadata and creation time. |
| `roast_logs` | Per-user roast/refinement telemetry: category, intensity, personality, refinement mode, input preview, token counters, credit count, success/error information and timestamp. The API records a preview of the submitted text, up to 200 characters, including on failed requests. |
| `payment_orders` | Razorpay orders associated with users: provider order/payment IDs and signature, pack, amount in paise, INR currency, credits, status, JSON metadata and created/paid/updated timestamps. User and provider-order indexes are defined. |

Foreign keys from credits, transactions, roast logs and payment orders point to users and use cascade deletion where specified. No account-deletion endpoint or retention/purge job for expired sessions, old payment orders or roast logs was found. The roast *history and full original submitted text* are client-local, but the backend does persist a limited text preview and roast usage metadata. Schema definitions and the checked development database reflect the current PostgreSQL architecture; no versioned Drizzle migration directory was found. `lib/db` provides `drizzle-kit push` and `push-force` commands.

The separate `supabase/schema.sql` defines a legacy, different Supabase profile schema and row-level security policies. Current application auth and credit routes use Replit OIDC and the Drizzle tables instead; the legacy SQL should not be mistaken for the active schema.

## 7. Deployment and operational readiness

- **Replit preview:** API and mobile managed workflows were running. The Expo browser preview bundled successfully and displayed the main app.
- **API checks:** `GET /api/healthz` returned HTTP 200; `GET /api/login` redirected with HTTP 302.
- **Production configuration:** `.replit` selects the `application` router and `autoscale` deployment target. The API artifact includes a production build, Node start command and `/api/healthz` startup health route. The mobile artifact uses an Expo static build/serve script. Presence of those files does not prove production deployment.
- **Production verification:** No current published deployment was verified; no live URL is asserted by this report.
- **Mobile release configuration risk:** `artifacts/mobile/eas.json` hardcodes `brutal-ai-web.replit.app` and a Replit client ID for both preview and production profiles. `artifacts/mobile/app.json` also sets an Expo Router origin to that older domain. The current Replit dev workflow injects runtime domain/client ID, but EAS release profiles select their own hardcoded values. `artifacts/mobile/lib/api.ts` falls back to the same legacy API URL/client ID in builds without the injected values.
- **Environment names referenced by code/config:**
  - Replit-managed: `DATABASE_URL`, `REPL_ID`, and `PORT`.
  - AI service: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`.
  - Optional payments: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
  - Optional OIDC override/logging: `ISSUER_URL`, `LOG_LEVEL`, `NODE_ENV`.
  - Mobile builds/runtime: `EXPO_PUBLIC_DOMAIN`, `EXPO_PUBLIC_REPL_ID`, `REPLIT_DEV_DOMAIN`, `REPLIT_EXPO_DEV_DOMAIN`; the release build helper also checks `REPLIT_INTERNAL_APP_DOMAIN`.
- **Dependencies:** pnpm workspace lockfile is present. Expo’s SDK-compatible dependency check reported no remaining mismatches after its SDK 54 alignment. The API build completed in the running development workflow. No native EAS build was run.
- **Tests:** No automated test suite or workspace `test` script was identified in the inspected source/package scripts. Static typechecks provide some verification but not behavior coverage.

## 8. Bugs, limitations and technical debt

Findings below are based on source/config evidence. Severity indicates likely impact if left unresolved; it is not a substitute for a penetration test, compliance review or payment-provider test.

| Severity | Finding | Evidence and potential impact |
|---|---|---|
| **High** | Payment verification can grant credits more than once under concurrent verification requests. | `/api/billing/verify-payment` reads the order and checks its current status, then later marks it verified and grants credits in a transaction. Unlike the webhook path, its update is not conditional on the prior status still being `created`. Simultaneous requests can both pass the initial read and each grant credits for one payment, creating financial loss. |
| **High** | The checkout URL carries the opaque session token as a query parameter. | The client opens `/api/billing/checkout?orderId=…&authToken=…`; query strings can be retained in browser history and exposed to browser tooling, proxies or other URL handlers. This exposes a bearer credential capable of accessing the session until it expires or is revoked. |
| **High** | Packaged mobile/EAS builds target a legacy app identity and API domain. | EAS preview and production profiles and `app.json` pin another Replit domain/client ID. A release can call the wrong backend or fail OIDC for the imported project, even though the Replit development preview gets current runtime values. |
| **Medium** | The privacy policy contradicts implemented data collection/storage. | `/api/privacy` says accounts are not required, no personal data is collected, and roast data remains on device. In fact, OIDC accounts/sessions, credits, payment and transaction records, and a 200-character roast input preview/error/usage log are stored server-side; roast text is forwarded to the AI provider. This risks misleading users and an inadequate disclosure/consent posture. |
| **Medium** | No API request-rate limiting is configured for AI or other routes. | There is no rate-limiter middleware in `artifacts/api-server/src/app.ts` or its route stack. Each roast consumes a credit and content is length-bounded, but stolen sessions or abusive repeated calls can consume paid credits and create provider load. |
| **Medium** | Payment flow has not been exercised with Razorpay credentials or real provider callbacks. | Source includes create-order, checkout, verification and webhook handlers, but no end-to-end test verifies provider behavior, failure/timeout recovery, reconciliation or double-delivery. Credits and money should not be treated as production-ready based only on code presence. |
| **Medium** | Account removal and server-data retention are absent. | No user deletion/export route or automated retention policy was found. Users cannot request in-app removal of the server-side account, transactions, payment orders or roast telemetry; session expiry is checked on access, but no purge job was found. |
| **Medium** | Local roast history is not account-scoped and is not cleared on sign-out. | History is one AsyncStorage collection for the device and may remain visible across logout or account changes. A shared device can expose prior content to another signed-in user. |
| **Medium** | Root typecheck fails in the separate mockup-sandbox artifact. | `pnpm run typecheck` fails at `artifacts/mockup-sandbox/src/components/ui/calendar.tsx` and `spinner.tsx` because React refs from differing `@types/react` resolutions are incompatible. This blocks the aggregate workspace check even though the mobile and API package checks pass. |
| **Low** | Roast request option values and the complete AI result are not strictly validated. | API accepts arbitrary nonempty category/personality/intensity values (with some prompt fallbacks) and only checks selected result fields after parsing JSON. Unexpected AI output may break downstream UI assumptions. |
| **Low** | The published/static privacy page is dated and its claims are stale. | Its last-updated label says May 2025, while the current data and identity architecture is different. |
| **Low** | UI feedback/platform differences need device testing. | Browser logs include React Native Web deprecation and native-animation fallback warnings. They are warnings, not proof of a user-visible failure; native iOS/Android interactions remain unverified. |
| **Low** | Legacy setup files can mislead maintainers. | `supabase/schema.sql` and some older product/store-listing documentation describe a prior Supabase/no-account architecture. Active source uses Replit OIDC and PostgreSQL instead. |

No security scan or full penetration test was performed; this list is limited to issues directly evidenced by the inspected source/config.

## 9. Verification and testing

**Checks performed**

| Check | Result |
|---|---|
| Read-only source, package, route, schema, deployment and environment-name inspection | Completed |
| Development database table/column catalog queries | Completed, read-only; six current application tables observed |
| `pnpm --filter @workspace/mobile run typecheck` | Passed |
| `pnpm --filter @workspace/api-server run typecheck` | Passed |
| `pnpm run typecheck` | Failed only at mockup-sandbox `calendar.tsx` and `spinner.tsx` with incompatible React ref types; library, API, mobile and scripts checks reported as passing |
| Expo SDK-compatible dependency check | Reported dependencies up to date after SDK-compatible package alignment |
| Current Expo app screenshot, mobile-sized browser preview | Passed; onboarding, roast choices, example chips and tab navigation rendered |
| `GET /api/healthz` via current Replit development domain | HTTP 200, `{"status":"ok"}` |
| `GET /api/login` via current Replit development domain | HTTP 302 OIDC redirect |
| Current API and Expo workflow logs | Both workflows running; Expo web bundle completed and API server logged listening on configured port |
| Automated unit/integration test suite | No project test script or applicable source test suite identified |

**Not performed:** production build/deployment, native iOS/Android build, real user sign-in, mobile OIDC exchange, AI request, Razorpay payment or webhook, account deletion, stress/rate testing, or destructive database action. No payment transaction was created and no AI roast was generated for this audit. The root typecheck failure was documented, not fixed.

## 10. Current product maturity

**Classification: Functional Prototype.**

This is beyond a static mockup: the app renders; the user-facing flow is substantial; OIDC and session code, a database schema, guarded credit deduction, refund code, AI prompts, local history, billing handlers and deployment configuration are present. The Replit preview and basic health/auth-redirect checks work.

The classification stops short of MVP/Beta readiness because the actual sign-in and roast flows were not end-to-end verified, EAS release profiles point at an older app identity, Razorpay is untested and its verification path has a concurrency risk, and the privacy policy does not describe the implemented data handling. The automated test baseline is absent and the aggregate typecheck currently fails in the Canvas package.

| Area | Assessment |
|---|---|
| Feature completeness | Broad prototype-level coverage; account deletion, server-side history/sync, data export and payment refunds are absent |
| Frontend maturity | Polished responsive Expo screen set; preview visually verified; native-device flows unverified |
| Backend maturity | Routes, OIDC/session and persistence code exist; local typecheck and health pass; limited automated coverage |
| Authentication readiness | Browser redirect works; callback/mobile sign-in and release-build identity remain unverified |
| AI readiness | Integration configured and prompt/backend code present; live call, failure/refund and cost behavior unverified |
| Payment readiness | Checkout and webhook code present; not configured/verified and unsafe under concurrent verification |
| Data persistence | Account/credits/payments/log metadata in PostgreSQL; full roast history/settings device-local |
| Security readiness | OIDC PKCE/state/session checks present, but checkout token URL exposure and several launch concerns require remediation |
| Deployment readiness | Replit deployment definitions exist; release mobile identity is stale and a production deployment was not checked |

## 11. Recommended next steps

### P0 — Critical before launch

1. **Bind payment-order verification and credit grant atomically to a single successful status transition.** Make the user-session verification path as race-safe as the webhook path; test duplicate and concurrent delivery.
2. **Remove the opaque session token from the checkout query string.** Use a short-lived, single-purpose checkout handoff or another design that does not put a reusable bearer credential into a URL.
3. **Configure release API and OIDC identities for this project.** Replace the inherited EAS and Expo Router values; verify preview and production builds call the intended API and complete login.
4. **Correct and review the privacy policy before accepting users’ text or payments.** Disclose accounts/sessions, AI-provider processing, roast telemetry/input previews, payment records, local history, retention and available deletion/contact options.

### P1 — Important improvements

1. Add rate and abuse controls for expensive AI routes; define sensible user-level request and spend limits.
2. Add end-to-end tests for browser and mobile OIDC, free grants, credit deduction/refund, result persistence and Razorpay duplicate/failure handling.
3. Implement account deletion/data export and a retention strategy for expired sessions, payment orders and roast logs.
4. Decide whether local history is per-device or per-account. Either scope it by authenticated account and clear/switch it appropriately, or make its device-local/shared-device behavior clear.
5. Resolve the mockup-sandbox React type mismatch so the root typecheck is a reliable green check.
6. Validate API category/intensity/personality and refinement enums and validate the complete AI response against a server-side schema.
7. Test native iOS/Android login, keyboard/safe-area behavior, clipboard, haptics, purchase handoff, error states and accessibility.

### P2 — Future enhancements

1. If users need multiple-device access, add authenticated server-side roast history with clear ownership, delete and retention controls.
2. Add customer-facing purchase-refund/support handling and reconciliation tools for payment orders.
3. Keep the OpenAPI contract in sync with every implemented billing/privacy route and add contract tests.
4. Remove or label superseded Supabase artifacts and reconcile older store-listing/product documentation with current auth, privacy and credit behavior.

## 12. Audit scope and provenance

This report describes the source and development environment as observed on 2026-10-19 at Git commit `ce9cc597cfb307927350212092223319bc2cdc9b`. Source inspection and read-only database metadata queries were used. Environment-variable **names** are listed where relevant; no secret values or personal records are included.

