import { pool, db, leadsTable, type CommercialLead } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { logger } from "./logger";

// Additive migration only: no existing table, row or column is changed.
let schemaReady: Promise<void> | undefined;
export function ensureLeadSchema() {
  if (!schemaReady) schemaReady = pool.query(`
    CREATE TABLE IF NOT EXISTS commercial_leads (
      id text PRIMARY KEY, nome_attivita text NOT NULL, settore text NOT NULL,
      whatsapp text NOT NULL, email text, messaggio text NOT NULL DEFAULT '',
      servizio text NOT NULL DEFAULT 'generale', pagina text NOT NULL DEFAULT '/',
      slug text NOT NULL DEFAULT 'generale', variant text NOT NULL DEFAULT 'control',
      attribution jsonb NOT NULL DEFAULT '{}', privacy boolean NOT NULL,
      marketing_consent boolean NOT NULL DEFAULT false,
      analytics_consent boolean NOT NULL DEFAULT false, stato text NOT NULL DEFAULT 'Nuovo',
      notification text NOT NULL DEFAULT 'pending', qualified_at timestamptz,
      events jsonb NOT NULL DEFAULT '[]', dedup_key text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS commercial_leads_created_idx ON commercial_leads(created_at);
  `).then(() => {}).catch((error) => { schemaReady = undefined; throw error; });
  return schemaReady;
}

export async function notifyLead(lead: CommercialLead): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    logger.error({ leadId: lead.id }, "Notifica contatto in attesa: servizio email non configurato");
    return false;
  }
  const fields = {
    "Nome attività": lead.nomeAttivita, "Tipo attività": lead.settore,
    WhatsApp: lead.whatsapp, Email: lead.email ?? "Non indicata",
    Servizio: lead.servizio, Pagina: lead.pagina, Settore: lead.slug,
    Richiesta: lead.messaggio || "Richiesta di informazioni senza impegno",
    ...lead.attribution,
  };
  try {
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.CONTACT_FROM_EMAIL || "PromoApp.it <onboarding@resend.dev>",
      to: "derosa.lazio@gmail.com",
      ...(lead.email ? { replyTo: lead.email } : {}),
      subject: `[PromoApp] Nuova richiesta — ${lead.nomeAttivita.replace(/[\r\n]/g, " ")}`,
      text: Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join("\n\n"),
    }, { idempotencyKey: `lead-${lead.id}` });
    if (result.error || !result.data?.id) {
      logger.error({ leadId: lead.id, reason: result.error?.name }, "Notifica contatto in attesa");
      return false;
    }
    await db.update(leadsTable).set({ notification: "sent" }).where(eq(leadsTable.id, lead.id));
    logger.info({ leadId: lead.id, emailId: result.data.id }, "Notifica contatto accettata dal servizio email");
    return true;
  } catch {
    logger.error({ leadId: lead.id }, "Notifica contatto in attesa; richiesta già salvata");
    return false;
  }
}
