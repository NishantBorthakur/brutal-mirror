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
2. Mobile: Get auth token from SecureStore, assemble `${apiBase}/api/billing/checkout?orderId=XXX&authToken=YYY`
3. Mobile: `WebBrowser.openAuthSessionAsync(checkoutUrl, 'brutalmirror://')` 
4. Backend: validates authToken + orderId ownership, renders HTML with Razorpay checkout.js
5. HTML: auto-opens Razorpay, on success calls `POST /api/billing/verify-payment` with Bearer authToken
6. Backend: verifies HMAC-SHA256 signature, adds credits in a DB transaction
7. HTML: redirects to `brutalmirror://payment/success?credits=XX&balance=YY`
8. Mobile: detects redirect, updates credits via `updateCreditsBalance(newBalance)`, shows toast

## Security decisions
- Pack prices/credits defined server-side only (`src/lib/razorpay.ts` PACKS config), never trust frontend
- Auth token passed in checkout URL (HTTPS only, opaque session ID — acceptable pattern)
- Idempotency: if same razorpay_order_id already `verified`, return current balance without re-adding credits
- Signature verification: `HMAC-SHA256(key_secret, orderId + "|" + paymentId)` compared with `crypto.timingSafeEqual`
- User can only verify their own orders (userId ownership check in verify-payment endpoint)

## rawBody for webhook
`express.json()` in `app.ts` has a `verify` callback that captures `req.rawBody`. The webhook handler at `POST /api/billing/razorpay-webhook` reads `req.rawBody` (typed as `ReqWithRawBody`) for signature verification. Credits are NOT granted from webhook — only from `/verify-payment` (webhook just updates order status).

## Environment variables required
- `RAZORPAY_KEY_ID` — Razorpay key ID (test: `rzp_test_...`, live: `rzp_live_...`)
- `RAZORPAY_KEY_SECRET` — Razorpay key secret (NEVER expose to frontend)
- `RAZORPAY_WEBHOOK_SECRET` — Razorpay webhook secret (optional, for webhook signature verification)

## DB table
`payment_orders` — tracks every order: userId, razorpayOrderId (unique), razorpayPaymentId, razorpaySignature, packId, amountInPaise, currency, credits, status (created/paid/failed/cancelled/verified), metadata, paidAt.
