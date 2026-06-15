import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, userCreditsTable, creditTransactionsTable, roastLogsTable } from "@workspace/db";
import { eq, and, gt, sql } from "drizzle-orm";

const router = Router();

const SYSTEM_PROMPT = `You are Brutal Mirror — an elite AI that sounds like a savage creative director, ruthless startup advisor, and razor-sharp internet critic fused into one terrifying entity. You have seen every bad idea, every buzzword-stuffed bio, every "disruptive" startup that disrupts nothing. You are immune to mediocrity and allergic to corporate vagueness.

YOUR VOICE:
- Short, punchy sentences. No padding. No filler. Every word earns its place.
- Witty comparisons that make people laugh and wince at the same time.
- You expose the gap between what someone thinks they're saying and what they're actually communicating.
- You sound like a person with taste, not a press release with opinions.
- You never repeat the same critique twice. Each sentence adds new, targeted damage.
- You are emotionally intelligent — you care enough to tell the brutal truth.
- You are observant, specific, and devastatingly accurate.

THE VIRAL ONE-LINER:
One devastating sentence, max 20 words. Screenshot-worthy. Specific to THEIR content. The kind of line someone screenshots and sends to a group chat.

RULES (non-negotiable):
- No hate speech, slurs, or attacks on protected traits (race, gender, religion, sexuality, disability, nationality, etc.)
- No threats, harassment, or content encouraging self-harm or illegal activity
- Brutal is great — cruel without purpose is not
- Every critique must point toward genuine improvement

You MUST respond with valid JSON only. No markdown, no code blocks, just raw JSON.`;

const INTENSITY_INSTRUCTIONS: Record<string, string> = {
  Honest: "Be direct and firm. Cut the fluff but stay professional. Still warm enough to shake hands with afterward.",
  Harsh: "No sugarcoating. State what's wrong and why with surgical precision. The truth, unfiltered.",
  Brutal: "Go in. Be savage, witty, and specific. Make it sting. This should feel like getting roasted at a dinner party by the funniest person in the room.",
  "Career-ending": "Maximum creative destruction. Pull no punches. Roast them into the next dimension — but keep it constructive and safe.",
};

const PERSONALITY_INSTRUCTIONS: Record<string, string> = {
  "Savage Mentor":
    "You are a savage but deeply growth-focused mentor. You tear apart the work, but every critique points toward real improvement. Think brutally honest mentor who genuinely wants them to succeed — they hear the roast AND leave knowing exactly what to do next.",
  "Startup Investor":
    "You are a sharp-eyed startup investor evaluating for investment. Focus on: market size, differentiation, competitive moat, business model viability, and whether this solves a real problem worth paying for. Be blunt about why you'd pass or invest. No time for fluff.",
  "Creative Director":
    "You are an award-winning creative director with impossibly high standards of taste. Focus on: originality, visual/verbal identity, clarity of message, memorability, and whether it stands out or blends into noise. You hate generic. You love sharp.",
  "Dating Coach":
    "You are a no-nonsense dating coach who has seen every cringe profile imaginable. Focus on: attraction signals, specificity vs genericness, confidence, personality coming through, and whether this would actually make someone want to know more. Be real.",
  "Resume Recruiter":
    "You are a senior recruiter who has reviewed thousands of resumes with zero patience for filler. Focus on: credibility signals, quantified outcomes, specificity, and whether this reads as a top performer or just another applicant. Cut through the corporate speak.",
  "Internet Troll, but useful":
    "You are the internet's most constructive troll — funnier and meaner than the other modes, but you always end with something genuinely useful. Use memes, analogies, and internet-level humor. Roast them into oblivion but leave them with actionable gold.",
};

const REFINEMENT_INSTRUCTIONS: Record<string, string> = {
  sharper:
    "REFINEMENT MODE — SHARPER: Make every critique MORE direct, MORE cutting, and MORE precise. Remove any softness. Be surgical. Each sentence should land harder than before.",
  funnier:
    "REFINEMENT MODE — FUNNIER: Make the critique FUNNIER and more meme-worthy. Use more witty analogies, pop culture comparisons, and internet-level observations. Make it the kind of thing someone screenshots and sends to a group chat.",
  professional:
    "REFINEMENT MODE — PROFESSIONAL: Less savage, more strategic. Feedback should read like it's from a senior consultant rather than a roaster. Still direct and critical, but more polished and business-useful.",
};

router.post("/roast", async (req, res) => {
  const { category, intensity, content, personality, refinementMode } =
    req.body as {
      category: string;
      intensity: string;
      content: string;
      personality: string;
      refinementMode?: string;
    };

  if (!category || !intensity || !content || !personality) {
    res.status(400).json({ error: "category, intensity, content, and personality are required" });
    return;
  }

  if (content.length < 20) {
    res.status(400).json({ error: "Content must be at least 20 characters" });
    return;
  }

  if (content.length > 3000) {
    res.status(400).json({ error: "Content must be 3000 characters or fewer" });
    return;
  }

  // ── Auth check ──────────────────────────────────────────────
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "AUTH_REQUIRED", message: "Sign in to generate roasts." });
    return;
  }

  const userId = req.user.id;

  // ── Atomic credit deduction ───────────────────────────────────
  // Deduct before calling AI so concurrent requests cannot both pass a balance=1
  // check and both consume a credit for free (TOCTOU race). The WHERE balance > 0
  // guard makes the UPDATE a no-op if out of credits; RETURNING tells us the new
  // balance without a separate SELECT.
  const deducted = await db
    .update(userCreditsTable)
    .set({ balance: sql`${userCreditsTable.balance} - 1`, updatedAt: new Date() })
    .where(and(eq(userCreditsTable.userId, userId), gt(userCreditsTable.balance, 0)))
    .returning({ balance: userCreditsTable.balance });

  if (deducted.length === 0) {
    res.status(402).json({ error: "OUT_OF_CREDITS", message: "You are out of credits." });
    return;
  }

  const newBalance = deducted[0]!.balance;

  // ── Build prompts ────────────────────────────────────────────
  const intensityInstruction =
    INTENSITY_INSTRUCTIONS[intensity] ?? INTENSITY_INSTRUCTIONS["Brutal"]!;
  const personalityInstruction =
    PERSONALITY_INSTRUCTIONS[personality] ?? PERSONALITY_INSTRUCTIONS["Savage Mentor"]!;
  const refinementInstruction = refinementMode
    ? `\n\n${REFINEMENT_INSTRUCTIONS[refinementMode] ?? ""}`
    : "";

  const userPrompt = `Category: ${category}
Intensity: ${intensity} — ${intensityInstruction}
Personality Mode: ${personality} — ${personalityInstruction}${refinementInstruction}

Content to roast:
${content}

Respond with a JSON object with EXACTLY these fields:
{
  "viralOneLiner": "One devastating, screenshot-worthy sentence under 20 words. Specific to their content. Make it land.",
  "brutalRoast": "2-4 punchy paragraphs of savage, witty critique in the specified personality style. Short sentences. No corporate language.",
  "actualDiagnosis": "The real underlying problem at a deeper level. Specific and insightful.",
  "biggestWeaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"],
  "threeFixes": ["concrete, actionable fix 1", "concrete, actionable fix 2", "concrete, actionable fix 3"],
  "improvedVersion": "A sharper, better rewritten version of their input. Show them what good actually looks like.",
  "scoreReport": {
    "overallRoastScore": <0-100, how badly this deserved to be roasted>,
    "clarity": <0-100, how clear and understandable the input is>,
    "originality": <0-100, how fresh and unique it feels>,
    "marketability": <0-100, how appealing or useful it is to others>,
    "cringeLevel": <0-100, how generic, embarrassing, or weak it sounds>,
    "fixability": <0-100, how easy it would be to significantly improve>
  }
}`;

  const inputPreview = content.slice(0, 200);

  // ── AI generation ────────────────────────────────────────────
  // Credit is already deducted. On any failure path, refund it.
  try {
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = aiResponse.choices[0]?.message?.content;
    if (!rawContent) {
      await refundCredit(userId, newBalance, { category, intensity, personality, refinementMode });
      void logFailedRoast(req, userId, { category, intensity, personality, refinementMode, inputPreview, errorMessage: "No response from AI" });
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(rawContent) as Record<string, unknown>;
    } catch {
      req.log.error({ rawContent }, "Failed to parse AI JSON response");
      await refundCredit(userId, newBalance, { category, intensity, personality, refinementMode });
      void logFailedRoast(req, userId, { category, intensity, personality, refinementMode, inputPreview, errorMessage: "Invalid JSON from AI" });
      res.status(500).json({ error: "AI returned invalid response format" });
      return;
    }

    // ── Log usage ────────────────────────────────────────────
    // Balance was already atomically decremented above; just record the audit rows.
    try {
      await db.transaction(async (tx) => {
        await tx.insert(creditTransactionsTable).values({
          userId,
          type: "usage",
          credits: -1,
          balanceAfter: newBalance,
          reason: refinementMode ? "Roast refinement" : "Roast generation",
          metadata: { category, intensity, personality, refinementMode: refinementMode ?? null },
        });

        await tx.insert(roastLogsTable).values({
          userId,
          category,
          intensity,
          personality,
          refinementMode: refinementMode ?? null,
          inputPreview,
          inputTokens: aiResponse.usage?.prompt_tokens ?? 0,
          outputTokens: aiResponse.usage?.completion_tokens ?? 0,
          totalTokens: aiResponse.usage?.total_tokens ?? 0,
          creditsUsed: 1,
          success: true,
        });
      });
    } catch (dbErr) {
      req.log.error({ err: dbErr }, "Failed to record credit transaction");
    }

    res.json({ ...result, creditsRemaining: newBalance });
  } catch (err) {
    req.log.error({ err }, "Error calling OpenAI");
    await refundCredit(userId, newBalance, { category, intensity, personality, refinementMode });
    void logFailedRoast(req, userId, { category, intensity, personality, refinementMode, inputPreview, errorMessage: String(err) });
    res.status(500).json({ error: "Failed to generate roast. Please try again." });
  }
});

async function refundCredit(
  userId: string,
  balanceAfterDeduction: number,
  meta: { category: string; intensity: string; personality: string; refinementMode?: string },
) {
  try {
    await db
      .update(userCreditsTable)
      .set({ balance: sql`${userCreditsTable.balance} + 1`, updatedAt: new Date() })
      .where(eq(userCreditsTable.userId, userId));

    await db.insert(creditTransactionsTable).values({
      userId,
      type: "refund",
      credits: 1,
      balanceAfter: balanceAfterDeduction + 1,
      reason: "AI call failed — credit refunded",
      metadata: { ...meta, refinementMode: meta.refinementMode ?? null },
    });
  } catch {
    // Best-effort — log handled by caller
  }
}

async function logFailedRoast(
  req: { log: { error: (obj: unknown, msg: string) => void } },
  userId: string,
  opts: {
    category: string;
    intensity: string;
    personality: string;
    refinementMode?: string;
    inputPreview: string;
    errorMessage: string;
  }
) {
  try {
    await db.insert(roastLogsTable).values({
      userId,
      category: opts.category,
      intensity: opts.intensity,
      personality: opts.personality,
      refinementMode: opts.refinementMode ?? null,
      inputPreview: opts.inputPreview,
      success: false,
      errorMessage: opts.errorMessage.slice(0, 500),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to log failed roast");
  }
}

export default router;
