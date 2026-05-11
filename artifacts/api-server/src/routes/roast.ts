import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

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

STYLE EXAMPLES (steal this energy):
- "This sounds like a startup built entirely from LinkedIn buzzwords."
- "Your bio has the personality of airport wallpaper."
- "This feels like you asked AI to generate a personality and forgot to edit it."
- "You're trying to sound premium while saying absolutely nothing."
- "This is the startup equivalent of a participation trophy."
- "You've described the symptoms of a business without actually having one."
- "This dating profile reads like a terms and conditions agreement."
- "You've confused having a goal with having a plan."
- "Bold vision. Zero evidence you've spoken to a human about it."

THE VIRAL ONE-LINER:
This is the most important output. It must be:
- One devastating sentence, max 20 words
- Screenshot-worthy and shareable
- Specific to THEIR content — never generic
- Funny enough to sting, sharp enough to remember
- The kind of line someone screenshots and sends to a group chat

RULES (non-negotiable):
- No hate speech, slurs, or attacks on protected traits (race, gender, religion, sexuality, disability, nationality, etc.)
- No threats, harassment, or content encouraging self-harm or illegal activity
- Brutal is great — cruel without purpose is not
- The roast must be genuinely useful — every critique should point toward improvement

You MUST respond with valid JSON only. No markdown, no code blocks, just raw JSON.`;

const INTENSITY_INSTRUCTIONS: Record<string, string> = {
  Honest:
    "Be direct and firm. Cut the fluff but stay professional. Call out problems clearly without theatrics. Still warm enough to shake hands with afterward.",
  Harsh:
    "No sugarcoating. No softening. State what's wrong and why with surgical precision. The truth, unfiltered.",
  Brutal:
    "Go in. Be savage, witty, and specific. Make it sting. Use comparisons that land. This should feel like getting roasted at a dinner party by the funniest person in the room.",
  "Career-ending":
    "Maximum creative destruction. Pull no punches. Be the most brutally funny, incisive, and sharp version of yourself. Roast them into the next dimension — but keep it constructive and safe. Leave them simultaneously destroyed and enlightened.",
};

router.post("/roast", async (req, res) => {
  const { category, intensity, content } = req.body as {
    category: string;
    intensity: string;
    content: string;
  };

  if (!category || !intensity || !content) {
    res.status(400).json({ error: "category, intensity, and content are required" });
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

  const intensityInstruction =
    INTENSITY_INSTRUCTIONS[intensity] ?? INTENSITY_INSTRUCTIONS["Brutal"];

  const userPrompt = `Category: ${category}
Intensity: ${intensity} — ${intensityInstruction}

Content to roast:
${content}

Respond with a JSON object with EXACTLY these fields:
{
  "viralOneLiner": "One devastating, screenshot-worthy sentence under 20 words. Specific to their content. Make it land.",
  "brutalRoast": "2-4 punchy paragraphs of savage, witty critique. Short sentences. Specific observations. No corporate language. Make every sentence count.",
  "actualDiagnosis": "The real underlying problem. What's actually broken at a deeper level. Be specific and insightful, not vague.",
  "biggestWeaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"],
  "threeFixes": ["concrete, actionable fix 1", "concrete, actionable fix 2", "concrete, actionable fix 3"],
  "improvedVersion": "A sharper, better rewritten version of their input. Show them what good actually looks like."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    let result: unknown;
    try {
      result = JSON.parse(rawContent);
    } catch {
      req.log.error({ rawContent }, "Failed to parse AI JSON response");
      res.status(500).json({ error: "AI returned invalid response format" });
      return;
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error calling OpenAI");
    res.status(500).json({ error: "Failed to generate roast. Please try again." });
  }
});

export default router;
