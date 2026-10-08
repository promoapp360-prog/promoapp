import { pgTable, text, timestamp, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("commercial_leads", {
  id: text("id").primaryKey(),
  nomeAttivita: text("nome_attivita").notNull(),
  settore: text("settore").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email"),
  messaggio: text("messaggio").notNull().default(""),
  servizio: text("servizio").notNull().default("generale"),
  pagina: text("pagina").notNull().default("/"),
  slug: text("slug").notNull().default("generale"),
  variant: text("variant").notNull().default("control"),
  attribution: jsonb("attribution").$type<Record<string, string>>().notNull().default({}),
  privacy: boolean("privacy").notNull(),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  analyticsConsent: boolean("analytics_consent").notNull().default(false),
  stato: text("stato").notNull().default("Nuovo"),
  notification: text("notification").notNull().default("pending"),
  qualifiedAt: timestamp("qualified_at", { withTimezone: true }),
  events: jsonb("events").$type<{ event: string; at: string; quoteAmountCents?: number | null; saleAmountCents?: number | null }[]>().notNull().default([]),
  dedupKey: text("dedup_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("commercial_leads_dedup_idx").on(table.dedupKey)]);
export const insertLeadSchema = createInsertSchema(leadsTable).omit({ createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type CommercialLead = typeof leadsTable.$inferSelect;
