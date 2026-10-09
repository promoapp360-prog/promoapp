import { Router } from "express";
import { db, recensioniTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { matchesAdminPassword } from "../middlewares/adminAuthorization";

const router = Router();

// ── POST /api/recensioni — invio pubblica (va in moderazione) ──
router.post("/recensioni", async (req, res) => {
  const { nome, attivita, testo, stelle } = req.body as {
    nome?: string;
    attivita?: string;
    testo?: string;
    stelle?: string;
  };

  if (
    !nome?.trim() ||
    !attivita?.trim() ||
    !testo?.trim() ||
    !stelle?.trim() ||
    !["1", "2", "3", "4", "5"].includes(stelle)
  ) {
    res.status(400).json({ success: false, message: "Compila tutti i campi." });
    return;
  }

  if (testo.trim().length < 10) {
    res.status(400).json({ success: false, message: "Scrivi almeno 10 caratteri." });
    return;
  }

  try {
    await db.insert(recensioniTable).values({
      id: randomUUID(),
      nome: nome.trim(),
      attivita: attivita.trim(),
      testo: testo.trim(),
      stelle,
      verificata: false,
    });

    req.log.info({ nome, attivita }, "Nuova recensione ricevuta (in attesa di verifica)");
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Errore salvataggio recensione");
    res.status(500).json({ success: false, message: "Errore nel salvataggio." });
  }
});

// ── GET /api/recensioni — lista solo verificate (pubblica) ──
router.get("/recensioni", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(recensioniTable)
      .where(eq(recensioniTable.verificata, true))
      .orderBy(desc(recensioniTable.createdAt))
      .limit(30);

    res.json({ success: true, data: rows });
  } catch (err) {
    req.log.error({ err }, "Errore fetch recensioni");
    res.status(500).json({ success: false, message: "Errore nel caricamento." });
  }
});

// ── PATCH /api/recensioni/:id/verifica — verifica (admin) ──
router.patch("/recensioni/:id/verifica", async (req, res) => {
  if (!matchesAdminPassword(req.get("x-admin-password"))) {
    res.status(401).json({ success: false, message: "Non autorizzato." });
    return;
  }

  const { id } = req.params;
  try {
    await db
      .update(recensioniTable)
      .set({ verificata: true })
      .where(eq(recensioniTable.id, id));

    req.log.info({ id }, "Recensione verificata");
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Errore verifica recensione");
    res.status(500).json({ success: false, message: "Errore nella verifica." });
  }
});

// ── GET /api/recensioni/pending — lista in attesa (admin) ──
router.get("/recensioni/pending", async (req, res) => {
  if (!matchesAdminPassword(req.get("x-admin-password"))) {
    res.status(401).json({ success: false, message: "Non autorizzato." });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(recensioniTable)
      .where(eq(recensioniTable.verificata, false))
      .orderBy(desc(recensioniTable.createdAt));

    res.json({ success: true, data: rows });
  } catch (err) {
    req.log.error({ err }, "Errore fetch recensioni pending");
    res.status(500).json({ success: false, message: "Errore nel caricamento." });
  }
});

export default router;
