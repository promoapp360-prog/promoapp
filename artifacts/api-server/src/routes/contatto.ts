import { Router } from "express";

const router = Router();

router.post("/invia-contatto", (req, res) => {
  const { nome_attivita, settore, email, messaggio } = req.body as {
    nome_attivita?: string;
    settore?: string;
    email?: string;
    messaggio?: string;
  };

  req.log.info(
    { nome_attivita, settore, email },
    "=== NUOVA RICHIESTA RICEVUTA ==="
  );

  console.log("=== NUOVA RICHIESTA RICEVUTA ===");
  console.log(`Attività: ${nome_attivita}`);
  console.log(`Settore:  ${settore}`);
  console.log(`Email:    ${email}`);
  console.log(`Messaggio:${messaggio}`);
  console.log("================================");

  res.json({ success: true, message: "Richiesta ricevuta" });
});

export default router;
