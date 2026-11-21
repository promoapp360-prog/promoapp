import { Resend } from "resend";
import type { SiteControlRequest } from "@workspace/db";
import { logger } from "./logger";

export async function notifySiteControlRequest(request: SiteControlRequest): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn({ requestId: request.id }, "Notifica controllo sito in attesa: servizio email non configurato");
    return false;
  }
  try {
    const result = await new Resend(apiKey).emails.send({
      from: process.env.CONTACT_FROM_EMAIL || "PromoApp.it <onboarding@resend.dev>",
      to: "promoapp360@gmail.com",
      ...(request.email ? { replyTo: request.email } : {}),
      subject: `[PromoApp] Nuova richiesta di controllo sito — ${request.nomeAttivita.replace(/[\r\n]/g, " ")}`,
      text: [
        "È arrivata una nuova richiesta di controllo gratuito del sito.",
        `Sito: ${request.siteUrl}`,
        `Attività: ${request.nomeAttivita}`,
        `Email: ${request.email ?? "Non indicata"}`,
        `WhatsApp: ${request.whatsapp ?? "Non indicato"}`,
        `Ricevuta il: ${request.createdAt.toISOString()}`,
      ].join("\n\n"),
    }, { idempotencyKey: `site-control-${request.id}` });
    if (result.error || !result.data?.id) {
      logger.warn({ requestId: request.id, reason: result.error?.name }, "Notifica controllo sito non accettata dal servizio email");
      return false;
    }
    return true;
  } catch {
    logger.warn({ requestId: request.id }, "Notifica controllo sito non inviata; richiesta salvata");
    return false;
  }
}
