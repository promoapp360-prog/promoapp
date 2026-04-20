import { Router } from "express";
import { Resend } from "resend";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const DESTINATARIO = "derosa.lazio@gmail.com";

router.post("/invia-contatto", async (req, res) => {
  const { nome_attivita, settore, email, messaggio } = req.body as {
    nome_attivita?: string;
    settore?: string;
    email?: string;
    messaggio?: string;
  };

  req.log.info({ nome_attivita, settore, email }, "Nuova richiesta contatto");

  try {
    await resend.emails.send({
      from: "PromoApp.it <onboarding@resend.dev>",
      to: DESTINATARIO,
      subject: `Nuova richiesta da ${nome_attivita} (${settore})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Nuova Richiesta — PromoApp.it</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">Attività</td>
              <td style="padding: 8px 0; color: #111827;">${nome_attivita ?? "—"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Settore</td>
              <td style="padding: 8px 0; color: #111827;">${settore ?? "—"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email cliente</td>
              <td style="padding: 8px 0; color: #111827;"><a href="mailto:${email}" style="color: #4f46e5;">${email ?? "—"}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Messaggio</td>
              <td style="padding: 8px 0; color: #111827;">${messaggio ?? "—"}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 13px; margin: 0;">Ricevuto tramite il form di PromoApp.it</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Errore invio email Resend");
    res.status(500).json({ success: false, message: "Errore nell'invio email" });
  }
});

export default router;
