import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const paymentOrdersTable = pgTable(
  "payment_orders",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    razorpayOrderId: varchar("razorpay_order_id").unique().notNull(),
    razorpayPaymentId: varchar("razorpay_payment_id"),
    razorpaySignature: varchar("razorpay_signature"),
    packId: text("pack_id").notNull(),
    amountInPaise: integer("amount_in_paise").notNull(),
    currency: text("currency").notNull().default("INR"),
    credits: integer("credits").notNull(),
    status: text("status").notNull().default("created"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_payment_orders_user_id").on(table.userId),
    index("idx_payment_orders_razorpay_order_id").on(table.razorpayOrderId),
  ],
);

export const checkoutAuthorizationsTable = pgTable(
  "checkout_authorizations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    paymentOrderId: varchar("payment_order_id")
      .notNull()
      .unique()
      .references(() => paymentOrdersTable.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    checkoutTokenHash: varchar("checkout_token_hash").notNull().unique(),
    checkoutExpiresAt: timestamp("checkout_expires_at", { withTimezone: true }).notNull(),
    checkoutConsumedAt: timestamp("checkout_consumed_at", { withTimezone: true }),
    verificationTokenHash: varchar("verification_token_hash").unique(),
    verificationExpiresAt: timestamp("verification_expires_at", { withTimezone: true }),
    verificationConsumedAt: timestamp("verification_consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_checkout_authorizations_user_id").on(table.userId),
    index("idx_checkout_authorizations_checkout_expiry").on(table.checkoutExpiresAt),
    index("idx_checkout_authorizations_verification_expiry").on(table.verificationExpiresAt),
  ],
);

export type PaymentOrder = typeof paymentOrdersTable.$inferSelect;
export type InsertPaymentOrder = typeof paymentOrdersTable.$inferInsert;
