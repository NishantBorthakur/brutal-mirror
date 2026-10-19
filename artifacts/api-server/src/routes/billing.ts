import { Router, type Request, type Response } from "express";
import {
  db,
  paymentOrdersTable,
  userCreditsTable,
  creditTransactionsTable,
  checkoutAuthorizationsTable,
} from "@workspace/db";
import { eq, and, ne, desc } from "drizzle-orm";
import {
  PACKS,
  getRazorpayInstance,
  isRazorpayConfigured,
  verifyPaymentSignature,
  verifyWebhookSignature,
  generateCheckoutHtml,
} from "../lib/razorpay";
import {
  CHECKOUT_AUTH_TTL_MS,
  claimPaymentVerificationAuthorization,
  consumeCheckoutAuthorization,
  createCheckoutAuthorizationToken,
  hashCheckoutAuthorizationToken,
  isCheckoutAuthorizationToken,
} from "../lib/checkout-auth";

type ReqWithRawBody = Request & { rawBody?: string };

const router = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "localhost";
  return `${proto}://${host}`;
}

// POST /api/billing/create-order
router.post("/billing/create-order", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "AUTH_REQUIRED" });
    return;
  }
  if (!isRazorpayConfigured()) {
    res.status(503).json({ error: "Billing is not available yet." });
    return;
  }

  const { packId } = req.body as { packId?: string };
  const pack = packId ? PACKS[packId] : undefined;
  if (!pack) {
    res.status(400).json({ error: "Invalid pack ID. Use: starter, value, or power." });
    return;
  }

  const checkoutToken = createCheckoutAuthorizationToken();
  try {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: pack.amount,
      currency: "INR",
      receipt: `bm_${Date.now()}`,
    });

    await db.transaction(async (tx) => {
      const [paymentOrder] = await tx
        .insert(paymentOrdersTable)
        .values({
          userId: req.user.id,
          razorpayOrderId: order.id,
          packId: packId!,
          amountInPaise: pack.amount,
          currency: "INR",
          credits: pack.credits,
          status: "created",
          metadata: { packLabel: pack.label },
        })
        .returning({ id: paymentOrdersTable.id });

      if (!paymentOrder) {
        throw new Error("Failed to persist the Razorpay order.");
      }

      await tx.insert(checkoutAuthorizationsTable).values({
        paymentOrderId: paymentOrder.id,
        userId: req.user.id,
        checkoutTokenHash: hashCheckoutAuthorizationToken(checkoutToken),
        checkoutExpiresAt: new Date(Date.now() + CHECKOUT_AUTH_TTL_MS),
      });
    });

    res.setHeader("Cache-Control", "no-store");
    res.json({
      orderId: order.id,
      amount: pack.amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      packId,
      credits: pack.credits,
      packLabel: pack.label,
      checkoutToken,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create Razorpay order");
    res.status(500).json({ error: "Failed to create payment order. Please try again." });
  }
});

// GET /api/billing/checkout — renders HTML checkout page
router.get("/billing/checkout", async (req: Request, res: Response) => {
  const { orderId, checkoutToken } = req.query as {
    orderId?: string;
    checkoutToken?: string;
  };
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (!orderId) {
    res.status(400).send("<p>Missing checkout order.</p>");
    return;
  }
  if (!isCheckoutAuthorizationToken(checkoutToken)) {
    res.status(401).send("<p>Invalid or expired checkout authorization.</p>");
    return;
  }
  if (!isRazorpayConfigured()) {
    res.status(503).send("<p>Billing is not configured.</p>");
    return;
  }

  const authorization = await consumeCheckoutAuthorization(
    orderId,
    checkoutToken,
    db,
  );
  if (authorization.status !== "authorized") {
    if (authorization.status === "order_unavailable") {
      res.status(409).send("<p>This order has already been processed.</p>");
    } else {
      res.status(401).send("<p>Invalid, expired, or already used checkout authorization.</p>");
    }
    return;
  }

  const { order, verificationToken } = authorization;
  const html = generateCheckoutHtml({
    keyId: process.env.RAZORPAY_KEY_ID!,
    orderId: order.razorpayOrderId,
    amount: order.amountInPaise,
    currency: order.currency,
    packLabel: ((order.metadata as Record<string, unknown>).packLabel as string | undefined) ?? order.packId,
    credits: order.credits,
    verificationToken,
    apiBase: getOrigin(req),
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
});

// POST /api/billing/verify-payment
router.post("/billing/verify-payment", async (req: Request, res: Response) => {
  const authenticatedUserId = req.isAuthenticated() ? req.user.id : null;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    checkoutVerificationToken,
  } = req.body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    checkoutVerificationToken?: string;
  };

  if (
    checkoutVerificationToken !== undefined &&
    !isCheckoutAuthorizationToken(checkoutVerificationToken)
  ) {
    res.status(401).json({ error: "Invalid or expired checkout authorization." });
    return;
  }
  if (!authenticatedUserId && !checkoutVerificationToken) {
    res.status(401).json({ error: "AUTH_REQUIRED" });
    return;
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: "Missing payment credentials." });
    return;
  }

  const [order] = await db
    .select()
    .from(paymentOrdersTable)
    .where(eq(paymentOrdersTable.razorpayOrderId, razorpay_order_id));

  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  if (authenticatedUserId && order.userId !== authenticatedUserId) {
    res.status(403).json({ error: "This order does not belong to your account." });
    return;
  }

  // Idempotency — already verified, return current balance
  if (
    !checkoutVerificationToken &&
    (order.status === "verified" || order.status === "paid")
  ) {
    const [credits] = await db
      .select()
      .from(userCreditsTable)
      .where(eq(userCreditsTable.userId, order.userId));
    res.json({ success: true, creditsBalance: credits?.balance ?? 0, alreadyVerified: true });
    return;
  }

  const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!isValid) {
    if (authenticatedUserId && !checkoutVerificationToken) {
      await db
        .update(paymentOrdersTable)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(paymentOrdersTable.id, order.id));
    }
    res.status(400).json({ error: "Payment signature verification failed." });
    return;
  }

  const [currentCredits] = await db
    .select()
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, order.userId));

  const currentBalance = currentCredits?.balance ?? 0;
  const newBalance = currentBalance + order.credits;

  const result = await db.transaction(async (tx) => {
    if (checkoutVerificationToken) {
      const authorized = await claimPaymentVerificationAuthorization(
        tx,
        order.id,
        order.userId,
        checkoutVerificationToken,
      );
      if (!authorized) return { status: "invalid_authorization" as const };
    }

    if (order.status === "verified" || order.status === "paid") {
      const [credits] = await tx
        .select()
        .from(userCreditsTable)
        .where(eq(userCreditsTable.userId, order.userId));
      return {
        status: "already_verified" as const,
        creditsBalance: credits?.balance ?? 0,
      };
    }

    await tx
      .update(paymentOrdersTable)
      .set({
        status: "verified",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentOrdersTable.id, order.id));

    if (currentCredits) {
      await tx
        .update(userCreditsTable)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(userCreditsTable.userId, order.userId));
    } else {
      await tx.insert(userCreditsTable).values({
        userId: order.userId,
        balance: newBalance,
        freeGranted: false,
      });
    }

    await tx.insert(creditTransactionsTable).values({
      userId: order.userId,
      type: "purchase",
      credits: order.credits,
      balanceAfter: newBalance,
      reason: "Razorpay credit purchase",
      metadata: {
        razorpay_order_id,
        razorpay_payment_id,
        pack_id: order.packId,
        amount_in_paise: order.amountInPaise,
      },
    });

    return { status: "verified" as const, creditsBalance: newBalance };
  });

  if (result.status === "invalid_authorization") {
    res.status(401).json({ error: "Invalid, expired, or already used checkout authorization." });
    return;
  }

  res.json({
    success: true,
    creditsBalance: result.creditsBalance,
    ...(result.status === "already_verified" ? { alreadyVerified: true } : {}),
  });
});

// POST /api/billing/razorpay-webhook
router.post("/billing/razorpay-webhook", (req: ReqWithRawBody, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  const rawBody = req.rawBody ?? JSON.stringify(req.body);

  // Signature is mandatory — every legitimate Razorpay delivery includes it.
  if (!signature) {
    res.status(400).json({ error: "Missing webhook signature." });
    return;
  }
  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(400).json({ error: "Invalid webhook signature." });
    return;
  }

  // Respond immediately — Razorpay requires 2XX within 5 seconds.
  res.json({ received: true });

  // Process in background after the response is flushed.
  const event = req.body as {
    event?: string;
    payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
  };

  const entity = event?.payload?.payment?.entity;
  const razorpayOrderId = entity?.order_id;
  const razorpayPaymentId = entity?.id;

  if (!razorpayOrderId) return;

  (async () => {
    if (event.event === "payment.captured" && razorpayPaymentId) {
      // Locate the order created by this app — ignore unknown order IDs.
      const [order] = await db
        .select()
        .from(paymentOrdersTable)
        .where(eq(paymentOrdersTable.razorpayOrderId, razorpayOrderId));

      if (!order) {
        req.log.warn({ razorpayOrderId }, "webhook: unknown order, ignoring");
        return;
      }

      // Fast-path: already verified means credits were already granted.
      if (order.status === "verified") {
        req.log.info({ razorpayOrderId }, "webhook: already verified, skipping");
        return;
      }

      // Full idempotent credit-grant inside a DB transaction.
      // The conditional UPDATE is the atomic idempotency lock — if /verify-payment
      // or a duplicate webhook delivery already flipped the status to "verified" or
      // "failed", this returns 0 rows and we abort before touching credits.
      await db.transaction(async (tx) => {
        const locked = await tx
          .update(paymentOrdersTable)
          .set({
            status: "verified",
            razorpayPaymentId,
            paidAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(paymentOrdersTable.id, order.id),
              ne(paymentOrdersTable.status, "verified"),
              ne(paymentOrdersTable.status, "failed"),
            ),
          )
          .returning({ id: paymentOrdersTable.id });

        // Another process (verify-payment or duplicate webhook) already won the race.
        if (locked.length === 0) {
          req.log.info({ razorpayOrderId }, "webhook: status already locked, skipping credits");
          return;
        }

        // Grant credits using order data from our DB — never trust webhook payload for amounts.
        const [currentCredits] = await tx
          .select()
          .from(userCreditsTable)
          .where(eq(userCreditsTable.userId, order.userId));

        const currentBalance = currentCredits?.balance ?? 0;
        const newBalance = currentBalance + order.credits;

        if (currentCredits) {
          await tx
            .update(userCreditsTable)
            .set({ balance: newBalance, updatedAt: new Date() })
            .where(eq(userCreditsTable.userId, order.userId));
        } else {
          await tx.insert(userCreditsTable).values({
            userId: order.userId,
            balance: newBalance,
            freeGranted: false,
          });
        }

        await tx.insert(creditTransactionsTable).values({
          userId: order.userId,
          type: "purchase",
          credits: order.credits,
          balanceAfter: newBalance,
          reason: "Razorpay credit purchase via webhook fallback",
          metadata: {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            pack_id: order.packId,
            amount_in_paise: order.amountInPaise,
            source: "webhook",
          },
        });

        req.log.info(
          { razorpayOrderId, userId: order.userId, credits: order.credits, newBalance },
          "webhook: credits granted via fallback",
        );
      });
    } else if (event.event === "payment.failed") {
      const [order] = await db
        .select()
        .from(paymentOrdersTable)
        .where(eq(paymentOrdersTable.razorpayOrderId, razorpayOrderId));

      // Do not overwrite a verified order — credits were already granted.
      if (!order || order.status === "verified" || order.status === "failed") return;

      await db
        .update(paymentOrdersTable)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(paymentOrdersTable.id, order.id));
    }
  })().catch((err: unknown) => {
    req.log.error({ err, razorpayOrderId }, "webhook background processing error");
  });
});

// GET /api/billing/transactions
router.get("/billing/transactions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "AUTH_REQUIRED" });
    return;
  }

  const transactions = await db
    .select({
      id: creditTransactionsTable.id,
      type: creditTransactionsTable.type,
      credits: creditTransactionsTable.credits,
      balanceAfter: creditTransactionsTable.balanceAfter,
      reason: creditTransactionsTable.reason,
      createdAt: creditTransactionsTable.createdAt,
    })
    .from(creditTransactionsTable)
    .where(eq(creditTransactionsTable.userId, req.user.id))
    .orderBy(desc(creditTransactionsTable.createdAt))
    .limit(20);

  res.json({ transactions });
});

export default router;
