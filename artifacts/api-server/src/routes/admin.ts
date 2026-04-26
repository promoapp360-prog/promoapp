import { Router } from "express";
import { db } from "@workspace/db";
import { discountCodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "promoapp2025";

function checkAuth(req: any, res: any): boolean {
  const auth = req.headers["x-admin-password"];
  if (auth !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Non autorizzato" });
    return false;
  }
  return true;
}

router.get("/admin/codes", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const codes = await db.select().from(discountCodesTable).orderBy(discountCodesTable.createdAt);
  res.json(codes);
});

router.post("/admin/codes", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { code, description, discountPercent, maxUses, expiresAt } = req.body as {
    code: string;
    description?: string;
    discountPercent: number;
    maxUses?: number;
    expiresAt?: string;
  };

  if (!code?.trim()) return res.status(400).json({ error: "Codice obbligatorio" });
  if (!discountPercent || discountPercent < 1 || discountPercent > 100)
    return res.status(400).json({ error: "Sconto deve essere tra 1 e 100" });

  try {
    const [newCode] = await db
      .insert(discountCodesTable)
      .values({
        id: randomUUID(),
        code: code.trim().toUpperCase(),
        description: description || null,
        discountPercent,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      })
      .returning();

    res.json(newCode);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Codice già esistente" });
    } else {
      res.status(500).json({ error: "Errore creazione codice" });
    }
  }
});

router.patch("/admin/codes/:id", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { id } = req.params;
  const { active } = req.body as { active: boolean };

  const [updated] = await db
    .update(discountCodesTable)
    .set({ active })
    .where(eq(discountCodesTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Codice non trovato" });
  res.json(updated);
});

router.delete("/admin/codes/:id", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { id } = req.params;

  await db.delete(discountCodesTable).where(eq(discountCodesTable.id, id));
  res.json({ success: true });
});

export default router;
