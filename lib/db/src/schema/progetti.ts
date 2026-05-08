import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const clientiTable = pgTable("clienti", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  cognome: text("cognome").notNull().default(""),
  email: text("email").notNull().default(""),
  telefono: text("telefono").notNull().default(""),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Cliente = typeof clientiTable.$inferSelect;

export const progettiLavoriTable = pgTable("progetti_lavori", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id").references(() => clientiTable.id),
  nome: text("nome").notNull(),
  url: text("url").notNull().default(""),
  password: text("password").notNull(),
  descrizione: text("descrizione").notNull().default(""),
  accontoVersato: integer("acconto_versato").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ProgettoLavori = typeof progettiLavoriTable.$inferSelect;

export const vociProgettoTable = pgTable("voci_progetto", {
  id: text("id").primaryKey(),
  progettoId: text("progetto_id")
    .notNull()
    .references(() => progettiLavoriTable.id, { onDelete: "cascade" }),
  descrizione: text("descrizione").notNull(),
  importo: integer("importo"),
  ordine: integer("ordine").notNull().default(0),
});

export type VoceProgetto = typeof vociProgettoTable.$inferSelect;
