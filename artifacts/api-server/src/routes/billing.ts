import { Router, type Request, type Response } from "express";
import {
  db,
  paymentOrdersTable,
  creditTransactionsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  PACKS,
  getRazorpayInstance,
  isRazorpayConfigured,
  verifyPaymentSignature,
  verifyWebhookSignature,
  generateCheckoutHtml,
} from "../lib/razorpay";
import { getSession } from "../lib/auth";
import {
  markPaymentOrderFailed,
  settleVerifiedPayment,
  settleWebhookPayment,
} from "../lib/payment-settlement";

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

  try {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: pack.amount,
      currency: "INR",
      receipt: `bm_${Date.now()}`,
    });

    await db.insert(paymentOrdersTable).values({
      userId: req.user.id,
      razorpayOrderId: order.id,
      packId: packId!,
      amountInPaise: pack.amount,
      currency: "INR",
      credits: pack.credits,
      status: "created",
      metadata: { packLabel: pack.label },
    });

    res.json({
      orderId: order.id,
      amount: pack.amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      packId,
      credits: pack.credits,
      packLabel: pack.label,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create Razorpay order");
    res.status(500).json({ error: "Failed to create payment order. Please try again." });
  }
});

// GET /api/billing/checkout — renders HTML checkout page
router.get("/billing/checkout", async (req: Request, res: Response) => {
  const { orderId, authToken } = req.query as { orderId?: string; authToken?: string };

  if (!orderId || !authToken) {
    res.status(400).send("<p>Missing orderId or authToken.</p>");
    return;
  }
  if (!isRazorpayConfigured()) {
    res.status(503).send("<p>Billing is not configured.</p>");
    return;
  }

  const session = await getSession(authToken);
  if (!session) {
    res.status(401).send("<p>Invalid or expired session. Please sign in again.</p>");
    return;
  }

  const [order] = await db
    .select()
    .from(paymentOrdersTable)
    .where(
      and(
        eq(paymentOrdersTable.razorpayOrderId, orderId),
        eq(paymentOrdersTable.userId, session.user.id),
      ),
    );

  if (!order) {
    res.status(404).send("<p>Order not found.</p>");
    return;
  }
  if (order.status !== "created") {
    res.status(409).send("<p>This order has already been processed.</p>");
    return;
  }

  const html = generateCheckoutHtml({
    keyId: process.env.RAZORPAY_KEY_ID!,
    orderId: order.razorpayOrderId,
    amount: order.amountInPaise,
    currency: order.currency,
    packLabel: ((order.metadata as Record<string, unknown>).packLabel as string | undefined) ?? order.packId,
    credits: order.credits,
    authToken,
    apiBase: getOrigin(req),
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
});

// POST /api/billing/verify-payment
router.post("/billing/verify-payment", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "AUTH_REQUIRED" });
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: "Missing payment credentials." });
    return;
  }

  const result = await settleVerifiedPayment(
    {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      expectedUserId: req.user.id,
    },
    db,
  );

  if (result.status === "invalid_signature") {
    res.status(400).json({ error: "Payment signature verification failed." });
    return;
  }
  if (result.status === "order_not_found") {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  if (result.status === "not_owned") {
    res.status(403).json({ error: "This order does not belong to your account." });
    return;
  }
  if (result.status !== "settled" && result.status !== "already_settled") {
    res.status(409).json({ error: "Payment does not match an eligible order." });
    return;
  }

  res.json({
    success: true,
    creditsBalance: result.creditsBalance,
    ...(result.status === "already_settled" ? { alreadyVerified: true } : {}),
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
    payload?: {
      payment?: {
        entity?: {
          order_id?: string;
          id?: string;
          amount?: number;
          currency?: string;
        };
      };
    };
  };

  const entity = event?.payload?.payment?.entity;
  const razorpayOrderId = entity?.order_id;
  const razorpayPaymentId = entity?.id;

  if (!razorpayOrderId) return;

  (async () => {
    if (event.event === "payment.captured" && razorpayPaymentId) {
      if (typeof entity?.amount !== "number" || typeof entity.currency !== "string") {
        req.log.warn("webhook: captured payment is missing amount or currency");
        return;
      }

      const result = await settleWebhookPayment(
        {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          amount: entity.amount,
          currency: entity.currency,
        },
        db,
      );
      if (
        result.status !== "settled" &&
        result.status !== "already_settled" &&
        result.status !== "order_not_found"
      ) {
        req.log.warn({ status: result.status }, "webhook: captured payment was not settled");
      } else if (result.status === "order_not_found") {
        req.log.warn("webhook: captured payment order was not found");
      }
    } else if (event.event === "payment.failed") {
      await markPaymentOrderFailed(razorpayOrderId, db);
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
