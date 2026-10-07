import { Router } from "express";
import { createHash, randomUUID } from "node:crypto";
import { db, leadsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { normalizeWhatsApp, legacyServiceCodes } from "../lib/contact-input";
import { SubmitContactBody } from "@workspace/api-zod";
import { ensureLeadSchema, notifyLead } from "../lib/leads";

const router = Router();
router.get("/marketing-config", (_req, res) => {
  res.json({
    gtmId: process.env.GTM_ID ?? "", ga4Id: process.env.GA4_ID ?? "",
    googleAdsId: process.env.GOOGLE_ADS_ID ?? "", googleAdsLeadLabel: process.env.GOOGLE_ADS_LEAD_LABEL ?? "",
    metaPixelId: process.env.META_PIXEL_ID ?? "",
  });
});
// Bounded, short-lived anti-abuse state; phone numbers/IP addresses are not logged.
const attempts = new Map<string, { count: number; expires: number }>();
router.post("/invia-contatto", async (req, res): Promise<void> => {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires < now) attempts.delete(key);
  const origin = req.get("origin");
  if (origin) {
    const allowed = new Set(["www.promoapp.it", "promoapp.it", "localhost", "127.0.0.1",
      ...(process.env.REPLIT_DOMAINS ?? "").split(","), req.hostname]);
    try { if (!allowed.has(new URL(origin).hostname)) { res.status(403).json({ success: false, message: "Origine non autorizzata." }); return; } }
    catch { res.status(403).json({ success: false }); return; }
  }
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? { ...req.body } : {};
  for (const field of ["nome_attivita", "settore", "email", "whatsapp", "messaggio"])
    if (typeof body[field] === "string") body[field] = body[field].trim();
  if (body.email === "") delete body.email;
  const parsed = SubmitContactBody.safeParse(body);
  if (!parsed.success || !/^[+\d\s().-]{6,30}$/.test(parsed.data?.whatsapp ?? "") ||
      (parsed.data?.whatsapp.replace(/\D/g, "").length ?? 0) < 6) {
    res.status(400).json({ success: false, message: "Controlla nome attività, tipo attività, WhatsApp e informativa privacy." });
    return;
  }
  const ipKey = createHash("sha256").update(req.ip ?? "unknown").digest("hex");
  const limit = attempts.get(ipKey) ?? { count: 0, expires: now + 600_000 };
  if (limit.count >= 15 || attempts.size > 10000) {
    res.status(429).json({ success: false, message: "Troppi tentativi. Attendi qualche minuto oppure scrivici su WhatsApp." }); return;
  }
  limit.count++; attempts.set(ipKey, limit);
  const data = parsed.data;
  const rawPhone = data.whatsapp;
  const normalizedPhone = normalizeWhatsApp(rawPhone);
  if (!normalizedPhone) {
    res.status(400).json({ success: false, message: "Inserisci un numero WhatsApp valido. Per numeri esteri indica il prefisso, ad esempio +44." }); return;
  }
  data.whatsapp = normalizedPhone;
  const submittedService = data.servizio ?? "generale";
  const service = legacyServiceCodes[submittedService] ?? submittedService;
  const attribution: Record<string, string> = {};
  if (data.marketingConsent || data.analyticsConsent) {
    for (const [key, value] of Object.entries(data.attribution ?? {}))
      if (typeof value === "string" && (data.marketingConsent || !["gclid", "gbraid", "wbraid"].includes(key)))
        attribution[key] = value;
  }
  // Atomic deduplication across concurrent submissions, scoped to this campaign/day.
  const phone = data.whatsapp.replace(/\D/g, "");
  const day = new Date().toISOString().slice(0, 10);
  const keyFor = (number: string, code: string) => createHash("sha256").update([
    number, data.settore.toLowerCase(), code, day,
  ].join("|")).digest("hex");
  const dedupKey = keyFor(phone, service);
  const legacyService = service === "sector_custom" ? "generale"
    : Object.keys(legacyServiceCodes).find((key) => legacyServiceCodes[key] === service) ?? submittedService;
  const numbers = [phone, rawPhone.replace(/\D/g, ""), phone.startsWith("39") ? phone.slice(2) : phone];
  const compatibleKeys = [...new Set(numbers.flatMap((number) =>
    [service, legacyService].map((code) => keyFor(number, code))))];
  try {
    await ensureLeadSchema();
    const [previous] = await db.select().from(leadsTable).where(inArray(leadsTable.dedupKey, compatibleKeys)).limit(1);
    const [created] = previous ? [] : await db.insert(leadsTable).values({
      id: randomUUID(), nomeAttivita: data.nome_attivita, settore: data.settore,
      whatsapp: data.whatsapp, email: data.email ?? null, messaggio: data.messaggio ?? "",
      servizio: service, pagina: data.pagina ?? "/",
      slug: data.slug ?? "generale", variant: data.variant ?? "control",
      privacy: true, marketingConsent: data.marketingConsent ?? false,
      analyticsConsent: data.analyticsConsent ?? false, attribution, dedupKey,
      events: [{ event: "generate_lead", at: new Date().toISOString() }],
    }).onConflictDoNothing({ target: leadsTable.dedupKey }).returning();
    const lead = previous ?? created ?? (await db.select().from(leadsTable).where(eq(leadsTable.dedupKey, dedupKey)))[0];
    if (!lead) throw new Error("Lead storage unavailable");
    // Duplicate submissions never send a second notification or acquisition event.
    const notified = created ? await notifyLead(lead) : lead.notification === "sent";
    res.json({ success: true, leadId: lead.id, duplicate: !created,
      notification: notified ? "sent" : "pending",
      message: "Richiesta salvata. Ti ricontatteremo al numero indicato." });
  } catch {
    req.log.error("Salvataggio richiesta contatto fallito");
    res.status(500).json({ success: false, message: "La richiesta non è stata salvata. Riprova oppure scrivici su WhatsApp." });
  }
});
export default router;
