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

export type PaymentOrder = typeof paymentOrdersTable.$inferSelect;
export type InsertPaymentOrder = typeof paymentOrdersTable.$inferInsert;
