import { Router } from "express";
import { db } from "@workspace/db";
import { richiesteGestionaleTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { Resend } from "resend";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "derosa.lazio@gmail.com";

router.post("/richiesta-gestionale", async (req, res) => {
  const { tipo, nome, cognome, email, telefono, tipoSoggetto, ragioneSociale, piva, codiceFiscale, settore, note } = req.body as Record<string, string>;
  if (!tipo || !nome || !email) { res.status(400).json({ error: "Dati mancanti" }); return; }

  await db.insert(richiesteGestionaleTable).values({
    id: randomUUID(), tipo, nome, cognome: cognome ?? "", email, telefono: telefono ?? "",
    tipoSoggetto: tipoSoggetto ?? "privato", ragioneSociale: ragioneSociale || null,
    piva: piva || null, codiceFiscale: codiceFiscale || null, settore: settore || null,
    note: note || null, stato: "nuova",
  });

  const nomeGestionale = tipo === "gestionale360" ? "Gestionale360" : "AgentiPro";
  const nomeCompleto = [nome, cognome].filter(Boolean).join(" ");

  const rigaFiscale = (label: string, val?: string | null) =>
    val ? `<tr><td style="padding:6px 0;font-weight:bold;color:#374151;width:160px;">${label}</td><td style="padding:6px 0;color:#111827;">${val}</td></tr>` : "";

  const htmlAdmin = `
    <div style="font-family:sans-serif;max-width:620px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#4f46e5;margin-top:0;">🆕 Nuova richiesta prova — ${nomeGestionale}</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${rigaFiscale("Nome", nomeCompleto)}
        ${rigaFiscale("Email", `<a href="mailto:${email}" style="color:#4f46e5;">${email}</a>`)}
        ${rigaFiscale("Telefono", telefono ? `<a href="tel:${telefono}" style="color:#4f46e5;">${telefono}</a>` : null)}
        ${rigaFiscale("Tipo soggetto", tipoSoggetto)}
        ${rigaFiscale("Ragione sociale", ragioneSociale)}
        ${rigaFiscale("P.IVA", piva)}
        ${rigaFiscale("Codice fiscale", codiceFiscale)}
        ${rigaFiscale("Settore", settore)}
        ${rigaFiscale("Note", note)}
      </table>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <a href="https://promoapp.it/admin" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none;">Apri pannello admin →</a>
    </div>`;

  const htmlCliente = `
    <div style="font-family:sans-serif;max-width:620px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#4f46e5;margin-top:0;">Richiesta ricevuta ✅</h2>
      <p style="color:#374151;">Ciao <strong>${nome}</strong>,</p>
      <p style="color:#374151;">abbiamo ricevuto la tua richiesta di prova gratuita per <strong>${nomeGestionale}</strong>.</p>
      <p style="color:#374151;">Il nostro team ti invierà le credenziali di accesso <strong>nelle prossime ore</strong>.</p>
      <div style="background:#f3f4f6;border-radius:10px;padding:16px;margin:20px 0;">
        <p style="margin:0;color:#6b7280;font-size:14px;">Hai bisogno di assistenza immediata? Scrivici su WhatsApp:</p>
        <a href="https://wa.me/393793602035" style="display:inline-block;margin-top:10px;background:#25d366;color:#fff;padding:10px 20px;border-radius:8px;font-weight:bold;text-decoration:none;">💬 Contattaci su WhatsApp</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">PromoApp.it · Sophia 2005 S.r.l. · P.IVA 08223951008</p>
    </div>`;

  await Promise.allSettled([
    resend.emails.send({
      from: "PromoApp.it <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `🆕 Richiesta prova ${nomeGestionale} — ${nomeCompleto}`,
      html: htmlAdmin,
    }),
    resend.emails.send({
      from: "PromoApp.it <onboarding@resend.dev>",
      to: email,
      subject: `Richiesta ricevuta — ${nomeGestionale}`,
      html: htmlCliente,
    }),
  ]);

  res.json({ ok: true });
});

/* ── Contatore visite Gestionale360 (pubblico) ── */
router.post("/gestionale/visita", async (_req, res) => {
  await db.execute(sql`
    INSERT INTO app_settings (key, value) VALUES ('visite_g360', '1')
    ON CONFLICT (key) DO UPDATE SET value = (CAST(app_settings.value AS INTEGER) + 1)::TEXT
  `);
  res.json({ ok: true });
});

router.get("/gestionale/visite", async (_req, res) => {
  const row = await db.execute(sql`SELECT value FROM app_settings WHERE key = 'visite_g360'`);
  const value = (row.rows[0] as any)?.value ?? "0";
  res.json({ visite: parseInt(value, 10) });
});

/* ── Contatore licenze (pubblico) ── */
router.get("/gestionale/contatore", async (_req, res) => {
  const row = await db.execute(sql`SELECT value FROM app_settings WHERE key = 'licenze_g360'`);
  const value = (row.rows[0] as any)?.value ?? "47";
  res.json({ licenze: parseInt(value, 10) });
});

export default router;
