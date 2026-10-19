---
name: Razorpay integration architecture
description: How Razorpay payments work in Brutal Mirror (Expo + Express), why native SDK was avoided, and key security decisions.
---

## The rule
Use `WebBrowser.openAuthSessionAsync(checkoutUrl, 'brutalmirror://')` instead of `react-native-razorpay` native SDK. Expo managed workflow can't use native modules in Expo Go.

**Why:** `react-native-razorpay` requires native linking; Expo managed workflow doesn't support it without a development build. The WebBrowser approach works in Expo Go and is equally secure.

**How to apply:** Any time the user wants native payment SDKs (Razorpay, Stripe), default to the WebBrowser checkout page approach. The backend serves an HTML page with the SDK's checkout.js that auto-opens, then redirects to the `brutalmirror://` scheme on completion.

## Payment flow
1. Mobile: `POST /api/billing/create-order` (Bearer token) → `{ orderId, amount, currency, keyId, packId, credits, packLabel }`
2. Mobile: the authenticated order response also returns a short-lived, one-use `checkoutToken`; assemble `${apiBase}/api/billing/checkout?orderId=XXX&checkoutToken=YYY`
3. Mobile: `WebBrowser.openAuthSessionAsync(checkoutUrl, 'brutalmirror://')` 
4. Backend: atomically consumes the checkout token for its matching order and renders HTML with Razorpay checkout.js plus a separate one-use verification token
5. HTML: auto-opens Razorpay, on success calls `POST /api/billing/verify-payment` with the verification token in the JSON body, not a session Bearer token
6. Backend: verifies HMAC-SHA256 signature, adds credits in a DB transaction
7. HTML: redirects to `brutalmirror://payment/success?credits=XX&balance=YY`
8. Mobile: detects redirect, updates credits via `updateCreditsBalance(newBalance)`, shows toast

## Security decisions
- Pack prices/credits defined server-side only (`src/lib/razorpay.ts` PACKS config), never trust frontend
- Never place a reusable session token in the checkout URL or checkout HTML. Checkout capabilities are high-entropy, order-scoped, short-lived, stored as hashes, and atomically consumed only by their designated billing endpoints.
- Idempotency: if same razorpay_order_id already `verified`, return current balance without re-adding credits
- Signature verification: `HMAC-SHA256(key_secret, orderId + "|" + paymentId)` compared with `crypto.timingSafeEqual`
- User can only verify their own orders (userId ownership check in verify-payment endpoint)

**Why:** The checkout page must work through Expo WebBrowser without a reusable mobile session credential in its URL or HTML. One-use, database-backed capabilities preserve the browser flow while limiting replay and API scope.

**How to apply:** For Razorpay checkout changes, keep session authentication on the mobile API call that creates an order; pass only the order-specific checkout capability to the checkout page, then use its separate verification capability for payment completion. Never store either capability in the sessions table.

## rawBody for webhook
`express.json()` in `app.ts` has a `verify` callback that captures `req.rawBody`. The webhook handler at `POST /api/billing/razorpay-webhook` reads `req.rawBody` (typed as `ReqWithRawBody`) for signature verification. Credits are NOT granted from webhook — only from `/verify-payment` (webhook just updates order status).

## Environment variables required
- `RAZORPAY_KEY_ID` — Razorpay key ID (test: `rzp_test_...`, live: `rzp_live_...`)
- `RAZORPAY_KEY_SECRET` — Razorpay key secret (NEVER expose to frontend)
- `RAZORPAY_WEBHOOK_SECRET` — Razorpay webhook secret (optional, for webhook signature verification)

## DB table
`payment_orders` — tracks every order: userId, razorpayOrderId (unique), razorpayPaymentId, razorpaySignature, packId, amountInPaise, currency, credits, status (created/paid/failed/cancelled/verified), metadata, paidAt.
