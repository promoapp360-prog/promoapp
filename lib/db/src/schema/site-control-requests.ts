import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteControlRequestsTable = pgTable("site_control_requests", {
  id: text("id").primaryKey(),
  siteUrl: text("site_url").notNull(),
  nomeAttivita: text("nome_attivita").notNull(),
  email: text("email"),
  whatsapp: text("whatsapp"),
  authorization: boolean("authorization").notNull(),
  privacyAccepted: boolean("privacy_accepted").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("Nuova"),
  notification: text("notification").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("site_control_requests_created_idx").on(table.createdAt),
  index("site_control_requests_status_idx").on(table.status),
]);

export const insertSiteControlRequestSchema = createInsertSchema(siteControlRequestsTable)
  .omit({ createdAt: true, consentedAt: true });
export type InsertSiteControlRequest = z.infer<typeof insertSiteControlRequestSchema>;
export type SiteControlRequest = typeof siteControlRequestsTable.$inferSelect;
