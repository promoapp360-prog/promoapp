import { Router } from "express";
import {
  CreateAdminFinanceEntryBody,
  CreateAdminFinanceProjectBody,
  DeleteAdminFinanceEntryParams,
  GetAdminFinanceQueryParams,
  GetAdminFinanceResponse,
  MarkAdminFinanceEntryPaidParams,
  UpdateAdminFinanceEntryBody,
  UpdateAdminFinanceEntryParams,
  UpdateAdminFinanceProjectBody,
  UpdateAdminFinanceProjectParams,
} from "@workspace/api-zod";
import type { FinanceEntryInput } from "@workspace/api-zod";
import { adminFinanceData } from "../lib/admin-finance-data";

type FinanceData = typeof adminFinanceData;
const FinanceProjectResponse = GetAdminFinanceResponse.shape.projects.element;
const FinanceEntryResponse = GetAdminFinanceResponse.shape.entries.element;

function categoryMatchesDirection(direction: FinanceEntryInput["direction"], category: FinanceEntryInput["category"]) {
  return direction === "income"
    ? ["deposit", "balance", "monthly_fee", "other"].includes(category)
    : ["facebook", "replit", "other"].includes(category);
}

export function createAdminFinanceRouter(data: FinanceData = adminFinanceData) {
  const router = Router();

  router.get("/admin/finance", async (req, res): Promise<void> => {
    const parsed = GetAdminFinanceQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Seleziona un mese valido." });
      return;
    }
    res.json(GetAdminFinanceResponse.parse(await data.list(parsed.data.month)));
  });

  router.post("/admin/finance/projects", async (req, res): Promise<void> => {
    const parsed = CreateAdminFinanceProjectBody.safeParse(req.body);
    if (!parsed.success || !parsed.data.clientName.trim() || !parsed.data.name.trim()) {
      res.status(400).json({ message: "Controlla il cliente, il lavoro e l’importo." });
      return;
    }
    res.status(201).json(FinanceProjectResponse.parse(await data.createProject({
      ...parsed.data,
      clientName: parsed.data.clientName.trim(),
      name: parsed.data.name.trim(),
    })));
  });

  router.patch("/admin/finance/projects/:id", async (req, res): Promise<void> => {
    const params = UpdateAdminFinanceProjectParams.safeParse(req.params);
    const body = UpdateAdminFinanceProjectBody.safeParse(req.body);
    if (!params.success || !body.success || Object.keys(body.data ?? {}).length === 0 ||
      (body.data.clientName !== undefined && !body.data.clientName.trim()) ||
      (body.data.name !== undefined && !body.data.name.trim())) {
      res.status(400).json({ message: "Dati del lavoro non validi." });
      return;
    }
    const updated = await data.updateProject(params.data.id, body.data);
    if (!updated) {
      res.status(404).json({ message: "Lavoro non trovato." });
      return;
    }
    res.json(FinanceProjectResponse.parse(updated));
  });

  router.post("/admin/finance/entries", async (req, res): Promise<void> => {
    const parsed = CreateAdminFinanceEntryBody.safeParse(req.body);
    if (!parsed.success || !parsed.data.description.trim() || !categoryMatchesDirection(parsed.data.direction, parsed.data.category)) {
      res.status(400).json({ message: "Controlla tipo, voce, importo e scadenza." });
      return;
    }
    const entry = await data.createEntry(parsed.data);
    if (!entry) {
      res.status(404).json({ message: "Il lavoro selezionato non esiste più." });
      return;
    }
    res.status(201).json(FinanceEntryResponse.parse(entry));
  });

  router.patch("/admin/finance/entries/:id", async (req, res): Promise<void> => {
    const params = UpdateAdminFinanceEntryParams.safeParse(req.params);
    const body = UpdateAdminFinanceEntryBody.safeParse(req.body);
    if (!params.success || !body.success || Object.keys(body.data ?? {}).length === 0 ||
      (body.data.description !== undefined && !body.data.description.trim())) {
      res.status(400).json({ message: "Dati del movimento non validi." });
      return;
    }
    const updated = await data.updateEntry(params.data.id, body.data);
    if (updated === null) {
      res.status(400).json({ message: "La voce scelta non è compatibile con entrate o spese." });
      return;
    }
    if (!updated) {
      res.status(404).json({ message: "Movimento non trovato." });
      return;
    }
    res.json(FinanceEntryResponse.parse(updated));
  });

  router.post("/admin/finance/entries/:id/paid", async (req, res): Promise<void> => {
    const params = MarkAdminFinanceEntryPaidParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: "Movimento non valido." });
      return;
    }
    const updated = await data.markEntryPaid(params.data.id);
    if (!updated) {
      res.status(404).json({ message: "Movimento non trovato." });
      return;
    }
    res.json(FinanceEntryResponse.parse(updated));
  });

  router.delete("/admin/finance/entries/:id", async (req, res): Promise<void> => {
    const params = DeleteAdminFinanceEntryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ message: "Movimento non valido." });
      return;
    }
    if (!await data.deleteEntry(params.data.id)) {
      res.status(404).json({ message: "Movimento non trovato o già pagato." });
      return;
    }
    res.status(204).end();
  });

  router.use("/admin/finance", (err: unknown, req: import("express").Request, res: import("express").Response, _next: import("express").NextFunction) => {
    req.log?.error({ err }, "Errore contabilità admin");
    res.status(500).json({ message: "Dati contabili non disponibili. Riprova tra poco." });
  });
  return router;
}

export default createAdminFinanceRouter();
