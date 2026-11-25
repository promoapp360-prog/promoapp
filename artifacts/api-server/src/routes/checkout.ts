import { Router } from "express";
import { db } from "@workspace/db";
import { discountCodesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const PIANI: Record<string, { nome: string; prezzoBase: number; mensile: number }> = {
  base: { nome: "Piano Base", prezzoBase: 69000, mensile: 1900 },
  pro: { nome: "Piano Business Pro", prezzoBase: 89000, mensile: 2900 },
  gestionale360: { nome: "Gestionale360", prezzoBase: 19900, mensile: 0 },
  agentipro: { nome: "AgentiPro", prezzoBase: 19900, mensile: 0 },
  sitoistituzionale: { nome: "Sito Web Istituzionale", prezzoBase: 39900, mensile: 0 },
};

router.post("/checkout/validate-code", async (req, res): Promise<void> => {
  const { code } = req.body as { code: string };
  if (!code?.trim()) {
    res.status(400).json({ error: "Codice mancante" });
    return;
  }

  const [discount] = await db
    .select()
    .from(discountCodesTable)
    .where(eq(discountCodesTable.code, code.trim().toUpperCase()));

  if (!discount || !discount.active) {
    res.status(404).json({ error: "Codice sconto non valido o scaduto" });
    return;
  }
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    res.status(400).json({ error: "Codice sconto esaurito" });
    return;
  }
  if (discount.expiresAt && new Date() > discount.expiresAt) {
    res.status(400).json({ error: "Codice sconto scaduto" });
    return;
  }

  res.json({
    valid: true,
    discountPercent: discount.discountPercent,
    description: discount.description,
  });
});

router.post("/checkout/bonifico", async (req, res): Promise<void> => {
  const { piano, discountCode, customerEmail, customerName } = req.body as {
    piano: string;
    discountCode?: string;
    customerEmail: string;
    customerName: string;
  };

  const pianoDati = PIANI[piano];
  if (!pianoDati) {
    res.status(400).json({ error: "Piano non valido" });
    return;
  }

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
