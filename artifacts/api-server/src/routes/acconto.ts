import { Router } from "express";
import { Resend } from "resend";
import { db, accontiTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { randomUUID } from "crypto";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = "derosa.lazio@gmail.com";

function emailRicevutaCliente(a: {
  nome: string; cognome: string; progetto: string;
  importo: number; id: string; paidAt: string;
  tipo: string; ragioneSociale?: string | null; piva?: string | null;
}): string {
  const importoFmt = (a.importo / 100).toFixed(2).replace(".", ",");
  const dataFmt = new Date(a.paidAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  const intestazione = a.tipo === "azienda" && a.ragioneSociale ? a.ragioneSociale : `${a.nome} ${a.cognome}`;

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ricevuta Acconto — PromoApp.it</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- HEADER GRADIENTE -->
      <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#0ea5e9 50%,#10b981 100%);padding:40px 32px;text-align:center;">
        <div style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1px;margin-bottom:4px;">
          Promo<span style="color:#fbbf24;">App</span>.it
        </div>
        <div style="color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Ricevuta Acconto</div>
      </td></tr>

      <!-- BADGE CONFERMATO -->
      <tr><td style="padding:32px 32px 0;text-align:center;">
        <div style="display:inline-block;background:#dcfce7;border:2px solid #16a34a;border-radius:50px;padding:10px 24px;">
          <span style="color:#15803d;font-size:15px;font-weight:700;">✓ Acconto ricevuto e confermato</span>
        </div>
      </td></tr>

      <!-- DETTAGLI TRANSAZIONE -->
      <tr><td style="padding:28px 32px 0;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;">
          <div style="font-size:12px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Riepilogo transazione</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:14px;width:50%;">N° ricevuta</td>
              <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;font-family:monospace;">${a.id.slice(0, 8).toUpperCase()}</td>
            </tr>
            <tr><td colspan="2" style="border-top:1px solid #e5e7eb;"></td></tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:14px;">Data</td>
              <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${dataFmt}</td>
            </tr>
            <tr><td colspan="2" style="border-top:1px solid #e5e7eb;"></td></tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;font-size:14px;">Intestato a</td>
              <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${intestazione}</td>
            </tr>
            <tr><td colspan="2" style="border-top:1px solid #e5e7eb;"></td></tr>
            <tr>
              <td style="padding:12px 0 4px;color:#374151;font-size:14px;font-weight:600;vertical-align:top;">Progetto</td>
              <td style="padding:12px 0 4px;color:#111827;font-size:14px;text-align:right;">${a.progetto}</td>
            </tr>
            <tr><td colspan="2" style="border-top:2px solid #6366f1;margin-top:8px;"></td></tr>
            <tr>
              <td style="padding:16px 0 0;color:#374151;font-size:18px;font-weight:700;">Importo pagato</td>
              <td style="padding:16px 0 0;text-align:right;">
                <span style="font-size:32px;font-weight:900;color:#6366f1;">${importoFmt}€</span>
              </td>
            </tr>
          </table>
        </div>
      </td></tr>

      ${a.tipo === "azienda" && a.piva ? `
      <!-- DATI FISCALI AZIENDA -->
      <tr><td style="padding:16px 32px 0;">
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:16px;">
          <div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Dati fiscali</div>
          <div style="font-size:13px;color:#4b5563;">${a.ragioneSociale ?? ""} · P.IVA ${a.piva}</div>
        </div>
      </td></tr>` : ""}

      <!-- MESSAGGIO -->
      <tr><td style="padding:24px 32px;">
        <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
          Gentile <strong>${a.nome}</strong>,<br><br>
          abbiamo ricevuto il tuo acconto di <strong>${importoFmt}€</strong> per il progetto <strong>"${a.progetto}"</strong>.<br>
          Il nostro team ti contatterà a breve per procedere con la realizzazione.
        </p>
        <div style="margin-top:20px;padding:16px;background:#eff6ff;border-radius:12px;border-left:4px solid #6366f1;">
          <p style="margin:0;color:#1e40af;font-size:13px;">
            📞 Hai domande? Scrivici su WhatsApp al <strong>+39 379 360 2035</strong> o rispondi a questa email.
          </p>
        </div>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#1e1b4b;padding:24px 32px;text-align:center;border-radius:0 0 20px 20px;">
        <div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:700;margin-bottom:4px;">PromoApp.it — Sophia 2005 S.r.l.</div>
        <div style="color:rgba(255,255,255,0.5);font-size:11px;">P.IVA 08223951008 · info@promoapp.it</div>
        <div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:8px;">Questa è una ricevuta ufficiale. Conservala per i tuoi archivi.</div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

router.post("/acconto/create-intent", async (req, res) => {
  const {
    progetto, tipo, nome, cognome, email, telefono,
    indirizzo, cap, citta, provincia, codiceFiscale,
    ragioneSociale, piva, sdi, pec, importoEuro,
  } = req.body as Record<string, string>;

  if (!progetto?.trim()) return res.status(400).json({ error: "Descrizione progetto obbligatoria" });
  if (!nome?.trim() || !cognome?.trim() || !email?.trim() || !telefono?.trim()) return res.status(400).json({ error: "Dati cliente incompleti" });
  if (!indirizzo?.trim() || !cap?.trim() || !citta?.trim()) return res.status(400).json({ error: "Indirizzo obbligatorio" });

  const centesimi = Math.round(parseFloat(importoEuro) * 100);
  if (!centesimi || centesimi < 100) return res.status(400).json({ error: "Importo minimo 1€" });

  const id = randomUUID();

  try {
    const stripe = await getUncachableStripeClient();
    const pi = await stripe.paymentIntents.create({
      amount: centesimi,
      currency: "eur",
      receipt_email: email,
      metadata: { accontoId: id, progetto, customerName: `${nome} ${cognome}` },
      automatic_payment_methods: { enabled: true },
    });

    await db.insert(accontiTable).values({
      id,
      progetto,
      tipo: tipo ?? "privato",
      nome, cognome, email, telefono,
      indirizzo, cap, citta,
      provincia: provincia || null,
      codiceFiscale: codiceFiscale || null,
      ragioneSociale: ragioneSociale || null,
      piva: piva || null,
      sdi: sdi || null,
      pec: pec || null,
      importoCentesimi: centesimi,
      stripePaymentIntentId: pi.id,
      stato: "in_attesa",
    });

    res.json({ clientSecret: pi.client_secret, accontoId: id });
  } catch (err: any) {
    req.log.error({ err }, "Errore creazione acconto");
    res.status(500).json({ error: err.message || "Errore interno" });
  }
});

router.post("/acconto/confirm", async (req, res) => {
  const { paymentIntentId } = req.body as { paymentIntentId: string };
  if (!paymentIntentId) return res.status(400).json({ error: "paymentIntentId mancante" });

  try {
    const stripe = await getUncachableStripeClient();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") return res.status(400).json({ error: "Pagamento non ancora completato" });

    const accontoId = pi.metadata.accontoId;
    const [acconto] = await db.select().from(accontiTable).where(eq(accontiTable.id, accontoId));
    if (!acconto) return res.status(404).json({ error: "Acconto non trovato" });

    if (acconto.stato === "pagato") return res.json({ ok: true, already: true });

    const now = new Date();
    await db.update(accontiTable).set({ stato: "pagato", paidAt: now }).where(eq(accontiTable.id, accontoId));

    const htmlCliente = emailRicevutaCliente({
      nome: acconto.nome,
      cognome: acconto.cognome,
      progetto: acconto.progetto,
      importo: acconto.importoCentesimi,
      id: acconto.id,
      paidAt: now.toISOString(),
      tipo: acconto.tipo,
      ragioneSociale: acconto.ragioneSociale,
      piva: acconto.piva,
    });

    await resend.emails.send({
      from: "PromoApp.it <onboarding@resend.dev>",
      to: acconto.email,
      subject: `✅ Ricevuta acconto — ${acconto.progetto}`,
      html: htmlCliente,
    });

    await resend.emails.send({
      from: "PromoApp.it <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `💰 Nuovo acconto: ${(acconto.importoCentesimi / 100).toFixed(2)}€ — ${acconto.progetto}`,
      html: `<div style="font-family:sans-serif;max-width:500px;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#6366f1;margin-top:0;">Nuovo acconto ricevuto</h2>
        <p><strong>Cliente:</strong> ${acconto.nome} ${acconto.cognome}</p>
        <p><strong>Email:</strong> <a href="mailto:${acconto.email}">${acconto.email}</a></p>
        <p><strong>Telefono:</strong> ${acconto.telefono}</p>
        <p><strong>Progetto:</strong> ${acconto.progetto}</p>
        <p><strong>Importo:</strong> <span style="color:#6366f1;font-size:20px;font-weight:bold;">${(acconto.importoCentesimi / 100).toFixed(2).replace(".", ",")}€</span></p>
        ${acconto.tipo === "azienda" ? `<p><strong>Azienda:</strong> ${acconto.ragioneSociale ?? ""} · P.IVA ${acconto.piva ?? ""}</p>` : ""}
        <p><strong>Indirizzo:</strong> ${acconto.indirizzo}, ${acconto.cap} ${acconto.citta} (${acconto.provincia ?? ""})</p>
      </div>`,
    });

    res.json({ ok: true });
  } catch (err: any) {
    req.log.error({ err }, "Errore conferma acconto");
    res.status(500).json({ error: err.message || "Errore interno" });
  }
});

router.get("/admin/acconti", async (req, res) => {
  const pwd = req.headers["x-admin-password"];
  if (pwd !== process.env.ADMIN_PASSWORD && pwd !== "promoapp2025") {
    return res.status(401).json({ error: "Non autorizzato" });
  }
  const rows = await db.select().from(accontiTable).orderBy(accontiTable.createdAt);
  res.json(rows.reverse());
});

export default router;
