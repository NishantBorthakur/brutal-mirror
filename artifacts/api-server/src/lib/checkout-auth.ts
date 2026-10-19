import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { db } from "@workspace/db";
import {
  checkoutAuthorizationsTable,
  paymentOrdersTable,
} from "@workspace/db";

type CheckoutDatabase = typeof db;
type CheckoutAuthorizationUpdater = Pick<CheckoutDatabase, "update">;

export const CHECKOUT_AUTH_TTL_MS = 10 * 60 * 1000;
export const PAYMENT_VERIFICATION_AUTH_TTL_MS = 30 * 60 * 1000;

export function createCheckoutAuthorizationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashCheckoutAuthorizationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isCheckoutAuthorizationToken(
  token: unknown,
): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export type CheckoutAuthorizationResult =
  | {
      status: "authorized";
      order: typeof paymentOrdersTable.$inferSelect;
      verificationToken: string;
    }
  | { status: "invalid" | "order_unavailable" };

export async function consumeCheckoutAuthorization(
  orderId: string,
  token: string,
  database: CheckoutDatabase,
): Promise<CheckoutAuthorizationResult> {
  if (!isCheckoutAuthorizationToken(token)) return { status: "invalid" };

  const tokenHash = hashCheckoutAuthorizationToken(token);
  const now = new Date();
  const verificationToken = createCheckoutAuthorizationToken();

  return database.transaction(async (tx) => {
    const [row] = await tx
      .select({
        authorizationId: checkoutAuthorizationsTable.id,
        order: paymentOrdersTable,
      })
      .from(checkoutAuthorizationsTable)
      .innerJoin(
        paymentOrdersTable,
        eq(checkoutAuthorizationsTable.paymentOrderId, paymentOrdersTable.id),
      )
      .where(
        and(
          eq(checkoutAuthorizationsTable.checkoutTokenHash, tokenHash),
          eq(paymentOrdersTable.razorpayOrderId, orderId),
          eq(checkoutAuthorizationsTable.userId, paymentOrdersTable.userId),
          isNull(checkoutAuthorizationsTable.checkoutConsumedAt),
          gt(checkoutAuthorizationsTable.checkoutExpiresAt, now),
        ),
      )
      .limit(1);

    if (!row) return { status: "invalid" };
    if (row.order.status !== "created") return { status: "order_unavailable" };

    const [claimed] = await tx
      .update(checkoutAuthorizationsTable)
      .set({
        checkoutConsumedAt: now,
        verificationTokenHash:
          hashCheckoutAuthorizationToken(verificationToken),
        verificationExpiresAt: new Date(
          now.getTime() + PAYMENT_VERIFICATION_AUTH_TTL_MS,
        ),
      })
      .where(
        and(
          eq(checkoutAuthorizationsTable.id, row.authorizationId),
          eq(checkoutAuthorizationsTable.paymentOrderId, row.order.id),
          isNull(checkoutAuthorizationsTable.checkoutConsumedAt),
          gt(checkoutAuthorizationsTable.checkoutExpiresAt, now),
        ),
      )
      .returning({ id: checkoutAuthorizationsTable.id });

    if (!claimed) return { status: "invalid" };

    return {
      status: "authorized",
      order: row.order,
      verificationToken,
    };
  });
}

export async function claimPaymentVerificationAuthorization(
  executor: CheckoutAuthorizationUpdater,
  paymentOrderId: string,
  expectedUserId: string,
  token: string,
): Promise<boolean> {
  if (!isCheckoutAuthorizationToken(token)) return false;

  const [claimed] = await executor
    .update(checkoutAuthorizationsTable)
    .set({ verificationConsumedAt: new Date() })
    .where(
      and(
        eq(checkoutAuthorizationsTable.paymentOrderId, paymentOrderId),
        eq(checkoutAuthorizationsTable.userId, expectedUserId),
        eq(
          checkoutAuthorizationsTable.verificationTokenHash,
          hashCheckoutAuthorizationToken(token),
        ),
        isNull(checkoutAuthorizationsTable.verificationConsumedAt),
        gt(checkoutAuthorizationsTable.verificationExpiresAt, new Date()),
      ),
    )
    .returning({ id: checkoutAuthorizationsTable.id });

  return Boolean(claimed);
}
