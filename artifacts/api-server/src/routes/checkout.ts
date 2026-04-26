import { Router } from "express";
import { getUncachableStripeClient, getStripePublishableKey } from "../lib/stripeClient";
import { db } from "@workspace/db";
import { discountCodesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const PIANI: Record<string, { nome: string; prezzoBase: number; mensile: number }> = {
  base: { nome: "Piano Base", prezzoBase: 69000, mensile: 1900 },
  pro: { nome: "Piano Business Pro", prezzoBase: 89900, mensile: 2500 },
};

router.get("/checkout/publishable-key", async (_req, res) => {
  try {
    const key = await getStripePublishableKey();
    res.json({ publishableKey: key });
  } catch (err) {
    res.status(500).json({ error: "Impossibile recuperare la chiave Stripe" });
  }
});

router.post("/checkout/validate-code", async (req, res) => {
  const { code } = req.body as { code: string };
  if (!code?.trim()) return res.status(400).json({ error: "Codice mancante" });

  const [discount] = await db
    .select()
    .from(discountCodesTable)
    .where(eq(discountCodesTable.code, code.trim().toUpperCase()));

  if (!discount || !discount.active) {
    return res.status(404).json({ error: "Codice sconto non valido o scaduto" });
  }
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return res.status(400).json({ error: "Codice sconto esaurito" });
  }
  if (discount.expiresAt && new Date() > discount.expiresAt) {
    return res.status(400).json({ error: "Codice sconto scaduto" });
  }

  res.json({
    valid: true,
    discountPercent: discount.discountPercent,
    description: discount.description,
  });
});

router.post("/checkout/create-intent", async (req, res) => {
  const { piano, discountCode, customerEmail, customerName } = req.body as {
    piano: string;
    discountCode?: string;
    customerEmail: string;
    customerName: string;
  };

  const pianoDati = PIANI[piano];
  if (!pianoDati) return res.status(400).json({ error: "Piano non valido" });

  let importo = pianoDati.prezzoBase;
  let discountApplied = 0;
  let discountId: string | null = null;

  if (discountCode) {
    const [discount] = await db
      .select()
      .from(discountCodesTable)
      .where(eq(discountCodesTable.code, discountCode.trim().toUpperCase()));

    if (discount && discount.active && (discount.maxUses === null || discount.usedCount < discount.maxUses)) {
      discountApplied = discount.discountPercent;
      discountId = discount.id;
      importo = Math.round(importo * (1 - discountApplied / 100));
    }
  }

  try {
    const stripe = await getUncachableStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: importo,
      currency: "eur",
      receipt_email: customerEmail,
      metadata: {
        piano,
        customerName,
        discountCode: discountCode || "",
        discountPercent: String(discountApplied),
        discountId: discountId || "",
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      importo,
      discountApplied,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Errore creazione pagamento" });
  }
});

router.post("/checkout/bonifico", async (req, res) => {
  const { piano, discountCode, customerEmail, customerName } = req.body as {
    piano: string;
    discountCode?: string;
    customerEmail: string;
    customerName: string;
  };

  const pianoDati = PIANI[piano];
  if (!pianoDati) return res.status(400).json({ error: "Piano non valido" });

  let importo = pianoDati.prezzoBase;
  let discountApplied = 0;
  let discountId: string | null = null;

  if (discountCode) {
    const [discount] = await db
      .select()
      .from(discountCodesTable)
      .where(eq(discountCodesTable.code, discountCode.trim().toUpperCase()));

    if (discount && discount.active && (discount.maxUses === null || discount.usedCount < discount.maxUses)) {
      discountApplied = discount.discountPercent;
      discountId = discount.id;
      importo = Math.round(importo * (1 - discountApplied / 100));

      await db
        .update(discountCodesTable)
        .set({ usedCount: sql`${discountCodesTable.usedCount} + 1` })
        .where(eq(discountCodesTable.id, discountId));
    }
  }

  const causale = `PromoApp ${pianoDati.nome} - ${customerName}${discountCode ? ` (sconto ${discountApplied}%)` : ""}`;

  res.json({
    success: true,
    importo,
    discountApplied,
    causale,
    iban: "IT00 X000 0000 0000 0000 0000 000",
    intestatario: "Sophia 2005 S.r.l.",
  });
});

export default router;
