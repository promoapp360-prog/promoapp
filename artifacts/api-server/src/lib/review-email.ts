import { Resend } from "resend";
import type { Recensione } from "@workspace/db";
import { logger } from "./logger";

type PendingReview = Pick<Recensione, "id" | "nome" | "attivita" | "testo" | "stelle" | "createdAt">;

export function buildPendingReviewEmail(review: PendingReview) {
  return {
    from: process.env.CONTACT_FROM_EMAIL || "PromoApp.it <onboarding@resend.dev>",
    to: "promoapp360@gmail.com",
    subject: `[PromoApp] Nuova recensione da approvare — ${review.nome.replace(/[\r\n]/g, " ")}`,
    text: [
      "È arrivata una nuova recensione ed è in attesa di approvazione.",
      `Nome: ${review.nome}`,
      `Attività: ${review.attivita}`,
      `Valutazione: ${review.stelle}/5`,
      `Recensione: ${review.testo}`,
      `Ricevuta il: ${review.createdAt.toISOString()}`,
      "Apri il pannello amministratore per approvarla:",
      "https://www.promoapp.it/admin",
    ].join("\n\n"),
    idempotencyKey: `review-${review.id}`,
  };
}

export async function notifyPendingReview(review: PendingReview): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn({ reviewId: review.id }, "Notifica recensione in attesa: servizio email non configurato");
    return false;
  }

  try {
    const { idempotencyKey, ...message } = buildPendingReviewEmail(review);
    const result = await new Resend(apiKey).emails.send(message, { idempotencyKey });

    if (result.error || !result.data?.id) {
      logger.warn({ reviewId: review.id, reason: result.error?.name }, "Notifica recensione non accettata dal servizio email");
      return false;
    }
    return true;
  } catch {
    logger.warn({ reviewId: review.id }, "Notifica recensione non inviata; recensione salvata");
    return false;
  }
}
