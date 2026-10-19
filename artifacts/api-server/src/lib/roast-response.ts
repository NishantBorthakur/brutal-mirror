import { CreateRoastResponse } from "@workspace/api-zod";
import type { RoastResult } from "@workspace/api-zod";

export const AI_ROAST_FAILURE_MESSAGE =
  "Failed to generate roast. Please try again.";

export type AIResponseFailureReason =
  | "empty_response"
  | "invalid_json"
  | "invalid_schema";

export type ValidatedAIRoast = Omit<RoastResult, "creditsRemaining">;

export type ParsedAIRoast =
  | { success: true; data: ValidatedAIRoast }
  | { success: false; reason: AIResponseFailureReason };

export type ValidatedAIRoastResult =
  | { success: true; data: ValidatedAIRoast }
  | {
      success: false;
      reason: AIResponseFailureReason;
      error: typeof AI_ROAST_FAILURE_MESSAGE;
    };

const aiRoastResponseSchema = CreateRoastResponse.omit({
  creditsRemaining: true,
})
  .extend({
    scoreReport: CreateRoastResponse.shape.scoreReport.strict(),
  })
  .strict()
  .superRefine((response, context) => {
    const textFields = [
      ["viralOneLiner", response.viralOneLiner],
      ["brutalRoast", response.brutalRoast],
      ["actualDiagnosis", response.actualDiagnosis],
      ["improvedVersion", response.improvedVersion],
    ] as const;

    for (const [field, value] of textFields) {
      if (value.trim().length === 0) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Must not be blank",
        });
      }
    }

    if (response.viralOneLiner.trim().split(/\s+/).length > 20) {
      context.addIssue({
        code: "custom",
        path: ["viralOneLiner"],
        message: "Must contain no more than 20 words",
      });
    }

    for (const field of ["biggestWeaknesses", "threeFixes"] as const) {
      response[field].forEach((item, index) => {
        if (item.trim().length === 0) {
          context.addIssue({
            code: "custom",
            path: [field, index],
            message: "Must not be blank",
          });
        }
      });
    }
  });

export function validateAIRoastPayload(payload: unknown): ParsedAIRoast {
  const result = aiRoastResponseSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, reason: "invalid_schema" };
  }

  return { success: true, data: result.data };
}

export function parseAIRoastOutput(raw: unknown): ParsedAIRoast {
  if (raw === null || raw === undefined) {
    return { success: false, reason: "empty_response" };
  }

  if (typeof raw !== "string") {
    return validateAIRoastPayload(raw);
  }

  if (raw.trim().length === 0) {
    return { success: false, reason: "empty_response" };
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return { success: false, reason: "invalid_json" };
  }

  return validateAIRoastPayload(decoded);
}

export async function validateAIRoastOutput(
  raw: unknown,
  onValidationFailure: (reason: AIResponseFailureReason) => Promise<void>,
): Promise<ValidatedAIRoastResult> {
  const parsed = parseAIRoastOutput(raw);
  if (parsed.success) {
    return parsed;
  }

  await onValidationFailure(parsed.reason);
  return {
    ...parsed,
    error: AI_ROAST_FAILURE_MESSAGE,
  };
}
