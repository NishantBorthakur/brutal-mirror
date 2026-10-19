import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@workspace/db/schema";
import {
  markPaymentOrderFailed,
  settleVerifiedPayment,
  settleWebhookPayment,
} from "../src/lib/payment-settlement";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const testSecret = "payment-idempotency-test-secret";
const priorSecret = process.env.RAZORPAY_KEY_SECRET;
const schemaName = `bm_payment_tests_${process.pid}_${randomUUID().replaceAll("-", "")}`;
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

interface Fixture {
  userId: string;
  orderId: string;
}

function signature(orderId: string, paymentId: string): string {
  return createHmac("sha256", testSecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

async function createFixture(options: {
  initialBalance?: number;
  status?: string;
  failLedger?: boolean;
} = {}): Promise<Fixture> {
  assert.ok(testPool, "TEST_DATABASE_URL must be set for PostgreSQL tests");
  const userId = `bm_paytest_${options.failLedger ? "fail_" : ""}${randomUUID()}`;
  const orderId = `order_${randomUUID()}`;
  const initialBalance = options.initialBalance ?? 5;

  await testPool.query("INSERT INTO users (id) VALUES ($1)", [userId]);
  await testPool.query(
    "INSERT INTO payment_orders (id, user_id, razorpay_order_id, pack_id, amount_in_paise, currency, credits, status) VALUES ($1, $2, $3, 'value', 9900, 'INR', 50, $4)",
    [randomUUID(), userId, orderId, options.status ?? "created"],
  );
  if (initialBalance >= 0) {
    await testPool.query(
      "INSERT INTO user_credits (user_id, balance, free_granted) VALUES ($1, $2, true)",
      [userId, initialBalance],
    );
  }

  return { userId, orderId };
}

async function getState(fixture: Fixture) {
  assert.ok(testPool);
  const [{ rows: orderRows }, { rows: creditRows }, { rows: transactionRows }] =
    await Promise.all([
      testPool.query(
        "SELECT status, razorpay_payment_id FROM payment_orders WHERE razorpay_order_id = $1",
        [fixture.orderId],
      ),
      testPool.query("SELECT balance FROM user_credits WHERE user_id = $1", [
        fixture.userId,
      ]),
      testPool.query(
        "SELECT id FROM credit_transactions WHERE user_id = $1 AND type = 'purchase'",
        [fixture.userId],
      ),
    ]);
  return {
    status: orderRows[0]?.status as string | undefined,
    paymentId: orderRows[0]?.razorpay_payment_id as string | null | undefined,
    balance: Number(creditRows[0]?.balance ?? 0),
    purchaseCount: transactionRows.length,
  };
}

async function setupPostgresTestSchema() {
  if (!adminPool || !testPool) return;

  await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
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
    CREATE TABLE user_credits (
      user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance integer NOT NULL DEFAULT 5,
      free_granted boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE credit_transactions (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type text NOT NULL,
      credits integer NOT NULL,
      balance_after integer NOT NULL,
      reason text,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE FUNCTION fail_test_purchase_ledger() RETURNS trigger
      LANGUAGE plpgsql AS $body$
      BEGIN
        IF NEW.user_id LIKE 'bm_paytest_fail_%' AND NEW.type = 'purchase' THEN
          RAISE EXCEPTION 'simulated test ledger failure';
        END IF;
        RETURN NEW;
      END
      $body$;
    CREATE TRIGGER fail_test_purchase_ledger
      BEFORE INSERT ON credit_transactions
      FOR EACH ROW EXECUTE FUNCTION fail_test_purchase_ledger();
  `);
}

before(async () => {
  process.env.RAZORPAY_KEY_SECRET = testSecret;
  await setupPostgresTestSchema();
});

after(async () => {
  if (testPool) await testPool.end();
  if (adminPool) {
    try {
      await adminPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    } finally {
      await adminPool.end();
    }
  }
  if (priorSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
  else process.env.RAZORPAY_KEY_SECRET = priorSecret;
});

const postgresTest = testDatabaseUrl ? test : test.skip;

test("invalid signature cannot reach the database settlement path", async () => {
  const database = {
    transaction: async () => {
      throw new Error("invalid signature must not start a transaction");
    },
  } as unknown as typeof testDb;

  const result = await settleVerifiedPayment(
    {
      orderId: "order_invalid_signature",
      paymentId: "payment_invalid_signature",
      signature: "not-a-valid-signature",
      expectedUserId: "not-a-real-user",
    },
    database!,
  );
  assert.deepEqual(result, { status: "invalid_signature" });
});

test("a signature for a different order identifier cannot settle this order", async () => {
  const database = {
    transaction: async () => {
      throw new Error("mismatched order signature must not start a transaction");
    },
  } as unknown as typeof testDb;

  const result = await settleVerifiedPayment(
    {
      orderId: "order_expected",
      paymentId: "payment_1",
      signature: signature("order_different", "payment_1"),
      expectedUserId: "not-a-real-user",
    },
    database!,
  );
  assert.deepEqual(result, { status: "invalid_signature" });
});

postgresTest("a valid paid order grants its pack credits and writes one ledger row", async () => {
  const fixture = await createFixture();
  const result = await settleVerifiedPayment(
    {
      orderId: fixture.orderId,
      paymentId: "payment_valid_1",
      signature: signature(fixture.orderId, "payment_valid_1"),
      expectedUserId: fixture.userId,
    },
    testDb!,
  );

  assert.deepEqual(result, { status: "settled", creditsBalance: 55 });
  assert.deepEqual(await getState(fixture), {
    status: "verified",
    paymentId: "payment_valid_1",
    balance: 55,
    purchaseCount: 1,
  });
});

postgresTest("repeating verification is idempotent and rejects another payment ID", async () => {
  const fixture = await createFixture();
  const settle = (paymentId: string) =>
    settleVerifiedPayment(
      {
        orderId: fixture.orderId,
        paymentId,
        signature: signature(fixture.orderId, paymentId),
        expectedUserId: fixture.userId,
      },
      testDb!,
    );

  assert.equal((await settle("payment_once")).status, "settled");
  assert.deepEqual(await settle("payment_once"), {
    status: "already_settled",
    creditsBalance: 55,
  });
  assert.deepEqual(await settle("payment_other"), { status: "payment_mismatch" });
  assert.equal((await getState(fixture)).balance, 55);
  assert.equal((await getState(fixture)).purchaseCount, 1);
});

postgresTest("concurrent verification requests grant the order only once", async () => {
  const fixture = await createFixture();
  const attempts = await Promise.all(
    Array.from({ length: 8 }, () =>
      settleVerifiedPayment(
        {
          orderId: fixture.orderId,
          paymentId: "payment_concurrent",
          signature: signature(fixture.orderId, "payment_concurrent"),
          expectedUserId: fixture.userId,
        },
        testDb!,
      ),
    ),
  );

  assert.equal(attempts.filter((result) => result.status === "settled").length, 1);
  assert.equal(
    attempts.filter((result) => result.status === "already_settled").length,
    7,
  );
  assert.equal((await getState(fixture)).balance, 55);
  assert.equal((await getState(fixture)).purchaseCount, 1);
});

postgresTest("duplicate captured webhooks grant credits only once", async () => {
  const fixture = await createFixture();
  const input = {
    orderId: fixture.orderId,
    paymentId: "payment_webhook_duplicate",
    amount: 9900,
    currency: "INR",
  };
  const attempts = await Promise.all([
    settleWebhookPayment(input, testDb!),
    settleWebhookPayment(input, testDb!),
    settleWebhookPayment(input, testDb!),
  ]);

  assert.equal(attempts.filter((result) => result.status === "settled").length, 1);
  assert.equal((await getState(fixture)).balance, 55);
  assert.equal((await getState(fixture)).purchaseCount, 1);
});

postgresTest("concurrent verification and webhook delivery share one credit claim", async () => {
  const fixture = await createFixture();
  const paymentId = "payment_mixed_sources";
  const [verification, webhook] = await Promise.all([
    settleVerifiedPayment(
      {
        orderId: fixture.orderId,
        paymentId,
        signature: signature(fixture.orderId, paymentId),
        expectedUserId: fixture.userId,
      },
      testDb!,
    ),
    settleWebhookPayment(
      {
        orderId: fixture.orderId,
        paymentId,
        amount: 9900,
        currency: "INR",
      },
      testDb!,
    ),
  ]);

  assert.equal(
    [verification, webhook].filter((result) => result.status === "settled").length,
    1,
  );
  assert.equal(
    [verification, webhook].filter((result) => result.status === "already_settled")
      .length,
    1,
  );
  assert.equal((await getState(fixture)).balance, 55);
  assert.equal((await getState(fixture)).purchaseCount, 1);
});

postgresTest("a captured payment must match the stored order amount and currency", async () => {
  const fixture = await createFixture();
  const result = await settleWebhookPayment(
    {
      orderId: fixture.orderId,
      paymentId: "payment_wrong_amount",
      amount: 1,
      currency: "USD",
    },
    testDb!,
  );

  assert.deepEqual(result, { status: "invalid_order" });
  assert.equal((await getState(fixture)).status, "created");
  assert.equal((await getState(fixture)).balance, 5);
  assert.equal((await getState(fixture)).purchaseCount, 0);
});

postgresTest("a captured attempt can recover an order after an out-of-order failure event", async () => {
  const fixture = await createFixture();
  await markPaymentOrderFailed(fixture.orderId, testDb!);
  assert.equal((await getState(fixture)).status, "failed");

  const result = await settleWebhookPayment(
    {
      orderId: fixture.orderId,
      paymentId: "payment_captured_after_failure",
      amount: 9900,
      currency: "INR",
    },
    testDb!,
  );

  assert.deepEqual(result, { status: "settled", creditsBalance: 55 });
  assert.equal((await getState(fixture)).purchaseCount, 1);
});

postgresTest("a failed ledger insert rolls back status and balance changes", async () => {
  const fixture = await createFixture({ failLedger: true });
  await assert.rejects(
    settleVerifiedPayment(
      {
        orderId: fixture.orderId,
        paymentId: "payment_rollback",
        signature: signature(fixture.orderId, "payment_rollback"),
        expectedUserId: fixture.userId,
      },
      testDb!,
    ),
    /simulated test ledger failure/,
  );

  assert.deepEqual(await getState(fixture), {
    status: "created",
    paymentId: null,
    balance: 5,
    purchaseCount: 0,
  });
});

postgresTest("a delayed failure event cannot overwrite a completed verification", async () => {
  const fixture = await createFixture();
  await settleVerifiedPayment(
    {
      orderId: fixture.orderId,
      paymentId: "payment_capture_before_failure",
      signature: signature(fixture.orderId, "payment_capture_before_failure"),
      expectedUserId: fixture.userId,
    },
    testDb!,
  );

  await markPaymentOrderFailed(fixture.orderId, testDb!);
  assert.deepEqual(await getState(fixture), {
    status: "verified",
    paymentId: "payment_capture_before_failure",
    balance: 55,
    purchaseCount: 1,
  });
});
