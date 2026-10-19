import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_ROAST_FAILURE_MESSAGE,
  parseAIRoastOutput,
  validateAIRoastOutput,
} from "../src/lib/roast-response.js";

const validRoast = {
  viralOneLiner:
    "Your launch plan is a fog machine pointed at an empty stage.",
  brutalRoast: "The pitch is all noise and no signal.",
  actualDiagnosis: "The offer is too vague to earn anyone's attention.",
  biggestWeaknesses: [
    "The audience is undefined.",
    "The benefit is unclear.",
    "The proof is missing.",
  ],
  threeFixes: [
    "Name one specific customer.",
    "State the outcome in plain language.",
    "Add evidence that the offer works.",
  ],
  improvedVersion: "A focused, measurable offer for a specific customer.",
  scoreReport: {
    overallRoastScore: 0,
    clarity: 100,
    originality: 50,
    marketability: 75,
    cringeLevel: 25,
    fixability: 90,
  },
};

test("accepts a complete response with scores at the allowed boundaries", () => {
  const parsed = parseAIRoastOutput(JSON.stringify(validRoast));

  assert.deepEqual(parsed, { success: true, data: validRoast });
});

test("rejects missing required response fields", () => {
  const fields = [
    "viralOneLiner",
    "brutalRoast",
    "actualDiagnosis",
    "biggestWeaknesses",
    "threeFixes",
    "improvedVersion",
    "scoreReport",
  ] as const;

  for (const field of fields) {
    const incomplete = { ...validRoast };
    delete (incomplete as Record<string, unknown>)[field];

    assert.deepEqual(parseAIRoastOutput(JSON.stringify(incomplete)), {
      success: false,
      reason: "invalid_schema",
    });
  }
});

test("rejects empty and malformed JSON responses", () => {
  assert.deepEqual(parseAIRoastOutput(null), {
    success: false,
    reason: "empty_response",
  });
  assert.deepEqual(parseAIRoastOutput(" \n "), {
    success: false,
    reason: "empty_response",
  });
  assert.deepEqual(parseAIRoastOutput("{not-json"), {
    success: false,
    reason: "invalid_json",
  });
});

test("rejects incorrect field types, blank text, and malformed arrays", () => {
  const wrongTypes = {
    ...validRoast,
    actualDiagnosis: 123,
  };
  const blankText = {
    ...validRoast,
    brutalRoast: "   ",
  };
  const wrongWeaknessCount = {
    ...validRoast,
    biggestWeaknesses: ["Only one"],
  };
  const wrongFixCount = {
    ...validRoast,
    threeFixes: ["One", "Two", "Three", "Four"],
  };
  const blankArrayItem = {
    ...validRoast,
    threeFixes: ["First", "  ", "Third"],
  };
  const tooManyOneLinerWords = {
    ...validRoast,
    viralOneLiner:
      "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty one",
  };

  for (const invalid of [
    wrongTypes,
    blankText,
    wrongWeaknessCount,
    wrongFixCount,
    blankArrayItem,
    tooManyOneLinerWords,
  ]) {
    assert.equal(parseAIRoastOutput(JSON.stringify(invalid)).success, false);
  }
});

test("rejects non-finite, non-integer, and out-of-range score metrics", () => {
  const invalidScores = [Number.NaN, Infinity, -Infinity, -1, 101, 50.5];

  for (const score of invalidScores) {
    const invalid = {
      ...validRoast,
      scoreReport: { ...validRoast.scoreReport, clarity: score },
    };
    assert.deepEqual(parseAIRoastOutput(invalid), {
      success: false,
      reason: "invalid_schema",
    });
  }
});

test("rejects missing score metrics and unexpected AI-supplied fields", () => {
  const missingMetric = {
    ...validRoast,
    scoreReport: {
      overallRoastScore: 60,
      clarity: 70,
      originality: 80,
      marketability: 90,
      cringeLevel: 40,
    },
  };

  assert.equal(parseAIRoastOutput(missingMetric).success, false);
  assert.equal(
    parseAIRoastOutput(JSON.stringify({ ...validRoast, creditsRemaining: 999 }))
      .success,
    false,
  );
  assert.equal(
    parseAIRoastOutput({
      ...validRoast,
      scoreReport: { ...validRoast.scoreReport, unexpected: 1 },
    }).success,
    false,
  );
});

test("refunds empty, malformed, and invalid responses with a safe generic error", async () => {
  const invalidResponses = [
    { raw: null, reason: "empty_response" },
    { raw: "{malformed", reason: "invalid_json" },
    {
      raw: JSON.stringify({
        ...validRoast,
        scoreReport: { ...validRoast.scoreReport, clarity: 101 },
      }),
      reason: "invalid_schema",
    },
  ] as const;

  for (const { raw, reason } of invalidResponses) {
    const refundReasons: string[] = [];
    const result = await validateAIRoastOutput(raw, async (failureReason) => {
      refundReasons.push(failureReason);
    });

    assert.deepEqual(refundReasons, [reason]);
    assert.deepEqual(result, {
      success: false,
      reason,
      error: AI_ROAST_FAILURE_MESSAGE,
    });
    assert.equal("data" in result, false);
  }
});

test("does not refund valid responses", async () => {
  let refundCount = 0;
  const result = await validateAIRoastOutput(JSON.stringify(validRoast), async () => {
    refundCount += 1;
  });

  assert.deepEqual(result, { success: true, data: validRoast });
  assert.equal(refundCount, 0);
});
