import { Router } from "express";
import { db, progettiLavoriTable, vociProgettoTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

// POST /api/lavori/sblocca — trova il progetto dalla password
router.post("/lavori/sblocca", async (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password?.trim()) { res.status(400).json({ success: false }); return; }

  try {
    const tutti = await db.select().from(progettiLavoriTable);
    const progetto = tutti.find(
      (p) => p.password.toLowerCase() === password.trim().toLowerCase()
    );

    if (!progetto) {
      res.status(401).json({ success: false, message: "Password errata. Riprova." });
      return;
    }

    const voci = await db
      .select()
      .from(vociProgettoTable)
      .where(eq(vociProgettoTable.progettoId, progetto.id))
      .orderBy(asc(vociProgettoTable.ordine));

    const totale = voci.reduce((s, v) => s + (v.importo ?? 0), 0);

    req.log.info({ id: progetto.id }, "Accesso lavoro sbloccato");

    res.json({
      success: true,
      scheda: {
        id: progetto.id,
        nome: progetto.nome,
        url: progetto.url,
        descrizione: progetto.descrizione,
        accontoVersato: progetto.accontoVersato,
        totale,
        voci: voci.map((v) => ({ id: v.id, descrizione: v.descrizione, importo: v.importo })),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Errore sblocca lavoro");
    res.status(500).json({ success: false });
  }
});

export default router;
