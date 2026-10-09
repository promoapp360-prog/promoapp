import { Router } from "express";
import { db } from "@workspace/db";
import { discountCodesTable, accontiTable, clientiTable, progettiLavoriTable, vociProgettoTable } from "@workspace/db";
import { eq, asc, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { matchesAdminPassword } from "../middlewares/adminAuthorization";

const router = Router();

function checkAuth(req: any, res: any): boolean {
  if (!matchesAdminPassword(req.get("x-admin-password"))) {
    res.status(401).json({ error: "Non autorizzato" });
    return false;
  }
  return true;
}

// ============ VERIFY ============
router.get("/admin/verify", (req, res) => {
  if (!checkAuth(req, res)) return;
  res.json({ ok: true });
});

// ============ DISCOUNT CODES ============

router.get("/admin/codes", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const codes = await db.select().from(discountCodesTable).orderBy(discountCodesTable.createdAt);
  res.json(codes);
});

router.post("/admin/codes", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { code, description, discountPercent, maxUses, expiresAt } = req.body as {
    code: string; description?: string; discountPercent: number; maxUses?: number; expiresAt?: string;
  };
  if (!code?.trim()) return res.status(400).json({ error: "Codice obbligatorio" });
  if (!discountPercent || discountPercent < 1 || discountPercent > 100)
    return res.status(400).json({ error: "Sconto deve essere tra 1 e 100" });
  try {
    const [newCode] = await db.insert(discountCodesTable).values({
      id: randomUUID(), code: code.trim().toUpperCase(), description: description || null,
      discountPercent, maxUses: maxUses || null, expiresAt: expiresAt ? new Date(expiresAt) : null, active: true,
    }).returning();
    res.json(newCode);
  } catch (err: any) {
    if (err.code === "23505") res.status(400).json({ error: "Codice già esistente" });
    else res.status(500).json({ error: "Errore creazione codice" });
  }
});

router.patch("/admin/codes/:id", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { id } = req.params;
  const { active } = req.body as { active: boolean };
  const [updated] = await db.update(discountCodesTable).set({ active }).where(eq(discountCodesTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Codice non trovato" });
  res.json(updated);
});

router.delete("/admin/codes/:id", async (req, res) => {
  if (!checkAuth(req, res)) return;
  await db.delete(discountCodesTable).where(eq(discountCodesTable.id, req.params.id));
  res.json({ success: true });
});

// ============ ACCONTI ============

router.get("/admin/acconti", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const list = await db.select().from(accontiTable).orderBy(desc(accontiTable.createdAt));
  res.json(list);
});

// ============ CLIENTI ============

router.get("/admin/clienti", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const list = await db.select().from(clientiTable).orderBy(asc(clientiTable.nome));
  res.json(list);
});

router.post("/admin/clienti", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { nome, cognome, email, telefono, note } = req.body as {
    nome: string; cognome?: string; email?: string; telefono?: string; note?: string;
  };
  if (!nome?.trim()) return res.status(400).json({ error: "Nome obbligatorio" });
  const [c] = await db.insert(clientiTable).values({
    id: randomUUID(), nome: nome.trim(), cognome: cognome?.trim() || "",
    email: email?.trim() || "", telefono: telefono?.trim() || "", note: note?.trim() || null,
  }).returning();
  res.json(c);
});

router.put("/admin/clienti/:id", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { nome, cognome, email, telefono, note } = req.body as {
    nome: string; cognome?: string; email?: string; telefono?: string; note?: string;
  };
  if (!nome?.trim()) return res.status(400).json({ error: "Nome obbligatorio" });
  const [c] = await db.update(clientiTable).set({
    nome: nome.trim(), cognome: cognome?.trim() || "",
    email: email?.trim() || "", telefono: telefono?.trim() || "", note: note?.trim() || null,
  }).where(eq(clientiTable.id, req.params.id)).returning();
  if (!c) return res.status(404).json({ error: "Cliente non trovato" });
  res.json(c);
});

router.delete("/admin/clienti/:id", async (req, res) => {
  if (!checkAuth(req, res)) return;
  await db.delete(clientiTable).where(eq(clientiTable.id, req.params.id));
  res.json({ success: true });
});

// ============ PROGETTI LAVORI ============

router.get("/admin/progetti", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const progetti = await db.select().from(progettiLavoriTable).orderBy(desc(progettiLavoriTable.createdAt));
  const clienti = await db.select().from(clientiTable);
  const voci = await db.select().from(vociProgettoTable).orderBy(asc(vociProgettoTable.ordine));

  const result = progetti.map((p) => ({
    ...p,
    cliente: clienti.find((c) => c.id === p.clienteId) || null,
    voci: voci.filter((v) => v.progettoId === p.id),
  }));
  res.json(result);
});

router.post("/admin/progetti", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { clienteId, nome, url, password, descrizione, accontoVersato, voci } = req.body as {
    clienteId?: string; nome: string; url?: string; password: string;
    descrizione?: string; accontoVersato?: number;
    voci?: { descrizione: string; importo?: number | null }[];
  };
  if (!nome?.trim()) return res.status(400).json({ error: "Nome obbligatorio" });
  if (!password?.trim()) return res.status(400).json({ error: "Password obbligatoria" });

  const progettoId = randomUUID();
  const [p] = await db.insert(progettiLavoriTable).values({
    id: progettoId, clienteId: clienteId || null, nome: nome.trim(),
    url: url?.trim() || "", password: password.trim(),
    descrizione: descrizione?.trim() || "", accontoVersato: accontoVersato || 0,
    updatedAt: new Date(),
  }).returning();

  if (voci?.length) {
    await db.insert(vociProgettoTable).values(
      voci.map((v, i) => ({
        id: randomUUID(), progettoId, descrizione: v.descrizione,
        importo: v.importo ?? null, ordine: i,
      }))
    );
  }
  res.json(p);
});

router.put("/admin/progetti/:id", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const { id } = req.params;
  const { clienteId, nome, url, password, descrizione, accontoVersato, voci } = req.body as {
    clienteId?: string; nome: string; url?: string; password: string;
    descrizione?: string; accontoVersato?: number;
    voci?: { descrizione: string; importo?: number | null }[];
  };
  if (!nome?.trim()) return res.status(400).json({ error: "Nome obbligatorio" });
  if (!password?.trim()) return res.status(400).json({ error: "Password obbligatoria" });

  const [p] = await db.update(progettiLavoriTable).set({
    clienteId: clienteId || null, nome: nome.trim(),
    url: url?.trim() || "", password: password.trim(),
    descrizione: descrizione?.trim() || "", accontoVersato: accontoVersato || 0,
    updatedAt: new Date(),
  }).where(eq(progettiLavoriTable.id, id)).returning();
  if (!p) return res.status(404).json({ error: "Progetto non trovato" });

  await db.delete(vociProgettoTable).where(eq(vociProgettoTable.progettoId, id));
  if (voci?.length) {
    await db.insert(vociProgettoTable).values(
      voci.map((v, i) => ({
        id: randomUUID(), progettoId: id, descrizione: v.descrizione,
        importo: v.importo ?? null, ordine: i,
      }))
    );
  }
  res.json(p);
});

router.delete("/admin/progetti/:id", async (req, res) => {
  if (!checkAuth(req, res)) return;
  await db.delete(progettiLavoriTable).where(eq(progettiLavoriTable.id, req.params.id));
  res.json({ success: true });
});

export default router;
