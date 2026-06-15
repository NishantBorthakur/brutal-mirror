# Brutal Mirror — AI Token Usage & Billing Analysis

## Overview

Every roast is a single API call to `gpt-5.4` via the Replit AI Integrations proxy.
There is no streaming, no batching, and no caching — each tap of **Roast Me** (or a refinement button) is one discrete request.

---

## 1. How the Prompt is Built

Each call sends two messages:

| Message | Role | Description |
|---|---|---|
| System prompt | `system` | Fixed persona, voice rules, safety rules, output format instruction |
| User prompt | `user` | Category + intensity instruction + personality instruction + (optional refinement instruction) + user's content + JSON schema |

### 1a. Fixed Token Costs (same on every call)

| Component | Approx. Tokens |
|---|---|
| System prompt (persona, voice, rules) | **374** |
| JSON output schema (field definitions) | **223** |
| User prompt template glue text | **17** |
| **Fixed subtotal per call** | **≈ 614** |

### 1b. Variable Input Tokens

**Category name** (selected from dropdown)

| Category | Chars | Tokens |
|---|---|---|
| Bio / "Other" | 3–5 chars | ~2 |
| "Instagram Bio", "Startup Idea", etc. | 11–16 chars | ~3–4 |
| "YouTube Channel Idea" (longest) | 20 chars | ~5 |

**Intensity instruction** (injected server-side, user never sees it)

| Intensity | Chars | Tokens |
|---|---|---|
| Harsh | 92 | **23** |
| Honest | 105 | **27** |
| Career-ending | 118 | **30** |
| Brutal | 145 | **37** |

**Personality instruction** (injected server-side)

| Personality | Chars | Tokens |
|---|---|---|
| Creative Director | 246 | **62** |
| Dating Coach | 251 | **63** |
| Internet Troll, but useful | 250 | **63** |
| Savage Mentor | 256 | **64** |
| Resume Recruiter | 262 | **66** |
| Startup Investor | 269 | **68** |

**Refinement instruction** (only on Sharper / Funnier / Professional taps — not on fresh roasts)

| Refinement | Chars | Tokens |
|---|---|---|
| Sharper | 171 | **43** |
| Professional | 206 | **52** |
| Funnier | 231 | **58** |

**User content** (the text they paste)

| Input length | Chars | Tokens |
|---|---|---|
| Minimum allowed | 20 | ~5 |
| Short bio / tweet-length | 100 | ~25 |
| Typical input | 300 | ~75 |
| Long resume summary | 800 | ~200 |
| Maximum allowed | 3,000 | ~750 |

> Rule of thumb: **1 token ≈ 4 characters** (OpenAI average for English text)

---

## 2. Output Token Breakdown

The model always returns the same 7 JSON fields. Token cost scales with input length because `brutalRoast` and `improvedVersion` mirror the depth of the input.

| Field | Typical Tokens | Notes |
|---|---|---|
| `viralOneLiner` | ~25 | Capped at 20 words by instruction |
| `brutalRoast` | 150–500 | 2–4 paragraphs; grows with input complexity |
| `actualDiagnosis` | ~50 | Single paragraph |
| `biggestWeaknesses` | ~70 | 3 bullet points |
| `threeFixes` | ~90 | 3 actionable items |
| `improvedVersion` | 60–750 | Rewrites their input — scales with input length |
| `scoreReport` | ~50 | 6 numeric scores + JSON keys |
| JSON structure overhead | ~100 | Brackets, quotes, commas |
| **Typical output subtotal** | **~635–1,635** | Varies by input length |

`max_completion_tokens` is set to **2,048** in code — this caps output cost and also means very complex inputs could hit the ceiling and get truncated. At 3,000-char inputs you are close to the limit.

---

## 3. Total Token Estimates by Scenario

These are per-call totals (input + output) using median intensity/personality combos.

| Scenario | User Content | Input Tokens | Output Tokens | **Total Tokens** |
|---|---|---|---|---|
| Minimum (bare minimum text) | 20 chars | ~713 | ~595 | **~1,308** |
| Short bio / tweet | 100 chars | ~747 | ~595 | **~1,342** |
| Typical use case | 300 chars | ~792 | ~625 | **~1,417** |
| Long entry (resume, pitch) | 800 chars | ~909 | ~925 | **~1,834** |
| Maximum allowed | 3,000 chars | ~1,465 | ~1,785 | **~3,250** |
| Refinement on typical input | 300 chars | ~836 | ~625 | **~1,461** |

**Working average to plan around: ~1,500 tokens/roast** (covers most real-world usage)

---

## 4. Cost Calculation

### The Formula

```
Cost per roast = (input_tokens × input_price_per_token) + (output_tokens × output_price_per_token)
```

Where:
- `input_price_per_token = model_input_price_per_million / 1,000,000`
- `output_price_per_token = model_output_price_per_million / 1,000,000`

### Sample Cost Table (fill in actual gpt-5.4 price when confirmed)

> ⚠️ `gpt-5.4` pricing must be confirmed from:
> - **Replit AI Integrations** dashboard (your primary vendor)
> - **OpenAI Pricing** page at https://platform.openai.com/docs/pricing
>
> The table below shows three price-tier scenarios so you can slot in the real number.

| Tier | Input $/1M | Output $/1M | Min roast | Typical roast | Max roast |
|---|---|---|---|---|---|
| Low (e.g. GPT-4.1-mini range) | $0.40 | $1.60 | $0.00110 | $0.00131 | $0.00344 |
| Mid (e.g. GPT-4o range) | $2.50 | $10.00 | $0.00773 | $0.00822 | $0.02150 |
| High (e.g. GPT-4.5 / GPT-5 range) | $15.00 | $60.00 | $0.04638 | $0.04935 | $0.12900 |

### Per-roast cost at the "Typical" scenario (300-char input, 1,417 total tokens):

```
At $2.50/$10 (mid):
  input:  792 tokens × $0.0000025  = $0.00198
  output: 625 tokens × $0.0000100  = $0.00625
  total per roast:                 = $0.00823

At $15/$60 (high):
  input:  792 × $0.000015  = $0.01188
  output: 625 × $0.000060  = $0.03750
  total per roast:          = $0.04938
```

---

## 5. Volume Cost Projections

Based on ~1,500 tokens average per roast:

### At mid-tier pricing ($2.50/$10 per million):

| Monthly Roasts | Est. Input Tokens | Est. Output Tokens | Monthly AI Cost |
|---|---|---|---|
| 100 | 79,200 | 62,500 | ~$0.82 |
| 500 | 396,000 | 312,500 | ~$4.11 |
| 1,000 | 792,000 | 625,000 | ~$8.22 |
| 5,000 | 3,960,000 | 3,125,000 | ~$41.10 |
| 10,000 | 7,920,000 | 6,250,000 | ~$82.20 |
| 50,000 | 39,600,000 | 31,250,000 | ~$411.00 |

### At high-tier pricing ($15/$60 per million):

| Monthly Roasts | Monthly AI Cost |
|---|---|
| 100 | ~$4.94 |
| 500 | ~$24.69 |
| 1,000 | ~$49.38 |
| 5,000 | ~$246.90 |
| 10,000 | ~$493.80 |
| 50,000 | ~$2,469.00 |

---

## 6. Cost Multipliers & Edge Cases

### Things that push cost UP:

| Factor | Impact |
|---|---|
| User pastes 3,000-char input (max) | 2.3× the typical roast cost |
| User hits all 3 refinement buttons | 4× the initial roast cost for that session |
| "Career-ending" + "Startup Investor" combo | ~5 extra input tokens vs cheapest combo — negligible |
| Response hits 2,048 token ceiling | Output truncated → wasted API call → user retries → you pay twice |

### Things that keep cost DOWN:

| Factor | Impact |
|---|---|
| Short inputs (bios, one-liners) | Most users will be in the 100–400 char range |
| No streaming = no partial completion waste | You only pay for completed responses |
| History stored locally (AsyncStorage) | No re-querying, no retrieval cost |
| No embeddings, no image calls | Zero additional API usage |

---

## 7. Billing Strategy Recommendations

### Option A — Free tier + paid tier (simplest)

| Tier | Price | Roasts | Your margin at mid pricing |
|---|---|---|---|
| Free | $0 | 3 roasts/month | -$0.025 cost |
| Pro | $4.99/month | Unlimited | ~$4.15 margin at 100 roasts/month |
| Pro | $4.99/month | Unlimited | ~$3.32 margin at 500 roasts/month |

Break-even for a $4.99/month Pro user at mid-tier pricing: they'd need to generate **~600 roasts/month** before you lose money — practically impossible.

### Option B — Credit pack (pay-per-use)

Sell credits rather than subscriptions:

| Pack | Price | Credits | Cost to you (mid) | Your margin |
|---|---|---|---|---|
| Starter pack | $1.99 | 20 roasts | ~$0.16 | ~$1.83 |
| Value pack | $4.99 | 60 roasts | ~$0.49 | ~$4.50 |
| Power pack | $9.99 | 150 roasts | ~$1.23 | ~$8.76 |

### Option C — Free with daily cap (freemium growth)

- 2 free roasts per day (resets midnight)
- No paywall needed initially
- Adds urgency without complexity
- Monetize later via credits or Pro once you have user data

### Option D — Ad-supported free (no payments needed for MVP)

At mid-tier pricing, 1,000 daily active users generating 2 roasts each = **~$16/day in AI costs** ($480/month). A modest interstitial ad after each result at $1–3 CPM on a mobile audience generates enough to cover costs at that scale.

---

## 8. Refinement Call Cost Note

Refinements (Sharper / Funnier / Professional) are **full API calls**, not deltas. Each refinement costs the same as a fresh roast. In the current implementation (after the recent bug fix), refinements **update** the existing history item rather than adding a new one — but you still pay for the API call.

If users repeatedly hit all three refinement buttons, a single "session" costs up to **4× the initial roast** in API spend. Consider rate-limiting refinements or counting them against roast credits.

---

## 9. Action Items Before Launching Billing

1. **Confirm actual gpt-5.4 pricing** — check your Replit AI Integrations dashboard and OpenAI's pricing page. Slot the real numbers into Section 4.
2. **Add usage logging** — log `prompt_tokens` and `completion_tokens` from the OpenAI response object (`response.usage`) to a database so you have real data instead of estimates.
3. **Set per-user rate limits** — the current API has no rate limiting. Before billing, add middleware that enforces roast-per-day limits per device/account.
4. **Decide on refinement billing** — count refinements as full roast credits, or offer them free. A 3-refinement session today costs ~4× one roast.
5. **Consider input length tiers** — the cost difference between a 20-char and 3,000-char input is 2.5×. You may want to cap free users at shorter inputs (e.g., 500 chars) to control costs.

---

*Document generated June 15, 2026. Token estimates use the 4-chars-per-token heuristic (±10–15% variance vs actual tokenizer output). Verify against OpenAI's tiktoken library for exact counts.*
