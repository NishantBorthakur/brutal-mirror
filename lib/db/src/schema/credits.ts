import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const userCreditsTable = pgTable("user_credits", {
  userId: varchar("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(5),
  freeGranted: boolean("free_granted").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const creditTransactionsTable = pgTable(
  "credit_transactions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    credits: integer("credits").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_credit_transactions_user_id").on(table.userId)],
);

export const roastLogsTable = pgTable(
  "roast_logs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    category: text("category"),
    intensity: text("intensity"),
    personality: text("personality"),
    refinementMode: text("refinement_mode"),
    inputPreview: text("input_preview"),
    inputTokens: integer("input_tokens").default(0),
    outputTokens: integer("output_tokens").default(0),
    totalTokens: integer("total_tokens").default(0),
    creditsUsed: integer("credits_used").default(1),
    success: boolean("success").notNull().default(true),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_roast_logs_user_id").on(table.userId)],
);

export type UserCredits = typeof userCreditsTable.$inferSelect;
export type CreditTransaction = typeof creditTransactionsTable.$inferSelect;
export type RoastLog = typeof roastLogsTable.$inferSelect;
