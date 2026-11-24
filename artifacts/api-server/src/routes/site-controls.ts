import { createHash } from "node:crypto";
import { Router } from "express";
import {
  ListAdminSiteControlRequestsQueryParams,
  SubmitSiteControlRequestBody,
  UpdateAdminSiteControlRequestBody,
} from "@workspace/api-zod";
import type { SiteControlRequest } from "@workspace/db";
import { siteControlData, type NewSiteControlRequest, type SiteControlStatus } from "../lib/site-control-data";
import { notifySiteControlRequest } from "../lib/site-control-email";

const CONFIRMATION = "Richiesta ricevuta! Riceverai il report entro 48 ore.";
const STATUS_VALUES = ["Nuova", "In analisi", "Report inviato", "Cliente acquisito"] as const;
type SiteControlRepository = {
  create(input: NewSiteControlRequest): Promise<SiteControlRequest>;
  list(status?: SiteControlStatus): Promise<SiteControlRequest[]>;
  updateStatus(id: string, status: SiteControlStatus): Promise<SiteControlRequest | undefined>;
  markNotification(id: string, notification: "sent" | "pending"): Promise<void>;
};
type Dependencies = {
  repository?: SiteControlRepository;
  notify?: (request: SiteControlRequest) => Promise<boolean>;
};

function normalizeSiteUrl(value: string): string | undefined {
  const raw = value.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) return;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return;
    if (url.hostname.length > 253 || /\s/.test(url.hostname)) return;
    return url.toString();
  } catch {
    return;
  }
}

function validWhatsApp(value: string): boolean {
  return /^[+\d\s().-]{6,30}$/.test(value) && value.replace(/\D/g, "").length >= 6;
}

export function createSiteControlsRouter({ repository = siteControlData, notify = notifySiteControlRequest }: Dependencies = {}) {
  const router = Router();
  const attempts = new Map<string, { count: number; expires: number }>();

  router.post("/controlli", async (req, res): Promise<void> => {
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    if (typeof body.honeypot === "string" && body.honeypot.trim()) {
      res.status(201).json({ success: true, message: CONFIRMATION }); return;
    }
    const origin = req.get("origin");
    if (origin) {
      const allowed = new Set(["promoapp.it", "www.promoapp.it", "localhost", "127.0.0.1",
        ...(process.env.REPLIT_DOMAINS ?? "").split(","), req.hostname]);
      try {
        if (!allowed.has(new URL(origin).hostname)) { res.status(403).json({ message: "Origine non autorizzata." }); return; }
      } catch {
        res.status(403).json({ message: "Origine non valida." }); return;
      }
    }

    const normalized = { ...body };
    for (const key of ["siteUrl", "nomeAttivita", "email", "whatsapp", "honeypot"]) {
      if (typeof normalized[key] === "string") normalized[key] = normalized[key].trim();
    }
    if (normalized.email === "") delete normalized.email;
    if (normalized.whatsapp === "") delete normalized.whatsapp;
    const parsed = SubmitSiteControlRequestBody.safeParse(normalized);
    if (!parsed.success) {
      res.status(400).json({ message: "Controlla l’indirizzo, i dati di contatto e le autorizzazioni richieste." }); return;
    }
    const siteUrl = normalizeSiteUrl(parsed.data.siteUrl);
    const email = parsed.data.email?.toLowerCase() ?? null;
    const whatsapp = parsed.data.whatsapp ?? null;
    if (!siteUrl || (!email && !whatsapp) || (whatsapp !== null && !validWhatsApp(whatsapp))) {
      res.status(400).json({ message: "Inserisci un sito valido e almeno un contatto raggiungibile." }); return;
    }

    const now = Date.now();
    for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
    const ipHash = createHash("sha256").update(req.ip ?? "unknown").digest("hex");
    const entry = attempts.get(ipHash) ?? { count: 0, expires: now + 3_600_000 };
    if (entry.count >= 5 || attempts.size >= 10_000) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.expires - now) / 1000))));
      res.status(429).json({ message: "Hai già inviato diverse richieste. Riprova tra un’ora." }); return;
    }
    entry.count++;
    attempts.set(ipHash, entry);

    let created: SiteControlRequest;
    try {
      created = await repository.create({
        siteUrl,
        nomeAttivita: parsed.data.nomeAttivita,
        email,
        whatsapp,
      });
    } catch {
      req.log?.error("Salvataggio richiesta controllo sito fallito");
      res.status(503).json({ message: "Non è stato possibile salvare la richiesta. Riprova tra poco." }); return;
    }

    try {
      const sent = await notify(created);
      await repository.markNotification(created.id, sent ? "sent" : "pending");
    } catch {
      req.log?.warn({ requestId: created.id }, "Richiesta controllo sito salvata con notifica in attesa");
    }
    res.status(201).json({ success: true, message: CONFIRMATION });
  });

  router.get("/admin/controlli", async (req, res): Promise<void> => {
    const query = ListAdminSiteControlRequestsQueryParams.safeParse(req.query);
    if (!query.success) { res.status(400).json({ message: "Filtro di stato non valido." }); return; }
    res.json(await repository.list(query.data.status as SiteControlStatus | undefined));
  });

  router.patch("/admin/controlli/:id", async (req, res): Promise<void> => {
    const parsed = UpdateAdminSiteControlRequestBody.safeParse(req.body);
    if (!parsed.success || !/^[0-9a-f-]{36}$/i.test(req.params.id)) {
      res.status(400).json({ message: "Stato o richiesta non validi." }); return;
    }
    if (!(STATUS_VALUES as readonly string[]).includes(parsed.data.status)) {
      res.status(400).json({ message: "Stato non valido." }); return;
    }
    const updated = await repository.updateStatus(req.params.id, parsed.data.status as SiteControlStatus);
    if (!updated) { res.status(404).json({ message: "Richiesta non trovata." }); return; }
    res.json(updated);
  });

  router.use("/admin/controlli", (err: unknown, req: import("express").Request, res: import("express").Response, _next: import("express").NextFunction) => {
    req.log?.error({ err }, "Errore richieste controllo sito");
    res.status(500).json({ message: "Richieste non disponibili. Riprova tra poco." });
  });
  return router;
}

export default createSiteControlsRouter();
