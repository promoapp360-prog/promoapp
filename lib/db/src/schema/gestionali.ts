import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const richiesteGestionaleTable = pgTable("richieste_gestionale", {
  id:             text("id").primaryKey(),
  tipo:           text("tipo").notNull(),          // "gestionale360" | "agentipro"
  nome:           text("nome").notNull(),
  cognome:        text("cognome").notNull().default(""),
  email:          text("email").notNull(),
  telefono:       text("telefono").notNull().default(""),
  tipoSoggetto:   text("tipo_soggetto").notNull(), // "privato" | "ditta" | "srl" | "spa" | "associazione"
  ragioneSociale: text("ragione_sociale"),
  piva:           text("piva"),
  codiceFiscale:  text("codice_fiscale"),
  settore:        text("settore"),
  note:           text("note"),
  stato:          text("stato").notNull().default("nuova"), // "nuova" | "inviata" | "attiva"
  username:       text("username"),
  passwordGestionale: text("password_gestionale"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

export type RichiestaGestionale = typeof richiesteGestionaleTable.$inferSelect;
