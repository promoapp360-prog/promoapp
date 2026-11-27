import {
  pgTable, text, integer, boolean, timestamp, date, jsonb, numeric, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { adminFinanceClientsTable, adminFinanceProjectsTable, adminFinanceRecurringTable, adminFinanceSuppliersTable } from "./admin-finance";

export const adminFinanceQuotesTable = pgTable("admin_finance_quotes", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => adminFinanceClientsTable.id),
  number: text("number").notNull(),
  issuedOn: date("issued_on", { mode: "string" }).notNull(),
  validUntil: date("valid_until", { mode: "string" }),
  status: text("status").notNull().default("draft"),
  totalAmountCents: integer("total_amount_cents").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex("admin_finance_quotes_number_idx").on(table.number),
  index("admin_finance_quotes_client_idx").on(table.clientId),
]);

export const adminFinanceQuoteItemsTable = pgTable("admin_finance_quote_items", {
  id: text("id").primaryKey(),
  quoteId: text("quote_id").notNull().references(() => adminFinanceQuotesTable.id),
  position: integer("position").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3, mode: "number" }).notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
}, table => [index("admin_finance_quote_items_quote_idx").on(table.quoteId, table.position)]);

export const adminFinanceObligationsTable = pgTable("admin_finance_obligations", {
  id: text("id").primaryKey(),
  direction: text("direction").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  dueDate: date("due_date", { mode: "string" }),
  clientId: text("client_id").references(() => adminFinanceClientsTable.id),
  projectId: text("project_id").references(() => adminFinanceProjectsTable.id),
  recurringId: text("recurring_id").references(() => adminFinanceRecurringTable.id),
  supplierId: text("supplier_id").references(() => adminFinanceSuppliersTable.id),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex("admin_finance_obligations_source_due_idx").on(table.sourceType, table.sourceId, table.dueDate),
  index("admin_finance_obligations_due_idx").on(table.dueDate),
  index("admin_finance_obligations_client_idx").on(table.clientId, table.dueDate),
  index("admin_finance_obligations_source_idx").on(table.sourceType, table.sourceId),
]);

export const adminFinanceAccountsTable = pgTable("admin_finance_accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  accountType: text("account_type").notNull(),
  openingBalanceCents: integer("opening_balance_cents").notNull().default(0),
  openingBalanceDate: date("opening_balance_date", { mode: "string" }),
  active: boolean("active").notNull().default(true),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex("admin_finance_accounts_name_idx").on(table.name)]);

export const adminFinanceMovementsTable = pgTable("admin_finance_movements", {
  id: text("id").primaryKey(),
  movementAt: timestamp("movement_at", { withTimezone: true }).notNull(),
  direction: text("direction").notNull(),
  amountCents: integer("amount_cents").notNull(),
  accountId: text("account_id").references(() => adminFinanceAccountsTable.id),
  paymentMethod: text("payment_method"),
  historical: boolean("historical").notNull().default(false),
  note: text("note").notNull().default(""),
  externalReference: text("external_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("admin_finance_movements_date_idx").on(table.movementAt),
  index("admin_finance_movements_direction_date_idx").on(table.direction, table.movementAt),
  uniqueIndex("admin_finance_movements_external_reference_idx").on(table.externalReference).where(sql`NULLIF(${table.externalReference}, '') IS NOT NULL`),
]);

export const adminFinanceMovementAllocationsTable = pgTable("admin_finance_movement_allocations", {
  id: text("id").primaryKey(),
  movementId: text("movement_id").notNull().references(() => adminFinanceMovementsTable.id),
  obligationId: text("obligation_id").notNull().references(() => adminFinanceObligationsTable.id),
  amountCents: integer("amount_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex("admin_finance_movement_allocations_pair_idx").on(table.movementId, table.obligationId),
  index("admin_finance_movement_allocations_obligation_idx").on(table.obligationId),
]);

export const adminFinanceDocumentsTable = pgTable("admin_finance_documents", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => adminFinanceClientsTable.id),
  projectId: text("project_id").references(() => adminFinanceProjectsTable.id),
  quoteId: text("quote_id").references(() => adminFinanceQuotesTable.id),
  documentType: text("document_type").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  number: text("number").notNull(),
  issuedOn: date("issued_on", { mode: "string" }).notNull(),
  status: text("status").notNull().default("draft"),
  grossAmountCents: integer("gross_amount_cents").notNull(),
  vatRateBps: integer("vat_rate_bps"),
  vatAmountCents: integer("vat_amount_cents").notNull().default(0),
  withholdingRateBps: integer("withholding_rate_bps"),
  withholdingAmountCents: integer("withholding_amount_cents").notNull().default(0),
  netAmountCents: integer("net_amount_cents").notNull(),
  storagePath: text("storage_path"),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex("admin_finance_documents_number_idx").on(table.documentType, table.fiscalYear, table.number),
  index("admin_finance_documents_client_idx").on(table.clientId, table.issuedOn),
]);

export const adminFinanceRemindersTable = pgTable("admin_finance_reminders", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  reminderType: text("reminder_type").notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  clientId: text("client_id").references(() => adminFinanceClientsTable.id),
  projectId: text("project_id").references(() => adminFinanceProjectsTable.id),
  sourceType: text("source_type"),
  sourceId: text("source_id"),
  generated: boolean("generated").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("admin_finance_reminders_due_idx").on(table.dueDate),
  index("admin_finance_reminders_client_idx").on(table.clientId, table.dueDate),
]);

export const adminFinanceSettingsTable = pgTable("admin_finance_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminFinanceTaxRegimesTable = pgTable("admin_finance_tax_regimes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  regimeType: text("regime_type").notNull(),
  documentType: text("document_type").notNull(),
  effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
  effectiveUntil: date("effective_until", { mode: "string" }),
  vatRateBps: integer("vat_rate_bps"),
  withholdingRateBps: integer("withholding_rate_bps"),
  active: boolean("active").notNull().default(true),
  notes: text("notes").notNull().default(""),
}, table => [index("admin_finance_tax_regimes_dates_idx").on(table.effectiveFrom, table.effectiveUntil)]);

export const adminFinanceDocumentSequencesTable = pgTable("admin_finance_document_sequences", {
  id: text("id").primaryKey(),
  documentType: text("document_type").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  nextNumber: integer("next_number").notNull().default(1),
  prefix: text("prefix").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex("admin_finance_document_sequences_type_year_idx").on(table.documentType, table.fiscalYear),
]);
