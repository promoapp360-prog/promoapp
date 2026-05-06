import { Router } from "express";

const router = Router();

const PROGETTI: Record<string, { password: string; url: string }> = {
  "dr-oggettistica": {
    password: "ciro",
    url: "https://dr-oggettistica.replit.app",
  },
};

router.post("/lavori/sblocca", (req, res) => {
  const { id, password } = req.body as { id?: string; password?: string };

  if (!id || !password) {
    res.status(400).json({ success: false });
    return;
  }

  const progetto = PROGETTI[id];

  if (!progetto) {
    res.status(404).json({ success: false });
    return;
  }

  if (password.trim().toLowerCase() !== progetto.password.toLowerCase()) {
    req.log.info({ id }, "Tentativo accesso lavoro fallito");
    res.status(401).json({ success: false, message: "Password errata" });
    return;
  }

  req.log.info({ id }, "Accesso lavoro sbloccato");
  res.json({ success: true, url: progetto.url });
});

export default router;
