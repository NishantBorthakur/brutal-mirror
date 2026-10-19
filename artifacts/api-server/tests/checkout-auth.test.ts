import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@workspace/db/schema";
import {
  checkoutAuthorizationsTable,
  sessionsTable,
} from "@workspace/db";
import {
  claimPaymentVerificationAuthorization,
  consumeCheckoutAuthorization,
  createCheckoutAuthorizationToken,
  hashCheckoutAuthorizationToken,
  isCheckoutAuthorizationToken,
} from "../src/lib/checkout-auth";
import { generateCheckoutHtml } from "../src/lib/razorpay";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const schemaName = `bm_checkout_auth_${process.pid}_${randomUUID().replaceAll("-", "")}`;
const adminPool = testDatabaseUrl
  ? new Pool({ connectionString: testDatabaseUrl, max: 2 })
  : undefined;
const testPool = testDatabaseUrl
  ? new Pool({
      connectionString: testDatabaseUrl,
      options: `-c search_path=${schemaName}`,
      max: 16,
    })
  : undefined;
const testDb = testPool ? drizzle(testPool, { schema }) : undefined;
let schemaCreated = false;

interface CheckoutFixture {
  userId: string;
  paymentOrderId: string;
  orderId: string;
  checkoutToken: string;
}

async function createFixture(options: { checkoutExpiresAt?: Date } = {}): Promise<CheckoutFixture> {
  assert.ok(testPool, "TEST_DATABASE_URL must be configured for PostgreSQL tests");
  const userId = `checkout_test_${randomUUID()}`;
  const orderId = `order_${randomUUID()}`;
  const checkoutToken = createCheckoutAuthorizationToken();

  await testPool.query("INSERT INTO users (id) VALUES ($1)", [userId]);
  const { rows } = await testPool.query<{ id: string }>(
    "INSERT INTO payment_orders (user_id, razorpay_order_id, pack_id, amount_in_paise, currency, credits, status) VALUES ($1, $2, 'value', 9900, 'INR', 50, 'created') RETURNING id",
    [userId, orderId],
  );
  const paymentOrderId = rows[0]!.id;
  await testPool.query(
    "INSERT INTO checkout_authorizations (payment_order_id, user_id, checkout_token_hash, checkout_expires_at) VALUES ($1, $2, $3, $4)",
    [
      paymentOrderId,
      userId,
      hashCheckoutAuthorizationToken(checkoutToken),
      options.checkoutExpiresAt ?? new Date(Date.now() + 10 * 60 * 1000),
    ],
  );

  return { userId, paymentOrderId, orderId, checkoutToken };
}

async function setupTestSchema() {
  if (!adminPool || !testPool) return;

  await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
  schemaCreated = true;
  await testPool.query(`
    CREATE TABLE users (id varchar PRIMARY KEY);
    CREATE TABLE payment_orders (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      razorpay_order_id varchar UNIQUE NOT NULL,
      razorpay_payment_id varchar,
      razorpay_signature varchar,
      pack_id text NOT NULL,
      amount_in_paise integer NOT NULL,
      currency text NOT NULL DEFAULT 'INR',
      credits integer NOT NULL,
      status text NOT NULL DEFAULT 'created',
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      paid_at timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE checkout_authorizations (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
      payment_order_id varchar UNIQUE NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      checkout_token_hash varchar UNIQUE NOT NULL,
      checkout_expires_at timestamptz NOT NULL,
      checkout_consumed_at timestamptz,
      verification_token_hash varchar UNIQUE,
      verification_expires_at timestamptz,
      verification_consumed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE sessions (
      sid varchar PRIMARY KEY,
      sess jsonb NOT NULL,
      expire timestamp NOT NULL
    );
  `);
}

before(setupTestSchema);

after(async () => {
  if (testPool) await testPool.end();
  if (adminPool) {
    try {
      if (schemaCreated) {
        await adminPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      }
    } finally {
      await adminPool.end();
    }
  }
});

const postgresTest = testDatabaseUrl ? test : test.skip;

test("checkout tokens are unpredictable, URL-safe, and stored as hashes", () => {
  const first = createCheckoutAuthorizationToken();
  const second = createCheckoutAuthorizationToken();

  assert.notEqual(first, second);
  assert.equal(isCheckoutAuthorizationToken(first), true);
  assert.equal(isCheckoutAuthorizationToken("short"), false);
  assert.equal(hashCheckoutAuthorizationToken(first).length, 64);
  assert.notEqual(hashCheckoutAuthorizationToken(first), first);
});

test("checkout HTML uses only the scoped verification token, not a bearer session", () => {
  const html = generateCheckoutHtml({
    keyId: "rzp_test_public_key",
    orderId: "order_test_1",
    amount: 9900,
    currency: "INR",
    packLabel: "Value Pack",
    credits: 50,
    verificationToken: "A".repeat(43),
    apiBase: "https://api.example.test",
  });

  assert.match(html, /checkoutVerificationToken/);
  assert.doesNotMatch(html, /Authorization["']?\s*:/);
  assert.doesNotMatch(html, /Bearer\s/);
});

postgresTest("invalid and expired checkout authorizations are rejected without consumption", async () => {
  const invalidFixture = await createFixture();
  const invalid = await consumeCheckoutAuthorization(
    invalidFixture.orderId,
    createCheckoutAuthorizationToken(),
    testDb!,
  );
  assert.deepEqual(invalid, { status: "invalid" });

  const expiredFixture = await createFixture({
    checkoutExpiresAt: new Date(Date.now() - 60_000),
  });
  const expired = await consumeCheckoutAuthorization(
    expiredFixture.orderId,
    expiredFixture.checkoutToken,
    testDb!,
  );
  assert.deepEqual(expired, { status: "invalid" });

  const [stillUnused] = await testDb!
    .select({ consumedAt: checkoutAuthorizationsTable.checkoutConsumedAt })
    .from(checkoutAuthorizationsTable)
    .where(
      eq(
        checkoutAuthorizationsTable.paymentOrderId,
        invalidFixture.paymentOrderId,
      ),
    );
  assert.equal(stillUnused?.consumedAt, null);
});

postgresTest("checkout authorization is restricted to its order and can be used once", async () => {
  const fixture = await createFixture();
  const otherOrder = await createFixture();

  assert.deepEqual(
    await consumeCheckoutAuthorization(
      otherOrder.orderId,
      fixture.checkoutToken,
      testDb!,
    ),
    { status: "invalid" },
  );

  const first = await consumeCheckoutAuthorization(
    fixture.orderId,
    fixture.checkoutToken,
    testDb!,
  );
  assert.equal(first.status, "authorized");
  if (first.status !== "authorized") return;

  assert.notEqual(first.verificationToken, fixture.checkoutToken);
  assert.deepEqual(
    await consumeCheckoutAuthorization(
      fixture.orderId,
      fixture.checkoutToken,
      testDb!,
    ),
    { status: "invalid" },
  );

  const [stored] = await testDb!
    .select({
      checkoutHash: checkoutAuthorizationsTable.checkoutTokenHash,
      verificationHash: checkoutAuthorizationsTable.verificationTokenHash,
    })
    .from(checkoutAuthorizationsTable)
    .where(
      eq(
        checkoutAuthorizationsTable.paymentOrderId,
        fixture.paymentOrderId,
      ),
    );
  assert.notEqual(stored?.checkoutHash, fixture.checkoutToken);
  assert.equal(
    stored?.verificationHash,
    hashCheckoutAuthorizationToken(first.verificationToken),
  );
});

postgresTest("concurrent checkout opens allow exactly one token claim", async () => {
  const fixture = await createFixture();
  const attempts = await Promise.all(
    Array.from({ length: 8 }, () =>
      consumeCheckoutAuthorization(
        fixture.orderId,
        fixture.checkoutToken,
        testDb!,
      ),
    ),
  );

  assert.equal(
    attempts.filter((result) => result.status === "authorized").length,
    1,
  );
  assert.equal(
    attempts.filter((result) => result.status === "invalid").length,
    7,
  );
});

postgresTest("verification authorization is order-scoped, expires, and is single-use", async () => {
  const fixture = await createFixture();
  const checkout = await consumeCheckoutAuthorization(
    fixture.orderId,
    fixture.checkoutToken,
    testDb!,
  );
  assert.equal(checkout.status, "authorized");
  if (checkout.status !== "authorized") return;

  const otherOrder = await createFixture();
  const wrongOrder = await testDb!.transaction((tx) =>
    claimPaymentVerificationAuthorization(
      tx,
      otherOrder.paymentOrderId,
      otherOrder.userId,
      checkout.verificationToken,
    ),
  );
  assert.equal(wrongOrder, false);

  const wrongUserClaim = await testDb!.transaction((tx) =>
    claimPaymentVerificationAuthorization(
      tx,
      fixture.paymentOrderId,
      "another_user",
      checkout.verificationToken,
    ),
  );
  assert.equal(wrongUserClaim, false);

  const concurrentClaims = await Promise.all([
    testDb!.transaction((tx) =>
      claimPaymentVerificationAuthorization(
        tx,
        fixture.paymentOrderId,
        fixture.userId,
        checkout.verificationToken,
      ),
    ),
    testDb!.transaction((tx) =>
      claimPaymentVerificationAuthorization(
        tx,
        fixture.paymentOrderId,
        fixture.userId,
        checkout.verificationToken,
      ),
    ),
  ]);
  const firstClaim = concurrentClaims.filter(Boolean).length;
  const reusedClaim = await testDb!.transaction((tx) =>
    claimPaymentVerificationAuthorization(
      tx,
      fixture.paymentOrderId,
      fixture.userId,
      checkout.verificationToken,
    ),
  );
  assert.equal(firstClaim, 1);
  assert.equal(reusedClaim, false);

  const expiredFixture = await createFixture();
  const expiredCheckout = await consumeCheckoutAuthorization(
    expiredFixture.orderId,
    expiredFixture.checkoutToken,
    testDb!,
  );
  assert.equal(expiredCheckout.status, "authorized");
  if (expiredCheckout.status !== "authorized") return;

  await testPool!.query(
    "UPDATE checkout_authorizations SET verification_expires_at = $1 WHERE payment_order_id = $2",
    [new Date(Date.now() - 60_000), expiredFixture.paymentOrderId],
  );
  const expiredClaim = await testDb!.transaction((tx) =>
    claimPaymentVerificationAuthorization(
      tx,
      expiredFixture.paymentOrderId,
      expiredFixture.userId,
      expiredCheckout.verificationToken,
    ),
  );
  assert.equal(expiredClaim, false);
});

postgresTest("checkout capabilities are not stored as authenticated sessions", async () => {
  const fixture = await createFixture();
  const checkout = await consumeCheckoutAuthorization(
    fixture.orderId,
    fixture.checkoutToken,
    testDb!,
  );
  assert.equal(checkout.status, "authorized");
  if (checkout.status !== "authorized") return;

  const [session] = await testDb!
    .select({ sid: sessionsTable.sid })
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, fixture.checkoutToken));
  assert.equal(session, undefined);

  const [verificationSession] = await testDb!
    .select({ sid: sessionsTable.sid })
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, checkout.verificationToken));
  assert.equal(verificationSession, undefined);
});
