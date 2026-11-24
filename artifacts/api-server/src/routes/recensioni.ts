import { Router } from "express";
import { db, recensioniTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Recensione } from "@workspace/db";
import { notifyPendingReview } from "../lib/review-email";

type NewReview = Pick<Recensione, "id" | "nome" | "attivita" | "testo" | "stelle" | "verificata" | "createdAt">;
type Dependencies = {
  saveReview?: (review: NewReview) => Promise<void>;
  listVerifiedReviews?: () => Promise<Recensione[]>;
  notify?: (review: NewReview) => Promise<boolean>;
};

export function createReviewsRouter({
  saveReview = async (review) => {
    await db.insert(recensioniTable).values(review);
  },
  listVerifiedReviews = async () => db
    .select()
    .from(recensioniTable)
    .where(eq(recensioniTable.verificata, true))
    .orderBy(desc(recensioniTable.createdAt))
    .limit(30),
  notify = notifyPendingReview,
}: Dependencies = {}) {
  const router = Router();

  // ── POST /api/recensioni — invio pubblico (va in moderazione) ──
  router.post("/recensioni", async (req, res): Promise<void> => {
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

    const review: NewReview = {
      id: randomUUID(),
      nome: nome.trim(),
      attivita: attivita.trim(),
      testo: testo.trim(),
      stelle,
      verificata: false,
      createdAt: new Date(),
    };

    try {
      await saveReview(review);
    } catch (err) {
      req.log.error({ err }, "Errore salvataggio recensione");
      res.status(500).json({ success: false, message: "Errore nel salvataggio." });
      return;
    }

    req.log.info({ reviewId: review.id }, "Nuova recensione ricevuta (in attesa di verifica)");
    try {
      const notified = await notify(review);
      if (!notified) req.log.warn({ reviewId: review.id }, "Notifica recensione non inviata; recensione salvata");
    } catch (err) {
      req.log.warn({ err, reviewId: review.id }, "Notifica recensione non inviata; recensione salvata");
    }
    res.json({ success: true });
  });

  // ── GET /api/recensioni — lista solo verificate (pubblica) ──
  router.get("/recensioni", async (req, res): Promise<void> => {
    try {
      const rows = await listVerifiedReviews();
      res.json({ success: true, data: rows });
    } catch (err) {
      req.log.error({ err }, "Errore fetch recensioni");
      res.status(500).json({ success: false, message: "Errore nel caricamento." });
    }
  });

  return router;
}

export default createReviewsRouter();
