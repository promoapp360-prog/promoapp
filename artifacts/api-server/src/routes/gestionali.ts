import { Router } from "express";
import { db } from "@workspace/db";
import { richiesteGestionaleTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Mamma080245.";

function checkAuth(req: any, res: any): boolean {
  const auth = req.headers["x-admin-password"];
  if (auth !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Non autorizzato" });
    return false;
  }
  return true;
}

router.post("/richiesta-gestionale", async (req, res) => {
  const { tipo, nome, cognome, email, telefono, tipoSoggetto, ragioneSociale, piva, codiceFiscale, settore, note } = req.body as Record<string, string>;
  if (!tipo || !nome || !email) { res.status(400).json({ error: "Dati mancanti" }); return; }
  await db.insert(richiesteGestionaleTable).values({
    id: randomUUID(), tipo, nome, cognome: cognome ?? "", email, telefono: telefono ?? "",
    tipoSoggetto: tipoSoggetto ?? "privato", ragioneSociale: ragioneSociale || null,
    piva: piva || null, codiceFiscale: codiceFiscale || null, settore: settore || null,
    note: note || null, stato: "nuova",
  });
  res.json({ ok: true });
});

router.get("/admin/richieste-gestionale", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const rows = await db.select().from(richiesteGestionaleTable).orderBy(desc(richiesteGestionaleTable.createdAt));
  res.json(rows);
});

router.patch("/admin/richieste-gestionale/:id", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { id } = req.params;
  const { stato, username, passwordGestionale } = req.body as Record<string, string>;
  await db.update(richiesteGestionaleTable).set({
    ...(stato ? { stato } : {}),
    ...(username !== undefined ? { username } : {}),
    ...(passwordGestionale !== undefined ? { passwordGestionale } : {}),
  }).where(eq(richiesteGestionaleTable.id, id));
  res.json({ ok: true });
});

export default router;
