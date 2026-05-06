import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `You are Brutal Mirror, an elite brutally honest critique assistant. Your job is to give sharp, direct, uncomfortable but useful feedback. Be witty, savage, and memorable, but do not use hate speech, slurs, threats, sexual harassment, or target protected traits. Never encourage self-harm or illegal activity. Your feedback must be harsh but constructive. Always include a better version of the user's input.

You MUST respond with valid JSON only. No markdown, no code blocks, just raw JSON.`;

const INTENSITY_INSTRUCTIONS: Record<string, string> = {
  Honest: "Be direct but professional. Constructive criticism with a firm tone.",
  Harsh: "Be sharper and more blunt. No sugarcoating. Call out flaws directly.",
  Brutal: "Be savage, witty, and uncomfortable. Make it sting but still useful.",
  "Career-ending":
    "Be extremely sharp and funny — roast them into oblivion, but keep it constructive and safe. This is the most savage level.",
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
    INTENSITY_INSTRUCTIONS[intensity] || INTENSITY_INSTRUCTIONS["Brutal"];

  const userPrompt = `Category: ${category}
Intensity: ${intensity} — ${intensityInstruction}

Content to roast:
${content}

Respond with a JSON object with exactly these fields:
{
  "brutalRoast": "The main savage roast paragraph",
  "actualDiagnosis": "The real underlying issue diagnosed",
  "biggestWeaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "threeFixes": ["fix 1", "fix 2", "fix 3"],
  "improvedVersion": "A sharper, better version of their input"
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
