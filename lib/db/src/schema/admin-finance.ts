import { pgTable, text, integer, smallint, boolean, timestamp, date, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

export const adminFinanceClientsTable = pgTable("admin_finance_clients", {
  id: text("id").primaryKey(),
  identityKey: text("identity_key").notNull().unique(),
  name: text("name").notNull(), companyName: text("company_name"), email: text("email"), phone: text("phone"),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  notes: text("notes").notNull().default(""), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const adminFinanceProjectsTable = pgTable("admin_finance_projects", {
  id: text("id").primaryKey(),
  clientId: text("client_id").references(() => adminFinanceClientsTable.id),
  // Retained as inert legacy values; the internal ledger never reads or writes site IDs.
  customerId: text("customer_id"),
  legacyProjectId: text("legacy_project_id"),
  clientName: text("client_name").notNull().default(""),
  name: text("name").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull().default(0),
  paymentType: text("payment_type").notNull().default("single"),
  depositAmountCents: integer("deposit_amount_cents"),
  installmentCount: smallint("installment_count"),
  notes: text("notes").notNull().default(""),
  active: boolean("active").notNull().default(true),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex("finance_legacy_project_idx").on(t.legacyProjectId)]);
export const adminFinanceRecurringTable = pgTable("admin_finance_recurring", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => adminFinanceProjectsTable.id),
  clientId: text("client_id").references(() => adminFinanceClientsTable.id),
  direction: text("direction").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  startDate: date("start_date", { mode: "string" }),
  nextDate: date("next_date", { mode: "string" }),
  intervalMonths: integer("interval_months").notNull().default(1),
  anchorDay: integer("anchor_day"),
  state: text("state").notNull().default("potential"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const adminFinanceEntriesTable = pgTable("admin_finance_entries", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => adminFinanceProjectsTable.id),
  direction: text("direction").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  repeatMonthly: boolean("repeat_monthly").notNull().default(false),
  seriesId: text("series_id"), seriesDay: smallint("series_day"),
  recurringId: text("recurring_id").references(() => adminFinanceRecurringTable.id),
  // Inert compatibility value; site-side payments are never imported into the ledger.
  accontoId: text("acconto_id"),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("finance_series_date_idx").on(t.seriesId, t.dueDate),
  uniqueIndex("finance_recurring_date_idx").on(t.recurringId, t.dueDate),
  uniqueIndex("finance_acconto_idx").on(t.accontoId),
  uniqueIndex("finance_external_reference_idx").on(sql`(${t.details}->>'externalReference')`).where(sql`NULLIF(${t.details}->>'externalReference','') IS NOT NULL`),
  index("finance_due_idx").on(t.dueDate),
]);
export const adminFinanceSuppliersTable = pgTable("admin_finance_suppliers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("other"),
  email: text("email"),
  website: text("website"),
  notes: text("notes").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("admin_finance_suppliers_name_idx").on(sql`lower(trim(${t.name}))`),
]);
export const adminFinanceAuditTable = pgTable("admin_finance_audit", {
  id: text("id").primaryKey(), entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(), actor: text("actor").notNull(),
  reason: text("reason").notNull(), before: jsonb("before"), after: jsonb("after"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("finance_audit_entity_idx").on(t.entityId)]);
export const insertFinanceProjectSchema = createInsertSchema(adminFinanceProjectsTable);
export const insertFinanceEntrySchema = createInsertSchema(adminFinanceEntriesTable);
export const insertFinanceRecurringSchema = createInsertSchema(adminFinanceRecurringTable);
export const insertFinanceSupplierSchema = createInsertSchema(adminFinanceSuppliersTable);
export type FinanceProjectRecord = typeof adminFinanceProjectsTable.$inferSelect;
export type FinanceEntryRecord = typeof adminFinanceEntriesTable.$inferSelect;
export type FinanceRecurringRecord = typeof adminFinanceRecurringTable.$inferSelect;
export type FinanceSupplierRecord = typeof adminFinanceSuppliersTable.$inferSelect;
