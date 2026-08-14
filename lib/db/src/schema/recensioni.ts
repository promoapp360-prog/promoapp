import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recensioniTable = pgTable("recensioni", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  attivita: text("attivita").notNull(),
  testo: text("testo").notNull(),
  stelle: text("stelle").notNull(), // "1"–"5"
  verificata: boolean("verificata").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecensioneSchema = createInsertSchema(recensioniTable).omit({
  id: true,
  verificata: true,
  createdAt: true,
});

export type InsertRecensione = z.infer<typeof insertRecensioneSchema>;
export type Recensione = typeof recensioniTable.$inferSelect;
