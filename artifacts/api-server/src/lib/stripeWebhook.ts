import type { Request, Response } from "express";
import { getUncachableStripeClient, getWebhookSecret } from "./stripeClient";
import { db, accontiTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { Resend } from "resend";
import { logger } from "./logger";
import { emailRicevuta } from "./emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "derosa.lazio@gmail.com";

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).json({ error: "stripe-signature mancante" });
    return;
  }

  let event: import("stripe").Stripe.Event;

  try {
    const stripe = await getUncachableStripeClient();
    const webhookSecret = getWebhookSecret();
    const sigStr = Array.isArray(sig) ? sig[0] : sig;

    if (!webhookSecret) {
      logger.warn("Stripe webhook secret non ancora configurato — evento accettato senza verifica firma");
      try {
        event = JSON.parse((req.body as Buffer).toString()) as import("stripe").Stripe.Event;
      } catch {
        res.status(400).json({ error: "Body non parsabile" });
        return;
      }
    } else {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sigStr, webhookSecret);
    }
  } catch (err: any) {
    logger.error({ err }, "Verifica firma webhook Stripe fallita");
    res.status(400).json({ error: "Verifica firma fallita" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const accontoId = session.metadata?.accontoId;
    const tipoPagamento = (session.metadata?.tipoPagamento ?? "acconto") as "acconto" | "saldo";

    if (!accontoId) {
      logger.warn({ sessionId: session.id }, "Webhook senza accontoId in metadata");
      res.json({ received: true });
      return;
    }

    try {
      const [acconto] = await db
        .select()
        .from(accontiTable)
        .where(eq(accontiTable.id, accontoId));

      if (!acconto) {
        logger.warn({ accontoId }, "Acconto non trovato per webhook Stripe");
        res.json({ received: true });
        return;
      }

      if (acconto.stato === "pagato") {
        res.json({ received: true });
        return;
      }

      const now = new Date();
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : null;

      await db
        .update(accontiTable)
        .set({ stato: "pagato", paidAt: now, stripePaymentIntentId: paymentIntentId })
        .where(eq(accontiTable.id, accontoId));

      // Calcola saldo rimanente
      let saldoRimanente = 0;
      if (tipoPagamento === "saldo" && acconto.progettoRef) {
        const refId = acconto.progettoRef;
        const pagamenti = await db.select().from(accontiTable).where(
          sql`(${accontiTable.id} = ${refId} OR ${accontiTable.progettoRef} = ${refId}) AND ${accontiTable.stato} = 'pagato'`
        );
        const totaleVersato = pagamenti.reduce((s, p) => s + p.importoCentesimi, 0);
        saldoRimanente = Math.max(0, (acconto.importoTotaleCentesimi ?? 0) - totaleVersato);
      } else {
        saldoRimanente = Math.max(
          0,
          (acconto.importoTotaleCentesimi ?? 0) - acconto.importoCentesimi
        );
      }

      const htmlCliente = emailRicevuta({
        nome: acconto.nome,
        cognome: acconto.cognome,
        progetto: acconto.progetto,
        importo: acconto.importoCentesimi,
        id: acconto.id,
        paidAt: now.toISOString(),
        tipo: acconto.tipo,
        ragioneSociale: acconto.ragioneSociale,
        piva: acconto.piva,
        tipoPagamento,
        importoTotale: acconto.importoTotaleCentesimi,
        saldoRimanente,
        metodoPagamento: "stripe",
      });

      const importoFmt = (acconto.importoCentesimi / 100).toFixed(2).replace(".", ",");
      const label = tipoPagamento === "saldo" ? "SALDO" : "Acconto";

      await resend.emails.send({
        from: "PromoApp.it <onboarding@resend.dev>",
        to: acconto.email,
        subject: `✅ Ricevuta ${label} (Stripe) — ${acconto.progetto}`,
        html: htmlCliente,
      });

      await resend.emails.send({
        from: "PromoApp.it <onboarding@resend.dev>",
        to: ADMIN_EMAIL,
        subject: `💳 ${label} Stripe: ${importoFmt}€ — ${acconto.progetto}`,
        html: `<div style="font-family:sans-serif;max-width:500px;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#6366f1;">💳 ${label} via Stripe ricevuto</h2>
          <p><strong>Cliente:</strong> ${acconto.nome} ${acconto.cognome}</p>
          <p><strong>Email:</strong> <a href="mailto:${acconto.email}">${acconto.email}</a></p>
          <p><strong>Telefono:</strong> ${acconto.telefono}</p>
          <p><strong>Progetto:</strong> ${acconto.progetto}</p>
          <p><strong>Versato:</strong> <span style="font-size:20px;font-weight:bold;color:#6366f1;">${importoFmt}€</span></p>
          <p><strong>Payment Intent:</strong> <code>${paymentIntentId ?? "N/D"}</code></p>
          ${acconto.importoTotaleCentesimi ? `<p><strong>Totale progetto:</strong> ${(acconto.importoTotaleCentesimi / 100).toFixed(2).replace(".", ",")}€</p>` : ""}
          <p><strong>Saldo rimanente:</strong> <span style="color:${saldoRimanente === 0 ? "#10b981" : "#f59e0b"};font-weight:bold;">${(saldoRimanente / 100).toFixed(2).replace(".", ",")}€</span></p>
        </div>`,
      });

      logger.info({ accontoId, tipoPagamento, importoFmt }, "Pagamento Stripe confermato e email inviate");
    } catch (err: any) {
      logger.error({ err, accontoId }, "Errore gestione checkout.session.completed");
    }
  }

  res.json({ received: true });
}
