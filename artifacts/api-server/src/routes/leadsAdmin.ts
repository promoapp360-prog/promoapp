import { Router } from "express";
import { db, leadsTable } from "@workspace/db";
import { and, eq, gte, lt, desc } from "drizzle-orm";
import { UpdateCommercialLeadBody } from "@workspace/api-zod";
import { ensureLeadSchema, notifyLead } from "../lib/leads";

const router = Router();

function filters(query: Record<string, unknown>) {
  const conditions = [eq(leadsTable.privacy, true)];
  if (typeof query.settore === "string" && query.settore) conditions.push(eq(leadsTable.slug, query.settore));
  if (typeof query.stato === "string" && query.stato) conditions.push(eq(leadsTable.stato, query.stato));
  for (const key of ["from", "to"] as const) {
    const value = query[key];
    if (!value) continue;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Data non valida");
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Data non valida");
    if (key === "from") conditions.push(gte(leadsTable.createdAt, date));
    else { date.setUTCDate(date.getUTCDate() + 1); conditions.push(lt(leadsTable.createdAt, date)); }
  }
  return and(...conditions);
}
const csv = (value: unknown) => {
  let text = String(value ?? "");
  // Prevent spreadsheet formula injection, including phone numbers starting '+'.
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
router.get("/admin/leads/export", async (req, res) => {
  try {
    const where = filters(req.query); await ensureLeadSchema();
    const rows = await db.select().from(leadsTable).where(where).orderBy(desc(leadsTable.createdAt));
    const header = ["ID", "Data UTC", "Attività", "Tipo", "WhatsApp", "Settore", "Pagina", "Stato", "Notifica",
      "UTM source", "UTM medium", "UTM campaign", "UTM content", "UTM term", "GCLID", "GBRAID", "WBRAID", "Qualificato UTC", "Consenso marketing"];
    const lines = rows.map((lead) => [lead.id, lead.createdAt.toISOString(), lead.nomeAttivita, lead.settore,
      lead.whatsapp, lead.slug, lead.pagina, lead.stato, lead.notification,
      ...["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].map((key) => lead.attribution[key] ?? ""),
      ...["gclid", "gbraid", "wbraid"].map((key) => lead.marketingConsent ? lead.attribution[key] ?? "" : ""),
      lead.qualifiedAt?.toISOString() ?? "", lead.marketingConsent ? "sì" : "no"].map(csv).join(","));
    res.setHeader("Content-Disposition", 'attachment; filename="promoapp-contatti.csv"');
    res.type("text/csv").send(`\uFEFF${header.map(csv).join(",")}\r\n${lines.join("\r\n")}`);
  } catch { res.status(400).json({ message: "Esportazione non disponibile o filtri non validi." }); }
});
router.get("/admin/leads", async (req, res) => {
  try {
    const where = filters(req.query); await ensureLeadSchema();
    const rows = await db.select().from(leadsTable).where(where).orderBy(desc(leadsTable.createdAt));
    // Dedup keys and private request content are not needed in the list.
    res.json(rows.map(({ dedupKey, email, messaggio, ...lead }) => lead));
  } catch { res.status(400).json({ message: "Elenco non disponibile o filtri non validi." }); }
});
router.patch("/admin/leads/:id", async (req, res) => {
  const parsed = UpdateCommercialLeadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: "Stato non valido." }); return; }
  try {
    await ensureLeadSchema();
    const lead = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(leadsTable).where(eq(leadsTable.id, req.params.id)).for("update");
      if (!current) return undefined;
      const qualified = parsed.data.qualified === true && !current.qualifiedAt;
      const [updated] = await tx.update(leadsTable).set({
        stato: parsed.data.stato,
        ...(qualified ? { qualifiedAt: new Date(), events: [...current.events, { event: "qualified_lead", at: new Date().toISOString() }] } : {}),
      }).where(eq(leadsTable.id, current.id)).returning();
      return updated;
    });
    if (!lead) { res.status(404).json({ message: "Contatto non trovato." }); return; }
    const { dedupKey, email, messaggio, ...safe } = lead;
    res.json(safe);
  } catch { res.status(500).json({ message: "Aggiornamento non riuscito." }); }
});
router.post("/admin/leads/:id/notify", async (req, res) => {
  try {
    await ensureLeadSchema();
    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, req.params.id));
    if (!lead) { res.status(404).json({ success: false }); return; }
    const sent = lead.notification === "sent" || await notifyLead(lead);
    res.json({ success: sent, notification: sent ? "sent" : "pending" });
  } catch { res.status(500).json({ success: false, message: "Notifica non riuscita." }); }
});
export default router;
