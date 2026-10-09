import { Router } from "express";
import { UpdateAdminContactBody, ModerateAdminReviewBody } from "@workspace/api-zod";
import { adminData } from "../lib/admin-data";

export function createAdminRouter(data = adminData) {
  const router = Router();
  router.get("/admin/overview", async (req, res) => {
    const days = Number(req.query.days ?? 30);
    if (![7, 30, 90].includes(days)) { res.status(400).json({ message: "Periodo non valido." }); return; }
    res.json(await data.overview(days));
  });
  router.get("/admin/contacts", async (_req, res) => { res.json(await data.contacts()); });
  router.patch("/admin/contacts/:id", async (req, res) => {
    const parsed = UpdateAdminContactBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Stato del contatto non valido." }); return; }
    const updated = await data.updateContact(req.params.id, parsed.data.stato);
    if (!updated) { res.status(404).json({ message: "Contatto non trovato." }); return; }
    res.json(updated);
  });
  router.get("/admin/reviews", async (_req, res) => { res.json(await data.reviews()); });
  router.patch("/admin/reviews/:id", async (req, res) => {
    const parsed = ModerateAdminReviewBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Pubblicazione non valida." }); return; }
    const updated = await data.publishReview(req.params.id, parsed.data.verificata);
    if (!updated) { res.status(404).json({ message: "Recensione non trovata." }); return; }
    res.json(updated);
  });
  router.delete("/admin/reviews/:id", async (req, res) => {
    if (!await data.deleteReview(req.params.id)) { res.status(404).json({ message: "Recensione non trovata." }); return; }
    res.status(204).end();
  });
  router.use("/admin", (err: unknown, req: import("express").Request, res: import("express").Response, _next: import("express").NextFunction) => {
    req.log?.error({ err }, "Errore pannello admin");
    res.status(500).json({ message: "Dati non disponibili. Riprova tra poco." });
  });
  return router;
}
export default createAdminRouter();
