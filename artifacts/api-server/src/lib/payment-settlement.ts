import { and, eq, inArray, sql } from "drizzle-orm";
import type { db } from "@workspace/db";
import {
  creditTransactionsTable,
  paymentOrdersTable,
  userCreditsTable,
} from "@workspace/db";
import { PACKS, verifyPaymentSignature } from "./razorpay";

type PaymentDatabase = typeof db;

const FINAL_STATUSES = ["verified", "paid"] as const;
const SETTLEABLE_STATUSES = ["created", "failed"] as const;

export interface PaymentSettlementInput {
  orderId: string;
  paymentId: string;
  expectedUserId?: string;
  checkoutSignature?: string;
  amount?: number;
  currency?: string;
}

export type PaymentSettlementResult =
  | { status: "settled" | "already_settled"; creditsBalance: number }
  | { status: "invalid_signature" | "order_not_found" | "payment_mismatch" | "invalid_order" }
  | { status: "not_owned" }
  | { status: "not_settleable"; orderStatus: string };

function matchesStoredOrder(order: typeof paymentOrdersTable.$inferSelect): boolean {
  const pack = PACKS[order.packId];
  return Boolean(
    pack &&
      order.amountInPaise === pack.amount &&
      order.credits === pack.credits &&
      order.currency === "INR",
  );
}

async function settleCapturedPayment(
  input: PaymentSettlementInput,
  database: PaymentDatabase,
): Promise<PaymentSettlementResult> {
  return database.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(paymentOrdersTable)
      .where(eq(paymentOrdersTable.razorpayOrderId, input.orderId))
      .limit(1);

    if (!order) return { status: "order_not_found" };
    if (input.expectedUserId && order.userId !== input.expectedUserId) {
      return { status: "not_owned" };
    }
    if (!matchesStoredOrder(order)) return { status: "invalid_order" };
    if (
      (input.amount !== undefined && input.amount !== order.amountInPaise) ||
      (input.currency !== undefined && input.currency !== order.currency)
    ) {
      return { status: "invalid_order" };
    }

    if ((FINAL_STATUSES as readonly string[]).includes(order.status)) {
      if (order.razorpayPaymentId && order.razorpayPaymentId !== input.paymentId) {
        return { status: "payment_mismatch" };
      }
      const [credits] = await tx
        .select({ balance: userCreditsTable.balance })
        .from(userCreditsTable)
        .where(eq(userCreditsTable.userId, order.userId));
      return { status: "already_settled", creditsBalance: credits?.balance ?? 0 };
    }

    if (!(SETTLEABLE_STATUSES as readonly string[]).includes(order.status)) {
      return { status: "not_settleable", orderStatus: order.status };
    }

    // This conditional update is the idempotency lock. PostgreSQL rechecks the
    // status predicate after waiting for a competing transaction's row lock, so
    // only one verifier or captured webhook can claim this order.
    const [claimed] = await tx
      .update(paymentOrdersTable)
      .set({
        status: "verified",
        razorpayPaymentId: input.paymentId,
        ...(input.checkoutSignature
          ? { razorpaySignature: input.checkoutSignature }
          : {}),
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(paymentOrdersTable.id, order.id),
          inArray(paymentOrdersTable.status, [...SETTLEABLE_STATUSES]),
        ),
      )
      .returning({ id: paymentOrdersTable.id });

    if (!claimed) {
      // The order changed after the initial read. Read the committed winner
      // and return its balance without issuing another credit or ledger row.
      const [currentOrder] = await tx
        .select()
        .from(paymentOrdersTable)
        .where(eq(paymentOrdersTable.id, order.id))
        .limit(1);

      if (
        currentOrder &&
        (FINAL_STATUSES as readonly string[]).includes(currentOrder.status)
      ) {
        if (
          currentOrder.razorpayPaymentId &&
          currentOrder.razorpayPaymentId !== input.paymentId
        ) {
          return { status: "payment_mismatch" };
        }
        const [credits] = await tx
          .select({ balance: userCreditsTable.balance })
          .from(userCreditsTable)
          .where(eq(userCreditsTable.userId, currentOrder.userId));
        return { status: "already_settled", creditsBalance: credits?.balance ?? 0 };
      }

      return {
        status: "not_settleable",
        orderStatus: currentOrder?.status ?? order.status,
      };
    }

    // Atomic upsert avoids lost balance updates if separate orders for the
    // same user settle concurrently, including the no-existing-row case.
    const [credits] = await tx
      .insert(userCreditsTable)
      .values({
        userId: order.userId,
        balance: order.credits,
        freeGranted: false,
      })
      .onConflictDoUpdate({
        target: userCreditsTable.userId,
        set: {
          balance: sql`${userCreditsTable.balance} + ${order.credits}`,
          updatedAt: new Date(),
        },
      })
      .returning({ balance: userCreditsTable.balance });

    await tx.insert(creditTransactionsTable).values({
      userId: order.userId,
      type: "purchase",
      credits: order.credits,
      balanceAfter: credits!.balance,
      reason: input.checkoutSignature
        ? "Razorpay credit purchase"
        : "Razorpay credit purchase via webhook fallback",
      metadata: {
        razorpay_order_id: input.orderId,
        razorpay_payment_id: input.paymentId,
        pack_id: order.packId,
        amount_in_paise: order.amountInPaise,
        ...(!input.checkoutSignature ? { source: "webhook" } : {}),
      },
    });

    return { status: "settled", creditsBalance: credits!.balance };
  });
}

export async function settleVerifiedPayment(
  input: PaymentSettlementInput & { signature: string; expectedUserId: string },
  database: PaymentDatabase,
): Promise<PaymentSettlementResult> {
  if (!verifyPaymentSignature(input.orderId, input.paymentId, input.signature)) {
    return { status: "invalid_signature" };
  }

  return settleCapturedPayment(
    {
      ...input,
      checkoutSignature: input.signature,
    },
    database,
  );
}

export function settleWebhookPayment(
  input: PaymentSettlementInput,
  database: PaymentDatabase,
): Promise<PaymentSettlementResult> {
  return settleCapturedPayment(input, database);
}

export async function markPaymentOrderFailed(
  orderId: string,
  database: PaymentDatabase,
): Promise<void> {
  // A failure event describes one payment attempt. Never let a delayed failure
  // overwrite a successful settlement; a later captured attempt may recover a
  // failed order through the same atomic settlement path.
  await database
    .update(paymentOrdersTable)
    .set({ status: "failed", updatedAt: new Date() })
    .where(
      and(
        eq(paymentOrdersTable.razorpayOrderId, orderId),
        eq(paymentOrdersTable.status, "created"),
      ),
    );
}
