import { Router } from "express";
import { Resend } from "resend";
import { db, accontiTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { emailRicevuta } from "../lib/emailTemplates";
import { matchesAdminPassword } from "../middlewares/adminAuthorization";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "derosa.lazio@gmail.com";

function getDomain(): string {
  return process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : "http://localhost:80";
}

// ===== PAYPAL ACCONTO =====
router.post("/acconto/paypal/create", async (req, res) => {
  const {
    progetto, tipo, nome, cognome, email, telefono,
    indirizzo, cap, citta, provincia, codiceFiscale,
    ragioneSociale, piva, sdi, pec, importoEuro, importoTotaleEuro,
  } = req.body as Record<string, string>;

  if (!progetto?.trim()) return res.status(400).json({ error: "Descrizione progetto obbligatoria" });
  if (!nome?.trim() || !cognome?.trim() || !email?.trim() || !telefono?.trim()) return res.status(400).json({ error: "Dati cliente incompleti" });
  if (!indirizzo?.trim() || !cap?.trim() || !citta?.trim()) return res.status(400).json({ error: "Indirizzo obbligatorio" });

  const centesimi = Math.round(parseFloat(importoEuro) * 100);
  if (!centesimi || centesimi < 100) return res.status(400).json({ error: "Importo minimo 1€" });

  const totaleCentesimi = importoTotaleEuro ? Math.round(parseFloat(importoTotaleEuro) * 100) : null;
  const id = randomUUID();

  try {
    await db.insert(accontiTable).values({
      id, progetto, tipoPagamento: "acconto",
      tipo: tipo ?? "privato",
      nome, cognome, email, telefono,
      indirizzo, cap, citta,
      provincia: provincia || null,
      codiceFiscale: codiceFiscale || null,
      ragioneSociale: ragioneSociale || null,
      piva: piva || null,
      sdi: sdi || null,
      pec: pec || null,
      importoTotaleCentesimi: totaleCentesimi,
      importoCentesimi: centesimi,
      stripePaymentIntentId: null,
      stato: "in_attesa",
    });
    res.json({ accontoId: id });
  } catch (err: any) {
    req.log.error({ err }, "Errore creazione acconto PayPal");
    res.status(500).json({ error: err.message || "Errore interno" });
  }
});

router.post("/acconto/paypal/confirm", async (req, res) => {
  const { accontoId, orderId } = req.body as { accontoId: string; orderId: string };
  if (!accontoId || !orderId) return res.status(400).json({ error: "Dati mancanti" });

  try {
    const [acconto] = await db.select().from(accontiTable).where(eq(accontiTable.id, accontoId));
    if (!acconto) return res.status(404).json({ error: "Acconto non trovato" });
    if (acconto.stato === "pagato") return res.json({ ok: true, already: true });

    const now = new Date();
    await db.update(accontiTable).set({ stato: "pagato", paidAt: now, stripePaymentIntentId: `paypal_${orderId}` }).where(eq(accontiTable.id, accontoId));

    const saldoRimanente = Math.max(0, (acconto.importoTotaleCentesimi ?? 0) - acconto.importoCentesimi);

    const htmlCliente = emailRicevuta({
      nome: acconto.nome, cognome: acconto.cognome, progetto: acconto.progetto,
      importo: acconto.importoCentesimi, id: acconto.id, paidAt: now.toISOString(),
      tipo: acconto.tipo, ragioneSociale: acconto.ragioneSociale, piva: acconto.piva,
      tipoPagamento: "acconto", importoTotale: acconto.importoTotaleCentesimi,
      saldoRimanente, metodoPagamento: "paypal",
    });

    await resend.emails.send({
      from: "PromoApp.it <onboarding@resend.dev>",
      to: acconto.email,
      subject: `✅ Ricevuta acconto (PayPal) — ${acconto.progetto}`,
      html: htmlCliente,
    });

    const importoFmt = (acconto.importoCentesimi / 100).toFixed(2).replace(".", ",");
    await resend.emails.send({
      from: "PromoApp.it <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `💰 Acconto PayPal: ${importoFmt}€ — ${acconto.progetto}`,
      html: `<div style="font-family:sans-serif;max-width:500px;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#003087;">🟡 Nuovo acconto PayPal ricevuto</h2>
        <p><strong>Cliente:</strong> ${acconto.nome} ${acconto.cognome}</p>
        <p><strong>Email:</strong> <a href="mailto:${acconto.email}">${acconto.email}</a></p>
        <p><strong>Telefono:</strong> ${acconto.telefono}</p>
        <p><strong>Progetto:</strong> ${acconto.progetto}</p>
        <p><strong>Versato:</strong> <span style="font-size:20px;font-weight:bold;color:#003087;">${importoFmt}€</span></p>
        <p><strong>PayPal Order ID:</strong> <code>${orderId}</code></p>
        ${acconto.importoTotaleCentesimi ? `<p><strong>Totale progetto:</strong> ${(acconto.importoTotaleCentesimi / 100).toFixed(2).replace(".", ",")}€</p>` : ""}
      </div>`,
    });

    res.json({ ok: true });
  } catch (err: any) {
    req.log.error({ err }, "Errore conferma PayPal");
    res.status(500).json({ error: err.message || "Errore interno" });
  }
});

// ===== STRIPE ACCONTO =====
router.post("/acconto/stripe/create-session", async (req, res) => {
  const {
    progetto, tipo, nome, cognome, email, telefono,
    indirizzo, cap, citta, provincia, codiceFiscale,
    ragioneSociale, piva, sdi, pec, importoEuro, importoTotaleEuro,
  } = req.body as Record<string, string>;

  if (!progetto?.trim()) return res.status(400).json({ error: "Descrizione progetto obbligatoria" });
  if (!nome?.trim() || !cognome?.trim() || !email?.trim() || !telefono?.trim()) return res.status(400).json({ error: "Dati cliente incompleti" });
  if (!indirizzo?.trim() || !cap?.trim() || !citta?.trim()) return res.status(400).json({ error: "Indirizzo obbligatorio" });

  const centesimi = Math.round(parseFloat(importoEuro) * 100);
  if (!centesimi || centesimi < 100) return res.status(400).json({ error: "Importo minimo 1€" });

  const totaleCentesimi = importoTotaleEuro ? Math.round(parseFloat(importoTotaleEuro) * 100) : null;
  const id = randomUUID();

  try {
    await db.insert(accontiTable).values({
      id, progetto, tipoPagamento: "acconto",
      tipo: tipo ?? "privato",
      nome, cognome, email, telefono,
      indirizzo, cap, citta,
      provincia: provincia || null,
      codiceFiscale: codiceFiscale || null,
      ragioneSociale: ragioneSociale || null,
      piva: piva || null,
      sdi: sdi || null,
      pec: pec || null,
      importoTotaleCentesimi: totaleCentesimi,
      importoCentesimi: centesimi,
      stripePaymentIntentId: null,
      stato: "in_attesa",
    });

    const stripe = await getUncachableStripeClient();
    const domain = getDomain();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: centesimi,
          product_data: {
            name: `Acconto: ${progetto.slice(0, 80)}`,
            description: "PromoApp.it — Sophia 2005 S.r.l.",
          },
        },
        quantity: 1,
      }],
      customer_email: email,
      metadata: { accontoId: id, tipoPagamento: "acconto" },
      success_url: `${domain}/pagamenti?stripe_success=1&tipo=acconto`,
      cancel_url: `${domain}/pagamenti?stripe_cancel=1`,
      locale: "it",
    });

    res.json({ url: session.url });
  } catch (err: any) {
    req.log.error({ err }, "Errore Stripe create-session acconto");
    res.status(500).json({ error: err.message || "Errore interno" });
  }
});

// ===== PAYPAL SALDO =====
router.post("/acconto/saldo/paypal/create", async (req, res) => {
  const { progettoRef, importoEuro } = req.body as Record<string, string>;
  if (!progettoRef || !importoEuro) return res.status(400).json({ error: "Dati mancanti" });

  const centesimi = Math.round(parseFloat(importoEuro) * 100);
  if (!centesimi || centesimi < 100) return res.status(400).json({ error: "Importo minimo 1€" });

  const [originale] = await db.select().from(accontiTable).where(eq(accontiTable.id, progettoRef));
  if (!originale) return res.status(404).json({ error: "Progetto non trovato" });

  const pagamenti = await db.select().from(accontiTable).where(
    sql`(${accontiTable.id} = ${progettoRef} OR ${accontiTable.progettoRef} = ${progettoRef}) AND ${accontiTable.stato} = 'pagato'`
  );
  const totaleVersato = pagamenti.reduce((s, p) => s + p.importoCentesimi, 0);
  const saldoRimanente = (originale.importoTotaleCentesimi ?? 0) - totaleVersato;

  if (centesimi > saldoRimanente + 1) return res.status(400).json({ error: `Il saldo rimanente è ${(saldoRimanente / 100).toFixed(2)}€` });

  const id = randomUUID();
  try {
    await db.insert(accontiTable).values({
      id, progetto: originale.progetto, tipoPagamento: "saldo", progettoRef,
      tipo: originale.tipo, nome: originale.nome, cognome: originale.cognome,
      email: originale.email, telefono: originale.telefono,
      indirizzo: originale.indirizzo, cap: originale.cap, citta: originale.citta,
      provincia: originale.provincia, codiceFiscale: originale.codiceFiscale,
      ragioneSociale: originale.ragioneSociale, piva: originale.piva,
      sdi: originale.sdi, pec: originale.pec,
      importoTotaleCentesimi: originale.importoTotaleCentesimi,
      importoCentesimi: centesimi,
      stripePaymentIntentId: null,
      stato: "in_attesa",
    });
    res.json({ accontoId: id, saldoRimanente, progetto: originale.progetto });
  } catch (err: any) {
    req.log.error({ err }, "Errore creazione saldo PayPal");
    res.status(500).json({ error: err.message || "Errore interno" });
  }
});

router.post("/acconto/paypal/saldo/confirm", async (req, res) => {
  const { accontoId, orderId } = req.body as { accontoId: string; orderId: string };
  if (!accontoId || !orderId) return res.status(400).json({ error: "Dati mancanti" });

  try {
    const [acconto] = await db.select().from(accontiTable).where(eq(accontiTable.id, accontoId));
    if (!acconto) return res.status(404).json({ error: "Acconto non trovato" });
    if (acconto.stato === "pagato") return res.json({ ok: true, already: true });

    const now = new Date();
    await db.update(accontiTable).set({ stato: "pagato", paidAt: now, stripePaymentIntentId: `paypal_${orderId}` }).where(eq(accontiTable.id, accontoId));

    const refId = acconto.progettoRef ?? accontoId;
    const pagamenti = await db.select().from(accontiTable).where(
      sql`(${accontiTable.id} = ${refId} OR ${accontiTable.progettoRef} = ${refId}) AND ${accontiTable.stato} = 'pagato'`
    );
    const totaleVersato = pagamenti.reduce((s, p) => s + p.importoCentesimi, 0) + acconto.importoCentesimi;
    const saldoRimanente = Math.max(0, (acconto.importoTotaleCentesimi ?? 0) - totaleVersato);

    const htmlCliente = emailRicevuta({
      nome: acconto.nome, cognome: acconto.cognome, progetto: acconto.progetto,
      importo: acconto.importoCentesimi, id: acconto.id, paidAt: now.toISOString(),
      tipo: acconto.tipo, ragioneSociale: acconto.ragioneSociale, piva: acconto.piva,
      tipoPagamento: "saldo", importoTotale: acconto.importoTotaleCentesimi,
      saldoRimanente, metodoPagamento: "paypal",
    });

    await resend.emails.send({
      from: "PromoApp.it <onboarding@resend.dev>",
      to: acconto.email,
      subject: `✅ Ricevuta saldo (PayPal) — ${acconto.progetto}`,
      html: htmlCliente,
    });

    const importoFmt = (acconto.importoCentesimi / 100).toFixed(2).replace(".", ",");
    await resend.emails.send({
      from: "PromoApp.it <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `💰 SALDO PayPal: ${importoFmt}€ — ${acconto.progetto}`,
      html: `<div style="font-family:sans-serif;max-width:500px;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#003087;">🟡 Saldo PayPal ricevuto</h2>
        <p><strong>Cliente:</strong> ${acconto.nome} ${acconto.cognome}</p>
        <p><strong>Email:</strong> <a href="mailto:${acconto.email}">${acconto.email}</a></p>
        <p><strong>Progetto:</strong> ${acconto.progetto}</p>
        <p><strong>Saldo versato:</strong> <span style="font-size:20px;font-weight:bold;color:#003087;">${importoFmt}€</span></p>
        <p><strong>PayPal Order ID:</strong> <code>${orderId}</code></p>
        <p><strong>Saldo rimanente:</strong> <span style="color:${saldoRimanente === 0 ? "#10b981" : "#f59e0b"};font-weight:bold;">${(saldoRimanente / 100).toFixed(2).replace(".", ",")}€</span></p>
      </div>`,
    });

    res.json({ ok: true });
  } catch (err: any) {
    req.log.error({ err }, "Errore conferma saldo PayPal");
    res.status(500).json({ error: err.message || "Errore interno" });
  }
});

// ===== STRIPE SALDO =====
router.post("/acconto/saldo/stripe/create-session", async (req, res) => {
  const { progettoRef, importoEuro } = req.body as Record<string, string>;
  if (!progettoRef || !importoEuro) return res.status(400).json({ error: "Dati mancanti" });

  const centesimi = Math.round(parseFloat(importoEuro) * 100);
  if (!centesimi || centesimi < 100) return res.status(400).json({ error: "Importo minimo 1€" });

  const [originale] = await db.select().from(accontiTable).where(eq(accontiTable.id, progettoRef));
  if (!originale) return res.status(404).json({ error: "Progetto non trovato" });

  const pagamenti = await db.select().from(accontiTable).where(
    sql`(${accontiTable.id} = ${progettoRef} OR ${accontiTable.progettoRef} = ${progettoRef}) AND ${accontiTable.stato} = 'pagato'`
  );
  const totaleVersato = pagamenti.reduce((s, p) => s + p.importoCentesimi, 0);
  const saldoRimanente = (originale.importoTotaleCentesimi ?? 0) - totaleVersato;

  if (centesimi > saldoRimanente + 1) return res.status(400).json({ error: `Il saldo rimanente è ${(saldoRimanente / 100).toFixed(2)}€` });

  const id = randomUUID();

  try {
    await db.insert(accontiTable).values({
      id, progetto: originale.progetto, tipoPagamento: "saldo", progettoRef,
      tipo: originale.tipo, nome: originale.nome, cognome: originale.cognome,
      email: originale.email, telefono: originale.telefono,
      indirizzo: originale.indirizzo, cap: originale.cap, citta: originale.citta,
      provincia: originale.provincia, codiceFiscale: originale.codiceFiscale,
      ragioneSociale: originale.ragioneSociale, piva: originale.piva,
      sdi: originale.sdi, pec: originale.pec,
      importoTotaleCentesimi: originale.importoTotaleCentesimi,
      importoCentesimi: centesimi,
      stripePaymentIntentId: null,
      stato: "in_attesa",
    });

    const stripe = await getUncachableStripeClient();
    const domain = getDomain();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: centesimi,
          product_data: {
            name: `Saldo: ${originale.progetto.slice(0, 80)}`,
            description: "PromoApp.it — Sophia 2005 S.r.l.",
          },
        },
        quantity: 1,
      }],
      customer_email: originale.email,
      metadata: { accontoId: id, tipoPagamento: "saldo" },
      success_url: `${domain}/pagamenti?stripe_success=1&tipo=saldo`,
      cancel_url: `${domain}/pagamenti?stripe_cancel=1`,
      locale: "it",
    });

    res.json({ url: session.url });
  } catch (err: any) {
    req.log.error({ err }, "Errore Stripe create-session saldo");
    res.status(500).json({ error: err.message || "Errore interno" });
  }
});

// ===== CERCA PROGETTO (per saldo) =====
router.get("/acconto/cerca-progetto", async (req, res) => {
  const { email } = req.query as { email: string };
  if (!email?.trim()) return res.status(400).json({ error: "Email obbligatoria" });

  const tutti = await db.select().from(accontiTable).where(
    sql`LOWER(${accontiTable.email}) = LOWER(${email.trim()}) AND ${accontiTable.progettoRef} IS NULL`
  );

  const progetti = await Promise.all(tutti.map(async (acc) => {
    const pagamenti = await db.select().from(accontiTable).where(
      sql`(${accontiTable.id} = ${acc.id} OR ${accontiTable.progettoRef} = ${acc.id}) AND ${accontiTable.stato} = 'pagato'`
    );
    const totaleVersato = pagamenti.reduce((s, p) => s + p.importoCentesimi, 0);
    const importoTotale = acc.importoTotaleCentesimi ?? 0;
    const saldoRimanente = Math.max(0, importoTotale - totaleVersato);
    return { id: acc.id, progetto: acc.progetto, nome: acc.nome, cognome: acc.cognome, importoTotale, totaleVersato, saldoRimanente, createdAt: acc.createdAt };
  }));

  const conSaldo = progetti.filter(p => p.saldoRimanente > 0 && p.importoTotale > 0);
  res.json(conSaldo);
});

// ===== ADMIN =====
router.get("/admin/acconti", async (req, res) => {
  if (!matchesAdminPassword(req.get("x-admin-password"))) {
    return res.status(401).json({ error: "Non autorizzato" });
  }
  const rows = await db.select().from(accontiTable).orderBy(accontiTable.createdAt);
  res.json(rows.reverse());
});

export default router;
