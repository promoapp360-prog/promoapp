import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const accontiTable = pgTable("acconti", {
  id: text("id").primaryKey(),
  progetto: text("progetto").notNull(),
  tipoPagamento: text("tipo_pagamento").notNull().default("acconto"),
  progettoRef: text("progetto_ref"),
  tipo: text("tipo").notNull().default("privato"),
  nome: text("nome").notNull(),
  cognome: text("cognome").notNull(),
  email: text("email").notNull(),
  telefono: text("telefono").notNull(),
  indirizzo: text("indirizzo").notNull(),
  cap: text("cap").notNull(),
  citta: text("citta").notNull(),
  provincia: text("provincia"),
  codiceFiscale: text("codice_fiscale"),
  ragioneSociale: text("ragione_sociale"),
  piva: text("piva"),
  sdi: text("sdi"),
  pec: text("pec"),
  importoTotaleCentesimi: integer("importo_totale_centesimi"),
  importoCentesimi: integer("importo_centesimi").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stato: text("stato").notNull().default("in_attesa"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

export type Acconto = typeof accontiTable.$inferSelect;
