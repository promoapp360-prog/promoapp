import { Router } from "express";
import { Resend } from "resend";
import { SubmitContactBody } from "@workspace/api-zod";

const router = Router();
const DESTINATARIO = "derosa.lazio@gmail.com";
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

router.post("/invia-contatto", async (req, res): Promise<void> => {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? { ...req.body } : {};
  for (const field of ["nome_attivita", "settore", "email", "whatsapp", "messaggio"]) {
    if (typeof body[field] === "string") body[field] = body[field].trim();
  }
  if (body.email === "") delete body.email;
  const parsed = SubmitContactBody.safeParse(body);
  if (!parsed.success || !/^[+\d\s().-]{6,30}$/.test(parsed.data?.whatsapp ?? "") ||
    (parsed.data?.whatsapp.replace(/\D/g, "").length ?? 0) < 6) {
    res.status(400).json({ success: false, message: "Controlla nome, telefono, tipo di attività e richiesta (almeno 10 caratteri)." });
    return;
  }
  if (!process.env.RESEND_API_KEY) {
    req.log.error("Servizio email non configurato");
    res.status(500).json({ success: false, message: "Invio momentaneamente non disponibile. Contattaci su WhatsApp." });
    return;
  }
  const data = parsed.data;
  const labels: Record<string, string> = {
    generale: "Preventivo generale", "siti-web": "Sito web", "web-app": "Web app / gestionale", "menu-digitali": "Menu digitale",
  };
  const service = labels[data.servizio ?? "generale"]!;
  const fields: [string, string][] = [
    ["Nome / attività", data.nome_attivita], ["Tipo di attività", data.settore],
    ["Telefono / WhatsApp", data.whatsapp], ["Email", data.email ?? "Non indicata"],
    ["Servizio", service], ["Pagina", data.pagina ?? "Non indicata"], ["Richiesta", data.messaggio],
    ...Object.entries(data.attribution ?? {}).filter((pair): pair is [string, string] => typeof pair[1] === "string"),
  ];
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || "PromoApp.it <onboarding@resend.dev>",
      to: DESTINATARIO,
      ...(data.email ? { replyTo: data.email } : {}),
      subject: `[PromoApp] ${service} — ${data.nome_attivita.replace(/[\r\n]/g, " ")}`,
      text: fields.map(([label, value]) => `${label}: ${value}`).join("\n\n"),
      html: `<div style="font-family:sans-serif;max-width:640px;padding:24px"><h2>Nuova richiesta — PromoApp.it</h2><table>${fields.map(([label, value]) =>
        `<tr><th style="text-align:left;vertical-align:top;padding:8px">${escapeHtml(label)}</th><td style="padding:8px;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join("")}</table></div>`,
    });
    // Resend reports delivery API errors in `error` without necessarily throwing.
    if (result.error || !result.data?.id) {
      req.log.error({ error: result.error?.name }, "Richiesta contatto non accettata dal servizio email");
      res.status(500).json({ success: false, message: "Non siamo riusciti a inviare la richiesta. Riprova o scrivici su WhatsApp." });
      return;
    }
    req.log.info({ emailId: result.data.id, servizio: data.servizio ?? "generale" }, "Richiesta contatto accettata dal servizio email");
    res.json({ success: true, message: "Richiesta inviata. Ti ricontatteremo ai recapiti indicati." });
  } catch (err) {
    req.log.error({ err }, "Errore invio contatto");
    res.status(500).json({ success: false, message: "Errore nell'invio. Riprova o contattaci su WhatsApp." });
  }
});

export default router;
