import { Router } from "express";
import { RecordSiteVisitBody } from "@workspace/api-zod";
import { saveVisit } from "../lib/site-visits";

export function createVisitsRouter(save = saveVisit) {
  const router = Router();
  const attempts = new Map<string, { count: number; expires: number }>();
  router.post("/visits", async (req, res) => {
    const parsed = RecordSiteVisitBody.safeParse(req.body);
    if (!parsed.success || !/^\/[a-zA-Z0-9/_-]*$/.test(parsed.data.path) ||
      /^\/(admin|gestione-contatti|lavori)(\/|$)/i.test(parsed.data.path)) {
      res.status(400).json({ message: "Visualizzazione non valida." }); return;
    }
    const origin = req.get("origin");
    if (origin) {
      try {
        if (![req.hostname, "promoapp.it", "www.promoapp.it", "localhost", "127.0.0.1", ...(process.env.REPLIT_DOMAINS ?? "").split(",")].includes(new URL(origin).hostname)) {
          res.status(403).end(); return;
        }
      } catch { res.status(403).end(); return; }
    }
    if (/bot|crawler|spider|headless|preview/i.test(req.get("user-agent") ?? "")) { res.status(204).end(); return; }
    const now = Date.now(), ip = req.ip ?? "unknown";
    for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
    const entry = attempts.get(ip) ?? { count: 0, expires: now + 60000 };
    if (entry.count >= 60 || attempts.size >= 10000) { res.status(429).end(); return; }
    entry.count++; attempts.set(ip, entry);
    try {
      await save(parsed.data);
      res.status(204).end();
    } catch (err) {
      req.log?.error({ err }, "Errore registrazione visita");
      res.status(503).json({ message: "Statistiche temporaneamente non disponibili." });
    }
  });
  return router;
}
export default createVisitsRouter();
